/**
 * Utility functions for formatting institution names
 */

/**
 * Remove leading numbers from institution names
 * Example: "100 Central Washington College" -> "Central Washington College"
 */
export function cleanInstitutionName(name: string): string {
  if (!name) return name
  
  // Remove leading numbers and spaces
  // Matches patterns like "100 ", "101 ", "102 ", etc.
  return name.replace(/^\d+\s+/, "").trim()
}

/**
 * Format institution name for display
 * Removes leading numbers and trims whitespace
 */
export function formatInstitutionName(name: string): string {
  return cleanInstitutionName(name)
}

