import { prisma } from "@/lib/prisma"

interface LogAuditEventParams {
  userId: string
  entityType: "institution" | "program" | "settings" | "user"
  entityId: string
  action: "create" | "update" | "delete" | "read"
  institutionId?: string
  programId?: string
  metadata?: Record<string, any>
}

export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId,
        institutionId: params.institutionId,
        programId: params.programId,
        metadata: params.metadata || undefined,
      },
    })
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main flow
    console.error("Failed to log audit event:", error)
  }
}

