import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import clickCursor from './assets/punteroi.png';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { OrdersProvider } from './context/OrdersContext.jsx';
import './index.css';

if (typeof document !== 'undefined') {
  document.documentElement.style.setProperty(
    '--cursor-interactive',
    `url(${clickCursor}) 8 2, auto`
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OrdersProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </OrdersProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
