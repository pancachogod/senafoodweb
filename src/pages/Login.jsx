import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthSplitLayout from '../components/AuthSplitLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';
import emailjs from '@emailjs/browser';
import { requestPasswordReset } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState('login');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [isRecoverySubmitting, setIsRecoverySubmitting] = useState(false);
  const panelClassName =
    'w-full max-w-[420px] rounded-[26px] border border-[#d1b09a] bg-white/70 px-6 py-6 shadow-[0_10px_26px_rgba(0,0,0,0.12)] backdrop-blur-md sm:px-7 sm:py-7';
  const mailIcon = (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16v12H4z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
  const lockIcon = (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );

  const emailJsConfig = {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  };
  const canSendEmailJs = Boolean(
    emailJsConfig.serviceId && emailJsConfig.templateId && emailJsConfig.publicKey
  );

  useEffect(() => {
    if (canSendEmailJs) {
      emailjs.init({ publicKey: emailJsConfig.publicKey });
    }
  }, [canSendEmailJs, emailJsConfig.publicKey]);

  const sendResetEmail = async (toEmail, resetLink) => {
    if (!canSendEmailJs || !resetLink) {
      return { sent: false, error: 'EmailJS no configurado.' };
    }
    try {
      await emailjs.send(
        emailJsConfig.serviceId,
        emailJsConfig.templateId,
        {
          to_email: toEmail,
          to_name: 'Usuario',
          email: toEmail,
          user_email: toEmail,
          name: 'Usuario',
          user_name: 'Usuario',
          from_email: toEmail,
          from_name: 'SENA FOOD',
          reply_to: toEmail,
          reset_link: resetLink,
          app_name: 'SENA FOOD',
        },
        { publicKey: emailJsConfig.publicKey }
      );
      return { sent: true };
    } catch (err) {
      return {
        sent: false,
        error: err?.text || err?.message || 'Error al enviar con EmailJS.',
      };
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Completa todos los campos.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setError(err?.message || 'No se pudo iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowRecovery = () => {
    setError('');
    setRecoveryEmail('');
    setRecoveryError('');
    setView('recover');
  };

  const handleRecoverySubmit = async (event) => {
    event.preventDefault();
    if (!recoveryEmail.trim()) {
      setRecoveryError('Ingresa tu correo o documento.');
      return;
    }
    setRecoveryError('');
    setIsRecoverySubmitting(true);
    try {
      const response = await requestPasswordReset(recoveryEmail.trim());
      let sent = Boolean(response?.email_sent);
      if (!sent && response?.reset_link && canSendEmailJs && recoveryEmail.includes('@')) {
        const fallback = await sendResetEmail(recoveryEmail.trim(), response.reset_link);
        sent = fallback.sent;
        if (!sent && fallback.error) {
          throw new Error(fallback.error);
        }
      }
      if (!sent) {
        if (!response?.reset_link) {
          throw new Error('No encontramos ese correo o documento.');
        }
        if (!canSendEmailJs && recoveryEmail.includes('@')) {
          throw new Error('Faltan las variables VITE_EMAILJS_* en Vercel o no se redeployo.');
        }
        if (response?.error) {
          throw new Error(response.error);
        }
        throw new Error('No se pudo enviar el enlace.');
      }
      setView('recover-sent');
    } catch (err) {
      setRecoveryError(err?.text || err?.message || 'No se pudo enviar el enlace.');
    } finally {
      setIsRecoverySubmitting(false);
    }
  };

  const handleRecoveryContinue = () => {
    handleBackToLogin();
  };

  const handleBackToLogin = () => {
    setView('login');
    setRecoveryEmail('');
    setRecoveryError('');
    setIsRecoverySubmitting(false);
    setError('');
  };

  return (
    <AuthSplitLayout>
      {view === 'login' ? (
        <div className={`${panelClassName} flex flex-col items-center gap-5 text-center`}>
          <h1 className="text-[15px] font-semibold tracking-[0.6px] text-title">
            BIENVENIDO A SENA FOOD
          </h1>
          <form className="flex w-full flex-col items-stretch gap-4 text-left" onSubmit={handleSubmit}>
            <TextInput
              label="Correo Electronico"
              name="email"
              type="email"
              placeholder="Ingresa tu correo"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              icon={mailIcon}
              variant="underline"
            />
            <TextInput
              label="Contraseña"
              name="password"
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              icon={lockIcon}
              variant="underline"
            />
            {error ? (
              <div className="flex w-full items-center justify-center gap-2 text-[11px] text-[#e24c3b]">
                <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#e24c3b] text-[10px] text-white">
                  ×
                </span>
                <span>{error}</span>
              </div>
            ) : null}
            <PrimaryButton
              type="submit"
              className="max-w-none rounded-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
            </PrimaryButton>
          </form>
          <button
            className="text-[11px] text-[#3f6df5]"
            type="button"
            onClick={handleShowRecovery}
          >
            ¿Olvidaste tu contraseña?
          </button>
          <div className="flex items-center gap-1 text-[11px] text-text">
            <span>¿no tienes cuenta?</span>
            <Link className="text-[11px] text-[#3f6df5]" to="/register">
              registrate
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          {view === 'recover' ? (
            <div className={`${panelClassName} flex flex-col items-center gap-4 lg:justify-center`}>
              <form className="flex w-full flex-col items-center gap-3" onSubmit={handleRecoverySubmit}>
                <TextInput
                  label="Ingrese su correo electronico"
                  name="recovery-email"
                  type="text"
                  placeholder="Ingresa tu correo/Documento"
                  value={recoveryEmail}
                  onChange={(value) => {
                    setRecoveryEmail(value);
                    if (recoveryError) {
                      setRecoveryError('');
                    }
                  }}
                  autoComplete="email"
                  disabled={isRecoverySubmitting}
                />
                {recoveryError ? (
                  <div className="flex w-full items-center justify-center gap-2 text-[11px] text-[#e24c3b]">
                    <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#e24c3b] text-[10px] text-white">
                      ×
                    </span>
                    <span>{recoveryError}</span>
                  </div>
                ) : null}
                <PrimaryButton
                  type="submit"
                  disabled={!recoveryEmail.trim() || isRecoverySubmitting}
                >
                  {isRecoverySubmitting ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
                </PrimaryButton>
              </form>
            </div>
          ) : null}
          {view === 'recover-sent' ? (
            <div className="flex w-full max-w-[320px] flex-col items-center gap-3 rounded-[26px] bg-white px-6 py-5 text-center shadow-card">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <svg
                  aria-hidden="true"
                  className="h-14 w-14"
                  viewBox="0 0 64 48"
                >
                  <rect x="4" y="8" width="56" height="32" rx="5" fill="#f5b532" />
                  <path d="M4 12l28 18 28-18" fill="#f9d56c" />
                  <path d="M4 40l20-16" stroke="#e39d2b" strokeWidth="2" />
                  <path d="M60 40l-20-16" stroke="#e39d2b" strokeWidth="2" />
                </svg>
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#d84b2b] text-[10px] font-semibold text-white">
                  1
                </span>
              </div>
              <p className="text-[11px] leading-[1.45] text-text">
                "Hemos enviado un enlace de recuperacion a tu correo electronico. Revisa tu
                bandeja de entrada o carpeta de spam para continuar con el proceso."
              </p>
              <PrimaryButton
                type="button"
                className="max-w-[130px] normal-case"
                onClick={handleRecoveryContinue}
              >
                Continuar
              </PrimaryButton>
            </div>
          ) : null}
          {view === 'recover-success' ? (
            <div className="flex w-full max-w-[320px] flex-col items-center gap-3 rounded-[26px] bg-white px-6 py-6 text-center shadow-card">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#36c776]">
                <svg
                  aria-hidden="true"
                  className="h-8 w-8 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[11px] text-text">"Contraseña actualizada exitosamente"</p>
            </div>
          ) : null}
          <button
            className="text-[11px] text-[#3f6df5]"
            type="button"
            onClick={handleBackToLogin}
          >
            Volver a iniciar sesion
          </button>
        </div>
      )}
    </AuthSplitLayout>
  );
}
