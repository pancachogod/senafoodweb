import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';
import { confirmPasswordReset, validatePasswordResetToken } from '../api/auth.js';
import { logo } from '../assets/index.js';

const isValidPassword = (value) => value.length >= 6 && /[A-Z]/.test(value);

export default function ResetPassword() {
  const location = useLocation();
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('checking');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    let isActive = true;
    setStatus('checking');
    validatePasswordResetToken(token)
      .then((data) => {
        if (!isActive) return;
        setStatus(data.valid ? 'valid' : 'invalid');
      })
      .catch(() => {
        if (!isActive) return;
        setStatus('invalid');
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status !== 'valid') {
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
      await confirmPasswordReset(token, password);
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
    <AuthLayout showHeader={false}>
      <img className="mb-4 h-24 w-auto" src={logo} alt="Sena Food" />
      {status === 'checking' ? (
        <p className="text-[11px] text-text">Validando enlace...</p>
      ) : null}
      {status === 'invalid' ? (
        <div className="flex w-full max-w-[320px] flex-col items-center gap-3 rounded-[22px] bg-white px-6 py-5 text-center shadow-card">
          <p className="text-[11px] text-text">
            El enlace no es valido o ya expiro. Solicita uno nuevo desde el inicio de sesion.
          </p>
          <Link className="text-[11px] text-[#3f6df5]" to="/login">
            Volver a iniciar sesion
          </Link>
        </div>
      ) : null}
      {status === 'success' ? (
        <div className="flex w-full max-w-[320px] flex-col items-center gap-3 rounded-[22px] bg-white px-6 py-5 text-center shadow-card">
          <p className="text-[11px] text-text">"Contrasena actualizada exitosamente"</p>
          <Link className="text-[11px] text-[#3f6df5]" to="/login">
            Volver a iniciar sesion
          </Link>
        </div>
      ) : null}
      {status === 'valid' ? (
        <>
          <form className="flex w-full flex-col items-center gap-3" onSubmit={handleSubmit}>
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
