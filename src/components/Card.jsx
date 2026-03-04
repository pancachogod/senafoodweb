export default function Card({ children, className = '' }) {
  return (
    <div
      className={`flex w-full max-w-[360px] flex-col items-center gap-3 rounded-[22px] bg-white px-6 py-5 text-center shadow-card ${className}`}
    >
      {children}
    </div>
  );
}
