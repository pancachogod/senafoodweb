import { useEffect, useRef, useState } from 'react';

export default function HeaderNavDrawer({
  active,
  onNavigateHome,
  onNavigateOrders,
  trigger,
  triggerClassName = '',
  menuClassName = '',
  triggerLabel = 'Abrir menu de navegacion',
}) {
  const [open, setOpen] = useState(false);
  const [allowTap, setAllowTap] = useState(false);
  const menuRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const media = window.matchMedia('(hover: none), (pointer: coarse)');
    const update = () => setAllowTap(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

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
  const toggleLabel = active === 'orders' ? 'Pedidos' : 'Inicio';

  const handleToggle = () => {
    if (!allowTap) return;
    setOpen((prev) => !prev);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen((prev) => !prev);
    }
  };

  const handleBlur = (event) => {
    if (!menuRef.current) return;
    if (menuRef.current.contains(event.relatedTarget)) return;
    setOpen(false);
  };

  const handleMouseEnter = () => {
    if (allowTap) return;
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = (event) => {
    if (allowTap) return;
    if (menuRef.current && menuRef.current.contains(event.relatedTarget)) return;
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimeoutRef.current = null;
    }, 1500);
  };

  const triggerContent = trigger ?? (
    <>
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
      {toggleLabel}
    </>
  );

  const triggerBaseClass = trigger
    ? 'inline-flex items-center gap-3 text-left'
    : 'inline-flex items-center gap-2 rounded-full border border-[#eadfd5] bg-white px-4 py-2 text-[12px] font-semibold text-title shadow-[0_4px_10px_rgba(0,0,0,0.08)]';

  return (
    <div
      className="relative"
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onBlur={handleBlur}
    >
      <button
        className={`${triggerBaseClass} ${triggerClassName}`}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={triggerLabel}
      >
        {triggerContent}
      </button>
      <div
        className={`absolute left-0 top-full z-30 mt-3 w-[180px] rounded-[16px] border border-[#eadfd5] bg-white/95 p-2 shadow-[0_12px_28px_rgba(0,0,0,0.12)] backdrop-blur transition duration-200 ease-out ${
          open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'
        } ${menuClassName}`}
        role="menu"
        aria-hidden={!open}
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
    </div>
  );
}
