export default function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}) {
  return (
    <button
      className={`w-full max-w-[230px] rounded-[6px] bg-orange px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.4px] text-white shadow-[0_4px_0_#d65318] transition disabled:cursor-not-allowed disabled:bg-[#e7b79f] disabled:shadow-none ${className}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
