export function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = Math.round((current / total) * 100)
  return (
    <div className="progress-wrap" aria-label={`전체 ${total}문제 중 ${current}문제 진행`}>
      <div className="progress-meta">
        <span>{current} / {total}</span>
        <span>{percent}%</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
    </div>
  )
}
