import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cart, logo, nequi, profile, qr } from '../assets/index.js';
import HeaderNavDrawer from '../components/HeaderNavDrawer.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useOrders } from '../context/OrdersContext.jsx';
import { getProfile } from '../data/profile.js';
import { createPayment } from '../api/payments.js';

const formatCop = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Checkout() {
  const navigate = useNavigate();
  const { items, itemCount, total, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { token, user, isAuthenticated, logout } = useAuth();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isConfirmWarningOpen, setIsConfirmWarningOpen] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const isProofReady = Boolean(paymentProof);
  const shouldHighlightPayment = isProofReady && !isSubmitting;

  const hasItems = items.length > 0;
  const summaryItems = useMemo(() => items, [items]);
  const profileData = useMemo(() => {
    if (user) {
      return {
        name: user.name,
        phone: user.phone,
        email: user.email,
        document: user.document,
        createdAt: user.created_at,
      };
    }
    return getProfile();
  }, [user]);

  const handleProofChange = (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    const isValidType = ['image/png', 'image/jpeg'].includes(file.type);
    if (!isValidType) {
      setPaymentError('Solo se permiten imagenes PNG o JPG.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPaymentError('El archivo supera 5MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProof({ name: file.name, dataUrl: reader.result, file });
      setPaymentError('');
      input.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPayment = async () => {
    if (!hasItems) return;
    if (!isAuthenticated) {
      setPaymentError('Inicia sesión para continuar.');
      navigate('/login');
      return;
    }
    if (!paymentProof?.file) {
      setPaymentError('Sube el comprobante para continuar.');
      return;
    }
    setIsSubmitting(true);
    setPaymentError('');
    try {
      const itemsPayload = summaryItems.map((item) => {
        const numericId = Number.isInteger(item.id) ? item.id : Number(item.id);
        if (Number.isFinite(numericId)) {
          return {
            product_id: numericId,
            quantity: item.quantity,
          };
        }
        return {
          name: item.name,
          description: item.description,
          price: item.price,
          image_url: item.image,
          quantity: item.quantity,
        };
      });

      const order = pendingOrderId
        ? { id: pendingOrderId, total }
        : await createOrder({
            items: itemsPayload,
            payment_method: 'Nequi',
          });

      if (!pendingOrderId) {
        setPendingOrderId(order.id);
      }

      await createPayment(token, {
        order_id: order.id,
        method: 'Nequi',
        amount: order.total,
        status: 'Pendiente',
        proof: paymentProof.file,
      });

      clearCart();
      setPendingOrderId(null);
      setIsPaymentOpen(false);
      setPaymentProof(null);
      setPaymentError('');
      navigate('/mis-pedidos', { state: { openOrderId: order.id } });
    } catch (error) {
      setPaymentError(error?.message || 'No se pudo confirmar el pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-cream pb-6 pt-6">
        <div className="mx-auto w-[min(1200px,92vw)]">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[#eadfd5] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)] animate-fade-up">
            <HeaderNavDrawer
              active="home"
              onNavigateHome={() => navigate('/home')}
              onNavigateOrders={() => navigate('/mis-pedidos')}
              trigger={
                <div className="flex items-center gap-3">
                  <span className="flex h-14 w-14 items-center justify-center">
                    <img
                      className="h-14 w-14 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
                      src={logo}
                      alt="Sena Food"
                    />
                  </span>
                  <div>
                    <span className="block text-[15px] font-semibold tracking-[0.08em] text-title">
                      SENAFOOD
                    </span>
                    <span className="block text-[11px] text-muted">Cafeteria SENA Salomia</span>
                  </div>
                </div>
              }
              triggerClassName="rounded-[14px] px-2 py-1 transition hover:bg-[#f8f4ef]"
              triggerLabel="Abrir menu de navegacion"
              menuClassName="mt-4 w-[190px]"
            />
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                className="flex items-center gap-2 rounded-full bg-orange px-5 py-2 text-[12px] font-semibold text-white shadow-[0_10px_18px_rgba(242,106,29,0.26)]"
                type="button"
                aria-label={`Carrito (${itemCount})`}
                onClick={() => navigate('/home', { state: { openCart: true } })}
              >
                <img className="h-4 w-4 brightness-0 invert" src={cart} alt="Carrito" />
                Carrito
                <span className="sr-only">{itemCount}</span>
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-orange text-white shadow-[0_10px_18px_rgba(242,106,29,0.28)] transition hover:-translate-y-0.5"
                type="button"
                aria-label="Perfil"
                onClick={() => navigate('/perfil')}
              >
                <img className="h-4 w-4 brightness-0 invert" src={profile} alt="Perfil" />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ffd5d5] bg-[#fff7f7] text-[#e24c3b] shadow-[0_6px_14px_rgba(226,76,59,0.12)] transition hover:-translate-y-0.5"
                type="button"
                aria-label="Cerrar sesion"
                onClick={handleLogout}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M8 4h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 10h8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 7l-3 3 3 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="border-b border-[#eadfd5] bg-[linear-gradient(90deg,#fbf7f3_0%,#f0e9e2_55%,#fbf7f3_100%)]">
        <div className="mx-auto w-[min(1200px,92vw)] py-8">
          <div className="mx-auto w-full max-w-[720px]">
            <button
              className="inline-flex items-center gap-2 text-[12px] font-medium text-muted"
              type="button"
              onClick={() => navigate('/home', { state: { openCart: true } })}
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
              Volver al carrito
            </button>

            <h1 className="mt-4 text-[18px] font-semibold text-title">Método de pago</h1>

            <div className="mt-5 rounded-[18px] bg-white px-6 py-5 shadow-soft">
              <h2 className="text-[12px] font-semibold text-title">Resumen del pedido</h2>

              {hasItems ? (
                <div className="mt-4 space-y-3 border-b border-[#f2e6dc] pb-4">
                  {summaryItems.map((item) => (
                    <div className="flex items-start justify-between gap-4" key={item.id}>
                      <div>
                        <p className="text-[12px] font-semibold text-title">{item.name}</p>
                        <p className="text-[10px] text-muted">
                          {item.description || 'Incluye arroz, ensalada y bebida natural'}
                        </p>
                      </div>
                      <span className="text-[11px] text-title">
                        {formatCop(item.price)} x {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-[11px] text-muted">No hay articulos en tu carrito.</p>
              )}

              <div className="mt-4 space-y-2 text-[11px] text-muted">
                <div className="flex items-center justify-between">
                  <span>Cliente:</span>
                  <span className="text-title">{profileData.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Teléfono:</span>
                  <span className="text-title">{profileData.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Método de Pago:</span>
                  <span className="text-title">Nequi</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-[12px] font-semibold text-title">
                  <span>Total</span>
                  <span className="text-orange">{formatCop(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[12px] font-semibold text-title">Método de pago</p>
              <button
                className="mt-3 flex w-full items-center justify-between rounded-[14px] border border-[#b084ff] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(176,132,255,0.2)]"
                type="button"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f1e9ff]">
                    <img className="h-6 w-6" src={nequi} alt="Nequi" />
                  </div>
                  <div className="text-left">
                    <p className="text-[12px] font-semibold text-title">Nequi</p>
                    <p className="text-[10px] text-muted">Pago digital instantáneo</p>
                  </div>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8c5bff] text-[12px] text-white">
                  ✓
                </span>
              </button>
            </div>

            <button
              className="mt-5 w-full rounded-full bg-orange py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_18px_rgba(242,106,29,0.26)] disabled:cursor-not-allowed disabled:bg-[#e7b79f]"
              type="button"
              disabled={!hasItems}
              onClick={() => {
                setPaymentError('');
                setIsConfirmWarningOpen(true);
              }}
            >
              Confirmar Pedido
            </button>
          </div>
        </div>
      </main>

      {isConfirmWarningOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[420px] rounded-[18px] bg-[#fff8f1] px-5 py-5 shadow-[0_18px_36px_rgba(0,0,0,0.2)]">
            <h3 className="text-[14px] font-semibold text-title">Este pedido no puede ser reembolsado</h3>
            <p className="mt-2 text-[11px] text-muted">
              Al continuar, confirmas que no podrás solicitar reembolso de este pedido.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <button
                className="rounded-full border border-[#eadfd5] bg-white px-4 py-2 text-[11px] text-title"
                type="button"
                onClick={() => setIsConfirmWarningOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="rounded-full bg-orange px-4 py-2 text-[11px] font-semibold text-white shadow-[0_8px_16px_rgba(242,106,29,0.2)]"
                type="button"
                onClick={() => {
                  setIsConfirmWarningOpen(false);
                  setIsPaymentOpen(true);
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPaymentOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[420px] rounded-[18px] bg-[#fff8f1] shadow-[0_18px_36px_rgba(0,0,0,0.2)]">
            <div className="flex items-start justify-between border-b border-[#f0e1d6] px-6 py-4">
              <div>
                <h2 className="text-[16px] font-semibold text-title">Pago con Nequi</h2>
                <p className="mt-1 text-[11px] text-muted">
                  Realiza el pago mediante Nequi para confirmar tu pedido
                </p>
              </div>
                <button
                  className="text-[18px] text-muted"
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => {
                    setIsPaymentOpen(false);
                    setPaymentError('');
                  }}
                >
                  ×
                </button>
            </div>

            <div className="px-6 py-5">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-[110px] w-[110px] items-center justify-center rounded-[14px] border border-[#e5d2ff] bg-[#f7f1ff]">
                  <img className="h-[70px] w-[70px]" src={qr} alt="Codigo QR" />
                </div>
                <p className="mt-4 text-[11px] text-muted">
                  Escanea el codigo QR con tu app Nequi
                </p>
                <p className="text-[10px] text-muted">
                  O transfiere a: <span className="font-semibold text-title">3001234567</span>
                </p>
                <p className="mt-4 text-[11px] text-muted">Total a pagar</p>
                <p className="text-[18px] font-semibold text-orange">{formatCop(total)} COP</p>
              </div>

              <div className="mt-6 border-t border-[#f0e1d6] pt-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-title">
                  <span className="text-orange">⬆</span>
                  Comprobante de Pago <span className="text-orange">*</span>
                </div>
                <label
                  className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border border-[#eadfd5] bg-white px-4 py-5 text-center"
                  htmlFor="payment-proof"
                >
                  <span className="text-[18px] text-muted">{paymentProof ? '✓' : '⬆'}</span>
                  <span className="text-[11px] text-muted">
                    {paymentProof ? 'Comprobante cargado' : 'Subir foto de comprobante'}
                  </span>
                  <span className="text-[10px] text-muted">
                    {paymentProof ? paymentProof.name : 'PNG, JPG o JPEG (max. 5MB)'}
                  </span>
                </label>
                <input
                  id="payment-proof"
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleProofChange}
                />
                {paymentProof ? (
                  <div className="mt-3 flex items-center gap-3 rounded-[12px] border border-[#eadfd5] bg-white px-3 py-2">
                    <img
                      className="h-12 w-12 rounded-[10px] object-cover"
                      src={paymentProof.dataUrl}
                      alt="Comprobante"
                    />
                    <div className="flex-1 text-[10px] text-muted">
                      Archivo seleccionado:{' '}
                      <span className="font-semibold text-title">{paymentProof.name}</span>
                    </div>
                    <button
                      className="text-[10px] font-semibold text-orange"
                      type="button"
                      onClick={() => setPaymentProof(null)}
                    >
                      Cambiar
                    </button>
                  </div>
                ) : null}
                {paymentError ? (
                  <p className="mt-2 text-[10px] text-[#e24c3b]">{paymentError}</p>
                ) : null}
                <p className="mt-2 text-[10px] text-muted">
                  * El comprobante es obligatorio para confirmar tu pedido
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-[#f0e1d6] px-6 py-4">
              <button
                className="flex-1 rounded-full border border-[#eadfd5] bg-white py-2 text-[12px] text-title"
                type="button"
                onClick={() => {
                  setIsPaymentOpen(false);
                  setPaymentError('');
                }}
              >
                Cancelar
              </button>
              <button
                className={`flex-1 rounded-full py-2 text-[12px] font-semibold text-white transition ${
                  shouldHighlightPayment
                    ? 'bg-[#59c976] shadow-[0_12px_20px_rgba(89,201,118,0.35)] ring-2 ring-[#b9f2cb]/70'
                    : 'bg-[#cfd3d8] shadow-none'
                } disabled:cursor-not-allowed`}
                type="button"
                disabled={!isProofReady || isSubmitting}
                onClick={handleConfirmPayment}
              >
                {isSubmitting ? 'Confirmando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
