interface StatsProps {
  total: number
  todo: number
  inProgress: number
  done: number
}

export const StatsBar = ({ total, todo, inProgress, done }: StatsProps) => {
  const donePercent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Total', value: total, color: 'text-zinc-300' },
        { label: 'To Do', value: todo, color: 'text-slate-400' },
        { label: 'In Progress', value: inProgress, color: 'text-blue-400' },
        { label: 'Done', value: done, color: 'text-emerald-400', sub: `${donePercent}%` },
      ].map(({ label, value, color, sub }) => (
        <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className={`text-2xl font-bold ${color} tabular-nums`}>{value}</div>
          <div className="text-xs text-zinc-600 mt-0.5">{label}</div>
          {sub && <div className="text-[10px] text-zinc-700 mt-0.5">{sub} complete</div>}
        </div>
      ))}
    </div>
  )
}
