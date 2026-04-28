const TOTAL_WEEKS = 40
const TRIMESTERS = [
  { name: '1st Trimester', weeks: [1, 13] },
  { name: '2nd Trimester', weeks: [14, 27] },
  { name: '3rd Trimester', weeks: [28, 40] },
]

const MESSAGES = {
  1: ["A tiny miracle has begun!", "The journey of a lifetime starts now."],
  2: ["Your little one is growing strong.", "Every day is a new milestone."],
  3: ["Baby is the size of a lemon now!", "You're doing beautifully, mama."],
  4: ["Tiny kicks, big love.", "You're glowing — inside and out."],
  5: ["Baby can hear your voice now.", "Halfway there — you're amazing!"],
  6: ["Little one is getting stronger every day.", "Almost there, you've got this!"],
  7: ["Nesting time! Your baby is almost ready.", "The best is yet to come."],
  8: ["So close to meeting your little one!", "You are stronger than you know."],
  9: ["Baby is ready to say hello!", "The wait is almost over — hang in there!"],
  10: ["Any day now!", "You've been incredible this whole journey."],
}

function getMessage(week) {
  const month = Math.min(Math.ceil(week / 4), 10)
  const msgs = MESSAGES[month]
  // Pick based on day of year so it feels fresh but stable per day
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return msgs[dayOfYear % msgs.length]
}

export default function WeekTracker({ dueDate }) {
  const due = new Date(dueDate + 'T00:00:00')
  const now = new Date()
  const conceptionDate = new Date(due)
  conceptionDate.setDate(conceptionDate.getDate() - TOTAL_WEEKS * 7)

  const daysPregnant = Math.floor((now - conceptionDate) / 86400000)
  const currentWeek = Math.min(Math.max(Math.floor(daysPregnant / 7) + 1, 1), TOTAL_WEEKS)
  const dayInWeek = daysPregnant % 7

  const daysLeft = Math.max(Math.ceil((due - now) / 86400000), 0)
  const progress = Math.min(currentWeek / TOTAL_WEEKS * 100, 100)

  const trimester = TRIMESTERS.find(t => currentWeek >= t.weeks[0] && currentWeek <= t.weeks[1]) || TRIMESTERS[2]

  return (
    <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4">
      {/* Week + Days */}
      <div className="text-center">
        <p className="text-4xl font-bold font-heading text-primary">{currentWeek}<span className="text-lg font-normal text-ink/40"> weeks</span></p>
        <p className="text-sm text-ink/50 mt-1">{dayInWeek} day{dayInWeek !== 1 ? 's' : ''} into week {currentWeek}</p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-2.5 bg-secondary/60 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-ink/40">
          <span>Week 1</span>
          <span>{trimester.name}</span>
          <span>Week 40</span>
        </div>
      </div>

      {/* Countdown */}
      <div className="flex justify-center gap-6 pt-2">
        <div className="text-center">
          <p className="text-2xl font-bold font-heading text-cta">{daysLeft}</p>
          <p className="text-xs text-ink/50">days to go</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-heading text-ink/70">{Math.floor(daysLeft / 7)}</p>
          <p className="text-xs text-ink/50">weeks left</p>
        </div>
      </div>

      {/* Encouraging message */}
      <p className="text-center text-sm text-ink/60 italic pt-1">{getMessage(currentWeek)}</p>
    </div>
  )
}
