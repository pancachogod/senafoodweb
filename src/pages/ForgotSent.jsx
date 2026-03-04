import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Card from '../components/Card.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { mail } from '../assets/index.js';

export default function ForgotSent() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <Card>
        <div className="relative flex h-[58px] w-[58px] items-center justify-center">
          <img className="h-[50px] w-[50px]" src={mail} alt="Correo" />
          <span className="absolute right-[6px] top-[4px] flex h-4 w-4 items-center justify-center rounded-full bg-orange text-[10px] text-white">
            1
          </span>
        </div>
        <p className="text-[11px] leading-[1.5] text-text">
          "Hemos enviado un enlace de recuperación a tu correo electrónico. Revisa tu
          bandeja de entrada o carpeta de spam para continuar con el proceso."
        </p>
        <PrimaryButton
          onClick={() => navigate('/reset')}
          className="max-w-[120px] normal-case shadow-none"
        >
          Continuar
        </PrimaryButton>
      </Card>
    </AuthLayout>
  );
}
