import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cancelOrder as cancelOrderApi, createOrder as createOrderApi, listOrders } from '../api/orders.js';
import { useAuth } from './AuthContext.jsx';

const OrdersContext = createContext(null);

export function OrdersProvider({ children }) {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      setError('');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const data = await listOrders(token);
      setOrders(data);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los pedidos.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const createOrder = useCallback(
    async (payload) => {
      if (!token) {
        throw new Error('Debes iniciar sesión.');
      }
      const order = await createOrderApi(token, payload);
      setOrders((prev) => [order, ...prev]);
      return order;
    },
    [token]
  );

  const updateOrder = useCallback((orderId, updates) => {
    if (!orderId) return;
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, ...updates } : order))
    );
  }, []);

  const cancelOrder = useCallback(
    async (orderId) => {
      if (!token) {
        throw new Error('Debes iniciar sesión.');
      }
      const updated = await cancelOrderApi(token, orderId);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)));
      return updated;
    },
    [token]
  );

  const value = useMemo(
    () => ({
      orders,
      isLoading,
      error,
      refreshOrders,
      createOrder,
      updateOrder,
      cancelOrder,
    }),
    [orders, isLoading, error, refreshOrders, createOrder, updateOrder, cancelOrder]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within OrdersProvider');
  }
  return context;
}
