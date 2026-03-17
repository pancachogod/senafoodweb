import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import CartDrawer from '../components/CartDrawer.jsx';
import HeaderNavDrawer from '../components/HeaderNavDrawer.jsx';
import { cart, logo, profile, qr } from '../assets/index.js';
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

const loadImageData = async (src) => {
  if (!src) return null;
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
    return { dataUrl, width: image.width, height: image.height };
  } catch (error) {
    return null;
  }
};

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, isLoading, error } = useOrders();
  const { items, itemCount, total, increaseItem, decreaseItem, removeItem } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [openOrderId, setOpenOrderId] = useState(null);
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

  const buildReceiptFileName = (order) => {
    const tokenPart = order?.token
      ? String(order.token).replace(/[^a-zA-Z0-9_-]/g, '')
      : String(order?.id ?? 'pedido');
    const date = new Date(order?.createdAt);
    const dateLabel = Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
    return `recibo-${tokenPart || 'pedido'}${dateLabel ? `-${dateLabel}` : ''}.pdf`;
  };

  const handleDownloadReceipt = async (order) => {
    if (!order) return;
    const [logoData, qrData] = await Promise.all([loadImageData(logo), loadImageData(qr)]);

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const lineHeight = 14;
    let y = margin;

    const ensureSpace = (heightNeeded) => {
      if (y + heightNeeded > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    let headerHeight = 0;
    if (logoData?.dataUrl) {
      const maxLogoWidth = 120;
      const maxLogoHeight = 48;
      const logoScale = Math.min(
        maxLogoWidth / logoData.width,
        maxLogoHeight / logoData.height,
        1
      );
      const logoWidth = logoData.width * logoScale;
      const logoHeight = logoData.height * logoScale;
      doc.addImage(logoData.dataUrl, 'PNG', margin, y, logoWidth, logoHeight);
      headerHeight = logoHeight;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Recibo de compra', pageWidth - margin, y + 18, { align: 'right' });
    headerHeight = Math.max(headerHeight, 24);
    y += headerHeight + 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Sena Food', margin, y);
    y += lineHeight;
    doc.text(`Fecha de emision: ${formatShortDateTime(order.createdAt)}`, margin, y);
    y += lineHeight;
    doc.text(`Pedido: ${order.token || order.id}`, margin, y);
    y += lineHeight;
    doc.text(`Estado: ${order.status}`, margin, y);
    y += lineHeight;
    doc.text(`Metodo de pago: ${order.paymentMethod || 'Nequi'}`, margin, y);
    y += lineHeight;
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    const receiptUser = order.user || user;
    if (receiptUser) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Cliente', margin, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const clientLines = [];
      if (receiptUser.name) clientLines.push(`Nombre: ${receiptUser.name}`);
      if (receiptUser.document) clientLines.push(`Documento: ${receiptUser.document}`);
      if (receiptUser.email) clientLines.push(`Correo: ${receiptUser.email}`);
      if (receiptUser.phone) clientLines.push(`Telefono: ${receiptUser.phone}`);
      if (!clientLines.length) clientLines.push('Informacion no disponible.');

      clientLines.forEach((line) => {
        ensureSpace(lineHeight);
        doc.text(line, margin, y);
        y += lineHeight;
      });
      y += 6;
      doc.line(margin, y, pageWidth - margin, y);
      y += 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Detalle del pedido', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const itemsList = Array.isArray(order.items) ? order.items : [];
    if (!itemsList.length) {
      doc.text('Sin productos registrados.', margin, y);
      y += lineHeight;
    } else {
      const colSubtotalX = pageWidth - margin;
      const colUnitX = colSubtotalX - 90;
      const colQtyX = colUnitX - 50;
      const colNameWidth = colQtyX - margin - 10;

      doc.setFont('helvetica', 'bold');
      doc.text('Producto', margin, y);
      doc.text('Cant.', colQtyX, y, { align: 'right' });
      doc.text('Unit.', colUnitX, y, { align: 'right' });
      doc.text('Subtotal', colSubtotalX, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 12;
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;

      itemsList.forEach((item) => {
        const quantity = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1;
        const unitPrice = Number.isFinite(Number(item.price)) ? Number(item.price) : 0;
        const subtotal = unitPrice * quantity;
        const nameLines = doc.splitTextToSize(item.name || 'Producto', colNameWidth);
        const rowHeight = lineHeight * nameLines.length;
        ensureSpace(rowHeight + 12);

        doc.text(nameLines, margin, y);
        doc.text(String(quantity), colQtyX, y, { align: 'right' });
        doc.text(formatCop(unitPrice), colUnitX, y, { align: 'right' });
        doc.text(formatCop(subtotal), colSubtotalX, y, { align: 'right' });
        y += rowHeight + 6;
      });
    }

    ensureSpace(40);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.text('Total', pageWidth - margin - 90, y, { align: 'right' });
    doc.text(formatCop(order.total || 0), pageWidth - margin, y, { align: 'right' });
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    if (qrData?.dataUrl) {
      const qrSize = 96;
      ensureSpace(qrSize + 16);
      const qrX = pageWidth - margin - qrSize;
      const qrY = y;
      doc.addImage(qrData.dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      doc.text('QR', qrX + qrSize / 2, qrY + qrSize + 12, { align: 'center' });
      y += qrSize + 20;
    }

    doc.text('Gracias por tu compra.', margin, y);

    doc.save(buildReceiptFileName(order));
  };

  const getStatusStyles = (status) => {
    if (status === 'Cancelado') {
      return 'bg-[#ffe5e5] text-[#d93838]';
    }
    if (status === 'Entregado') {
      return 'bg-[#e7f7eb] text-[#24884b]';
    }
    return 'bg-[#fff1df] text-[#e56a1a]';
  };

  const hasOrders = sortedOrders.length > 0;
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
              active="orders"
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
                onClick={() => setIsCartOpen(true)}
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
                                    src={item.image || item.imageFallback || logo}
                                    alt={item.name}
                                    onError={(event) => {
                                      const fallback = item.imageFallback || logo;
                                      if (event.currentTarget.src !== fallback) {
                                        event.currentTarget.src = fallback;
                                      }
                                    }}
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
                                onClick={() => handleDownloadReceipt(order)}
                              >
                                Descargar Recibo
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
