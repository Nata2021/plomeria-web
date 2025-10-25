import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

// ------------------ Tipos y Helpers ------------------
type Status = 'Scheduled' | 'Dispatched' | 'OnRoute' | 'Arrived' | 'InService' | 'Paused' | 'Completed';
type WorkOrder = { id: string; code: string; title: string; status: Status; scheduledAt?: string; };
type PaginatedResponse<T> = { items: T[]; page: number; pageSize: number; total: number; };

function readErr(e: any): string {
  const msg = e?.response?.data || e?.message || 'Error desconocido';
  return typeof msg === 'string' ? msg : JSON.stringify(msg);
}

// -----------------------------------------------------------------
// ------- 👇 COMPONENTES DE UI REUTILIZABLES Y MINIMALISTAS 👇 -------
// -----------------------------------------------------------------

const statusColors: Record<Status, string> = {
  Scheduled: 'bg-gray-100 text-gray-800',
  Dispatched: 'bg-purple-100 text-purple-800',
  OnRoute: 'bg-yellow-100 text-yellow-800',
  Arrived: 'bg-green-100 text-green-800',
  InService: 'bg-blue-100 text-blue-800',
  Paused: 'bg-orange-100 text-orange-800',
  Completed: 'bg-green-100 text-green-800',
};

// Un "Badge" para mostrar el estado con colores
const StatusBadge = ({ status }: { status: Status }) => (
  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status] || 'bg-gray-100'}`}>
    {status}
  </span>
);

// Componente de Botón mejorado
function Btn({ children, onClick, variant = 'primary', disabled = false }: { children: React.ReactNode; onClick: () => void; variant?: 'primary' | 'secondary' | 'success' | 'danger'; disabled?: boolean; }) {
  const base = "px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    danger: "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500",
  };
  return <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>{children}</button>;
}

// ------------------ Componente Principal ------------------
export default function WorkOrdersPage() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['workorders'],
    queryFn: async () => (await api.get<PaginatedResponse<WorkOrder>>('/WorkOrders')).data,
  });

  const [pauseModal, setPauseModal] = useState<{ open: boolean; id?: string }>({ open: false });
  const [finishModal, setFinishModal] = useState<{ open: boolean; id?: string }>({ open: false });
  const [pauseReason, setPauseReason] = useState('');
  const [finishSummary, setFinishSummary] = useState('');
  
  const invalidate = () => qc.invalidateQueries({ queryKey: ['workorders'] });

  const useWorkOrderMutation = <T,>(mutationFn: (vars: T) => Promise<any>, messages: { loading: string; success: string }) => useMutation({ mutationFn, onMutate: () => toast.loading(messages.loading, { id: 'mutation' }), onSuccess: () => { toast.success(messages.success, { id: 'mutation' }); invalidate(); }, onError: (err) => toast.error(readErr(err), { id: 'mutation' }) });

  const mDispatch = useWorkOrderMutation((id: string) => api.post(`/WorkOrders/${id}/dispatch`, {}), { loading: 'Despachando…', success: 'Despachado' });
  const mStartRoute = useWorkOrderMutation((id: string) => api.post(`/WorkOrders/${id}/start-route`, {}), { loading: 'Iniciando ruta…', success: 'En ruta' });
  const mArrive = useWorkOrderMutation((id: string) => api.post(`/WorkOrders/${id}/arrive`, {}), { loading: 'Marcando llegada…', success: 'Llegada registrada' });
  const mStartService = useWorkOrderMutation((id: string) => api.post(`/WorkOrders/${id}/start-service`, {}), { loading: 'Iniciando servicio…', success: 'Servicio iniciado' });
  const mPauseService = useWorkOrderMutation((vars: { id: string; reason?: string }) => api.post(`/WorkOrders/${vars.id}/pause-service`, { reason: vars.reason }), { loading: 'Pausando…', success: 'Servicio pausado' });
  const mResumeService = useWorkOrderMutation((id: string) => api.post(`/WorkOrders/${id}/resume-service`, {}), { loading: 'Reanudando…', success: 'Reanudado' });
  const mFinishService = useWorkOrderMutation((vars: { id: string; summary?: string }) => api.post(`/WorkOrders/${vars.id}/finish-service`, { summary: vars.summary }), { loading: 'Finalizando…', success: 'Trabajo finalizado' });

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error al cargar: {readErr(error)}</div>;

  const renderActions = (wo: WorkOrder) => {
    switch (wo.status) {
      case 'Scheduled': return <div className="flex gap-2"><Btn onClick={() => mDispatch.mutate(wo.id)} disabled={mDispatch.isPending}>Despachar</Btn><Btn variant="secondary" onClick={() => mStartRoute.mutate(wo.id)} disabled={mStartRoute.isPending}>Iniciar ruta</Btn></div>;
      case 'Dispatched': return <Btn onClick={() => mStartRoute.mutate(wo.id)} disabled={mStartRoute.isPending}>Iniciar ruta</Btn>;
      case 'OnRoute': return <Btn variant="success" onClick={() => mArrive.mutate(wo.id)} disabled={mArrive.isPending}>Llegué</Btn>;
      case 'Arrived': return <Btn onClick={() => mStartService.mutate(wo.id)} disabled={mStartService.isPending}>Iniciar servicio</Btn>;
      case 'InService': return <div className="flex gap-2"><Btn variant="danger" onClick={() => { setPauseReason(''); setPauseModal({ open: true, id: wo.id }); }}>Pausar</Btn><Btn variant="success" onClick={() => { setFinishSummary(''); setFinishModal({ open: true, id: wo.id }); }}>Finalizar</Btn></div>;
      case 'Paused': return <div className="flex gap-2"><Btn onClick={() => mResumeService.mutate(wo.id)} disabled={mResumeService.isPending}>Reanudar</Btn><Btn variant="success" onClick={() => { setFinishSummary(''); setFinishModal({ open: true, id: wo.id }); }}>Finalizar</Btn></div>;
      case 'Completed': return null;
      default: return null;
    }
  };

  return (
    <div className="bg-slate-50 min-h-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* --- Encabezado --- */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Órdenes de trabajo</h1>
          <Link to="/workorders/new" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition">
            + Nueva orden
          </Link>
        </div>

        {/* --- Tarjeta con la Tabla --- */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agendado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                <th className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(data?.items ?? []).map((w) => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{w.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{w.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={w.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.scheduledAt ? new Date(w.scheduledAt).toLocaleString() : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{renderActions(w)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/workorders/${w.id}`} className="text-blue-600 hover:text-blue-900">Ver</Link>
                  </td>
                </tr>
              ))}
               {(data?.items?.length === 0) && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-10">No se encontraron órdenes de trabajo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- Modales --- */}
      <Modal open={pauseModal.open} title="Pausar servicio" onClose={() => setPauseModal({ open: false })} footer={
          <div className="flex gap-3"><Btn variant="secondary" onClick={() => setPauseModal({ open: false })}>Cancelar</Btn><Btn variant="danger" onClick={() => { if (!pauseModal.id) return; mPauseService.mutate({ id: pauseModal.id, reason: pauseReason || undefined }); setPauseModal({ open: false }); }}>Confirmar pausa</Btn></div>}>
        <label className="block text-sm font-medium mb-1">Motivo (opcional)</label>
        <textarea className="w-full border rounded p-2" value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} placeholder="Ej: Esperando repuestos..." />
      </Modal>
      <Modal open={finishModal.open} title="Finalizar trabajo" onClose={() => setFinishModal({ open: false })} footer={
          <div className="flex gap-3"><Btn variant="secondary" onClick={() => setFinishModal({ open: false })}>Cancelar</Btn><Btn variant="success" onClick={() => { if (!finishModal.id) return; mFinishService.mutate({ id: finishModal.id, summary: finishSummary || undefined }); setFinishModal({ open: false }); }}>Confirmar finalización</Btn></div>}>
        <label className="block text-sm font-medium mb-1">Resumen (opcional)</label>
        <textarea className="w-full border rounded p-2" value={finishSummary} onChange={(e) => setFinishSummary(e.target.value)} placeholder="Ej: Se reemplazó flexible..." />
      </Modal>
    </div>
  );
}