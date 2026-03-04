import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const OrdersContext = createContext(null);
const storageKey = 'senafood-orders';

const readStoredOrders = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(readStoredOrders);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(orders));
  }, [orders]);

  const addOrder = (order) => {
    if (!order) return;
    setOrders((prev) => [order, ...prev]);
  };

  const updateOrder = (orderId, updates) => {
    if (!orderId) return;
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, ...updates } : order))
    );
  };

  const cancelOrder = (orderId) => {
    updateOrder(orderId, { status: 'Cancelado' });
  };

  const value = useMemo(
    () => ({
      orders,
      addOrder,
      updateOrder,
      cancelOrder,
    }),
    [orders]
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
