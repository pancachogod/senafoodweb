import { apiRequest } from './client.js';

export function createPayment(token, payload) {
  const form = new FormData();
  form.append('order_id', String(payload.order_id));
  form.append('method', payload.method);
  form.append('amount', String(payload.amount));
  if (payload.status) {
    form.append('status', payload.status);
  }
  if (payload.proof) {
    form.append('proof', payload.proof, payload.proof.name);
  }

  return apiRequest('/payments', {
    method: 'POST',
    body: form,
    token,
  });
}
