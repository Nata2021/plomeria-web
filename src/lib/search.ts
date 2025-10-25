import { api } from './api';

export async function searchCustomers(q: string) {
  const { data } = await api.get('/Customers', { params: { search: q, pageSize: 10 } });
  return (data.items ?? []).map((c: any) => ({
    id: c.id,
    label: c.name ?? c.fullName ?? c.email ?? 'Cliente',
    subtitle: c.email ?? c.phone ?? '',
  }));
}

export async function searchTechnicians(q: string) {
  const { data } = await api.get('/Technicians', { params: { search: q, pageSize: 10 } });
  return (data.items ?? []).map((t: any) => ({
    id: t.id,
    label: t.name ?? t.fullName ?? t.email ?? 'Técnico',
    subtitle: t.email ?? t.phone ?? '',
  }));
}
