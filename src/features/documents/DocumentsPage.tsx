import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';

type Document = {
  id: string;
  number: string;
  type: 'Quote'|'Invoice';
  status: string;
  issueDate: string; // DateOnly serializado: "2025-10-13"
  currency: string;
  total: number;
  customerId: string;
};

type Page<T> = { items: T[]; page: number; pageSize: number; total: number };

export default function DocumentsPage() {
  const q = useQuery({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<Page<Document>>('/Documents')).data
  });

  if (q.isLoading) return <div className="p-6">Cargando…</div>;
  if (q.isError) return <div className="p-6 text-red-600">No se pudo cargar.</div>;

  const docs = q.data?.items ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Documentos</h1>
        <Link to="/documents/new" className="px-3 py-1.5 rounded bg-blue-600 text-white">Nuevo</Link>
      </div>
      <table className="w-full min-w-[800px] border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Número</th>
            <th className="p-2 border">Tipo</th>
            <th className="p-2 border">Estado</th>
            <th className="p-2 border">Fecha</th>
            <th className="p-2 border">Total</th>
            <th className="p-2 border">Ver</th>
          </tr>
        </thead>
        <tbody>
          {docs.map(d => (
            <tr key={d.id} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border">{d.number}</td>
              <td className="p-2 border">{d.type}</td>
              <td className="p-2 border">{d.status}</td>
              <td className="p-2 border">{d.issueDate}</td>
              <td className="p-2 border">{d.currency} {d.total?.toFixed(2)}</td>
              <td className="p-2 border"><Link className="px-2 py-1 bg-slate-200 rounded" to={`/documents/${d.id}`}>Abrir</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
