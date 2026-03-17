import { useEffect } from 'react';

const formatCop = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CartDrawer({
  open,
  items,
  total,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onNavigateMenu,
  onProceed,
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isEmpty = !items.length;

  return (
    <div className="fixed inset-0 z-40">
      <button
        className="absolute inset-0 bg-black/40"
        type="button"
        aria-label="Cerrar carrito"
        onClick={onClose}
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-[min(360px,92vw)] flex-col bg-[#fff8f1] shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between border-b border-[#f0e1d6] px-5 py-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-title">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 7.2h12l-1 9.1a2 2 0 0 1-2 1.8H7a2 2 0 0 1-2-1.8L4 7.2Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 7.2V6a3.5 3.5 0 1 1 7 0v1.2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            Tu Carrito
          </div>
          <button
            className="text-[16px] text-muted"
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {isEmpty ? (
          <div className="flex flex-1 flex-col">
            <p className="px-5 pt-3 text-[11px] text-muted">Tu carrito esta vacio</p>
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-[#e7d8cc] bg-white">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 8h14l-1.2 11.5a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z"
                    stroke="#c7c7c7"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.2 8V6.6a3.8 3.8 0 0 1 7.6 0V8"
                    stroke="#c7c7c7"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-[11px] text-muted">No hay articulos en tu carrito</p>
              {onNavigateMenu ? (
                <button
                  className="rounded-full bg-orange px-4 py-2 text-[11px] font-semibold text-white shadow-[0_8px_16px_rgba(242,106,29,0.24)]"
                  type="button"
                  onClick={onNavigateMenu}
                >
                  Ver Menu
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {items.map((item) => (
                <div
                  className="flex gap-3 rounded-[16px] bg-white/90 p-3 shadow-[0_8px_18px_rgba(0,0,0,0.08)]"
                  key={item.id}
                >
                  <img
                    className="h-[58px] w-[70px] rounded-[12px] object-cover"
                    src={item.image}
                    alt={item.name}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-[12px] font-semibold text-title">{item.name}</h4>
                        <span className="text-[11px] text-muted">{formatCop(item.price)}</span>
                      </div>
                      <button
                        className="text-[14px] text-muted"
                        type="button"
                        aria-label={`Eliminar ${item.name}`}
                        onClick={() => onRemove(item.id)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-[#e7d8cc] bg-white text-[12px] text-title"
                          type="button"
                          onClick={() => onDecrease(item.id)}
                          aria-label={`Disminuir ${item.name}`}
                        >
                          -
                        </button>
                        <span className="text-[11px] font-semibold text-title">{item.quantity}</span>
                        <button
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-[#e7d8cc] bg-white text-[12px] text-title disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          onClick={() => onIncrease(item.id)}
                          aria-label={`Aumentar ${item.name}`}
                          disabled={item.stock !== null && item.quantity >= item.stock}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[11px] font-semibold text-title">
                        {formatCop(item.price * item.quantity)}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-muted">
                      {item.stock === null
                        ? 'Stock no disponible.'
                        : item.stock > 0
                          ? `Disponibles: ${item.stock}`
                          : 'Agotado'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#f0e1d6] px-5 py-4">
              <div className="flex items-center justify-between text-[12px] text-title">
                <span>Total</span>
                <span className="font-semibold">{formatCop(total)}</span>
              </div>
              {onProceed ? (
                <button
                  className="mt-4 w-full rounded-full bg-[#2fb454] py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_18px_rgba(47,180,84,0.28)]"
                  type="button"
                  onClick={onProceed}
                >
                  Continuar con el pago
                </button>
              ) : null}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
