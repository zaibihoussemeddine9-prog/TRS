import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downtimeEntrySchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lineId = searchParams.get("lineId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const causeId = searchParams.get("causeId");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (lineId) where.lineId = lineId;
  if (causeId) where.causeId = causeId;
  if (type) where.type = type;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo);
  }

  const entries = await prisma.downtimeEntry.findMany({
    where,
    include: { line: true, cause: true, subCause: true, shift: true },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = downtimeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const startTime = new Date(data.startTime);
  const endTime = data.endTime ? new Date(data.endTime) : null;
  const duration = data.duration ?? (endTime ? (endTime.getTime() - startTime.getTime()) / 60000 : null);

  const entry = await prisma.downtimeEntry.create({
    data: {
      productionEntryId: data.productionEntryId || null,
      lineId: data.lineId,
      shiftId: data.shiftId || null,
      date: new Date(data.date),
      startTime,
      endTime,
      duration,
      type: data.type,
      causeId: data.causeId,
      subCauseId: data.subCauseId || null,
      description: data.description || null,
      responsibility: data.responsibility,
      estimatedImpact: data.estimatedImpact ?? null,
      immediateAction: data.immediateAction || null,
      status: data.status ?? "OPEN",
      createdById: body.userId || "system",
    },
  });

  if (body.userId) {
    await createAuditLog({
      userId: body.userId,
      action: "CREATE",
      entity: "DowntimeEntry",
      entityId: entry.id,
      newValue: data as unknown as Record<string, unknown>,
    });
  }

  return NextResponse.json(entry, { status: 201 });
}
