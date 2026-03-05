import { useState } from 'react';
import emailjs from 'emailjs-com';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';
import { requestPasswordReset } from '../api/auth.js';

const EMAIL_SERVICE_ID =
  import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_5tr2w9y';
const EMAIL_TEMPLATE_ID =
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_t8pfyjk';
const EMAIL_PUBLIC_KEY =
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YFvIwWeCq8xOeqqdp';
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

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
      const response = await requestPasswordReset(cleanValue);
      if (response?.token && response?.email) {
        const link = `${APP_URL}/forgot/sent?token=${encodeURIComponent(
          response.token
        )}`;
        await emailjs.send(
          EMAIL_SERVICE_ID,
          EMAIL_TEMPLATE_ID,
          { to_email: response.email, link },
          EMAIL_PUBLIC_KEY
        );
      }
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
