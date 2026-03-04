import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

const normalizeItem = (item) => ({
  id: item.id,
  name: item.name,
  description: item.description ?? '',
  price: item.price,
  image: item.image,
});

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (item, quantity = 1) => {
    if (!item) return;
    const payload = normalizeItem(item);
    const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === payload.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === payload.id
            ? { ...entry, quantity: entry.quantity + safeQuantity }
            : entry
        );
      }
      return [...prev, { ...payload, quantity: safeQuantity }];
    });
  };

  const increaseItem = (id) => {
    setItems((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, quantity: entry.quantity + 1 } : entry))
    );
  };

  const decreaseItem = (id) => {
    setItems((prev) =>
      prev
        .map((entry) =>
          entry.id === id ? { ...entry, quantity: entry.quantity - 1 } : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((entry) => entry.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = useMemo(
    () => items.reduce((total, entry) => total + entry.quantity, 0),
    [items]
  );

  const total = useMemo(
    () => items.reduce((sum, entry) => sum + entry.price * entry.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      increaseItem,
      decreaseItem,
      removeItem,
      clearCart,
      itemCount,
      total,
    }),
    [items, itemCount, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
