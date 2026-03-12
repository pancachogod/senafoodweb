import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';
import { confirmAccountVerification } from '../api/auth.js';
import { fondo, logo } from '../assets/index.js';

export default function VerifyAccount() {
  const location = useLocation();
  const token = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromSearch =
      searchParams.get('token') ||
      searchParams.get('verify_token') ||
      searchParams.get('verifyToken') ||
      '';
    if (fromSearch) return fromSearch;

    const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
    const hashParams = new URLSearchParams(hash.startsWith('?') ? hash.slice(1) : hash);
    const fromHash =
      hashParams.get('token') ||
      hashParams.get('verify_token') ||
      hashParams.get('verifyToken') ||
      '';
    if (fromHash) return fromHash;

    const pathMatch = location.pathname.match(/\/verify\/?(.+)?$/);
    if (pathMatch?.[1]) {
      return decodeURIComponent(pathMatch[1]);
    }

    return '';
  }, [location.hash, location.pathname, location.search]);
  const [manualToken, setManualToken] = useState('');
  const effectiveToken = token || manualToken.trim();
  const [status, setStatus] = useState(token ? 'checking' : 'form');
  const [error, setError] = useState('');
  const [alreadyActive, setAlreadyActive] = useState(false);

  useEffect(() => {
    if (!token) return;
    let isActive = true;
    setStatus('checking');
    confirmAccountVerification(token)
      .then(() => {
        if (!isActive) return;
        setStatus('success');
      })
      .catch((err) => {
        if (!isActive) return;
        const message = err?.message || 'No se pudo verificar la cuenta.';
        if (message.toLowerCase().includes('ya fue usado')) {
          setAlreadyActive(true);
          setStatus('success');
          return;
        }
        setStatus('error');
        setError(message);
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    if (!effectiveToken) {
      setError('Pega el token para continuar.');
      return;
    }
    setError('');
    setStatus('checking');
    try {
      await confirmAccountVerification(effectiveToken);
      setAlreadyActive(false);
      setStatus('success');
    } catch (err) {
      const message = err?.message || 'No se pudo verificar la cuenta.';
      if (message.toLowerCase().includes('ya fue usado')) {
        setAlreadyActive(true);
        setStatus('success');
        return;
      }
      setStatus('form');
      setError(message);
    }
  };

  return (
    <AuthLayout showHeader={false} backgroundImage={fondo}>
      <img className="mb-4 h-24 w-auto" src={logo} alt="Sena Food" />
      {status === 'checking' ? (
        <p className="text-[11px] text-text">Verificando cuenta...</p>
      ) : null}
      {status === 'success' ? (
        <div className="flex w-full max-w-[320px] flex-col items-center gap-3 rounded-[22px] bg-white px-6 py-5 text-center shadow-card">
          <p className="text-[11px] text-text">
            {alreadyActive
              ? 'Tu cuenta ya esta activa.'
              : 'Cuenta verificada exitosamente.'}
          </p>
          <Link className="text-[11px] text-[#3f6df5]" to="/login">
            Ir a iniciar sesion
          </Link>
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="flex w-full max-w-[320px] flex-col items-center gap-3 rounded-[22px] bg-white px-6 py-5 text-center shadow-card">
          <p className="text-[11px] text-text">{error}</p>
          <Link className="text-[11px] text-[#3f6df5]" to="/login">
            Volver a iniciar sesion
          </Link>
        </div>
      ) : null}
      {status === 'form' ? (
        <form className="flex w-full max-w-[320px] flex-col items-center gap-3" onSubmit={handleManualSubmit}>
          <TextInput
            label="Token de verificacion"
            name="verify-token"
            placeholder="Pega el token del correo"
            value={manualToken}
            onChange={(value) => {
              setManualToken(value);
              if (error) {
                setError('');
              }
            }}
            autoComplete="off"
          />
          {error ? (
            <div className="flex w-full items-center justify-center gap-2 text-[11px] text-[#e24c3b]">
              <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#e24c3b] text-[10px] text-white">
                ×
              </span>
              <span>{error}</span>
            </div>
          ) : null}
          <PrimaryButton type="submit">Verificar cuenta</PrimaryButton>
        </form>
      ) : null}
    </AuthLayout>
  );
}
