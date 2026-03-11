import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';
import { logo } from '../assets/index.js';

const isValidPassword = (value) => value.length >= 6 && /[A-Z]/.test(value);

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
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
  };

  return (
    <AuthLayout showHeader={false}>
      <img className="mb-4 h-24 w-auto" src={logo} alt="Sena Food" />
      <form className="flex w-full flex-col items-center gap-3" onSubmit={handleSubmit}>
        <TextInput
          label="Nueva contraseña"
          name="reset-password"
          type="password"
          placeholder="Ingrese su contraseña"
          value={password}
          onChange={(value) => {
            setPassword(value);
            if (error) {
              setError('');
            }
          }}
          autoComplete="new-password"
        />
        <TextInput
          label="Confirmar contraseña"
          name="reset-confirm"
          type="password"
          placeholder="Ingrese su contraseña"
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            if (error) {
              setError('');
            }
          }}
          autoComplete="new-password"
        />
        {error ? (
          <div className="flex w-full items-center justify-center gap-2 text-[11px] text-[#e24c3b]">
            <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#e24c3b] text-[10px] text-white">
              ×
            </span>
            <span>{error}</span>
          </div>
        ) : null}
        <PrimaryButton type="submit" disabled={!password || !confirmPassword}>
          RESTABLECER CONTRASEÑA
        </PrimaryButton>
      </form>
      <Link className="mt-2 text-[11px] text-[#3f6df5]" to="/login">
        Volver a iniciar sesion
      </Link>
    </AuthLayout>
  );
}
