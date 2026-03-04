import { apiRequest } from './client.js';

const mapOrderItem = (item) => ({
  id: item.id,
  productId: item.product_id ?? null,
  name: item.name,
  description: item.description ?? '',
  price: item.price,
  image: item.image_url ?? item.image ?? null,
  quantity: item.quantity,
});

const mapOrder = (order) => ({
  id: order.id,
  status: order.status,
  paymentMethod: order.payment_method ?? order.paymentMethod ?? 'Nequi',
  total: order.total,
  token: order.token,
  createdAt: order.created_at ?? order.createdAt,
  updatedAt: order.updated_at ?? order.updatedAt,
  items: Array.isArray(order.items) ? order.items.map(mapOrderItem) : [],
  title: order.title ?? 'Almuerzo de Día',
  subtitle: order.subtitle ?? order.items?.[0]?.name,
  user: order.user,
});

export async function listOrders(token) {
  const data = await apiRequest('/orders', { token });
  return Array.isArray(data) ? data.map(mapOrder) : [];
}

export async function createOrder(token, payload) {
  const data = await apiRequest('/orders', {
    method: 'POST',
    body: payload,
    token,
  });
  return mapOrder(data);
}

export async function cancelOrder(token, orderId) {
  const data = await apiRequest(`/orders/${orderId}`, {
    method: 'PATCH',
    body: { status: 'Cancelado' },
    token,
  });
  return mapOrder(data);
}
