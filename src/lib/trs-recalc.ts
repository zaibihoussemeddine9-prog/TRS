import { prisma } from "./prisma";
import { calcShiftTRS, getShiftDurationMinutes } from "./trs-calculations";

const PAUSE_MINUTES = 30;

/**
 * Get downtime minutes for a specific shift on a specific date.
 * Only counts CLOSED downtimes (with duration > 0).
 */
export async function getShiftDowntimeMinutes(
  batchId: string,
  shiftStartTime: string,
  shiftEndTime: string,
  date: Date
): Promise<number> {
  const [sh, sm] = shiftStartTime.split(":").map(Number);
  const [eh, em] = shiftEndTime.split(":").map(Number);

  const shiftStart = new Date(date);
  shiftStart.setHours(sh, sm, 0, 0);

  const shiftEnd = new Date(date);
  shiftEnd.setHours(eh, em, 0, 0);

  if (shiftEnd <= shiftStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  const events = await prisma.downtimeEvent.findMany({
    where: {
      batchId,
      startTime: { gte: shiftStart, lt: shiftEnd },
      duration: { not: null, gt: 0 },
    },
    select: { duration: true },
  });

  return events.reduce((sum, e) => sum + (e.duration || 0), 0);
}

/** Compute TRS for a single production declaration */
export async function computeTRS(
  batchId: string,
  shiftId: string,
  declDate: Date,
  quantityProduced: number,
  microStopMinutes: number
) {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) return {};

  const shiftDuration = getShiftDurationMinutes(shift.startTime, shift.endTime);

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { product: true },
  });
  const nominalSpeed = batch?.product?.nominalSpeed || 0;

  const shiftDowntime = await getShiftDowntimeMinutes(
    batchId,
    shift.startTime,
    shift.endTime,
    declDate
  );

  const trs = calcShiftTRS({
    shiftDurationMinutes: shiftDuration,
    pauseMinutes: PAUSE_MINUTES,
    downtimeMinutes: shiftDowntime,
    microStopMinutes,
    quantityProduced,
    nominalSpeed,
  });

  return {
    plannedMinutes: trs.plannedMinutes,
    runningMinutes: trs.runningMinutes,
    usefulMinutes: Math.round(trs.usefulMinutes * 10) / 10,
    unjustifiedMinutes: Math.round(trs.unjustifiedMinutes * 10) / 10,
    availability: Math.round(trs.availability * 10000) / 10000,
    performance: Math.round(trs.performance * 10000) / 10000,
    quality: Math.round(trs.quality * 10000) / 10000,
    oee: Math.round(trs.oee * 10000) / 10000,
  };
}

/**
 * Recalculate TRS for ALL production declarations of a batch.
 * Called after every downtime create/update/delete.
 */
export async function recalcBatchTRS(batchId: string): Promise<void> {
  try {
    const declarations = await prisma.productionDeclaration.findMany({
      where: { batchId },
    });

    for (const decl of declarations) {
      const trsFields = await computeTRS(
        batchId,
        decl.shiftId,
        decl.date,
        decl.quantityProduced,
        decl.microStopMinutes
      );

      await prisma.productionDeclaration.update({
        where: { id: decl.id },
        data: trsFields,
      });
    }
  } catch (err) {
    console.error("[recalcBatchTRS] error:", err);
  }
}
