/**
 * TRS/OEE Calculation Engine
 * Times in minutes, speeds in units/minute, quantities in units.
 */

export interface ShiftTRSInput {
  shiftDurationMinutes: number; // durée brute du shift
  pauseMinutes: number;         // pause fixe (30 min)
  downtimeMinutes: number;      // arrêts déclarés (DowntimeEvent)
  microStopMinutes: number;     // micro-arrêts
  quantityProduced: number;
  nominalSpeed: number;         // cadence nominale du produit (u/min)
}

export interface TRSResult {
  plannedMinutes: number;
  runningMinutes: number;
  usefulMinutes: number;
  unjustifiedMinutes: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

const PAUSE_MINUTES = 30;

/**
 * Calculate TRS for a single shift declaration.
 * - Planned = shift duration - pause
 * - Running = planned - downtimes - micro-stops
 * - Availability = running / planned
 * - Performance = qty / (nominal speed × running time)
 * - Quality = 1.0 (reject computed at batch close)
 * - OEE = A × P × Q
 */
export function calcShiftTRS(input: ShiftTRSInput): TRSResult {
  const plannedMinutes = input.shiftDurationMinutes - input.pauseMinutes;
  const runningMinutes = Math.max(plannedMinutes - input.downtimeMinutes - input.microStopMinutes, 0);

  const availability = plannedMinutes > 0 ? Math.min(runningMinutes / plannedMinutes, 1) : 0;

  const theoreticalQty = input.nominalSpeed > 0 ? input.nominalSpeed * runningMinutes : 0;
  const performance = theoreticalQty > 0 ? Math.min(input.quantityProduced / theoreticalQty, 1) : 0;

  const quality = 1.0; // calculated at batch close

  // Temps utile = temps théorique pour produire la quantité réelle
  const usefulMinutes = input.nominalSpeed > 0 ? input.quantityProduced / input.nominalSpeed : 0;

  // Temps non justifié = planifié - arrêts - micro-arrêts - temps utile
  const unjustifiedMinutes = Math.max(
    plannedMinutes - input.downtimeMinutes - input.microStopMinutes - usefulMinutes,
    0
  );

  return {
    plannedMinutes,
    runningMinutes,
    usefulMinutes,
    unjustifiedMinutes,
    availability,
    performance,
    quality,
    oee: availability * performance * quality,
  };
}

/**
 * Calculate shift duration in minutes from startTime/endTime strings (HH:MM).
 * Handles overnight shifts (e.g., 22:00-06:00 = 480 min).
 */
export function getShiftDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60; // overnight
  return end - start;
}

/** Aggregate TRS across multiple shift results */
export function calcAggregateTRS(shifts: TRSResult[]): TRSResult {
  if (shifts.length === 0) return { plannedMinutes: 0, runningMinutes: 0, usefulMinutes: 0, unjustifiedMinutes: 0, availability: 0, performance: 0, quality: 1, oee: 0 };

  const totalPlanned = shifts.reduce((s, r) => s + r.plannedMinutes, 0);
  const totalRunning = shifts.reduce((s, r) => s + r.runningMinutes, 0);

  const availability = totalPlanned > 0 ? Math.min(totalRunning / totalPlanned, 1) : 0;

  // Weighted performance: sum(qty) / sum(nominal × running)
  // We can't recompute from TRSResult alone, so use weighted average
  const totalOEEWeighted = shifts.reduce((s, r) => s + r.oee * r.plannedMinutes, 0);
  const oee = totalPlanned > 0 ? totalOEEWeighted / totalPlanned : 0;

  const performance = availability > 0 ? oee / availability : 0;

  const totalUseful = shifts.reduce((s, r) => s + r.usefulMinutes, 0);
  const totalUnjustified = shifts.reduce((s, r) => s + r.unjustifiedMinutes, 0);

  return { plannedMinutes: totalPlanned, runningMinutes: totalRunning, usefulMinutes: totalUseful, unjustifiedMinutes: totalUnjustified, availability, performance, quality: 1, oee };
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
