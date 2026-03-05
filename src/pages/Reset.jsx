import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';
import { confirmPasswordReset, validatePasswordReset } from '../api/auth.js';

const isValidPassword = (value) => value.length >= 6 && /[A-Z]/.test(value);

export default function Reset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!token) {
      navigate('/forgot', { replace: true });
      return;
    }
    let isMounted = true;
    const runValidation = async () => {
      try {
        await validatePasswordReset(token);
        if (isMounted) {
          setIsValidToken(true);
        }
      } catch (err) {
        if (isMounted) {
          navigate('/forgot', { replace: true });
        }
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    };
    runValidation();
    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValidToken || isValidating) {
      return;
    }
    if (!password || !confirm) {
      setError('Completa ambos campos.');
      return;
    }
    if (!isValidPassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres y una mayuscula.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(token, password);
      navigate('/reset/success');
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <form className="flex w-full flex-col items-center gap-3" onSubmit={handleSubmit}>
        <TextInput
          label="Nueva contraseña"
          name="password"
          type="password"
          placeholder="Ingrese su contraseña"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={isSubmitting || isValidating}
        />
        <TextInput
          label="Confirmar contraseña"
          name="confirm"
          type="password"
          placeholder="Ingrese su contraseña"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          disabled={isSubmitting || isValidating}
        />
        {error ? (
          <div className="text-center text-[11px] text-[#e24c3b]">{error}</div>
        ) : null}
        <PrimaryButton type="submit" disabled={isSubmitting || isValidating}>
          RESTABLECER CONTRASEÑA
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}
