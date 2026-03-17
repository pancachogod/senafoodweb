import { apiRequest } from './client.js';

const mapPayment = (payment) => ({
  id: payment.id,
  orderId: payment.order_id ?? payment.orderId,
  method: payment.method,
  amount: payment.amount,
  status: payment.status,
  proofFilename: payment.proof_filename ?? payment.proofFilename ?? null,
  proofMime: payment.proof_mime ?? payment.proofMime ?? null,
  hasProof: Boolean(payment.has_proof ?? payment.hasProof ?? payment.proof_url ?? payment.proofUrl),
  proofUrl: payment.proof_url ?? payment.proofUrl ?? null,
  createdAt: payment.created_at ?? payment.createdAt,
});

const mapOrderItem = (item) => ({
  id: item.id,
  productId: item.product_id ?? null,
  name: item.name,
  description: item.description ?? '',
  price: item.price,
  image: item.image_url ?? item.image ?? null,
  quantity: item.quantity,
});

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
    proof: latestPayment?.proofUrl
      ? {
          url: latestPayment.proofUrl,
          filename: latestPayment.proofFilename,
          mime: latestPayment.proofMime,
        }
      : null,
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
