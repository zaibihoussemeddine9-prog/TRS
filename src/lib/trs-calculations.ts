/**
 * TRS/OEE Calculation Engine
 * All times are in minutes, speeds in units/minute, quantities in units.
 */

export interface ProductionData {
  plannedTime: number;
  plannedUsefulTime: number;
  actualRunningTime: number;
  plannedDowntime: number;
  unplannedDowntime: number;
  formatChangeTime: number;
  adjustmentTime: number;
  cleaningTime: number;
  qualityWaitTime: number;
  maintenanceWaitTime: number;
  materialWaitTime: number;
  microStopTime: number;
  theoreticalSpeed: number;
  actualSpeed: number;
  quantityProduced: number;
  quantityConform: number;
  quantityRejected: number;
}

export interface TRSResult {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface ExtendedKPIs extends TRSResult {
  rejectRate: number;
  totalDowntime: number;
  totalPlannedDowntime: number;
  totalUnplannedDowntime: number;
  totalFormatChangeTime: number;
  totalQualityWaitTime: number;
  totalMaintenanceWaitTime: number;
  totalMaterialWaitTime: number;
  microStopTime: number;
  theoreticalProduction: number;
  actualProduction: number;
  productionGap: number;
  speedLoss: number;
  qualityLoss: number;
  availabilityLoss: number;
}

/** Availability = Actual Running Time / Planned Useful Time */
export function calcAvailability(data: ProductionData): number {
  if (data.plannedUsefulTime <= 0) return 0;
  return Math.min(data.actualRunningTime / data.plannedUsefulTime, 1);
}

/** Performance = (Theoretical time for actual qty) / Actual running time */
export function calcPerformance(data: ProductionData): number {
  if (data.actualRunningTime <= 0 || data.theoreticalSpeed <= 0) return 0;
  const theoreticalTime = data.quantityProduced / data.theoreticalSpeed;
  return Math.min(theoreticalTime / data.actualRunningTime, 1);
}

/** Quality = Conform quantity / Total produced */
export function calcQuality(data: ProductionData): number {
  if (data.quantityProduced <= 0) return 0;
  return Math.min(data.quantityConform / data.quantityProduced, 1);
}

/** OEE/TRS = Availability × Performance × Quality */
export function calcOEE(data: ProductionData): TRSResult {
  const availability = calcAvailability(data);
  const performance = calcPerformance(data);
  const quality = calcQuality(data);
  return {
    availability,
    performance,
    quality,
    oee: availability * performance * quality,
  };
}

/** Extended KPIs with loss analysis */
export function calcExtendedKPIs(data: ProductionData): ExtendedKPIs {
  const trs = calcOEE(data);
  const theoreticalProduction = data.actualRunningTime * data.theoreticalSpeed;
  const totalDowntime =
    data.plannedDowntime +
    data.unplannedDowntime +
    data.formatChangeTime +
    data.adjustmentTime +
    data.cleaningTime +
    data.qualityWaitTime +
    data.maintenanceWaitTime +
    data.materialWaitTime;

  return {
    ...trs,
    rejectRate:
      data.quantityProduced > 0
        ? data.quantityRejected / data.quantityProduced
        : 0,
    totalDowntime,
    totalPlannedDowntime: data.plannedDowntime,
    totalUnplannedDowntime: data.unplannedDowntime,
    totalFormatChangeTime: data.formatChangeTime,
    totalQualityWaitTime: data.qualityWaitTime,
    totalMaintenanceWaitTime: data.maintenanceWaitTime,
    totalMaterialWaitTime: data.materialWaitTime,
    microStopTime: data.microStopTime,
    theoreticalProduction,
    actualProduction: data.quantityProduced,
    productionGap: theoreticalProduction - data.quantityProduced,
    speedLoss: theoreticalProduction - data.quantityProduced + data.quantityRejected,
    qualityLoss: data.quantityRejected,
    availabilityLoss:
      data.plannedUsefulTime > 0
        ? (1 - trs.availability) * data.plannedUsefulTime * data.theoreticalSpeed
        : 0,
  };
}

/** Aggregate OEE across multiple entries */
export function calcAggregateOEE(entries: ProductionData[]): TRSResult {
  if (entries.length === 0) {
    return { availability: 0, performance: 0, quality: 0, oee: 0 };
  }

  const totals = entries.reduce(
    (acc, e) => ({
      plannedUsefulTime: acc.plannedUsefulTime + e.plannedUsefulTime,
      actualRunningTime: acc.actualRunningTime + e.actualRunningTime,
      quantityProduced: acc.quantityProduced + e.quantityProduced,
      quantityConform: acc.quantityConform + e.quantityConform,
      theoreticalTime:
        acc.theoreticalTime +
        (e.theoreticalSpeed > 0 ? e.quantityProduced / e.theoreticalSpeed : 0),
    }),
    {
      plannedUsefulTime: 0,
      actualRunningTime: 0,
      quantityProduced: 0,
      quantityConform: 0,
      theoreticalTime: 0,
    }
  );

  const availability =
    totals.plannedUsefulTime > 0
      ? Math.min(totals.actualRunningTime / totals.plannedUsefulTime, 1)
      : 0;
  const performance =
    totals.actualRunningTime > 0
      ? Math.min(totals.theoreticalTime / totals.actualRunningTime, 1)
      : 0;
  const quality =
    totals.quantityProduced > 0
      ? Math.min(totals.quantityConform / totals.quantityProduced, 1)
      : 0;

  return {
    availability,
    performance,
    quality,
    oee: availability * performance * quality,
  };
}

/** Get KPI color based on thresholds */
export function getKPIColor(
  value: number,
  greenMin = 0.85,
  orangeMin = 0.65
): "green" | "orange" | "red" {
  if (value >= greenMin) return "green";
  if (value >= orangeMin) return "orange";
  return "red";
}

/** Format percentage for display */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Format minutes to HH:MM */
export function formatMinutesToHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h${m.toString().padStart(2, "0")}`;
}
