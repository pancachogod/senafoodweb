import { apiRequest } from './client.js';
import { menuItems } from '../data/menu.js';

const localByCode = new Map(menuItems.map((item) => [item.id, item]));

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const inferProductCode = (product) => {
  if (product?.code) {
    return product.code;
  }

  const normalizedName = normalizeText(product?.name);
  const normalizedDescription = normalizeText(product?.description);
  const searchText = `${normalizedName} ${normalizedDescription}`;

  if (searchText.includes('pollo')) {
    return 'pollo';
  }

  if (searchText.includes('pescado') || searchText.includes('tilapia')) {
    return 'pescado';
  }

  return null;
};

const findLocalProduct = (product) => {
  const inferredCode = inferProductCode(product);
  if (inferredCode) {
    return localByCode.get(inferredCode);
  }

  const normalizedName = normalizeText(product?.name);
  return menuItems.find((item) => normalizeText(item.name) === normalizedName);
};

const mapProduct = (product) => {
  const local = findLocalProduct(product);
  const fallback = local ?? {};
  const code = inferProductCode(product) ?? fallback.id;

  return {
    id: product?.id ?? fallback.id,
    code,
    name: product?.name ?? fallback.name,
    description: product?.description ?? fallback.description ?? '',
    price: product?.price ?? fallback.price ?? 0,
    stock: product?.stock ?? fallback.stock ?? 0,
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
