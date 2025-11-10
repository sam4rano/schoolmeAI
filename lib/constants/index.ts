/**
 * Application-wide constants
 * Centralized location for magic numbers and strings
 */

// ============================================================================
// Pagination Constants
// ============================================================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  ADMIN_DEFAULT_LIMIT: 50,
} as const

// ============================================================================
// API Constants
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const

// ============================================================================
// AI/ML Constants
// ============================================================================

export const AI = {
  MAX_MESSAGE_LENGTH: 1000,
  DEFAULT_LIMIT: 5,
  GUEST_LIMIT: 3,
  MAX_LIMIT: 10,
  MIN_SIMILARITY_THRESHOLD: 0.3,
  EMBEDDING_DIMENSION: 1536,
} as const

// ============================================================================
// Calculator Constants
// ============================================================================

export const CALCULATOR = {
  UTME_MAX_SCORE: 400,
  UTME_MIN_SCORE: 0,
  DEFAULT_DURATION: 4, // years
  MAX_DURATION: 10,
  MIN_DURATION: 1,
  MAX_PROGRAMS_TO_COMPARE: 10,
} as const

// ============================================================================
// Database Constants
// ============================================================================

export const DATABASE = {
  DEFAULT_QUERY_LIMIT: 20,
  MAX_QUERY_LIMIT: 100,
  CACHE_TTL_SECONDS: 3600, // 1 hour
  BATCH_SIZE: 50,
} as const

// ============================================================================
// Authentication Constants
// ============================================================================

export const AUTH = {
  BCRYPT_SALT_ROUNDS: 10,
  SESSION_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
} as const

// ============================================================================
// O-Level Grade Constants
// ============================================================================

export const O_LEVEL_GRADES = {
  A1: 6,
  B2: 5,
  B3: 4,
  C4: 3,
  C5: 2,
  C6: 1,
  D7: 0,
  E8: 0,
  F9: 0,
} as const

export const VALID_O_LEVEL_GRADES = [
  "A1",
  "B2",
  "B3",
  "C4",
  "C5",
  "C6",
  "D7",
  "E8",
  "F9",
] as const

// ============================================================================
// Data Quality Constants
// ============================================================================

export const DATA_QUALITY = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  DEFAULT_SCORE: 0,
} as const

// ============================================================================
// Validation Constants
// ============================================================================

export const VALIDATION = {
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_STRING_LENGTH: 1,
  MAX_STRING_LENGTH: 1000,
} as const

