export const defaultEquipmentOptions: string[] = [
  'LED Wall',
  'Sound System',
  'Microphone',
  'Lights',
  'Projector with white screen',
  'Other',
]

export function normalizeRequestedItems(items: string[] = [], customItemText = ''): string[] {
  const trimmed = customItemText.trim()
  const cleaned = (items ?? []).filter(Boolean)

  if (!cleaned.includes('Other')) {
    return cleaned
  }

  const withoutOther = cleaned.filter((item) => item !== 'Other')
  return trimmed ? [...withoutOther, trimmed] : [...withoutOther, 'Other']
}

export function timeRangeOverlaps(startA: string, endA: string, startB: string, endB: string) {
  const startMinutesA = toMinutes(startA)
  const endMinutesA = toMinutes(endA)
  const startMinutesB = toMinutes(startB)
  const endMinutesB = toMinutes(endB)

  return startMinutesA < endMinutesB && startMinutesB < endMinutesA
}

export function toMinutes(value: string) {
  if (!value) return 0
  const [hours, minutes] = String(value).split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}
