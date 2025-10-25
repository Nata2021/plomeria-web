import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import ItemAutocomplete from './ItemAutocomplete';

type Doc = {
  id: string;
  number: string;
  type: 'Quote' | 'Invoice';
  status: string;
  currency: string;
  subtotal: number;
  taxTotal: number;
  total: number;
};

type Line = {
  id: number;
  documentId: string;
  kind: 'Labor' | 'Material' | 'Other';
  description: string;
  qty: number;
  unitPrice: number;
  taxRate: number;
  total: number;
};

// Si tu ItemAutocomplete expone esta forma, ajustá si es distinto
type ItemPick = {
  id: string;
  name: string;
  type: 'Material' | 'Service';
  unitPrice: number;
  taxRate: number;
};

type GetDocResponse = { doc: Doc; lines: Line[] };

type LineForm = {
  kind: 'Labor' | 'Material' | 'Other';
  description: string;
  qty: number;
  unitPrice: number;
  taxRate: number;
  itemId?: string; // opcional
};

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // ----------- Query del documento -----------
  const q = useQuery({
    queryKey: ['document', id],
    queryFn: async () => (await api.get<GetDocResponse>(`/Documents/${id}`)).data,
    enabled: !!id,
  });

  // ----------- Estado de alta rápida ----------
  const [f, setF] = useState<LineForm>({
    kind: 'Material',
    description: '',
    qty: 1,
    unitPrice: 0,
    taxRate: 21,
  });

  // ----------- Mutations -----------
  const mAdd = useMutation({
    mutationFn: (payload: LineForm) => api.post(`/Documents/${id}/lines`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document', id] });
      setF((s) => ({ ...s, description: '', qty: 1, unitPrice: 0, taxRate: 21, itemId: undefined }));
    },
  });

  const mDel = useMutation({
    mutationFn: (lineId: number) => api.delete(`/Documents/${id}/lines/${lineId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document', id] }),
  });

  const mPromote = useMutation({
    mutationFn: () => api.post(`/Documents/${id}/promote-to-invoice`, {}),
    onSuccess: (r) => {
      toast.success('Factura creada');
      const invoiceId = r.data?.invoiceId as string | undefined;
      if (invoiceId) navigate(`/documents/${invoiceId}`);
      else qc.invalidateQueries({ queryKey: ['document', id] });
    },
    onError: () => toast.error('No se pudo convertir a factura'),
  });

  if (q.isLoading) return <div className="p-6">Cargando…</div>;
  if (q.isError || !q.data) return <div className="p-6 text-red-600">No se pudo cargar.</div>;

  const { doc, lines } = q.data;

  // ----------- Helpers UI -----------
  const num = (v: any, def = 0) => (Number.isFinite(+v) ? +v : def);

  const handleAdd = async () => {
    const payload: LineForm = {
      kind: f.kind,
      description: f.description.trim(),
      qty: num(f.qty, 0),
      unitPrice: num(f.unitPrice, 0),
      taxRate: num(f.taxRate, 0),
      itemId: f.itemId,
    };
    if (!payload.description) {
      toast.error('La descripción es requerida');
      return;
    }
    await toast.promise(mAdd.mutateAsync(payload), {
      loading: 'Agregando…',
      success: 'Línea agregada',
      error: 'Error al agregar la línea',
    });
  };

  const handleDelete = async (lineId: number) => {
    await toast.promise(mDel.mutateAsync(lineId), {
      loading: 'Eliminando…',
      success: 'Eliminada',
      error: 'Error al eliminar',
    });
  };

  const linePreviewTotal = ((num(f.qty) * num(f.unitPrice)) * (1 + num(f.taxRate) / 100)).toFixed(2);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          {doc.number} — {doc.type}
        </h1>

        <div className="flex items-center gap-3">
          <div className="text-slate-700">
            Subtotal: {doc.subtotal.toFixed(2)} · IVA: {doc.taxTotal.toFixed(2)} · Total:{' '}
            <b>
              {doc.currency} {doc.total.toFixed(2)}
            </b>
          </div>
          {doc.type === 'Quote' && (
            <button
              className="px-3 py-1.5 rounded bg-violet-600 text-white hover:bg-violet-700"
              onClick={() =>
                toast.promise(mPromote.mutateAsync(), {
                  loading: 'Convirtiendo…',
                  success: 'Factura creada',
                  error: 'Error al convertir',
                })
              }
            >
              Convertir a factura
            </button>
          )}
        </div>
      </div>

      {/* Líneas */}
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-3">Líneas</h2>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Tipo</th>
              <th>Descripción</th>
              <th>Cant</th>
              <th>Precio</th>
              <th>IVA%</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b">
                <td className="py-2">{l.kind}</td>
                <td>{l.description}</td>
                <td>{l.qty}</td>
                <td>{l.unitPrice.toFixed(2)}</td>
                <td>{l.taxRate}</td>
                <td>{l.total.toFixed(2)}</td>
                <td>
                  <button className="text-red-600" onClick={() => handleDelete(l.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td colSpan={7} className="py-3 text-slate-500">
                  Sin líneas
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Alta rápida de línea + Autocomplete */}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="w-full">
            <label className="block text-xs mb-1">Buscar ítem</label>
            <ItemAutocomplete
              onSelect={(it: ItemPick) => {
                setF((s) => ({
                  ...s,
                  kind: it.type === 'Service' ? 'Labor' : 'Material',
                  description: it.name,
                  unitPrice: it.unitPrice,
                  taxRate: it.taxRate,
                  itemId: it.id,
                }));
              }}
            />
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs">Descripción</label>
            <input
              value={f.description}
              onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))}
              className="border rounded px-2 py-1 w-full"
            />
          </div>

          <div>
            <label className="block text-xs">Tipo</label>
            <select
              value={f.kind}
              onChange={(e) =>
                setF((s) => ({ ...s, kind: e.target.value as LineForm['kind'] }))
              }
              className="border rounded px-2 py-1"
            >
              <option>Material</option>
              <option>Labor</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs">Cant</label>
            <input
              type="number"
              step="0.01"
              value={f.qty}
              onChange={(e) => setF((s) => ({ ...s, qty: num(e.target.value, 0) }))}
              className="border rounded px-2 py-1 w-24"
            />
          </div>

          <div>
            <label className="block text-xs">Precio</label>
            <input
              type="number"
              step="0.01"
              value={f.unitPrice}
              onChange={(e) => setF((s) => ({ ...s, unitPrice: num(e.target.value, 0) }))}
              className="border rounded px-2 py-1 w-28"
            />
          </div>

          <div>
            <label className="block text-xs">IVA %</label>
            <input
              type="number"
              step="0.01"
              value={f.taxRate}
              onChange={(e) => setF((s) => ({ ...s, taxRate: num(e.target.value, 0) }))}
              className="border rounded px-2 py-1 w-20"
            />
          </div>

          <div className="text-sm text-slate-700">
            Total línea: <b>{linePreviewTotal}</b>
          </div>

          <button
            onClick={handleAdd}
            className="px-3 py-1.5 rounded bg-blue-600 text-white"
          >
            Agregar línea
          </button>
        </div>
      </div>
    </div>
  );
}
