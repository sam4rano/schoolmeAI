import { PrismaClient } from "@prisma/client"
import * as fs from "fs"
import * as path from "path"

const prisma = new PrismaClient()

// Parse CSV with proper handling of quoted fields
function parseCSV(text: string): any[] {
  const lines = text.split("\n").filter((line) => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const data: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ""))
        current = ""
      } else {
        current += char
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ""))

    if (values.length === headers.length) {
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] || ""
      })
      data.push(obj)
    }
  }

  return data
}

async function importProgramsFromCSV() {
  try {
    const csvPath = path.join(process.cwd(), "csv_folder", "all_institutions.csv")
    const csvText = fs.readFileSync(csvPath, "utf-8")
    const csvData = parseCSV(csvText)

    console.log(`Found ${csvData.length} institutions in CSV`)

    // Filter only universities with website URLs that might have program data
    const universitiesWithWebsites = csvData.filter(
      (row) =>
        row.Type?.toLowerCase() === "university" &&
        row.Website &&
        row.Website.trim() !== "" &&
        (row.Website.includes("myschoolgist.com") || row.Website.includes("courses") || row.Website.includes("program"))
    )

    console.log(`Found ${universitiesWithWebsites.length} universities with potential program URLs`)

    const results = {
      processed: 0,
      programsCreated: 0,
      programsUpdated: 0,
      errors: [] as string[],
    }

    // Get all institutions from database
    const institutions = await prisma.institution.findMany({
      select: { id: true, name: true, website: true, type: true },
      where: { type: "university" },
    })

    const institutionMap = new Map<string, string>()
    institutions.forEach((inst) => {
      const normalized = inst.name.toLowerCase().trim()
      institutionMap.set(normalized, inst.id)
    })

    // For now, we'll create a note that programs need to be scraped from websites
    // The actual scraping should be done via the Python scraper
    console.log("\n📝 Note: Programs should be scraped from institution websites.")
    console.log(`   Found ${universitiesWithWebsites.length} universities with website URLs.`)
    console.log(`   Use the Python scraper: python scrapers/scrape_programs.py http://localhost:3000`)
    console.log("\n   Or use the admin API to import programs from accreditation CSV if available.")

    // Check if we can at least create some basic programs from the CSV data
    // For universities, we can note that programs need to be scraped
    console.log("\n✅ Institution data is ready for program scraping.")
    console.log(`   Total universities in database: ${institutions.length}`)
    console.log(`   Universities with websites: ${institutions.filter((i) => i.website).length}`)

    await prisma.$disconnect()
  } catch (error) {
    console.error("Fatal error:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importProgramsFromCSV()

