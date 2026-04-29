const MEALS = ['breakfast', 'lunch', 'dinner']
const LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

export default function DietSection({ diet, onUpdate }) {
  const update = (meal, field, value) => {
    onUpdate({ ...diet, [meal]: { ...(diet[meal] || {}), [field]: value } })
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z"/></svg>
        Diet
      </h3>
      <div className="space-y-3">
        {MEALS.map(meal => (
          <div key={meal} className="bg-surface/50 rounded-lg p-3">
            <p className="text-xs font-medium text-ink/50 mb-1.5">{LABELS[meal]}</p>
            <input
              value={diet[meal]?.name || ''}
              onChange={e => update(meal, 'name', e.target.value)}
              placeholder="Meal name"
              className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150 mb-1.5"
            />
            <input
              value={diet[meal]?.instructions || ''}
              onChange={e => update(meal, 'instructions', e.target.value)}
              placeholder="Instructions / notes"
              className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-primary transition-colors duration-150"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
