import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { generateEmbedding, findSimilarEmbeddings } from "./embeddings"

interface RAGContext {
  institutions?: any[]
  programs?: any[]
  cutoffHistory?: any[]
  userProfile?: any
  conversationHistory?: Array<{
    role: "user" | "assistant"
    content: string
  }>
}

interface RAGResult {
  answer: string
  sources: Array<{
    type: string
    id: string
    title: string
    content: string
    similarity: number
  }>
  context: RAGContext
}

/**
 * Fallback: Query database directly when embeddings aren't available
 */
async function queryDatabaseDirectly(
  query: string,
  options?: {
    entityType?: string
    limit?: number
  }
): Promise<RAGResult["sources"]> {
  const limit = options?.limit || 5
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2)
  
  if (searchTerms.length === 0) {
    return []
  }

  const sources: RAGResult["sources"] = []

  try {
    // Search programs if entityType is "program" or "all" or undefined
    if (!options?.entityType || options.entityType === "program" || options.entityType === "all") {
      const programs = await prisma.program.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { faculty: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { department: { contains: query, mode: Prisma.QueryMode.insensitive } },
            ...searchTerms.map(term => ({
              name: { contains: term, mode: Prisma.QueryMode.insensitive }
            }))
          ]
        },
        include: {
          institution: {
            select: {
              name: true,
              state: true,
              city: true,
              type: true,
            }
          }
        },
        take: limit,
      })

      for (const program of programs) {
        const content = `Program: ${program.name}
Institution: ${program.institution.name}
Location: ${program.institution.city}, ${program.institution.state}
Type: ${program.institution.type}
${program.faculty ? `Faculty: ${program.faculty}` : ""}
${program.degreeType ? `Degree Type: ${program.degreeType}` : ""}
${program.utmeSubjects.length > 0 ? `Required UTME Subjects: ${program.utmeSubjects.join(", ")}` : ""}`

        sources.push({
          type: "program",
          id: program.id,
          title: `${program.name} at ${program.institution.name}`,
          content,
          similarity: 0.5, // Default similarity for direct queries
        })
      }
    }

    // Search institutions if entityType is "institution" or "all" or undefined
    if (!options?.entityType || options.entityType === "institution" || options.entityType === "all") {
      const institutions = await prisma.institution.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { state: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { city: { contains: query, mode: Prisma.QueryMode.insensitive } },
            ...searchTerms.map(term => ({
              name: { contains: term, mode: Prisma.QueryMode.insensitive }
            }))
          ]
        },
        include: {
          programs: {
            select: {
              name: true,
            },
            take: 10,
          }
        },
        take: limit,
      })

      for (const institution of institutions) {
        const programNames = institution.programs.map(p => p.name).join(", ")
        const content = `Institution: ${institution.name}
Type: ${institution.type}
Ownership: ${institution.ownership}
Location: ${institution.city}, ${institution.state}, Nigeria
${institution.website ? `Website: ${institution.website}` : ""}
${programNames ? `Offers programs: ${programNames}` : ""}`

        sources.push({
          type: "institution",
          id: institution.id,
          title: institution.name,
          content,
          similarity: 0.5, // Default similarity for direct queries
        })
      }
    }

    return sources.slice(0, limit)
  } catch (error) {
    console.error("Error in queryDatabaseDirectly:", error)
    return []
  }
}

/**
 * Retrieve relevant context using RAG
 */
export async function retrieveContext(
  query: string,
  options?: {
    entityType?: string
    limit?: number
    minSimilarity?: number
  }
): Promise<RAGResult["sources"]> {
  try {
    const queryEmbedding = await generateEmbedding(query)
    const limit = options?.limit || 5
    // Lower similarity threshold to get more results when embeddings are sparse
    const minSimilarity = options?.minSimilarity || 0.3

    const similarEmbeddings = await findSimilarEmbeddings(
      queryEmbedding,
      options?.entityType,
      limit * 2 // Get more results to filter from
    )

    // Filter by similarity and sort by relevance
    const sources = similarEmbeddings
      .filter((item) => item.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
      .slice(0, limit) // Take top N results
      .map((item) => ({
        type: item.entityType,
        id: item.entityId,
        title: item.metadata?.title || `${item.entityType} ${item.entityId}`,
        content: item.content,
        similarity: item.similarity,
      }))

    // If no embeddings found, fall back to direct database query
    if (sources.length === 0) {
      console.log("No embeddings found, falling back to direct database query")
      return await queryDatabaseDirectly(query, options)
    }

    return sources
  } catch (error) {
    console.error("Error in retrieveContext:", error)
    // If embeddings table doesn't exist or has issues, fall back to direct query
    if (error instanceof Error && (error.message.includes("relation") || error.message.includes("does not exist"))) {
      console.warn("Embeddings table not found, falling back to direct database query")
      return await queryDatabaseDirectly(query, options)
    }
    // For other errors, try direct query as fallback
    try {
      return await queryDatabaseDirectly(query, options)
    } catch (fallbackError) {
      console.error("Error in fallback query:", fallbackError)
      return []
    }
  }
}

/**
 * Generate answer using Gemini API
 */
async function generateAnswerWithGemini(
  query: string,
  sources: RAGResult["sources"],
  userContext?: RAGContext & {
    conversationHistory?: Array<{
      role: "user" | "assistant"
      content: string
    }>
  }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set")
  }

  const contextText = sources
    .map((source, idx) => `[${idx + 1}] ${source.title}\n${source.content}`)
    .join("\n\n")

  const userContextText = userContext
    ? `\n\nUser Context:\n- UTME Score: ${userContext.userProfile?.utme || "Not provided"}\n- O-Level Results: ${userContext.userProfile?.olevels ? "Available" : "Not provided"}\n- State of Origin: ${userContext.userProfile?.stateOfOrigin || "Not provided"}`
    : ""

  const conversationHistoryText = userContext?.conversationHistory && userContext.conversationHistory.length > 0
    ? `\n\nPrevious Conversation:\n${userContext.conversationHistory
        .slice(-4)
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n")}`
    : ""

  const prompt = `You are an AI assistant helping Nigerian students with university admission guidance. 
Use the provided context to answer questions accurately and helpfully. Even if the context is limited, 
provide the best answer you can based on what's available. Always cite sources using [1], [2], etc. when referencing the context.

IMPORTANT: If the context contains relevant information (even if partial), use it to provide a helpful answer. 
Only say you don't have information if the context is completely empty or irrelevant.

${conversationHistoryText ? "Use the conversation history to understand the context and provide more relevant answers." : ""}

Context:
${contextText}
${userContextText}
${conversationHistoryText}

User Question: ${query}

Provide a helpful answer based on the context above. If the context has relevant information, use it. 
If the context is empty, suggest that the user check back later as the database is being updated.
${conversationHistoryText ? "Reference previous conversation when relevant to provide continuity." : ""}`

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash"

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Gemini API error: ${error.error?.message || "Unknown error"}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

/**
 * Generate answer using OpenAI API
 */
async function generateAnswerWithOpenAI(
  query: string,
  sources: RAGResult["sources"],
  userContext?: RAGContext & {
    conversationHistory?: Array<{
      role: "user" | "assistant"
      content: string
    }>
  }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set")
  }

  const contextText = sources
    .map((source, idx) => `[${idx + 1}] ${source.title}\n${source.content}`)
    .join("\n\n")

  const userContextText = userContext
    ? `\n\nUser Context:\n- UTME Score: ${userContext.userProfile?.utme || "Not provided"}\n- O-Level Results: ${userContext.userProfile?.olevels ? "Available" : "Not provided"}\n- State of Origin: ${userContext.userProfile?.stateOfOrigin || "Not provided"}`
    : ""

  const conversationHistoryText = userContext?.conversationHistory && userContext.conversationHistory.length > 0
    ? `\n\nPrevious Conversation:\n${userContext.conversationHistory
        .slice(-4)
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n")}`
    : ""

  const systemPrompt = `You are an AI assistant helping Nigerian students with university admission guidance. 
Use the provided context to answer questions accurately and helpfully. Even if the context is limited, 
provide the best answer you can based on what's available. Always cite sources using [1], [2], etc. when referencing the context.

IMPORTANT: If the context contains relevant information (even if partial), use it to provide a helpful answer. 
Only say you don't have information if the context is completely empty or irrelevant.

${conversationHistoryText ? "Use the conversation history to understand the context and provide more relevant answers. Reference previous conversation when relevant to provide continuity." : ""}

Context:
${contextText}
${userContextText}
${conversationHistoryText}`

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || "Unknown error"}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Generate answer using LLM with retrieved context
 * Tries Gemini first, then OpenAI, then fallback
 */
export async function generateAnswer(
  query: string,
  sources: RAGResult["sources"],
  userContext?: RAGContext
): Promise<string> {
  // Try Gemini first (most cost-effective)
  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateAnswerWithGemini(query, sources, userContext)
    } catch (error) {
      console.error("Error with Gemini API:", error)
      // Fall through to OpenAI
    }
  }

  // Try OpenAI as fallback
  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateAnswerWithOpenAI(query, sources, userContext)
    } catch (error) {
      console.error("Error with OpenAI API:", error)
      // Fall through to fallback
    }
  }

  // Fallback to rule-based answer
  return generateFallbackAnswer(query, sources, userContext)
}

/**
 * Fallback answer generator when LLM is not available
 */
function generateFallbackAnswer(
  query: string,
  sources: RAGResult["sources"],
  userContext?: RAGContext
): string {
  if (sources.length === 0) {
    return `I couldn't find specific information about "${query}" in our database. This might be because:

1. **No embeddings generated yet** - The knowledge base needs to be populated. An admin can generate embeddings at /admin/embeddings
2. **Data not available** - The information might not be in our database yet
3. **Try rephrasing** - Try asking in a different way, for example:
   - "What universities offer Computer Science?"
   - "Which institutions have Computer Science programs?"
   - "Show me Computer Science programs in Nigeria"

Please check back later as we continue to update our information, or try rephrasing your question.`
  }

  let answer = `Based on the information available in our database:\n\n`

  sources.forEach((source, idx) => {
    answer += `[${idx + 1}] ${source.title}\n${source.content.substring(0, 300)}${source.content.length > 300 ? "..." : ""}\n\n`
  })

  answer += `\nNote: This is a simplified response. For more detailed AI-powered answers, please configure a GEMINI_API_KEY or OPENAI_API_KEY in your environment variables.`

  return answer
}

/**
 * Full RAG pipeline: retrieve context and generate answer
 */
export async function ragPipeline(
  query: string,
  options?: {
    entityType?: string
    limit?: number
    minSimilarity?: number
    userContext?: RAGContext
    conversationHistory?: Array<{
      role: "user" | "assistant"
      content: string
    }>
  }
): Promise<RAGResult> {
  try {
    const sources = await retrieveContext(query, {
      entityType: options?.entityType,
      limit: options?.limit,
      minSimilarity: options?.minSimilarity,
    })

    const answer = await generateAnswer(query, sources, {
      ...options?.userContext,
      conversationHistory: options?.conversationHistory,
    })

    const context: RAGContext = {}

    if (sources.length > 0) {
      const institutionIds = sources
        .filter((s) => s.type === "institution")
        .map((s) => s.id)
      const programIds = sources.filter((s) => s.type === "program").map((s) => s.id)

      if (institutionIds.length > 0) {
        context.institutions = await prisma.institution.findMany({
          where: { id: { in: institutionIds } },
          take: 5,
        })
      }

      if (programIds.length > 0) {
        context.programs = await prisma.program.findMany({
          where: { id: { in: programIds } },
          include: { institution: true },
          take: 5,
        })
      }
    }

    return {
      answer,
      sources,
      context,
    }
  } catch (error) {
    console.error("Error in ragPipeline:", error)
    throw error
  }
}

