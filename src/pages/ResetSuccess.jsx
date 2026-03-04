import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Card from '../components/Card.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';

export default function ResetSuccess() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <Card>
        <div
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#39c86b] text-[26px] text-white"
          aria-hidden="true"
        >
          ✓
        </div>
        <p className="text-[11px] leading-[1.5] text-text">"Contraseña actualizada exitosamente"</p>
        <PrimaryButton
          onClick={() => navigate('/login')}
          className="max-w-[120px] normal-case shadow-none"
        >
          Continuar
        </PrimaryButton>
      </Card>
    </AuthLayout>
  );
}
