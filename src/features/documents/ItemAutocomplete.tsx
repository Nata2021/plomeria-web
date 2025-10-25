import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useDebounce } from '../../lib/useDebounce';

type Item = {
  id: string; name: string; sku?: string;
  unitPrice: number; taxRate: number; unit?: string;
  type: 'Material' | 'Service';
};

export default function ItemAutocomplete({
  onSelect
}: {
  onSelect: (item: Item) => void;
}) {
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term, 250);

  const { data, isLoading } = useQuery({
    queryKey: ['items', debounced],
    queryFn: async () => {
      if (!debounced) return [] as Item[];
      const { data } = await api.get<Item[]>('/Items', { params: { q: debounced, pageSize: 10 } });
      return data;
    }
  });

  return (
    <div className="relative w-full">
      <input
        className="w-full border rounded px-2 py-1"
        placeholder="Buscar ítem por nombre o SKU…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {term && (data?.length ?? 0) > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow">
          {data!.map(it => (
            <button
              key={it.id}
              type="button"
              onClick={() => { onSelect(it); setTerm(''); }}
              className="w-full text-left px-2 py-1 hover:bg-slate-100"
            >
              <div className="font-medium">{it.name}</div>
              <div className="text-xs text-slate-500">
                {it.sku ? `SKU ${it.sku} · ` : ''}{it.type} · {it.unitPrice.toFixed(2)} · IVA {it.taxRate}%
              </div>
            </button>
          ))}
        </div>
      )}
      {isLoading && term && <div className="absolute mt-1 text-xs text-slate-500">Buscando…</div>}
    </div>
  );
}
