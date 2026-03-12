import { useEffect, useRef, useState } from 'react';

export default function HeaderNavDrawer({ active, onNavigateHome, onNavigateOrders }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) return;
      setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const baseItemClass =
    'w-full rounded-[10px] px-3 py-2 text-left text-[12px] font-semibold transition';
  const activeClass = 'bg-[#ffe7d4] text-orange';
  const idleClass = 'text-title hover:bg-[#fff4eb]';

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="inline-flex items-center gap-2 rounded-full border border-[#eadfd5] bg-white px-4 py-2 text-[12px] font-semibold text-title shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ffe7d4] text-orange">
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4 6h12M4 10h12M4 14h8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        Inicio y pedidos
      </button>
      {open ? (
        <div
          className="absolute left-0 top-full z-30 mt-3 w-[180px] rounded-[16px] border border-[#eadfd5] bg-white/95 p-2 shadow-[0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur"
          role="menu"
        >
          <button
            className={`${baseItemClass} ${active === 'home' ? activeClass : idleClass}`}
            type="button"
            onClick={() => {
              setOpen(false);
              onNavigateHome?.();
            }}
            role="menuitem"
          >
            Inicio
          </button>
          <button
            className={`${baseItemClass} ${active === 'orders' ? activeClass : idleClass}`}
            type="button"
            onClick={() => {
              setOpen(false);
              onNavigateOrders?.();
            }}
            role="menuitem"
          >
            Pedidos
          </button>
        </div>
      ) : null}
    </div>
  );
}
