/**
 * Shift overlap detection utilities.
 * Works with Shift model's startTime/endTime as "HH:MM" strings.
 */

/** Convert "HH:MM" to minutes since midnight */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Check if two shifts overlap on the same date.
 * Handles overnight shifts (end <= start → add 1440).
 * Adjacent shifts (Matin 06-14 + AM 14-22) do NOT overlap.
 */
export function shiftsOverlap(
  s1: { startTime: string; endTime: string },
  s2: { startTime: string; endTime: string }
): boolean {
  let s1Start = toMinutes(s1.startTime);
  let s1End = toMinutes(s1.endTime);
  let s2Start = toMinutes(s2.startTime);
  let s2End = toMinutes(s2.endTime);

  // Normalize overnight shifts
  if (s1End <= s1Start) s1End += 1440;
  if (s2End <= s2Start) s2End += 1440;

  // Strict overlap: s1_start < s2_end AND s2_start < s1_end
  return s1Start < s2End && s2Start < s1End;
}

/**
 * Check if a shift declaration (date + shift times) falls within the batch time window.
 * batchEnd = null means lot is still open (no upper bound).
 */
export function shiftWithinBatch(
  declDate: string,
  shift: { startTime: string; endTime: string },
  batchStart: Date | string,
  batchEnd: Date | string | null
): boolean {
  const date = new Date(declDate);
  const [sh, sm] = shift.startTime.split(":").map(Number);
  const [eh, em] = shift.endTime.split(":").map(Number);

  const shiftStart = new Date(date);
  shiftStart.setHours(sh, sm, 0, 0);

  const shiftEnd = new Date(date);
  shiftEnd.setHours(eh, em, 0, 0);
  if (shiftEnd <= shiftStart) shiftEnd.setDate(shiftEnd.getDate() + 1); // overnight

  const bStart = new Date(batchStart);

  // Shift must start on or after batch start
  if (shiftStart < bStart) return false;

  // If batch has an end time, shift must end on or before it
  if (batchEnd) {
    const bEnd = new Date(batchEnd);
    if (shiftEnd > bEnd) return false;
  }

  return true;
}
