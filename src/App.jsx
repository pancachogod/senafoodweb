import { Navigate, Route, Routes } from 'react-router-dom';
import Forgot from './pages/Forgot.jsx';
import ForgotSent from './pages/ForgotSent.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Checkout from './pages/Checkout.jsx';
import MenuItem from './pages/MenuItem.jsx';
import Orders from './pages/Orders.jsx';
import Register from './pages/Register.jsx';
import Reset from './pages/Reset.jsx';
import ResetSuccess from './pages/ResetSuccess.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <div className="min-h-screen font-sans text-text antialiased">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/menu/:id" element={<MenuItem />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/mis-pedidos" element={<Orders />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/forgot/sent" element={<ForgotSent />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/reset/success" element={<ResetSuccess />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}
