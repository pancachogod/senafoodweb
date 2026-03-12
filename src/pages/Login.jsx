import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';
import emailjs from '@emailjs/browser';
import { requestPasswordReset } from '../api/auth.js';
import { logo } from '../assets/index.js';
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

  const emailJsConfig = {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  };
  const canSendEmailJs = Boolean(
    emailJsConfig.serviceId && emailJsConfig.templateId && emailJsConfig.publicKey
  );

  const sendResetEmail = async (toEmail, resetLink) => {
    if (!canSendEmailJs || !resetLink) return false;
    await emailjs.send(
      emailJsConfig.serviceId,
      emailJsConfig.templateId,
      {
        to_email: toEmail,
        to_name: 'Usuario',
        reset_link: resetLink,
        app_name: 'SENA FOOD',
      },
      emailJsConfig.publicKey
    );
    return true;
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
      if (!response?.email_sent && response?.reset_link) {
        if (canSendEmailJs) {
          await sendResetEmail(recoveryEmail.trim(), response.reset_link);
        }
      }
      setView('recover-sent');
    } catch (err) {
      setRecoveryError(err?.message || 'No se pudo enviar el enlace.');
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
    <AuthLayout showHeader={false}>
      <img className="mb-4 h-24 w-auto" src={logo} alt="Sena Food" />
      {view === 'login' ? (
        <>
          <form className="flex w-full flex-col items-center gap-3" onSubmit={handleSubmit}>
            <TextInput
              label="Correo Electronico"
              name="email"
              type="email"
              placeholder="Ingresa tu correo"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <TextInput
              label="Contraseña"
              name="password"
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            {error ? (
              <div className="flex w-full items-center justify-center gap-2 text-[11px] text-[#e24c3b]">
                <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#e24c3b] text-[10px] text-white">
                  ×
                </span>
                <span>{error}</span>
              </div>
            ) : null}
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
            </PrimaryButton>
          </form>
          <button
            className="mt-1 text-[11px] text-[#3f6df5]"
            type="button"
            onClick={handleShowRecovery}
          >
            ¿Olvidaste tu contraseña?
          </button>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-text">
            <span>¿no tienes cuenta?</span>
            <Link className="text-[11px] text-[#3f6df5]" to="/register">
              registrate
            </Link>
          </div>
        </>
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          {view === 'recover' ? (
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
    </AuthLayout>
  );
}
