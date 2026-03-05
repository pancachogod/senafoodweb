import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CartDrawer from '../components/CartDrawer.jsx';
import { cart, logo, profile as profileIcon } from '../assets/index.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getProfile, saveProfile } from '../data/profile.js';

const formatLongDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;

const sanitizeName = (value) => value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
const sanitizePhone = (value) => value.replace(/\D/g, '').slice(0, 10);

const isValidName = (value) => {
  const trimmed = value.trim();
  return trimmed.length > 0 && nameRegex.test(trimmed);
};

const isValidPhone = (value) => /^\d{10}$/.test(value);

const inputClassName =
  'w-full rounded-[12px] border border-[#f2e6dc] bg-[#fff9f3] px-3 py-2.5 text-[12px] text-title shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition focus:border-orange focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f7efe7] disabled:text-muted';
const editableInputClassName =
  'border-[#59c976] bg-white shadow-[0_0_0_3px_rgba(89,201,118,0.2)]';

export default function Profile() {
  const navigate = useNavigate();
  const { items, itemCount, total, increaseItem, decreaseItem, removeItem } = useCart();
  const { user, updateProfile, logout } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const baseProfile = useMemo(() => {
    if (user) {
      return {
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        document: user.document ?? '',
        createdAt: user.created_at,
      };
    }
    return getProfile();
  }, [user]);
  const [storedProfile, setStoredProfile] = useState(baseProfile);
  const [formData, setFormData] = useState(baseProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStoredProfile(baseProfile);
    setFormData(baseProfile);
  }, [baseProfile]);

  const hasChanges = useMemo(() => {
    return ['name', 'phone'].some((field) => formData[field] !== storedProfile[field]);
  }, [formData, storedProfile]);

  const canEdit = isEditing || hasChanges;
  const editButtonClassName = canEdit
    ? 'border-[#7ad39b] bg-[#e7f7ec] text-[#1f7a3a] shadow-[0_10px_18px_rgba(89,201,118,0.25)]'
    : 'border-[#eadfd5] bg-white text-title shadow-soft';

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/home');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === 'name') {
      nextValue = sanitizeName(value);
    }

    if (name === 'phone') {
      nextValue = sanitizePhone(value);
    }

    if (name === 'document') {
      nextValue = value.replace(/\D/g, '');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
    setFormError('');
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    const trimmedName = formData.name.trim();
    if (!isValidName(trimmedName)) {
      setFormError('El nombre solo debe contener letras.');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setFormError('El telefono debe tener 10 numeros.');
      return;
    }
    setIsSaving(true);
    setFormError('');
    try {
      let nextProfile = {
        ...storedProfile,
        ...formData,
        name: trimmedName,
      };

      if (user) {
        const updated = await updateProfile({
          name: trimmedName,
          phone: formData.phone,
        });
        nextProfile = {
          ...nextProfile,
          name: updated.name,
          phone: updated.phone,
          createdAt: updated.created_at,
        };
      } else {
        saveProfile(nextProfile);
      }

      setStoredProfile(nextProfile);
      setFormData(nextProfile);
      setIsEditing(false);
    } catch (error) {
      setFormError(error?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(storedProfile);
    setIsEditing(false);
    setFormError('');
  };

  const createdAtLabel = formatLongDate(formData.createdAt || storedProfile.createdAt);

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
              <img className="h-[18px] w-[18px]" src={profileIcon} alt="Perfil" />
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
            onClick={handleBack}
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

          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-[440px] rounded-[18px] border border-[#eadfd5] bg-white px-6 py-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffe9d8]">
                    <img className="h-6 w-6" src={profileIcon} alt="Avatar" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-title">Mi Perfil</p>
                    <p className="text-[11px] text-muted">{formData.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${editButtonClassName}`}
                    type="button"
                    onClick={() => {
                      setIsEditing((prev) => !prev);
                      setFormError('');
                    }}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M13.9 3.6l2.5 2.5a1.1 1.1 0 0 1 0 1.6l-7.9 7.9-3.3.8.8-3.3 7.9-7.9a1.1 1.1 0 0 1 1.6 0Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12.2 5.3l2.5 2.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                  {canEdit ? 'Editando' : 'Editar'}
                  </button>
                  {canEdit ? (
                    <span className="rounded-full bg-[#eefaf2] px-2 py-0.5 text-[10px] font-semibold text-[#1f7a3a]">
                      Edición activa
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] text-muted" htmlFor="email">
                    Correo Electronico
                  </label>
                  <input
                    className={inputClassName}
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                  />
                  <p className="mt-1 text-[10px] text-muted">
                    El correo electronico no se puede modificar
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-muted" htmlFor="name">
                    Nombre Completo
                  </label>
                  <input
                    className={`${inputClassName} ${canEdit ? editableInputClassName : ''}`}
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-muted" htmlFor="phone">
                    Telefono
                  </label>
                  <input
                    className={`${inputClassName} ${canEdit ? editableInputClassName : ''}`}
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    maxLength={10}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-muted" htmlFor="document">
                    Numero de Documento
                  </label>
                  <input
                    className={inputClassName}
                    id="document"
                    name="document"
                    type="text"
                    value={formData.document}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    disabled
                  />
                </div>
              </div>

                <button
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-[#ffd1d1] bg-[#fff6f6] py-2 text-[11px] font-semibold text-[#e24c3b]"
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login', { replace: true });
                  }}
                >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M8 4h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 10h8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 7l-3 3 3 3"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Cerrar Sesion
              </button>

              {createdAtLabel ? (
                <p className="mt-4 text-[10px] text-muted">Cuenta creada el: {createdAtLabel}</p>
              ) : null}

              {formError ? (
                <p className="mt-3 text-[10px] text-[#e24c3b]">{formError}</p>
              ) : null}

              {hasChanges ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    className="flex-1 rounded-full bg-[#23b146] py-2 text-[11px] font-semibold text-white shadow-[0_8px_16px_rgba(35,177,70,0.3)]"
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    className="flex-1 rounded-full border border-[#eadfd5] bg-white py-2 text-[11px] text-title"
                    type="button"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </button>
                </div>
              ) : null}
            </div>
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
                navigate('/checkout', { state: { fromCart: true } });
              }
            : undefined
        }
      />
    </div>
  );
}
