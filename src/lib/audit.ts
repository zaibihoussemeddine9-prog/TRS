import { prisma } from "./prisma";

/**
 * Create an audit log entry.
 * Never throws — audit failures must not block business operations.
 * If userId is provided, verifies it exists before inserting.
 */
export async function createAuditLog(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    let resolvedUserId: string | null = null;

    if (params.userId) {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { id: true },
      });
      if (user) {
        resolvedUserId = user.id;
      } else {
        console.warn(
          `[AuditLog] userId "${params.userId}" introuvable en base — log créé sans utilisateur`,
          { action: params.action, entity: params.entity, entityId: params.entityId }
        );
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: resolvedUserId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      },
    });
  } catch (err) {
    // Never let audit logging break a business operation
    console.error(
      `[AuditLog] échec d'écriture — ${params.action} ${params.entity}:${params.entityId}`,
      err instanceof Error ? err.message : err
    );
  }
}
