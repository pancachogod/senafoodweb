import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CartDrawer from '../components/CartDrawer.jsx';
import { cart, logo, profile } from '../assets/index.js';
import { useCart } from '../context/CartContext.jsx';
import { useOrders } from '../context/OrdersContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const formatCop = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatShortDateTime = (value) => {
  const date = new Date(value);
  const datePart = date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} - ${timePart}`;
};

const formatLongDate = (value) => {
  return new Date(value).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatTime = (value) => {
  return new Date(value).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, cancelOrder, isLoading, error } = useOrders();
  const { items, itemCount, total, increaseItem, decreaseItem, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [openOrderId, setOpenOrderId] = useState(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const copyTimeoutRef = useRef(null);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders]);

  useEffect(() => {
    if (location.state?.openOrderId) {
      setOpenOrderId(location.state.openOrderId);
    }
  }, [location.state]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleToggle = (orderId) => {
    setOpenOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleOpenCancel = (order) => {
    setOrderToCancel(order);
    setIsCancelOpen(true);
  };

  const handleCloseCancel = () => {
    setIsCancelOpen(false);
    setOrderToCancel(null);
    setCancelError('');
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel?.id) return;
    setCancelError('');
    try {
      await cancelOrder(orderToCancel.id);
      handleCloseCancel();
    } catch (error) {
      setCancelError(error?.message || 'No se pudo cancelar el pedido.');
    }
  };

  const handleCopy = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedToken(value);
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedToken(null);
      }, 1500);
    } catch (error) {
      return;
    }
  };

  const handleViewProof = (proof) => {
    if (!proof?.dataUrl) return;
    window.open(proof.dataUrl, '_blank', 'noopener,noreferrer');
  };

  const getStatusStyles = (status) => {
    if (status === 'Cancelado') {
      return 'bg-[#ffe5e5] text-[#d93838]';
    }
    return 'bg-[#fff1df] text-[#e56a1a]';
  };

  const hasOrders = sortedOrders.length > 0;

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-[#eadfd5] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex w-[min(1200px,92vw)] flex-wrap items-center justify-center gap-6 py-4 md:justify-between md:py-5">
          <img className="h-10 w-auto" src={logo} alt="Sena Food" />
          <nav className="flex items-center gap-7">
            <button
              className="text-[13px] font-medium text-[#5b667a]"
              type="button"
              onClick={() => navigate('/home')}
            >
              Inicio
            </button>
            <span className="rounded-full bg-[#ffe7d4] px-4 py-2 text-[12px] font-semibold text-orange shadow-[0_4px_10px_rgba(242,106,29,0.15)]">
              Mis pedidos
            </span>
          </nav>
          <div className="flex items-center gap-4">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfd5] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
              type="button"
              aria-label="Perfil"
              onClick={() => navigate('/perfil')}
            >
              <img className="h-[18px] w-[18px]" src={profile} alt="Perfil" />
            </button>
            <button
              className="flex items-center gap-2 rounded-full bg-orange px-5 py-2 text-[12px] font-semibold text-white shadow-[0_10px_18px_rgba(242,106,29,0.26)]"
              type="button"
              aria-label={`Carrito (${itemCount})`}
              onClick={() => setIsCartOpen(true)}
            >
              <img className="h-4 w-4 brightness-0 invert" src={cart} alt="Carrito" />
              Carrito
              <span className="sr-only">{itemCount}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="border-b border-[#eadfd5] bg-[#fbf7f3]">
        <div className="mx-auto w-[min(1200px,92vw)] py-8">
          <button
            className="inline-flex items-center gap-2 text-[12px] font-medium text-muted"
            type="button"
            onClick={() => navigate('/home')}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10.5 3.25L6 8l4.5 4.75"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Volver
          </button>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-semibold text-title">Historial de Pedidos</h1>
              <p className="mt-1 text-[12px] text-muted">Revisa tus pedidos anteriores</p>
            </div>
            <button
              className="rounded-full bg-orange px-4 py-2 text-[11px] font-semibold text-white shadow-[0_8px_16px_rgba(242,106,29,0.24)]"
              type="button"
              onClick={() => navigate('/home')}
            >
              Nuevo pedido
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {!isAuthenticated ? (
              <div className="rounded-[18px] border border-dashed border-[#eadfd5] bg-white px-6 py-8 text-center shadow-soft">
                <p className="text-[12px] font-semibold text-title">Inicia sesión para ver tus pedidos</p>
                <p className="mt-2 text-[11px] text-muted">
                  Accede con tu cuenta para consultar el historial y tus tokens.
                </p>
                <button
                  className="mt-4 rounded-full bg-orange px-4 py-2 text-[11px] font-semibold text-white"
                  type="button"
                  onClick={() => navigate('/login')}
                >
                  Ir a iniciar sesión
                </button>
              </div>
            ) : isLoading ? (
              <div className="rounded-[18px] border border-dashed border-[#eadfd5] bg-white px-6 py-8 text-center shadow-soft">
                <p className="text-[12px] font-semibold text-title">Cargando pedidos...</p>
              </div>
            ) : error ? (
              <div className="rounded-[18px] border border-dashed border-[#eadfd5] bg-white px-6 py-8 text-center shadow-soft">
                <p className="text-[12px] font-semibold text-title">No se pudieron cargar los pedidos</p>
                <p className="mt-2 text-[11px] text-muted">{error}</p>
              </div>
            ) : hasOrders ? (
              sortedOrders.map((order) => {
                const isOpen = openOrderId === order.id;
                const isCancelled = order.status === 'Cancelado';
                return (
                  <div
                    className="rounded-[18px] border border-[#eadfd5] bg-white shadow-soft"
                    key={order.id}
                  >
                    <button
                      className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 text-left"
                      type="button"
                      onClick={() => handleToggle(order.id)}
                      aria-expanded={isOpen}
                      aria-controls={`order-panel-${order.id}`}
                    >
                      <div className="min-w-[220px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-[13px] font-semibold text-title">
                            {order.title || 'Almuerzo de Día'}
                          </h2>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusStyles(order.status)}`}
                          >
                            {order.status || 'Pendiente'}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted">
                          {order.subtitle || order.items?.[0]?.name}
                        </p>
                        <p className="mt-2 text-[10px] text-muted">
                          Método de Pago: {order.paymentMethod || 'Nequi'} · Fecha y Hora:{' '}
                          {formatShortDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
                          Total de Almuerzo
                        </span>
                        <div className="text-[16px] font-semibold text-orange">
                          {formatCop(order.total || 0)}
                        </div>
                      </div>
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#eadfd5] bg-[#f8f1ea] text-title transition duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M5.5 7.5l4.5 4.5 4.5-4.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>

                    <div
                      id={`order-panel-${order.id}`}
                      className={`grid transition-all duration-300 ease-out ${
                        isOpen ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden border-t border-[#f2e6dc] px-5 pt-5">
                        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                          <div>
                            <h3 className="text-[12px] font-semibold text-title">Productos pedidos</h3>
                            <div className="mt-3 space-y-3">
                              {order.items?.map((item) => (
                                <div
                                  className="flex items-start gap-3 rounded-[16px] bg-[#fff8f1] p-3"
                                  key={`${order.id}-${item.id}`}
                                >
                                  <img
                                    className="h-12 w-14 rounded-[12px] object-cover"
                                    src={item.image || logo}
                                    alt={item.name}
                                  />
                                  <div className="flex-1">
                                    <p className="text-[12px] font-semibold text-title">{item.name}</p>
                                    <p className="mt-1 text-[10px] text-muted">
                                      {item.description ||
                                        'Incluye arroz, ensalada fresca y bebida natural'}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                                      <span>Cantidad: {item.quantity}</span>
                                      <span className="font-semibold text-title">
                                        {formatCop(item.price * item.quantity)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-[18px] bg-[#fffdf9] p-4 shadow-soft">
                            <h3 className="text-[12px] font-semibold text-title">Detalles del pedido</h3>
                            <div className="mt-3 space-y-3 text-[11px] text-muted">
                              <div>
                                <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
                                  Token de pedido
                                </span>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="rounded-[8px] bg-[#fff2e6] px-2 py-1 text-[12px] font-semibold text-orange">
                                    {order.token}
                                  </span>
                                  <div className="relative">
                                    <button
                                      className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[#eadfd5] bg-white"
                                      type="button"
                                      aria-label="Copiar token"
                                      onClick={() => handleCopy(order.token)}
                                    >
                                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
                                        <rect
                                          x="7"
                                          y="6"
                                          width="9"
                                          height="10"
                                          rx="2"
                                          stroke="currentColor"
                                          strokeWidth="1.3"
                                        />
                                        <rect
                                          x="4"
                                          y="3"
                                          width="9"
                                          height="10"
                                          rx="2"
                                          stroke="currentColor"
                                          strokeWidth="1.3"
                                        />
                                      </svg>
                                    </button>
                                    {copiedToken === order.token ? (
                                      <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-title px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft">
                                        Copiado
                                      </span>
                                    ) : null}
                                  </div>
                                  {order.proof?.dataUrl ? (
                                    <button
                                      className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[#eadfd5] bg-white"
                                      type="button"
                                      aria-label="Ver comprobante"
                                      onClick={() => handleViewProof(order.proof)}
                                    >
                                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
                                        <path
                                          d="M2.5 10s3-5 7.5-5 7.5 5 7.5 5-3 5-7.5-5-7.5-5Z"
                                          stroke="currentColor"
                                          strokeWidth="1.4"
                                        />
                                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                                      </svg>
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center justify-between border-t border-[#f0e1d6] pt-3">
                                <span>Método de pago</span>
                                <span className="text-title">{order.paymentMethod || 'Nequi'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Fecha</span>
                                <span className="text-title">{formatLongDate(order.createdAt)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Hora</span>
                                <span className="text-title">{formatTime(order.createdAt)}</span>
                              </div>
                              <div className="flex items-center justify-between border-t border-[#f0e1d6] pt-3">
                                <span className="font-semibold text-title">Total</span>
                                <span className="font-semibold text-orange">
                                  {formatCop(order.total || 0)}
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <button
                                className="w-full rounded-full bg-[#23b146] py-2 text-[11px] font-semibold text-white shadow-[0_10px_18px_rgba(35,177,70,0.3)]"
                                type="button"
                                onClick={() => navigate('/home')}
                              >
                                Volver a pedir
                              </button>
                              <button
                                className="w-full rounded-full border border-[#eadfd5] bg-white py-2 text-[11px] text-title"
                                type="button"
                              >
                                Download receipt
                              </button>
                              <button
                                className="w-full rounded-full bg-[#ff2f2f] py-2 text-[11px] font-semibold text-white"
                                type="button"
                                disabled={isCancelled}
                                onClick={() => handleOpenCancel(order)}
                              >
                                {isCancelled ? 'Pedido cancelado' : 'Cancelar pedido'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[18px] border border-dashed border-[#eadfd5] bg-white px-6 py-8 text-center shadow-soft">
                <p className="text-[12px] font-semibold text-title">Aún no tienes pedidos</p>
                <p className="mt-2 text-[11px] text-muted">
                  Cuando confirmes un pago, aparecerá aquí tu historial.
                </p>
                <button
                  className="mt-4 rounded-full bg-orange px-4 py-2 text-[11px] font-semibold text-white"
                  type="button"
                  onClick={() => navigate('/home')}
                >
                  Ir al menú
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {isCancelOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-[420px] rounded-[18px] bg-[#fff8f1] px-5 py-5 shadow-[0_18px_36px_rgba(0,0,0,0.2)]">
            <h3 className="text-[14px] font-semibold text-title">¿Cancelar este pedido?</h3>
            <p className="mt-2 text-[11px] text-muted">
              Esta acción no se puede deshacer. El pedido será cancelado y no podrás recuperarlo.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <button
                className="rounded-full border border-[#eadfd5] bg-white px-4 py-2 text-[11px] text-title"
                type="button"
                onClick={handleCloseCancel}
              >
                No, mantener pedido
              </button>
              <button
                className="rounded-full bg-[#ff2f2f] px-4 py-2 text-[11px] font-semibold text-white"
                type="button"
                onClick={handleConfirmCancel}
              >
                Si, cancelar pedido
              </button>
            </div>
            {cancelError ? (
              <p className="mt-3 text-[10px] text-[#e24c3b]">{cancelError}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <CartDrawer
        open={isCartOpen}
        items={items}
        total={total}
        onClose={() => setIsCartOpen(false)}
        onIncrease={increaseItem}
        onDecrease={decreaseItem}
        onRemove={removeItem}
        onNavigateMenu={() => {
          setIsCartOpen(false);
          navigate('/home');
        }}
        onProceed={
          items.length
            ? () => {
                setIsCartOpen(false);
                navigate('/checkout');
              }
            : undefined
        }
      />
    </div>
  );
}
