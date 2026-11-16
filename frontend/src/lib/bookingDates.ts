const localCalendar = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Tbilisi', year: 'numeric', month: '2-digit', day: '2-digit',
})

const displayCalendar = new Intl.DateTimeFormat('ka-GE', {
  timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric',
})

export function todayInTbilisi() {
  const parts = localCalendar.formatToParts(new Date())
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function displayBookingDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? value : displayCalendar.format(parsed)
}
