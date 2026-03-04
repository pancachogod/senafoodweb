import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';
import { logo } from '../assets/index.js';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Completa todos los campos.');
      return;
    }
    setError('');
    navigate('/home');
  };

  return (
    <AuthLayout showHeader={false}>
      <img className="mb-4 h-24 w-auto" src={logo} alt="Sena Food" />
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
        <PrimaryButton type="submit">INICIAR SESIÓN</PrimaryButton>
      </form>
      <div className="mt-2 flex items-center gap-1 text-[11px] text-text">
        <span>¿no tienes cuenta?</span>
        <Link className="text-[11px] text-[#3f6df5]" to="/register">
          registrate
        </Link>
      </div>
      <Link className="mt-1 text-[11px] text-[#3f6df5]" to="/forgot">
        ¿Has olvidado tu contraseña
      </Link>
    </AuthLayout>
  );
}
