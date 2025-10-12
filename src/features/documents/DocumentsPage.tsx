import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

type Document = {
  id: string; number: string; type: string; status: string;
  issueDate: string; total: number; currency: string;
};

export default function DocumentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => (await api.get<Document[]>('/documents')).data
  });

  if (isLoading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-600">Error cargando documentos</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Documentos</h2>
      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2">Número</th>
            <th className="text-left p-2">Tipo</th>
            <th className="text-left p-2">Estado</th>
            <th className="text-left p-2">Fecha</th>
            <th className="text-right p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {data?.map(d => (
            <tr key={d.id} className="border-t">
              <td className="p-2">{d.number}</td>
              <td className="p-2">{d.type}</td>
              <td className="p-2">{d.status}</td>
              <td className="p-2">{d.issueDate}</td>
              <td className="p-2 text-right">{d.currency} {d.total?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
