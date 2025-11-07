import { generateAllEmbeddings } from "../lib/ai/generate-embeddings"

async function main() {
  console.log("Starting embeddings generation...")
  try {
    await generateAllEmbeddings()
    console.log("✓ Embeddings generation completed successfully")
    process.exit(0)
  } catch (error) {
    console.error("Error generating embeddings:", error)
    process.exit(1)
  }
}

main()

