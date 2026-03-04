import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';

const isValidPassword = (value) => value.length >= 6 && /[A-Z]/.test(value);

export default function Reset() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
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
    navigate('/reset/success');
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
        />
        <TextInput
          label="Confirmar contraseña"
          name="confirm"
          type="password"
          placeholder="Ingrese su contraseña"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        {error ? (
          <div className="text-center text-[11px] text-[#e24c3b]">{error}</div>
        ) : null}
        <PrimaryButton type="submit">RESTABLECER CONTRASEÑA</PrimaryButton>
      </form>
    </AuthLayout>
  );
}
