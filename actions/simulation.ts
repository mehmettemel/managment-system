/**
 * Simulation Actions
 * Control the time travel simulation
 */

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getServerToday } from '@/utils/server-date-helper';
import { successResponse, errorResponse } from '@/utils/response-helpers';

const SIMULATION_COOKIE = 'x-simulation-date';

/**
 * Set the simulation date
 */
export async function setSimulationDate(date: string) {
  try {
    const cookieStore = await cookies();

    // Set cookie for 1 day
    cookieStore.set(SIMULATION_COOKIE, date, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24,
    });

    revalidatePath('/');
    return successResponse(date);
  } catch (error) {
    return errorResponse('Simülasyon tarihi ayarlanamadı');
  }
}

/**
 * Clear simulation mode (Return to real time)
 */
export async function clearSimulationDate() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SIMULATION_COOKIE);

    revalidatePath('/');
    return successResponse(true);
  } catch (error) {
    return errorResponse('Simülasyon durdurulamadı');
  }
}

/**
 * Get current simulation status
 */
export async function getSimulationStatus() {
  const effectiveDate = await getServerToday();
  const cookieStore = await cookies();
  const isSimulating = cookieStore.has(SIMULATION_COOKIE);

  return {
    isSimulating,
    effectiveDate,
  };
}
