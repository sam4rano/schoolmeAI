import { prisma } from "@/lib/prisma"
import { generateEmbedding, findSimilarEmbeddings } from "./embeddings"

interface RAGContext {
  institutions?: any[]
  programs?: any[]
  cutoffHistory?: any[]
  userProfile?: any
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
    const minSimilarity = options?.minSimilarity || 0.5

    const similarEmbeddings = await findSimilarEmbeddings(
      queryEmbedding,
      options?.entityType,
      limit
    )

    const sources = similarEmbeddings
      .filter((item) => item.similarity >= minSimilarity)
      .map((item) => ({
        type: item.entityType,
        id: item.entityId,
        title: item.metadata?.title || `${item.entityType} ${item.entityId}`,
        content: item.content,
        similarity: item.similarity,
      }))

    return sources
  } catch (error) {
    console.error("Error in retrieveContext:", error)
    // If embeddings table doesn't exist or has issues, return empty sources
    // The fallback answer generator will handle this gracefully
    if (error instanceof Error && (error.message.includes("relation") || error.message.includes("does not exist"))) {
      console.warn("Embeddings table not found, returning empty sources")
      return []
    }
    throw error
  }
}

/**
 * Generate answer using Gemini API
 */
async function generateAnswerWithGemini(
  query: string,
  sources: RAGResult["sources"],
  userContext?: RAGContext
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

  const prompt = `You are an AI assistant helping Nigerian students with university admission guidance. 
Use the provided context to answer questions accurately. If the context doesn't contain enough information, 
say so honestly. Always cite sources using [1], [2], etc. when referencing the context.

Context:
${contextText}
${userContextText}

User Question: ${query}`

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
  userContext?: RAGContext
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

  const systemPrompt = `You are an AI assistant helping Nigerian students with university admission guidance. 
Use the provided context to answer questions accurately. If the context doesn't contain enough information, 
say so honestly. Always cite sources using [1], [2], etc. when referencing the context.

Context:
${contextText}
${userContextText}`

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
    return `I couldn't find specific information about "${query}" in our database. Please try rephrasing your question or check back later as we continue to update our information.`
  }

  let answer = `Based on the information available:\n\n`

  sources.forEach((source, idx) => {
    answer += `[${idx + 1}] ${source.title}\n${source.content.substring(0, 200)}...\n\n`
  })

  answer += `\nNote: This is a simplified response. For more detailed AI-powered answers, please configure a GEMINI_API_KEY or OPENAI_API_KEY.`

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
  }
): Promise<RAGResult> {
  try {
    const sources = await retrieveContext(query, {
      entityType: options?.entityType,
      limit: options?.limit,
      minSimilarity: options?.minSimilarity,
    })

    const answer = await generateAnswer(query, sources, options?.userContext)

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

