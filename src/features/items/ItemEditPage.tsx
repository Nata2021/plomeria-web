import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItem, updateItem } from '../../lib/items';
import ItemForm, { type ItemFormSubmitValues } from './ItemForm';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function ItemEditPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const nav = useNavigate();

  const q = useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem(id!),
    enabled: !!id,
  });

  const mUpdate = useMutation({
    mutationFn: (v: ItemFormSubmitValues) => updateItem(id!, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['item', id] });
    },
  });

  if (q.isLoading) return <div className="p-6">Cargando…</div>;
  if (q.isError || !q.data) return <div className="p-6 text-red-600">No se pudo cargar el ítem.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Editar ítem</h1>
      <ItemForm
        initial={q.data}
        onSubmit={(v) => {
          toast.promise(mUpdate.mutateAsync(v), {
            loading: 'Guardando…',
            success: 'Ítem actualizado',
            error: (e) => e?.response?.data?.title || e?.message || 'No se pudo actualizar',
          }).then(() => nav('/items'));
        }}
        submitting={mUpdate.isPending}
      />
    </div>
  );
}
