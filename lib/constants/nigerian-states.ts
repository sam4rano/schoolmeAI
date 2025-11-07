/**
 * Complete list of all 36 Nigerian States plus FCT (Federal Capital Territory)
 */
export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT", // Federal Capital Territory
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const

// Also include "Abuja" as an alias for FCT
export const NIGERIAN_STATES_WITH_ABUJA = [
  ...NIGERIAN_STATES,
  "Abuja", // Alias for FCT
] as const

export type NigerianState = typeof NIGERIAN_STATES[number] | "Abuja"

