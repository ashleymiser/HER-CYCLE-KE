const ACCENTS = {
  sage: { border: 'var(--color-sage)', bg: 'var(--color-sage-light)' },
  rust: { border: 'var(--color-rust)', bg: 'var(--color-rust-light)' },
  amber: { border: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
  plum: { border: 'var(--color-plum)', bg: 'var(--color-plum-tint)' },
}

export default function OptionButton({ label, help, selected, onClick, accent = 'rust' }) {
  const { border, bg } = ACCENTS[accent] || ACCENTS.rust

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border px-4 py-3 mb-2 transition-colors
                 focus:outline-none focus:ring-2 focus:ring-offset-1"
      style={{
        borderColor: selected ? border : 'var(--color-sand-dark)',
        background: selected ? bg : 'var(--color-cream)',
        '--tw-ring-color': border,
      }}
    >
      <div className="font-medium text-sm text-plum">{label}</div>
      {help && <div className="text-xs mt-0.5 text-plum-light">{help}</div>}
    </button>
  )
}
