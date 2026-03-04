import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CartDrawer from '../components/CartDrawer.jsx';
import { useCart } from '../context/CartContext.jsx';
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
import { menuItems } from '../data/menu.js';

const formatCop = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const { items, addItem, increaseItem, decreaseItem, removeItem, itemCount, total } = useCart();
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
    addItem(product, 1);
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

  useEffect(() => {
    if (location.state?.openCart) {
      setIsCartOpen(true);
      navigate('/home', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-[#eadfd5] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex w-[min(1200px,92vw)] flex-wrap items-center justify-center gap-6 py-4 md:justify-between md:py-5">
          <img className="h-10 w-auto" src={logo} alt="Sena Food" />
          <nav className="flex items-center gap-7">
            <button
              className="rounded-full bg-[#ffe7d4] px-4 py-2 text-[12px] font-semibold text-orange shadow-[0_4px_10px_rgba(242,106,29,0.15)]"
              type="button"
              onClick={() => scrollTo('top')}
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
              onClick={handleOpenCart}
              aria-label={`Carrito (${itemCount})`}
            >
              <img className="h-4 w-4 brightness-0 invert" src={cart} alt="Carrito" />
              Carrito
              <span className="sr-only">{itemCount}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="border-b border-[#eadfd5] bg-[linear-gradient(90deg,#fbf7f3_0%,#f0e9e2_55%,#fbf7f3_100%)]">
          <div className="mx-auto grid w-[min(1200px,92vw)] grid-cols-1 gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <img className="mb-4 h-11 w-11 opacity-50" src={riceBowl} alt="" />
              <span className="inline-flex items-center gap-2 rounded-full bg-orange px-4 py-1.5 text-[11px] font-medium text-white shadow-[0_6px_14px_rgba(242,106,29,0.22)]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-[0_4px_8px_rgba(0,0,0,0.08)]">
                  <img className="h-[11px] w-[11px] brightness-0 invert" src={starIcon} alt="" />
                </span>
                Comida fresca preparada diariamente
              </span>
              <h1 className="mt-5 text-[26px] font-semibold text-title sm:text-[30px]">
                Almuerzos saludables
              </h1>
              <h2 className="text-[26px] font-semibold text-orange sm:text-[30px]">para tu dia en el SENA</h2>
              <p className="mt-4 max-w-[460px] text-[14px] leading-relaxed text-muted">
                Disfruta de comida casera y nutritiva. Ordena facil, paga rapido y recoge con
                tu token.
              </p>
              <div className="mt-7 flex items-center gap-4">
                <button
                  className="flex items-center gap-2 rounded-full bg-orange px-6 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_18px_rgba(242,106,29,0.26)]"
                  type="button"
                  onClick={() => scrollTo('menu')}
                >
                  Ver Menú
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-[12px]">
                    &gt;
                  </span>
                </button>
                <button
                  className="rounded-full border border-title px-6 py-2.5 text-[12px] font-semibold text-title"
                  type="button"
                  onClick={() => scrollTo('faq')}
                >
                  Ver FAQ
                </button>
              </div>
              <div className="mt-8 h-px max-w-[460px] bg-[#e5ded6]" />
              <div className="mt-5 flex max-w-[460px] items-center justify-between">
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

            <div className="relative h-[400px] max-lg:mx-auto max-lg:h-[380px] max-lg:w-full">
              <div className="absolute left-[4%] top-[86px] flex items-center gap-3 rounded-[20px] bg-white px-4 py-3.5 shadow-[0_12px_24px_rgba(0,0,0,0.12)] max-lg:left-[2%] max-lg:top-[58px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange">
                  <img className="h-4 w-4 brightness-0 invert" src={naturalIcon} alt="Natural" />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-title">100% Natural</span>
                  <span className="block text-[10px] text-muted">Sin conservantes</span>
                </div>
              </div>

              <div className="absolute right-0 top-[10px] w-[60%] overflow-hidden rounded-[20px] border-[5px] border-white shadow-[0_16px_32px_rgba(0,0,0,0.18)] max-lg:w-[68%]">
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

              <div className="absolute left-[8%] bottom-[-8px] w-[46%] overflow-hidden rounded-[20px] border-[5px] border-white shadow-[0_14px_28px_rgba(0,0,0,0.16)] max-lg:left-[4%] max-lg:bottom-[-4px] max-lg:w-[52%]">
                <img
                  className="h-[160px] w-full object-cover"
                  src={ingredientsFresh}
                  alt="Ingredientes frescos"
                />
                <span className="absolute bottom-2 left-3 text-[11px] font-medium text-white drop-shadow">
                  Ingredientes frescos
                </span>
              </div>

              <div className="absolute right-[4%] bottom-[50px] flex items-center gap-3 rounded-[20px] bg-white px-4 py-3.5 shadow-[0_12px_24px_rgba(0,0,0,0.12)] max-lg:bottom-[40px]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange">
                  <img className="h-4 w-4 brightness-0 invert" src={clockIcon} alt="Reloj" />
                </span>
                <div>
                  <span className="block text-[11px] font-semibold text-title">Entrega rápida</span>
                  <span className="block text-[10px] text-muted">Mismo día</span>
                </div>
              </div>

              <div className="absolute right-[18%] bottom-[-2px] h-[50px] w-[50px] rounded-full border-[5px] border-white bg-white shadow-[0_8px_16px_rgba(0,0,0,0.12)] max-lg:right-[16%] max-lg:bottom-[-4px]">
                <img className="h-full w-full rounded-full object-cover opacity-45" src={saladHome} alt="" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#eadfd5] py-10" id="menu">
          <div className="mx-auto w-[min(1200px,92vw)]">
            <div className="text-center">
              <h2 className="text-[20px] text-title">Nuestro Menú</h2>
              <p className="mt-1 text-[12px] text-muted">
                Ingredientes frescos, preparados con amor cada día para la comunidad del SENA
              </p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {menuItems.map((product) => (
                <article
                  className="overflow-hidden rounded-[18px] bg-white shadow-[0_6px_14px_rgba(0,0,0,0.06)]"
                  key={product.id}
                >
                  <Link to={`/menu/${product.id}`} aria-label={`Ver ${product.name}`}>
                    <img className="h-[150px] w-full object-cover" src={product.image} alt={product.name} />
                  </Link>
                  <div className="px-4 py-4">
                    <h3 className="text-[14px] text-title">
                      <Link className="transition hover:text-orange" to={`/menu/${product.id}`}>
                        {product.name}
                      </Link>
                    </h3>
                    <p className="mt-1 text-[11px] text-muted">{product.description}</p>
                    <div className="mt-3 flex items-center justify-between text-[12px] text-[#e75a1a]">
                      <span>{formatCop(product.price)}</span>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#f0e4da] bg-white"
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        aria-label="Agregar al carrito"
                      >
                        <img className="h-4 w-4" src={cartMenu} alt="Agregar" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10" id="steps">
          <div className="mx-auto w-[min(1200px,92vw)]">
            <div className="text-center">
              <h2 className="text-[20px] text-title">¿Como funciona?</h2>
              <p className="mt-1 text-[12px] text-muted">Tu almuerzo en 3 pasos simples</p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
              {steps.map((step, index) => (
                <div className="text-center" key={step.title}>
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
              <h2 className="text-[20px] text-title">Preguntas frecuentes</h2>
              <p className="mt-1 text-[12px] text-muted">Respuestas rápidas sobre tus pedidos</p>
            </div>
            <div className="mt-8 space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    className="rounded-[16px] border border-[#eadfd5] bg-white shadow-soft"
                    key={faq.question}
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
                        isOpen ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'
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
