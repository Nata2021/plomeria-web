import { api } from './api';

export type Item = {
  id: string;
  name: string;
  sku?: string;
  type: 'Material' | 'Service';
  unit?: string;
  unitPrice: number;
  taxRate: number;
  stock?: number | null;
};

export type ItemCreateDto = {
  name: string;
  sku?: string;
  type: 'Material' | 'Service';
  unit?: string;
  unitPrice: number;
  taxRate: number;
  stock?: number | null;
};

export type ItemUpdateDto = ItemCreateDto;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listItems(params: { search?: string; type?: 'Material' | 'Service' }) {
  const { data } = await api.get<Item[]>('/Items', { params }); // tu controlador devuelve array
  // si en un futuro devuelves paginado, adaptamos aquí
  return data;
}

export async function getItem(id: string) {
  const { data } = await api.get<Item>(`/Items/${id}`);
  return data;
}

export async function createItem(payload: ItemCreateDto) {
  const { data } = await api.post<Item>('/Items', payload);
  return data;
}

export async function updateItem(id: string, payload: ItemUpdateDto) {
  await api.put(`/Items/${id}`, payload);
}

export async function deleteItem(id: string) {
  await api.delete(`/Items/${id}`);
}
