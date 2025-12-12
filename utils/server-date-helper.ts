/**
 * Server Date Helper
 * Handles "Virtual Time" for Simulation Mode
 */

import { cookies } from 'next/headers';
import dayjs from 'dayjs';

const SIMULATION_COOKIE = 'x-simulation-date';

/**
 * Get the effective "Today" date
 * If simulation mode is active (cookie set), returns that date.
 * Otherwise, returns actual current date.
 *
 * @returns Date string in YYYY-MM-DD format
 */
export async function getServerToday(): Promise<string> {
  const cookieStore = await cookies();
  const simDate = cookieStore.get(SIMULATION_COOKIE)?.value;

  if (simDate && dayjs(simDate).isValid()) {
    return simDate;
  }

  return dayjs().format('YYYY-MM-DD');
}

/**
 * Get the effective "Now" object
 * Useful if you need full dayjs functionality
 */
export async function getServerNow(): Promise<dayjs.Dayjs> {
  const todayStr = await getServerToday();
  return dayjs(todayStr); // Time will be 00:00:00 of that day usually
}
