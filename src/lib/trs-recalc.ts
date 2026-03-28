import { prisma } from "./prisma";
import { calcShiftTRS, getShiftDurationMinutes } from "./trs-calculations";

const PAUSE_MINUTES = 30;

/**
 * Get total downtime minutes for a batch (all closed downtimes).
 * Distributed proportionally across declarations.
 */
async function getBatchDowntimeMinutes(batchId: string): Promise<number> {
  const result = await prisma.downtimeEvent.aggregate({
    where: {
      batchId,
      duration: { not: null, gt: 0 },
    },
    _sum: { duration: true },
  });
  return result._sum.duration || 0;
}

/** Compute TRS for a single production declaration */
export async function computeTRS(
  batchId: string,
  shiftId: string,
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
  const targetOEE = batch?.product?.targetOEE || 0;

  // Get total batch downtime and distribute per declaration
  const totalBatchDowntime = await getBatchDowntimeMinutes(batchId);
  const declCount = await prisma.productionDeclaration.count({ where: { batchId } });
  const downtimeForShift = declCount > 0 ? totalBatchDowntime / declCount : totalBatchDowntime;

  const trs = calcShiftTRS({
    shiftDurationMinutes: shiftDuration,
    pauseMinutes: PAUSE_MINUTES,
    downtimeMinutes: downtimeForShift,
    microStopMinutes,
    quantityProduced,
    nominalSpeed,
  });

  // Objectif shift = TRS cible × cadence nominale × temps planifié
  const targetQuantity = targetOEE > 0 && nominalSpeed > 0
    ? Math.round(targetOEE * nominalSpeed * trs.plannedMinutes)
    : null;

  return {
    plannedMinutes: trs.plannedMinutes,
    runningMinutes: trs.runningMinutes,
    usefulMinutes: Math.round(trs.usefulMinutes * 10) / 10,
    unjustifiedMinutes: Math.round(trs.unjustifiedMinutes * 10) / 10,
    availability: Math.round(trs.availability * 10000) / 10000,
    performance: Math.round(trs.performance * 10000) / 10000,
    quality: Math.round(trs.quality * 10000) / 10000,
    oee: Math.round(trs.oee * 10000) / 10000,
    targetQuantity,
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
