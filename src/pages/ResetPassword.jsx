import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';
import { confirmPasswordReset, validatePasswordResetToken } from '../api/auth.js';
import { fondo, logo } from '../assets/index.js';

const isValidPassword = (value) => value.length >= 6 && /[A-Z]/.test(value);

export default function ResetPassword() {
  const location = useLocation();
  const token = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromSearch =
      searchParams.get('token') ||
      searchParams.get('reset_token') ||
      searchParams.get('resetToken') ||
      '';
    if (fromSearch) return fromSearch;

    const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
    const hashParams = new URLSearchParams(hash.startsWith('?') ? hash.slice(1) : hash);
    const fromHash =
      hashParams.get('token') ||
      hashParams.get('reset_token') ||
      hashParams.get('resetToken') ||
      '';
    if (fromHash) return fromHash;

    const pathMatch = location.pathname.match(/\/reset\/?(.+)?$/);
    if (pathMatch?.[1]) {
      return decodeURIComponent(pathMatch[1]);
    }

    return '';
  }, [location.hash, location.pathname, location.search]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('checking');
  const [validationMessage, setValidationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const effectiveToken = token || manualToken.trim();

  useEffect(() => {
    let isActive = true;
    setStatus('form');
    setValidationMessage('');
    if (!effectiveToken) {
      return () => {
        isActive = false;
      };
    }
    validatePasswordResetToken(effectiveToken)
      .then((data) => {
        if (!isActive) return;
        if (!data.valid) {
          setValidationMessage(
            'No pudimos validar el enlace. Puedes intentar crear tu contraseña de todas formas.'
          );
        }
      })
      .catch(() => {
        if (!isActive) return;
        setValidationMessage(
          'No pudimos validar el enlace. Puedes intentar crear tu contraseña de todas formas.'
        );
      });

    return () => {
      isActive = false;
    };
  }, [effectiveToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!effectiveToken) {
      setError('El enlace no trae el token. Pega el token del correo o solicita uno nuevo.');
      return;
    }
    if (status === 'invalid') {
      return;
    }
    if (!password || !confirmPassword) {
      setError('Completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('La contrasena debe tener al menos 6 caracteres y una mayuscula.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(effectiveToken, password);
      setStatus('success');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err?.message || 'No se pudo restablecer la contrasena.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout showHeader={false} backgroundImage={fondo}>
      <img className="mb-4 h-24 w-auto" src={logo} alt="Sena Food" />
      {status === 'checking' ? (
        <p className="text-[11px] text-text">Validando enlace...</p>
      ) : null}
      {status === 'success' ? (
        <div className="flex w-full max-w-[320px] flex-col items-center gap-3 rounded-[22px] bg-white px-6 py-5 text-center shadow-card">
          <p className="text-[11px] text-text">"Contrasena actualizada exitosamente"</p>
          <Link className="text-[11px] text-[#3f6df5]" to="/login">
            Volver a iniciar sesion
          </Link>
        </div>
      ) : null}
      {status === 'form' ? (
        <>
          <form className="flex w-full flex-col items-center gap-3" onSubmit={handleSubmit}>
            {validationMessage ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#fff4eb] px-3 py-2 text-[11px] text-title">
                <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-orange text-[10px] text-white">
                  !
                </span>
                <span>{validationMessage}</span>
              </div>
            ) : null}
            {!token ? (
              <TextInput
                label="Token del enlace"
                name="reset-token"
                placeholder="Pega el token del correo"
                value={manualToken}
                onChange={(value) => {
                  setManualToken(value);
                  if (error) {
                    setError('');
                  }
                }}
                autoComplete="off"
                disabled={isSubmitting}
              />
            ) : null}
            <TextInput
              label="Nueva contrasena"
              name="reset-password"
              type="password"
              placeholder="Ingrese su contrasena"
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (error) {
                  setError('');
                }
              }}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            <TextInput
              label="Confirmar contrasena"
              name="reset-confirm"
              type="password"
              placeholder="Ingrese su contrasena"
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                if (error) {
                  setError('');
                }
              }}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            {error ? (
              <div className="flex w-full items-center justify-center gap-2 text-[11px] text-[#e24c3b]">
                <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#e24c3b] text-[10px] text-white">
                  ×
                </span>
                <span>{error}</span>
              </div>
            ) : null}
            <PrimaryButton type="submit" disabled={!password || !confirmPassword || isSubmitting}>
              {isSubmitting ? 'RESTABLECIENDO...' : 'RESTABLECER CONTRASEÑA'}
            </PrimaryButton>
          </form>
          <Link className="mt-2 text-[11px] text-[#3f6df5]" to="/login">
            Volver a iniciar sesion
          </Link>
        </>
      ) : null}
    </AuthLayout>
  );
}
