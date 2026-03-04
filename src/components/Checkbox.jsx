export default function Checkbox({ label, checked, onChange }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        className={`flex h-[14px] w-[14px] items-center justify-center rounded-[3px] border border-orange text-[10px] text-white ${
          checked ? 'bg-orange' : 'bg-white'
        }`}
        aria-hidden="true"
      >
        {checked ? '✓' : ''}
      </span>
      <span>{label}</span>
    </label>
  );
}
