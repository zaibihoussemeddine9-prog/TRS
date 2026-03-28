/**
 * Shift overlap detection utilities.
 * Works with Shift model's startTime/endTime as "HH:MM" strings.
 */

/** Convert "HH:MM" to minutes since midnight. Validates range. */
export function toMinutes(time: string): number {
  const parts = time.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return 0; // safe fallback
  }
  return h * 60 + m;
}

/**
 * Check if two shifts overlap on the same date.
 * Handles overnight shifts (end <= start → add 1440).
 * Adjacent shifts (Matin 06-14 + AM 14-22) do NOT overlap (strict <).
 */
export function shiftsOverlap(
  s1: { startTime: string; endTime: string },
  s2: { startTime: string; endTime: string }
): boolean {
  let s1Start = toMinutes(s1.startTime);
  let s1End = toMinutes(s1.endTime);
  let s2Start = toMinutes(s2.startTime);
  let s2End = toMinutes(s2.endTime);

  if (s1End <= s1Start) s1End += 1440;
  if (s2End <= s2Start) s2End += 1440;

  return s1Start < s2End && s2Start < s1End;
}

/**
 * Check if a declaration date falls within the batch time window.
 * Compares ISO date strings (YYYY-MM-DD) to avoid timezone issues.
 * batchEnd = null means lot is still open (no upper bound).
 */
export function shiftWithinBatch(
  declDate: string,
  _shift: { startTime: string; endTime: string },
  batchStart: Date | string,
  batchEnd: Date | string | null
): boolean {
  // Extract date-only strings (YYYY-MM-DD) — timezone-safe
  const declDay = declDate.split("T")[0];
  const bStartDay = new Date(batchStart).toISOString().split("T")[0];

  if (declDay < bStartDay) return false;

  if (batchEnd) {
    const bEndDay = new Date(batchEnd).toISOString().split("T")[0];
    if (declDay > bEndDay) return false;
  }

  return true;
}
