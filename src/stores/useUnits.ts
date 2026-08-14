/**
 * Weight units.
 *
 * The unit is a **label on the number the user typed**, not a conversion.
 * Switching an exercise from KG to LB leaves `80` as `80` — it now means 80 lb.
 * That is how a lifter reads equipment: the plate says 45, so you record 45 and
 * mark it pounds. Converting it to 20.4 would help nobody.
 *
 * The unit is chosen per exercise in the routine builder and inherited by every
 * session built from that routine; the active workout only displays it.
 */

/** Uppercase, as the design labels and stores it. */
export type WeightUnit = 'KG' | 'LB';

export const WEIGHT_UNITS: WeightUnit[] = ['KG', 'LB'];

/** Placeholder for an unset weight — bodyweight sets and cleared fields. */
export const NO_VALUE = '—';

/** "kg" / "lb", for inline prose and the keypad label. */
export function unitLabel(unit: WeightUnit): string {
  return unit.toLowerCase();
}
