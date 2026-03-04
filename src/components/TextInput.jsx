export default function TextInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
  inputMode,
  maxLength,
  disabled = false,
}) {
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-[12px] text-text" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full rounded-[6px] border border-[#f3b28f] bg-white px-3 py-2 text-[12px] text-text outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20 disabled:cursor-not-allowed disabled:bg-[#f7efe7]"
      />
    </div>
  );
}
