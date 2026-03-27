import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actionPlanSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const assignedToId = searchParams.get("assignedToId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (assignedToId) where.assignedToId = assignedToId;

  const actions = await prisma.actionPlan.findMany({
    where,
    include: {
      assignedTo: { select: { name: true } },
      createdBy: { select: { name: true } },
      downtimeEntry: { include: { cause: true } },
    },
    orderBy: { targetDate: "asc" },
  });

  return NextResponse.json(actions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = actionPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const action = await prisma.actionPlan.create({
    data: {
      title: data.title,
      description: data.description || null,
      downtimeEntryId: data.downtimeEntryId || null,
      causeId: data.causeId || null,
      assignedToId: data.assignedToId,
      targetDate: new Date(data.targetDate),
      priority: data.priority ?? "MEDIUM",
      status: data.status ?? "TODO",
      progress: data.progress ?? 0,
      comment: data.comment || null,
      createdById: body.userId || "system",
    },
  });

  return NextResponse.json(action, { status: 201 });
}
