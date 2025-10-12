import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

// La "forma" del objeto de paginación
type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

// La "forma" de una WorkOrder, ahora en camelCase para coincidir con el JSON
type WorkOrder = {
  id: string; // id suele venir en minúscula
  code: string;
  title: string;
  status: string;
  scheduledAt?: string;
};

export default function WorkOrdersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['workorders'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<WorkOrder>>('/WorkOrders');
      console.log('Respuesta de la API:', data); // Mantenemos esto para verificar
      return data;
    },
    retry: false,
  });

  if (isLoading) return <div className="p-6">Cargando...</div>;
 
  if (error) {
    const anyErr = error as any;
    const status = anyErr?.response?.status;
    const body = anyErr?.response?.data;
    return (
      <div className="p-6 text-red-600">
        Error al cargar WorkOrders (status {status}).<br />
        {typeof body === 'string' ? body : JSON.stringify(body)}
      </div>
    );
  }

  // Usamos data.items, que es el array
  const workOrders = data?.items || [];

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Órdenes de trabajo</h1>
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2 border">Código</th>
              <th className="text-left p-2 border">Título</th>
              <th className="text-left p-2 border">Estado</th>
              <th className="text-left p-2 border">Agendado</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map(w => (
              // Usamos camelCase para acceder a las propiedades
              <tr key={w.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border">{w.code}</td>
                <td className="p-2 border">{w.title}</td>
                <td className="p-2 border">{w.status}</td>
                <td className="p-2 border">
                  {w.scheduledAt ? new Date(w.scheduledAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
            {workOrders.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Sin órdenes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}