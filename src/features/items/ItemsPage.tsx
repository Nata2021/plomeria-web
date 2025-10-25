import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listItems, deleteItem, type Item } from '../../lib/items';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ItemsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'' | 'Material' | 'Service'>('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['items', { search, type }],
    queryFn: () => listItems({ search: search || undefined, type: (type as any) || undefined }),
    staleTime: 5_000,
  });

  const mDelete = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Ítems (Materiales / Servicios)</h1>
        <Link to="/items/new" className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">
          Nuevo ítem
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 items-end mb-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Buscar</label>
          <input
            className="rounded border px-2 py-1"
            placeholder="Nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Tipo</label>
          <select
            className="rounded border px-2 py-1"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="">Todos</option>
            <option value="Material">Material</option>
            <option value="Service">Service</option>
          </select>
        </div>
        <button
          className="px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300"
          onClick={() => refetch()}
        >
          Aplicar {isFetching ? '…' : ''}
        </button>
      </div>

      {isLoading && <div>Cargando…</div>}
      {error && <div className="text-red-600">No se pudo cargar.</div>}

      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2 border">Nombre</th>
              <th className="text-left p-2 border">SKU</th>
              <th className="text-left p-2 border">Tipo</th>
              <th className="text-right p-2 border">Precio</th>
              <th className="text-right p-2 border">IVA %</th>
              <th className="text-right p-2 border">Stock</th>
              <th className="text-left p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((it: Item) => (
              <tr key={it.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{it.name}</td>
                <td className="p-2 border">{it.sku ?? '—'}</td>
                <td className="p-2 border">{it.type}</td>
                <td className="p-2 border text-right">{it.unitPrice.toFixed(2)}</td>
                <td className="p-2 border text-right">{it.taxRate.toFixed(2)}</td>
                <td className="p-2 border text-right">{it.stock ?? '—'}</td>
                <td className="p-2 border">
                  <div className="flex gap-2">
                    <Link to={`/items/${it.id}/edit`} className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300">
                      Editar
                    </Link>
                    <button
                      className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      onClick={() => {
                        toast.promise(mDelete.mutateAsync(it.id), {
                          loading: 'Eliminando…',
                          success: 'Ítem eliminado',
                          error: (e) => e?.response?.data?.title || e?.message || 'No se pudo eliminar',
                        });
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(data?.length ?? 0) === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-gray-500">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
