import { randomUUID } from 'expo-crypto';

/**
 * Primary keys are UUIDs rather than autoincrement integers so rows created on
 * two devices can never collide — see docs/ARCHITECTURE.md §4.
 */
export function newId(): string {
  return randomUUID();
}
