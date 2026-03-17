import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CartDrawer from '../components/CartDrawer.jsx';
import HeaderNavDrawer from '../components/HeaderNavDrawer.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  cart,
  cartMenu,
  clients,
  clockIcon,
  healthyIcon,
  ingredientsFresh,
  logo,
  lunchFish,
  naturalIcon,
  profile,
  rating,
  riceBowl,
  saladHome,
  starIcon,
  stepOne,
  stepThree,
  stepTwo,
} from '../assets/index.js';
import { fallbackProducts, fetchProducts } from '../api/products.js';
import { menuItems } from '../data/menu.js';

const formatCop = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

const getProductKey = (product) => product?.id ?? product?.code ?? product?.name ?? '';

const getProductImages = (product) => {
  const gallery = product?.detail?.gallery;
  if (Array.isArray(gallery) && gallery.length) {
    return gallery;
  }
  return product?.image ? [product.image] : [];
};

const getStockLabel = (stock) => {
  if (!Number.isFinite(stock) || stock < 0) {
    return 'Stock no disponible';
  }
  if (stock === 0) {
    return 'Agotado';
  }
  if (stock === 1) {
    return '1 disponible';
  }
  return `${stock} disponibles`;
};

const getStockStyles = (stock) => {
  if (!Number.isFinite(stock) || stock <= 0) {
    return 'bg-[#fff1f1] text-[#d93838]';
  }
  return 'bg-[#edf8ef] text-[#24884b]';
};

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [products, setProducts] = useState(menuItems);
  const [productsError, setProductsError] = useState('');
  const [carouselIndexMap, setCarouselIndexMap] = useState({});
  const { items, addItem, increaseItem, decreaseItem, removeItem, itemCount, total } = useCart();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const steps = useMemo(
    () => [
      {
        title: 'Elige tu menu',
        text: 'Selecciona el almuerzo que mas te guste.',
        image: stepOne,
      },
      {
        title: 'Realiza el pago',
        text: 'Paga facil y rapido desde la plataforma.',
        image: stepTwo,
      },
      {
        title: 'Recoge tu pedido',
        text: 'Presenta tu token y disfruta tu comida.',
        image: stepThree,
      },
    ],
    []
  );

  const faqs = useMemo(
    () => [
      {
        question: '¿Cómo puedo hacer un pedido?',
        answer:
          'Puedes hacer un pedido seleccionando los productos que deseas desde nuestro menú, agregándolos al carrito y procediendo al checkout. Luego selecciona tu método de pago preferido.',
      },
      {
        question: '¿Cuáles son los métodos de pago disponibles?',
        answer:
          'Aceptamos pagos exclusivamente mediante Nequi. Te proporcionaremos las instrucciones de pago con un código QR para escanear o número de teléfono para transferir.',
      },
      {
        question: '¿Cómo funciona el almuerzo del día?',
        answer:
          'El almuerzo del día incluye arroz, proteína, vegetales y bebida. Puedes personalizarlo eligiendo qué componentes incluir o excluir según tus preferencias.',
      },
      {
        question: '¿Qué es el token de pedido?',
        answer:
          'El token es un código único que recibirás después de completar tu pago. Debes presentar este token para reclamar tu pedido.',
      },
      {
        question: '¿Puedo ver mi historial de pedidos?',
        answer:
          'Sí, en la sección "Historial de pedidos" puedes ver todos tus pedidos anteriores, incluyendo detalles de lo que ordenaste, método de pago y el token.',
      },
      {
        question: '¿Puedo modificar mi pedido después de pagarlo?',
        answer:
          'Una vez confirmado el pago, no es posible modificar el pedido. Asegúrate de revisar tu orden antes de proceder al checkout.',
      },
    ],
    []
  );

  const scrollTo = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddToCart = (product) => {
    if (!product || !Number.isFinite(product.stock) || product.stock <= 0) {
      return;
    }
    addItem(product, 1);
    setIsCartOpen(true);
  };

  const handleOpenCart = () => setIsCartOpen(true);
  const handleCloseCart = () => setIsCartOpen(false);
  const handleGoMenu = () => {
    setIsCartOpen(false);
    scrollTo('menu');
  };

  const handleProceed = () => {
    setIsCartOpen(false);
    navigate('/checkout', { state: { fromCart: true } });
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (location.state?.openCart) {
      setIsCartOpen(true);
      navigate('/home', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    let isActive = true;
    fetchProducts()
      .then((data) => {
        if (!isActive) return;
        if (data.length) {
          setProducts(data);
        } else {
          setProducts(fallbackProducts());
        }
      })
      .catch(() => {
        if (!isActive) return;
        setProducts(fallbackProducts());
        setProductsError('No se pudo cargar el menú desde el servidor.');
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!products.length) return;
    setCarouselIndexMap((prev) => {
      const next = {};
      products.forEach((product) => {
        const key = getProductKey(product);
        if (!key) return;
        const images = getProductImages(product);
        if (!images.length) return;
        const current = Number.isFinite(prev[key]) ? prev[key] : 0;
        next[key] = current >= images.length ? 0 : current;
      });
      return next;
    });
  }, [products]);

  useEffect(() => {
    if (!products.length) return;
    const timer = window.setInterval(() => {
      setCarouselIndexMap((prev) => {
        const next = { ...prev };
        products.forEach((product) => {
          const key = getProductKey(product);
          if (!key) return;
          const images = getProductImages(product);
          if (images.length <= 1) return;
          const current = Number.isFinite(next[key]) ? next[key] : 0;
          next[key] = (current + 1) % images.length;
        });
        return next;
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [products]);

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-cream pb-6 pt-6">
        <div className="mx-auto w-[min(1200px,92vw)]">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[#eadfd5] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)] animate-fade-up">
            <HeaderNavDrawer
              active="home"
              onNavigateHome={() => scrollTo('top')}
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
                onClick={handleOpenCart}
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

      <main id="top">
        <section className="border-b border-[#eadfd5] bg-[linear-gradient(90deg,#fbf7f3_0%,#f0e9e2_55%,#fbf7f3_100%)]">
          <div className="mx-auto grid w-[min(1200px,92vw)] grid-cols-1 gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <img
                className="mb-4 h-11 w-11 opacity-50 animate-fade-up"
                style={{ animationDelay: '40ms' }}
                src={riceBowl}
                alt=""
              />
              <span
                className="inline-flex items-center gap-2 rounded-full bg-orange px-4 py-1.5 text-[11px] font-medium text-white shadow-[0_6px_14px_rgba(242,106,29,0.22)] animate-fade-up"
                style={{ animationDelay: '90ms' }}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-[0_4px_8px_rgba(0,0,0,0.08)]">
                  <img className="h-[11px] w-[11px] brightness-0 invert" src={starIcon} alt="" />
                </span>
                Comida fresca preparada diariamente
              </span>
              <h1
                className="mt-5 text-[26px] font-semibold text-title sm:text-[30px] animate-fade-up"
                style={{ animationDelay: '140ms' }}
              >
                Almuerzos saludables
              </h1>
              <h2
                className="text-[26px] font-semibold text-orange sm:text-[30px] animate-fade-up"
                style={{ animationDelay: '180ms' }}
              >
                para tu dia en el SENA
              </h2>
              <p
                className="mt-4 max-w-[460px] text-[14px] leading-relaxed text-muted animate-fade-up"
                style={{ animationDelay: '220ms' }}
              >
                Disfruta de comida casera y nutritiva. Ordena facil, paga rapido y recoge con
                tu token.
              </p>
              <div
                className="mt-7 flex items-center gap-4 animate-fade-up"
                style={{ animationDelay: '260ms' }}
              >
                <button
                  className="flex items-center gap-2 rounded-full bg-orange px-6 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_18px_rgba(242,106,29,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(242,106,29,0.3)]"
                  type="button"
                  onClick={() => scrollTo('menu')}
                >
                  Ver Menú
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-[12px]">
                    &gt;
                  </span>
                </button>
                <button
                  className="rounded-full border border-title px-6 py-2.5 text-[12px] font-semibold text-title transition hover:-translate-y-0.5 hover:bg-title hover:text-white"
                  type="button"
                  onClick={() => scrollTo('faq')}
                >
                  Ver FAQ
                </button>
              </div>
              <div
                className="mt-8 h-px max-w-[460px] bg-[#e5ded6] animate-fade-up"
                style={{ animationDelay: '300ms' }}
              />
              <div
                className="mt-5 flex max-w-[460px] items-center justify-between animate-fade-up"
                style={{ animationDelay: '340ms' }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_6px_12px_rgba(0,0,0,0.1)]">
                      <img className="h-[16px] w-[16px]" src={rating} alt="Calificacion" />
                    </span>
                    <span className="text-[18px] font-semibold text-orange">4.8</span>
                  </div>
                  <span className="mt-1 block text-[11px] text-muted">Calificación</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_6px_12px_rgba(0,0,0,0.1)]">
                      <img className="h-[18px] w-[18px]" src={clients} alt="Clientes" />
                    </span>
                    <span className="text-[18px] font-semibold text-title">690+</span>
                  </div>
                  <span className="mt-1 block text-[11px] text-muted">Clientes</span>
                </div>
              </div>
            </div>

            <div
              className="relative h-[400px] max-lg:mx-auto max-lg:h-[380px] max-lg:w-full animate-fade-up"
              style={{ animationDelay: '200ms' }}
            >
              <div
                className="absolute left-[4%] top-[86px] flex items-center gap-3 rounded-[20px] bg-white px-4 py-3.5 shadow-[0_12px_24px_rgba(0,0,0,0.12)] animate-float-slow transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_32px_rgba(0,0,0,0.18)] max-lg:left-[2%] max-lg:top-[58px]"
                style={{ animationDelay: '0.3s' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange">
                  <img className="h-4 w-4 brightness-0 invert" src={naturalIcon} alt="Natural" />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-title">100% Natural</span>
                  <span className="block text-[10px] text-muted">Sin conservantes</span>
                </div>
              </div>

              <div className="absolute right-0 top-[10px] w-[60%] overflow-hidden rounded-[20px] border-[5px] border-white shadow-[0_16px_32px_rgba(0,0,0,0.18)] animate-fade-in transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(0,0,0,0.22)] max-lg:w-[68%]">
                <div className="relative">
                  <img className="h-[210px] w-full object-cover" src={lunchFish} alt="Almuerzo del dia" />
                  <div className="absolute inset-x-0 bottom-0 h-[68px] bg-gradient-to-t from-black/45 to-transparent" />
                  <div className="absolute inset-x-4 bottom-3 flex items-end justify-between">
                    <div className="text-[12px] text-white drop-shadow">
                      <span>Almuerzo del día</span>
                      <strong className="block text-[13px] font-semibold">$8.600</strong>
                    </div>
                    <div className="flex items-center gap-2 rounded-[16px] bg-white px-3 py-2.5 shadow-[0_8px_16px_rgba(0,0,0,0.15)]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange">
                        <img className="h-4 w-4 brightness-0 invert" src={healthyIcon} alt="Saludable" />
                      </span>
                      <div>
                        <span className="block text-[11px] font-semibold text-title">Saludable</span>
                        <span className="block text-[10px] text-muted">Balanceado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="absolute left-[8%] bottom-[-8px] w-[46%] overflow-hidden rounded-[20px] border-[5px] border-white shadow-[0_14px_28px_rgba(0,0,0,0.16)] animate-float transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(0,0,0,0.2)] max-lg:left-[4%] max-lg:bottom-[-4px] max-lg:w-[52%]"
                style={{ animationDelay: '0.6s' }}
              >
                <img
                  className="h-[160px] w-full object-cover"
                  src={ingredientsFresh}
                  alt="Ingredientes frescos"
                />
                <span className="absolute bottom-2 left-3 text-[11px] font-medium text-white drop-shadow">
                  Ingredientes frescos
                </span>
              </div>

              <div
                className="absolute right-[4%] bottom-[50px] flex items-center gap-3 rounded-[20px] bg-white px-4 py-3.5 shadow-[0_12px_24px_rgba(0,0,0,0.12)] animate-float-slow transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_32px_rgba(0,0,0,0.18)] max-lg:bottom-[40px]"
                style={{ animationDelay: '0.9s' }}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange">
                  <img className="h-4 w-4 brightness-0 invert" src={clockIcon} alt="Reloj" />
                </span>
                <div>
                  <span className="block text-[11px] font-semibold text-title">Entrega rápida</span>
                  <span className="block text-[10px] text-muted">Mismo día</span>
                </div>
              </div>

              <div
                className="absolute right-[18%] bottom-[-2px] h-[50px] w-[50px] rounded-full border-[5px] border-white bg-white shadow-[0_8px_16px_rgba(0,0,0,0.12)] animate-float transition duration-300 ease-out hover:scale-105 hover:shadow-[0_14px_24px_rgba(0,0,0,0.18)] max-lg:right-[16%] max-lg:bottom-[-4px]"
                style={{ animationDelay: '1.1s' }}
              >
                <img className="h-full w-full rounded-full object-cover opacity-45" src={saladHome} alt="" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#eadfd5] py-10" id="menu">
          <div className="mx-auto w-[min(1200px,92vw)]">
            <div className="text-center">
              <h2 className="text-[20px] text-title animate-fade-up">Nuestro Menú</h2>
              <p className="mt-1 text-[12px] text-muted animate-fade-up" style={{ animationDelay: '80ms' }}>
                Ingredientes frescos, preparados con amor cada día para la comunidad del SENA
              </p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {products.map((product, index) => {
                const isOutOfStock = Number.isFinite(product.stock) && product.stock <= 0;
                const images = getProductImages(product);
                const key = getProductKey(product);
                const activeIndex = Number.isFinite(carouselIndexMap[key])
                  ? carouselIndexMap[key]
                  : 0;
                const activeImage = images[activeIndex] ?? product.image;

                return (
                  <article
                    className="group overflow-hidden rounded-[18px] bg-white shadow-[0_6px_14px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-1 animate-reveal"
                    key={product.id}
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <Link to={`/menu/${product.id}`} aria-label={`Ver ${product.name}`}>
                      <img
                        className="h-[150px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        src={activeImage}
                        alt={product.name}
                        onError={(event) => {
                          if (event.currentTarget.src !== product.imageFallback) {
                            event.currentTarget.src = product.imageFallback;
                          }
                        }}
                      />
                    </Link>
                    <div className="px-4 py-4">
                      <h3 className="text-[14px] text-title">
                        <Link className="transition hover:text-orange" to={`/menu/${product.id}`}>
                          {product.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-[11px] text-muted">{product.description}</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStockStyles(product.stock)}`}
                        >
                          {getStockLabel(product.stock)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[12px] text-[#e75a1a]">
                        <span>{formatCop(product.price)}</span>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#f0e4da] bg-white transition hover:bg-[#fff4eb] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          aria-label="Agregar al carrito"
                          disabled={isOutOfStock}
                        >
                          <img className="h-4 w-4" src={cartMenu} alt="Agregar" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {productsError ? (
              <p className="mt-4 text-center text-[11px] text-[#e24c3b]">{productsError}</p>
            ) : null}
          </div>
        </section>

        <section className="py-10" id="steps">
          <div className="mx-auto w-[min(1200px,92vw)]">
            <div className="text-center">
              <h2 className="text-[20px] text-title animate-fade-up">¿Como funciona?</h2>
              <p className="mt-1 text-[12px] text-muted animate-fade-up" style={{ animationDelay: '80ms' }}>
                Tu almuerzo en 3 pasos simples
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
              {steps.map((step, index) => (
                <div
                  className="text-center animate-fade-up"
                  style={{ animationDelay: `${index * 140}ms` }}
                  key={step.title}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f28c28] shadow-soft">
                    <img className="h-6 w-6" src={step.image} alt={step.title} />
                  </div>
                  <div className="mt-3 rounded-[20px] bg-white px-5 pb-5 pt-7 shadow-soft">
                    <span className="text-[11px] text-[#f28c28]">Paso {index + 1}</span>
                    <h3 className="mt-1 text-[14px] text-title">{step.title}</h3>
                    <p className="mt-1 text-[11px] text-muted">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#eadfd5] bg-[#fbf7f3] py-12" id="faq">
          <div className="mx-auto w-[min(980px,92vw)]">
            <div className="text-center">
              <h2 className="text-[20px] text-title animate-fade-up">Preguntas frecuentes</h2>
              <p className="mt-1 text-[12px] text-muted animate-fade-up" style={{ animationDelay: '80ms' }}>
                Respuestas rápidas sobre tus pedidos
              </p>
            </div>
            <div className="mt-8 space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    className="rounded-[16px] border border-[#eadfd5] bg-white shadow-soft animate-fade-up"
                    key={faq.question}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <button
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                      type="button"
                      onClick={() => setOpenFaqIndex((prev) => (prev === index ? null : index))}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${index}`}
                    >
                      <span className="text-[13px] font-semibold text-title">{faq.question}</span>
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
                      id={`faq-panel-${index}`}
                      className={`grid transition-all duration-300 ease-out ${
                        isOpen ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden px-5">
                        <p className="text-[12px] leading-relaxed text-muted">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <CartDrawer
        open={isCartOpen}
        items={items}
        total={total}
        onClose={handleCloseCart}
        onIncrease={increaseItem}
        onDecrease={decreaseItem}
        onRemove={removeItem}
        onNavigateMenu={handleGoMenu}
        onProceed={items.length ? handleProceed : undefined}
      />
    </div>
  );
}
