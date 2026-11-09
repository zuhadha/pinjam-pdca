export interface SelectedUnit {
  id: string
  code: string
}

/**
 * Toggle a unit code for an item that has `quantity` units requested.
 * Returns null when the selection is already full (caller should warn the user).
 */
export function toggleUnitInSelection(
  selected: SelectedUnit[],
  unit: SelectedUnit,
  quantity: number
): SelectedUnit[] | null {
  if (selected.some(u => u.id === unit.id)) {
    return selected.filter(u => u.id !== unit.id)
  }
  // With qty 1, clicking another code just swaps the selection.
  if (quantity <= 1) return [unit]
  if (selected.length >= quantity) return null
  return [...selected, unit]
}

/** Drop extra selected codes when the quantity is lowered. */
export function trimSelection(selected: SelectedUnit[] | undefined, quantity: number): SelectedUnit[] {
  return (selected || []).slice(0, Math.max(quantity, 0))
}
