import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthSplitLayout from '../components/AuthSplitLayout.jsx';
import Checkbox from '../components/Checkbox.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;

const sanitizeName = (value) => value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
const sanitizeDigits = (value) => value.replace(/\D/g, '');
const sanitizeDocument = (value) => sanitizeDigits(value).slice(0, 11);

const isValidPassword = (value) => value.length >= 6 && /[A-Z]/.test(value);

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [document, setDocument] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordHasMinLength = password.length >= 6;
  const passwordHasUppercase = /[A-Z]/.test(password);
  const panelClassName =
    'w-full max-w-[460px] rounded-[26px] border border-white/80 bg-[#f7f1eb]/80 px-6 py-7 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:px-7 sm:py-8';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!document || !name || !phone || !email || !password) {
      setError('Completa todos los campos.');
      return;
    }
    if (!nameRegex.test(name.trim())) {
      setError('El nombre solo debe contener letras.');
      return;
    }
    if (phone.length !== 10) {
      setError('El telefono debe tener 10 numeros.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres y una mayuscula.');
      return;
    }
    if (!acceptedTerms) {
      setError('Acepta los terminos y condiciones.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email,
        phone,
        document,
        password,
      });
      navigate('/home');
    } catch (err) {
      setError(err?.message || 'No se pudo crear la cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className={`${panelClassName} flex flex-col items-center gap-4`}>
        <form className="flex w-full flex-col items-stretch gap-3" onSubmit={handleSubmit}>
          <TextInput
            label="Numero de documento"
            name="document"
            placeholder="Ingresa tu numero de documento"
            value={document}
            onChange={(value) => setDocument(sanitizeDocument(value))}
            autoComplete="off"
            inputMode="numeric"
            maxLength={11}
          />
          <TextInput
            label="Nombre completo"
            name="name"
            placeholder="Ingresa tu nombre Completo"
            value={name}
            onChange={(value) => setName(sanitizeName(value))}
            autoComplete="name"
          />
          <TextInput
            label="Numero de telefono"
            name="phone"
            placeholder="Ingresa tu numero de telefono"
            value={phone}
            onChange={(value) => setPhone(sanitizeDigits(value))}
            autoComplete="tel"
            inputMode="numeric"
            maxLength={10}
          />
          <TextInput
            label="Correo electronico"
            name="email"
            type="email"
            placeholder="Ingresa tu correo electronico"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <TextInput
            label="Contraseña"
            name="password"
            type="password"
            placeholder="Crea una contraseña"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <div className="w-full space-y-1 text-[11px]">
            <div
              className={`flex items-center gap-2 ${
                passwordHasMinLength ? 'text-[#2f9e44]' : 'text-[#d84b2b]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  passwordHasMinLength ? 'bg-[#2f9e44]' : 'bg-[#d84b2b]'
                }`}
              />
              <span>Min. 6 caracteres</span>
            </div>
            <div
              className={`flex items-center gap-2 ${
                passwordHasUppercase ? 'text-[#2f9e44]' : 'text-[#d84b2b]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  passwordHasUppercase ? 'bg-[#2f9e44]' : 'bg-[#d84b2b]'
                }`}
              />
              <span>1 mayuscula</span>
            </div>
          </div>
          <div className="flex w-full justify-center">
            <Checkbox
              label="Aceptar terminos y condiciones"
              checked={acceptedTerms}
              onChange={() => setShowTerms(true)}
            />
          </div>
          {error ? (
            <div className="text-center text-[11px] text-[#e24c3b]">{error}</div>
          ) : null}
          <PrimaryButton type="submit" disabled={!acceptedTerms || isSubmitting}>
            {isSubmitting ? 'REGISTRANDO...' : 'REGISTRARME'}
          </PrimaryButton>
        </form>
        <Link className="text-[12px] uppercase tracking-[0.4px] text-[#e75a1a]" to="/login">
          ¿YA TIENES UNA CUENTA?
        </Link>
      </div>
      {showTerms ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="flex w-full max-w-[420px] flex-col rounded-[24px] bg-white pt-4 pb-3 shadow-card max-h-[85vh]">
            <h2 className="mb-3 text-center text-[14px] text-title">Términos y Condiciones</h2>
            <div className="space-y-2 overflow-y-auto px-6 text-[10px] leading-[1.45] text-text">
              <p>
                Bienvenido(a) a SENAFOOD, una plataforma digital desarrollada con el
                propósito de facilitar la gestión de pedidos y pagos de los servicios
                de cafetería en el complejo SENA Salomia. Al registrarte y utilizar
                nuestros servicios, aceptas los siguientes Términos y Condiciones de
                Uso. Por favor, léelos cuidadosamente antes de utilizar la aplicación.
              </p>
              <h3 className="mt-4 text-[11px] text-title">Aceptación de los términos</h3>
              <p>
                El uso de SENAFOOD implica la aceptación plena de estos Términos y
                Condiciones, así como de las políticas complementarias de privacidad y
                seguridad de datos. Si no estás de acuerdo con alguno de los apartados,
                debes abstenerte de utilizar la plataforma.
              </p>
              <h3 className="mt-4 text-[11px] text-title">Registro y cuenta del usuario</h3>
              <ol className="list-decimal space-y-1 pl-4 marker:text-orange marker:font-semibold">
                <li>
                  El usuario debe registrarse con información veraz, completa y
                  actualizada (nombre, documento, correo, teléfono, etc.).
                </li>
                <li>
                  Cada usuario es responsable de mantener la confidencialidad de sus
                  credenciales de acceso.
                </li>
                <li>
                  No se permite el uso indebido o fraudulento de la plataforma.
                </li>
                <li>
                  El usuario puede eliminar su cuenta en cualquier momento desde su
                  perfil.
                </li>
              </ol>
              <h3 className="mt-4 text-[11px] text-title">Uso del sistema</h3>
              <ol className="list-decimal space-y-1 pl-4 marker:text-orange marker:font-semibold">
                <li>
                  La plataforma SENAFOOD está destinada exclusivamente al uso interno
                  de la comunidad del SENA Salomia.
                </li>
                <li>
                  Los usuarios pueden visualizar el menú, realizar pedidos, efectuar
                  pagos (efectivo o Nequi), revisar su historial y enviar
                  retroalimentación.
                </li>
                <li>
                  Está prohibido el uso del sistema con fines fraudulentos, comerciales
                  externos o cualquier otro que viole la integridad del servicio.
                </li>
                <li>
                  El administrador se reserva el derecho de suspender o eliminar cuentas
                  que incumplan estos términos.
                </li>
              </ol>
              <h3 className="mt-4 text-[11px] text-title">Pagos y pedidos</h3>
              <ol className="list-decimal space-y-1 pl-4 marker:text-orange marker:font-semibold">
                <li>
                  Los pedidos solo se procesarán una vez confirmada la transacción o el
                  método de pago.
                </li>
                <li>
                  El usuario podrá cancelar un pedido únicamente si aún no ha sido
                  procesado o entregado.
                </li>
                <li>
                  Los métodos de pago disponibles son efectivo y Nequi, gestionados bajo
                  procesos seguros de verificación y cifrado.
                </li>
                <li>
                  Los precios, disponibilidad y descripciones de los productos pueden
                  variar según el día.
                </li>
              </ol>
              <h3 className="mt-4 text-[11px] text-title">Protección de datos personales</h3>
              <p>
                SENAFOOD cumple con las disposiciones de la Ley 1581 de 2012 sobre
                protección de datos personales. Tu información será tratada de forma
                segura y no será compartida con terceros sin autorización expresa del
                usuario.
              </p>
              <p>
                Tu información será tratada de forma segura según las políticas del
                SENA y la Ley de Protección de Datos Personales.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 px-5 pt-3">
              <PrimaryButton
                type="button"
                className="max-w-[120px] normal-case shadow-none"
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTerms(false);
                  setError('');
                }}
              >
                Confirmar
              </PrimaryButton>
              <button
                className="rounded-full border border-[#eadfd5] px-4 py-1.5 text-[11px] text-[#8c8c8c]"
                type="button"
                onClick={() => setShowTerms(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AuthSplitLayout>
  );
}
