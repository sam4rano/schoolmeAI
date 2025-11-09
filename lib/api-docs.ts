/**
 * OpenAPI/Swagger API Documentation
 * Auto-generated from JSDoc comments in API routes
 */

import swaggerJsdoc from "swagger-jsdoc"

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SchoolMe API",
      version: "1.0.0",
      description: "API documentation for SchoolMe - Nigerian University Admission Guidance Platform",
      contact: {
        name: "SchoolMe Support",
        email: "support@schoolme.ng",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.schoolme.ng",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Institution: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            type: { type: "string", enum: ["university", "polytechnic", "college", "nursing", "military"] },
            ownership: { type: "string", enum: ["federal", "state", "private"] },
            state: { type: "string" },
            city: { type: "string" },
            website: { type: "string", format: "uri", nullable: true },
            contact: { type: "object", nullable: true },
            accreditationStatus: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Program: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            institutionId: { type: "string", format: "uuid" },
            name: { type: "string" },
            faculty: { type: "string", nullable: true },
            department: { type: "string", nullable: true },
            degreeType: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            duration: { type: "string", nullable: true },
            utmeSubjects: { type: "array", items: { type: "string" } },
            olevelSubjects: { type: "array", items: { type: "string" } },
            cutoffHistory: { type: "array", items: { type: "object" }, nullable: true },
            tuitionFees: { type: "object", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "object", nullable: true },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
    tags: [
      { name: "Institutions", description: "Institution management endpoints" },
      { name: "Programs", description: "Program management endpoints" },
      { name: "Calculator", description: "Eligibility and fee calculation endpoints" },
      { name: "Recommendations", description: "Program recommendation endpoints" },
      { name: "AI Chat", description: "AI assistant endpoints" },
      { name: "Watchlist", description: "User watchlist endpoints" },
      { name: "Reviews", description: "Review management endpoints" },
      { name: "Notifications", description: "Notification endpoints" },
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Admin", description: "Admin management endpoints" },
    ],
  },
  apis: [
    "./app/api/**/*.ts",
    "./app/api/**/*.js",
  ],
}

export const swaggerSpec = swaggerJsdoc(options)

