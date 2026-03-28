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
 * Check if a declaration date falls within the batch time window.
 * Compares dates only (not shift hours).
 * batchEnd = null means lot is still open (no upper bound).
 */
export function shiftWithinBatch(
  declDate: string,
  _shift: { startTime: string; endTime: string },
  batchStart: Date | string,
  batchEnd: Date | string | null
): boolean {
  // Extract date parts only (ignore time)
  const declDay = new Date(declDate);
  declDay.setHours(0, 0, 0, 0);

  const bStartDay = new Date(batchStart);
  bStartDay.setHours(0, 0, 0, 0);

  // Declaration date must be on or after the batch start date
  if (declDay < bStartDay) return false;

  // If batch has an end, declaration date must be on or before the batch end date
  if (batchEnd) {
    const bEndDay = new Date(batchEnd);
    bEndDay.setHours(23, 59, 59, 999);
    if (declDay > bEndDay) return false;
  }

  return true;
}
