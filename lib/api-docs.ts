/**
 * OpenAPI/Swagger API Documentation
 * Auto-generated from JSDoc comments in API routes
 */

import swaggerJsdoc from "swagger-jsdoc"

interface SwaggerOptions {
  definition: {
    openapi?: string
    info?: any
    servers?: any[]
    components?: any
    tags?: any[]
  }
  apis?: string[]
}

const options: SwaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "edurepoAI API",
      version: "1.0.0",
      description: "API documentation for edurepoAI.xyz - Nigerian University Admission Guidance Platform",
      contact: {
        name: "edurepoAI Support",
        email: "support@edurepoai.xyz",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://edurepoai.xyz",
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
        Backup: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            filePath: { type: "string", nullable: true },
            size: { type: "integer", nullable: true },
            error: { type: "string", nullable: true },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        ScheduledTask: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            schedule: { type: "string" },
            enabled: { type: "boolean" },
            lastRun: { type: "string", format: "date-time", nullable: true },
            nextRun: { type: "string", format: "date-time", nullable: true },
          },
        },
        Report: {
          type: "object",
          properties: {
            period: {
              type: "object",
              properties: {
                start: { type: "string", format: "date-time" },
                end: { type: "string", format: "date-time" },
              },
            },
            data: { type: "object" },
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
      { name: "Backup", description: "Database backup and restore endpoints" },
      { name: "Reports", description: "Analytics and reporting endpoints" },
      { name: "Cron", description: "Scheduled task management endpoints" },
      { name: "Documentation", description: "API documentation endpoints" },
    ],
  },
  apis: [
    "./app/api/**/*.ts",
    "./app/api/**/*.js",
  ],
}

export const swaggerSpec = swaggerJsdoc(options)

