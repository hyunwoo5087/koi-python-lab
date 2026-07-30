import type { Choice } from '../types'

export function ChoiceList({
  choices,
  value,
  onChange,
  disabled = false,
}: {
  choices: Choice[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="choice-list" role="radiogroup">
      {choices.map((choice) => (
        <button
          className={`choice-card ${value === choice.id ? 'selected' : ''}`}
          type="button"
          key={choice.id}
          onClick={() => onChange(choice.id)}
          disabled={disabled}
          aria-pressed={value === choice.id}
        >
          <span className="choice-letter">{choice.id}</span>
          <span>{choice.text}</span>
        </button>
      ))}
    </div>
  )
}
