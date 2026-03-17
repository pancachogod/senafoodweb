import { apiRequest } from './client.js';
import { defaultProductImage } from '../assets/index.js';
import { menuItems } from '../data/menu.js';

const localByCode = new Map(menuItems.map((item) => [item.id, item]));

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const inferItemCode = (item) => {
  const searchText = `${normalizeText(item?.name)} ${normalizeText(item?.description)}`;

  if (searchText.includes('pollo')) {
    return 'pollo';
  }

  if (searchText.includes('pescado') || searchText.includes('tilapia')) {
    return 'pescado';
  }

  return null;
};

const findLocalItem = (item) => {
  const inferredCode = inferItemCode(item);
  if (inferredCode) {
    return localByCode.get(inferredCode);
  }

  const normalizedName = normalizeText(item?.name);
  return menuItems.find((entry) => normalizeText(entry.name) === normalizedName);
};

const isReliableImageUrl = (value) => {
  const normalized = String(value || '').trim();
  return normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('data:');
};

const mapPayment = (payment) => ({
  id: payment.id,
  orderId: payment.order_id ?? payment.orderId,
  method: payment.method,
  amount: payment.amount,
  status: payment.status,
  createdAt: payment.created_at ?? payment.createdAt,
});

const mapOrderItem = (item) => {
  const fallback = findLocalItem(item);
  const imageFallback = fallback?.image ?? defaultProductImage;
  const image = isReliableImageUrl(item?.image_url ?? item?.image)
    ? item.image_url ?? item.image
    : imageFallback;

  return {
    id: item.id,
    productId: item.product_id ?? null,
    name: item.name,
    description: item.description ?? '',
    price: item.price,
    image,
    imageFallback,
    quantity: item.quantity,
  };
};

const mapOrder = (order) => {
  const latestPayment = order.latest_payment ? mapPayment(order.latest_payment) : null;

  return {
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
    latestPayment,
  };
};

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
