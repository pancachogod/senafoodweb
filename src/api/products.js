import { apiRequest } from './client.js';
import { menuItems } from '../data/menu.js';

const localByCode = new Map(menuItems.map((item) => [item.id, item]));

const mapProduct = (product) => {
  const local = product?.code ? localByCode.get(product.code) : undefined;
  const fallback = local ?? {};

  return {
    id: product?.id ?? fallback.id,
    code: product?.code ?? fallback.id,
    name: product?.name ?? fallback.name,
    description: product?.description ?? fallback.description ?? '',
    price: product?.price ?? fallback.price ?? 0,
    image: product?.image_url || fallback.image,
    detail: fallback.detail,
  };
};

export async function fetchProducts() {
  const data = await apiRequest('/products');
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(mapProduct);
}

export function fallbackProducts() {
  return menuItems;
}
