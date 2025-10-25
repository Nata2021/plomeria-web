import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem } from '../../lib/items';
import ItemForm, { type ItemFormSubmitValues } from './ItemForm';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ItemNewPage() {
  const qc = useQueryClient();
  const nav = useNavigate();

  const mCreate = useMutation({
    mutationFn: (v: ItemFormSubmitValues) => createItem(v),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Nuevo ítem</h1>
      <ItemForm
        onSubmit={(v) => {
          toast.promise(mCreate.mutateAsync(v), {
            loading: 'Guardando…',
            success: 'Ítem creado',
            error: (e) => e?.response?.data?.title || e?.message || 'No se pudo crear',
          }).then(() => nav('/items'));
        }}
        submitting={mCreate.isPending}
      />
    </div>
  );
}
