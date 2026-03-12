import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cart, logo, profile } from '../assets/index.js';
import CartDrawer from '../components/CartDrawer.jsx';
import { useCart } from '../context/CartContext.jsx';
import { fetchProducts, fallbackProducts } from '../api/products.js';
import { menuBenefits, menuItems } from '../data/menu.js';

const formatCop = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function MenuItem() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [products, setProducts] = useState(menuItems);
  const product =
    products.find((item) => String(item.id) === id || item.code === id) ??
    menuItems.find((item) => item.id === id) ??
    menuItems[0];
  const gallery = product?.detail?.gallery?.length
    ? product.detail.gallery
    : product?.image
      ? [product.image]
      : [];
  const [selectedImage, setSelectedImage] = useState(gallery[0]);
  const [quantity, setQuantity] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [buyButtonWidth, setBuyButtonWidth] = useState(0);
  const quantityRowRef = useRef(null);
  const { items, addItem, increaseItem, decreaseItem, removeItem, itemCount, total } = useCart();

  useEffect(() => {
    setSelectedImage(gallery[0]);
    setQuantity(1);
  }, [gallery]);

  useEffect(() => {
    if (gallery.length <= 1) return;
    const timer = window.setInterval(() => {
      setSelectedImage((prev) => {
        const currentIndex = gallery.indexOf(prev);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % gallery.length;
        return gallery[nextIndex];
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [gallery]);

  useEffect(() => {
    if (!quantityRowRef.current) return;
    setBuyButtonWidth(quantityRowRef.current.offsetWidth);
  }, [quantity]);

  useEffect(() => {
    const handleResize = () => {
      if (!quantityRowRef.current) return;
      setBuyButtonWidth(quantityRowRef.current.offsetWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isActive = true;
    fetchProducts()
      .then((data) => {
        if (!isActive) return;
        setProducts(data.length ? data : fallbackProducts());
      })
      .catch(() => {
        if (!isActive) return;
        setProducts(fallbackProducts());
      });
    return () => {
      isActive = false;
    };
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/home');
  };

  const handleBuy = () => {
    addItem(product, quantity);
    setIsCartOpen(true);
  };

  const subtitle = product?.detail?.subtitle ?? product.description;
  const unitPrice = product?.price ?? 0;
  const totalPrice = unitPrice * quantity;

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
            <button
              className="text-[13px] font-medium text-[#5b667a]"
              type="button"
              onClick={() => navigate('/mis-pedidos')}
            >
              Mis pedidos
            </button>
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

      <main>
        <section className="border-b border-[#eadfd5] bg-[linear-gradient(90deg,#fbf7f3_0%,#f0e9e2_55%,#fbf7f3_100%)]">
          <div className="mx-auto w-[min(1200px,92vw)] py-10">
            <button
              className="inline-flex items-center gap-2 text-[12px] font-medium text-muted"
              type="button"
              onClick={handleBack}
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
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

            <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="overflow-hidden rounded-[22px] border-[6px] border-white shadow-[0_18px_36px_rgba(0,0,0,0.18)]">
                  {selectedImage ? (
                    <img
                      className="h-[300px] w-full object-cover sm:h-[340px]"
                      src={selectedImage}
                      alt={product?.name}
                    />
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {gallery.map((image, index) => {
                    const isActive = image === selectedImage;
                    return (
                      <button
                        className={`overflow-hidden rounded-[14px] border-[3px] ${
                          isActive ? 'border-orange' : 'border-white'
                        } bg-white shadow-[0_10px_18px_rgba(0,0,0,0.15)]`}
                        type="button"
                        key={`${product?.id}-thumb-${index}`}
                        onClick={() => setSelectedImage(image)}
                        aria-label={`Vista ${index + 1} de ${product?.name}`}
                      >
                        <img className="h-[70px] w-[95px] object-cover" src={image} alt="" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col items-start lg:pt-6">
                <h1 className="text-[22px] font-semibold text-title sm:text-[26px]">
                  {product?.name}
                </h1>
                <p className="mt-1 text-[12px] text-muted">{subtitle}</p>
                <p className="mt-3 text-[16px] font-semibold text-orange">
                  {formatCop(totalPrice)} COP
                </p>
                {quantity > 1 ? (
                  <p className="mt-1 text-[11px] text-muted">
                    Precio unitario: {formatCop(unitPrice)} COP
                  </p>
                ) : null}

                <div className="mt-4">
                  <span className="text-[11px] text-muted">Cantidad</span>
                  <div className="mt-2 inline-flex items-center gap-4" ref={quantityRowRef}>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e3d6cb] bg-white text-[14px] text-title shadow-[0_4px_8px_rgba(0,0,0,0.08)]"
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      aria-label="Disminuir cantidad"
                    >
                      -
                    </button>
                    <span className="text-[12px] font-semibold text-title">{quantity}</span>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e3d6cb] bg-white text-[14px] text-title shadow-[0_4px_8px_rgba(0,0,0,0.08)]"
                      type="button"
                      onClick={() => setQuantity((prev) => prev + 1)}
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  className="mt-5 rounded-full bg-orange py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_16px_rgba(242,106,29,0.24)]"
                  type="button"
                  onClick={handleBuy}
                  style={buyButtonWidth ? { width: buyButtonWidth } : undefined}
                >
                  Comprar
                </button>

                <ul className="mt-6 space-y-3">
                  {menuBenefits.map((benefit) => (
                    <li className="flex items-center gap-3 text-[11px] text-muted" key={benefit}>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#29a35a]">
                        <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path
                            d="M3.5 8.5l2.5 2.5 6.5-6.5"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
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
        onProceed={() => {
          setIsCartOpen(false);
          navigate('/checkout', { state: { fromCart: true } });
        }}
      />
    </div>
  );
}
