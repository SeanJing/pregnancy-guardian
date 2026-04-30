import guide from '../data/pg.json'

export default function WeeklyGuide({ week }) {
  const data = guide[`week_${week}`]
  if (!data) return null

  return (
    <div className="w-full max-w-md bg-white rounded-2xl p-5 space-y-4 text-left">
      <h3 className="text-sm font-semibold font-heading text-primary">Week {week} Guide</h3>

      {data.meals?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink/50 uppercase mb-1.5">Recommended</p>
          <ul className="space-y-1">
            {data.meals.slice(0, 3).map((m, i) => (
              <li key={i} className="text-xs text-ink/70 flex gap-1.5">
                <span className="text-cta shrink-0">•</span>{m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.avoid?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink/50 uppercase mb-1.5">Avoid</p>
          <ul className="space-y-1">
            {data.avoid.slice(0, 3).map((a, i) => (
              <li key={i} className="text-xs text-ink/70 flex gap-1.5">
                <span className="text-red-400 shrink-0">•</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.events?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink/50 uppercase mb-1.5">This Week</p>
          <ul className="space-y-1">
            {data.events.slice(0, 2).map((e, i) => (
              <li key={i} className="text-xs text-ink/70 flex gap-1.5">
                <span className="text-primary shrink-0">•</span>{e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.tips?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink/50 uppercase mb-1.5">Tips</p>
          <ul className="space-y-1">
            {data.tips.slice(0, 2).map((t, i) => (
              <li key={i} className="text-xs text-ink/70 flex gap-1.5">
                <span className="text-amber-400 shrink-0">•</span>{t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
