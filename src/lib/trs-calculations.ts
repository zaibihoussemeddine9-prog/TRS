/**
 * TRS/OEE Calculation Engine — simplified
 * Times in minutes, speeds in units/minute, quantities in units.
 */

export interface BatchData {
  plannedTime: number;
  actualRunningTime: number;
  theoreticalSpeed: number;
  quantityProduced: number;
  quantityConform: number;
}

export interface TRSResult {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

/** Availability = actual running / planned */
export function calcAvailability(d: BatchData): number {
  if (d.plannedTime <= 0) return 0;
  return Math.min(d.actualRunningTime / d.plannedTime, 1);
}

/** Performance = (theoretical time for qty) / actual running */
export function calcPerformance(d: BatchData): number {
  if (d.actualRunningTime <= 0 || d.theoreticalSpeed <= 0) return 0;
  const theoreticalTime = d.quantityProduced / d.theoreticalSpeed;
  return Math.min(theoreticalTime / d.actualRunningTime, 1);
}

/** Quality = conform / produced */
export function calcQuality(d: BatchData): number {
  if (d.quantityProduced <= 0) return 0;
  return Math.min(d.quantityConform / d.quantityProduced, 1);
}

/** OEE = A × P × Q */
export function calcOEE(d: BatchData): TRSResult {
  const availability = calcAvailability(d);
  const performance = calcPerformance(d);
  const quality = calcQuality(d);
  return { availability, performance, quality, oee: availability * performance * quality };
}

/** Aggregate OEE across batches */
export function calcAggregateOEE(batches: BatchData[]): TRSResult {
  if (batches.length === 0) return { availability: 0, performance: 0, quality: 0, oee: 0 };

  const t = batches.reduce(
    (a, b) => ({
      plannedTime: a.plannedTime + b.plannedTime,
      actualRunningTime: a.actualRunningTime + b.actualRunningTime,
      quantityProduced: a.quantityProduced + b.quantityProduced,
      quantityConform: a.quantityConform + b.quantityConform,
      theoreticalTime: a.theoreticalTime + (b.theoreticalSpeed > 0 ? b.quantityProduced / b.theoreticalSpeed : 0),
    }),
    { plannedTime: 0, actualRunningTime: 0, quantityProduced: 0, quantityConform: 0, theoreticalTime: 0 }
  );

  const availability = t.plannedTime > 0 ? Math.min(t.actualRunningTime / t.plannedTime, 1) : 0;
  const performance = t.actualRunningTime > 0 ? Math.min(t.theoreticalTime / t.actualRunningTime, 1) : 0;
  const quality = t.quantityProduced > 0 ? Math.min(t.quantityConform / t.quantityProduced, 1) : 0;
  return { availability, performance, quality, oee: availability * performance * quality };
}

export function getKPIColor(value: number, greenMin = 0.85, orangeMin = 0.65): "green" | "orange" | "red" {
  if (value >= greenMin) return "green";
  if (value >= orangeMin) return "orange";
  return "red";
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatMinutesToHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h${m.toString().padStart(2, "0")}`;
}
