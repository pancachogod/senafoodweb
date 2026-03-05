import { useState } from 'react';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';
import { requestPasswordReset } from '../api/auth.js';

export default function Forgot() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanValue = value.trim();
    if (!cleanValue) {
      setError('Ingresa tu correo o documento.');
      return;
    }
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await requestPasswordReset(cleanValue);
      setSuccess('Si el correo existe, recibirás un enlace de recuperación.');
      setValue('');
    } catch (err) {
      setError(err.message || 'Error al enviar el correo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form className="flex w-full flex-col items-center gap-3" onSubmit={handleSubmit}>
        <TextInput
          label="Ingrese su correo electronico"
          name="forgot"
          placeholder="Ingresa tu correo/Documento"
          value={value}
          onChange={setValue}
          autoComplete="email"
          disabled={isLoading}
        />
        {error ? (
          <div className="text-center text-[11px] text-[#e24c3b]">{error}</div>
        ) : null}
        {success ? (
          <div className="text-center text-[11px] text-text">{success}</div>
        ) : null}
        <PrimaryButton type="submit" disabled={isLoading}>
          ENVIAR ENLACE
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}
