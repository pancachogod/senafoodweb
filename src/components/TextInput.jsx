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
  icon,
  variant = 'boxed',
  inputClassName = '',
  labelClassName = '',
  wrapperClassName = '',
}) {
  const isUnderline = variant === 'underline';
  const labelStyles = `mb-1.5 block text-[12px] ${
    isUnderline ? 'text-title' : 'text-text'
  } ${labelClassName}`;
  const inputStyles = isUnderline
    ? `w-full bg-transparent py-2 text-[12px] text-text outline-none transition placeholder:text-[#8b7a6e] disabled:cursor-not-allowed ${inputClassName}`
    : `w-full rounded-[6px] border border-[#f3b28f] bg-white px-3 py-2 text-[12px] text-text outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20 disabled:cursor-not-allowed disabled:bg-[#f7efe7] ${
        icon ? 'pl-9' : ''
      } ${inputClassName}`;
  const inputField = (
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
      className={inputStyles}
    />
  );

  return (
    <div className={`w-full ${wrapperClassName}`}>
      <label className={labelStyles} htmlFor={name}>
        {label}
      </label>
      {isUnderline ? (
        <div
          className={`flex items-center gap-2 border-b border-[#d1b09a] pb-1 transition focus-within:border-orange ${
            disabled ? 'opacity-60' : ''
          }`}
        >
          {icon ? <span className="text-[#7a665a]">{icon}</span> : null}
          {inputField}
        </div>
      ) : icon ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a665a]">
            {icon}
          </span>
          {inputField}
        </div>
      ) : (
        inputField
      )}
    </div>
  );
}
