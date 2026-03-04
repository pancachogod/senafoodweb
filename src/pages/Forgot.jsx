import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import TextInput from '../components/TextInput.jsx';

export default function Forgot() {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!value) {
      setError('Ingresa tu correo o documento.');
      return;
    }
    setError('');
    navigate('/forgot/sent');
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
        />
        {error ? (
          <div className="text-center text-[11px] text-[#e24c3b]">{error}</div>
        ) : null}
        <PrimaryButton type="submit">ENVIAR ENLACE</PrimaryButton>
      </form>
    </AuthLayout>
  );
}
