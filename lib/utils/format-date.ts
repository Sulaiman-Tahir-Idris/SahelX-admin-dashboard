export function formatDate(timestamp: any): string {
  if (!timestamp) return "N/A"

  let date: Date
  if (timestamp.toDate) {
    date = timestamp.toDate()
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000)
  } else {
    date = new Date(timestamp)
  }

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "N/A"
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}
