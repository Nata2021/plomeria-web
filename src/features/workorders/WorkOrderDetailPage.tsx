import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';

// ------------------ Tipos y Helpers ------------------
type Status = 'Scheduled' | 'Dispatched' | 'OnRoute' | 'Arrived' | 'InService' | 'Paused' | 'Completed';
type WorkOrder = {
  id: string; code: string; title: string; description?: string;
  address?: string; status: Status; scheduledAt?: string;
};
type TimeEntry = { id: string; startAt: string; endAt?: string; notes?: string; };

const statusInfo: Record<Status, { label: string; className: string }> = {
  Scheduled: { label: 'Agendado', className: 'bg-gray-100 text-gray-800' },
  Dispatched: { label: 'Despachado', className: 'bg-purple-100 text-purple-800' },
  OnRoute: { label: 'En Ruta', className: 'bg-yellow-100 text-yellow-800' },
  Arrived: { label: 'En Sitio', className: 'bg-teal-100 text-teal-800' },
  InService: { label: 'En Servicio', className: 'bg-blue-100 text-blue-800' },
  Paused: { label: 'Pausado', className: 'bg-orange-100 text-orange-800' },
  Completed: { label: 'Completado', className: 'bg-green-100 text-green-800' },
};

function readErr(e: any): string {
  const msg = e?.response?.data || e?.message || 'Error desconocido';
  return typeof msg === 'string' ? msg : JSON.stringify(msg);
}

// ------------------ Componentes de UI Refinados ------------------
const Card = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <div className="bg-white rounded-lg shadow-md">
    {title && <h2 className="px-6 py-4 text-lg font-semibold text-gray-800 border-b">{title}</h2>}
    <div className="p-6">{children}</div>
  </div>
);

const InfoBlock = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div>
    <h3 className="flex items-center text-sm font-semibold text-gray-500 mb-2">
      {icon}
      <span className="ml-2">{label}</span>
    </h3>
    <p className="text-gray-800">{children}</p>
  </div>
);

function Btn({ children, onClick, variant = 'primary', disabled = false }: { children: React.ReactNode; onClick: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'success'; disabled?: boolean; }) {
  const base = "px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
    danger: "bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  };
  return <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>{children}</button>;
}

// ------------------ Componente Principal ------------------
export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: wo, isLoading, error } = useQuery({ queryKey: ['workorders', id], queryFn: async () => (await api.get<WorkOrder>(`/WorkOrders/${id}`)).data, enabled: !!id });
  const { data: timeEntries } = useQuery({ queryKey: ['timeEntries', id], queryFn: async () => (await api.get<TimeEntry[]>(`/WorkOrders/${id}/time-entries`)).data, enabled: !!id });

  const [pauseModal, setPauseModal] = useState(false);
  const [finishModal, setFinishModal] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [finishSummary, setFinishSummary] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['workorders', id] });
    qc.invalidateQueries({ queryKey: ['timeEntries', id] });
    qc.invalidateQueries({ queryKey: ['workorders'] });
  };
  
  const useWorkOrderMutation = <T,>(mutationFn: (vars: T) => Promise<any>, messages: { loading: string; success: string }) => useMutation({ mutationFn, onMutate: () => toast.loading(messages.loading, { id: 'mutation' }), onSuccess: () => { toast.success(messages.success, { id: 'mutation' }); invalidate(); }, onError: (err) => toast.error(readErr(err), { id: 'mutation' }) });

  const mDispatch = useWorkOrderMutation((id: string) => api.post(`/WorkOrders/${id}/dispatch`, {}), { loading: 'Despachando…', success: 'Despachado' });
  const mStartRoute = useWorkOrderMutation((id: string) => api.post(`/WorkOrders/${id}/start-route`, {}), { loading: 'Iniciando ruta…', success: 'En ruta' });
  const mArrive = useWorkOrderMutation((id: string) => api.post(`/WorkOrders/${id}/arrive`, {}), { loading: 'Marcando llegada…', success: 'Llegada registrada' });
  const mStartService = useWorkOrderMutation((id: string) => api.post(`/WorkOrders/${id}/start-service`, {}), { loading: 'Iniciando servicio…', success: 'Servicio iniciado' });
  const mPauseService = useWorkOrderMutation((vars: { id: string; reason?: string }) => api.post(`/WorkOrders/${vars.id}/pause-service`, { reason: vars.reason }), { loading: 'Pausando…', success: 'Servicio pausado' });
  const mResumeService = useWorkOrderMutation((id: string) => api.post(`/WorkOrders/${id}/resume-service`, {}), { loading: 'Reanudando…', success: 'Reanudado' });
  const mFinishService = useWorkOrderMutation((vars: { id: string; summary?: string }) => api.post(`/WorkOrders/${vars.id}/finish-service`, { summary: vars.summary }), { loading: 'Finalizando…', success: 'Trabajo finalizado' });

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;
  if (error || !wo) return <div className="p-8 text-red-600">Error al cargar: {readErr(error)}<Link to="/workorders" className="block mt-2 text-blue-600">Volver</Link></div>;

  const renderActions = (wo: WorkOrder) => {
    switch (wo.status) {
      case 'Scheduled': return <div className="flex gap-2"><Btn variant="secondary" onClick={() => mDispatch.mutate(wo.id)} disabled={mDispatch.isPending}>Despachar</Btn><Btn variant="secondary" onClick={() => mStartRoute.mutate(wo.id)} disabled={mStartRoute.isPending}>Iniciar ruta</Btn></div>;
      case 'Dispatched': return <Btn onClick={() => mStartRoute.mutate(wo.id)} disabled={mStartRoute.isPending}>Iniciar ruta</Btn>;
      case 'OnRoute': return <Btn variant="success" onClick={() => mArrive.mutate(wo.id)} disabled={mArrive.isPending}>Marcar Llegada</Btn>;
      case 'Arrived': return <Btn onClick={() => mStartService.mutate(wo.id)} disabled={mStartService.isPending}>Iniciar servicio</Btn>;
      case 'InService': return <div className="flex gap-2"><Btn variant="danger" onClick={() => setPauseModal(true)}>Pausar</Btn><Btn variant="success" onClick={() => setFinishModal(true)}>Finalizar</Btn></div>;
      case 'Paused': return <div className="flex gap-2"><Btn onClick={() => mResumeService.mutate(wo.id)} disabled={mResumeService.isPending}>Reanudar</Btn><Btn variant="success" onClick={() => setFinishModal(true)}>Finalizar</Btn></div>;
      case 'Completed': return <div className="flex items-center gap-2 text-green-600 font-semibold"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span>Trabajo completado</span></div>;
      default: return <span className="text-gray-400 text-sm">Sin acciones disponibles.</span>;
    }
  };

  return (
    <div className="bg-slate-50 min-h-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/workorders" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver al listado
        </Link>
        
        <Card>
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusInfo[wo.status]?.className}`}>{statusInfo[wo.status]?.label}</span>
              <h1 className="text-3xl font-bold text-gray-800 mt-2">{wo.title}</h1>
              <p className="text-gray-500 font-mono">{wo.code}</p>
            </div>
            <div className="flex-shrink-0">{renderActions(wo)}</div>
          </div>
          <div className="space-y-4 border-t pt-6">
            <InfoBlock label="Descripción" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>}>
              {wo.description || <span className="text-gray-400">Sin descripción.</span>}
            </InfoBlock>
            <InfoBlock label="Dirección" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
              {wo.address || <span className="text-gray-400">Sin dirección.</span>}
            </InfoBlock>
          </div>
        </Card>

        <Card title="Tiempo Registrado">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 px-1 font-medium text-gray-500">Inicio</th>
                <th className="text-left py-2 px-1 font-medium text-gray-500">Fin</th>
                <th className="text-left py-2 px-1 font-medium text-gray-500 w-1/3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(timeEntries ?? []).map((entry) => (
                <tr key={entry.id}>
                  <td className="py-3 px-1 text-gray-600">{new Date(entry.startAt).toLocaleString()}</td>
                  <td className="py-3 px-1 text-gray-600">{entry.endAt ? new Date(entry.endAt).toLocaleString() : <span className="text-blue-600 font-semibold">En curso...</span>}</td>
                  <td className="py-3 px-1 text-gray-600">{entry.notes}</td>
                </tr>
              ))}
              {(timeEntries?.length === 0) && (
                <tr><td colSpan={3} className="text-center text-gray-500 py-6">No hay tiempo registrado.</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* --- Modales --- */}
        <Modal open={pauseModal} title="Pausar servicio" onClose={() => setPauseModal(false)} footer={<div className="flex gap-3"><Btn variant="secondary" onClick={() => setPauseModal(false)}>Cancelar</Btn><Btn variant="danger" onClick={() => { mPauseService.mutate({ id: wo.id, reason: pauseReason || 'Pausa manual' }); setPauseModal(false); }}>Confirmar pausa</Btn></div>}>
          <label className="block text-sm font-medium mb-1">Motivo (opcional)</label>
          <textarea className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none" value={pauseReason} onChange={(e) => setPauseReason(e.target.value)} placeholder="Ej: Esperando repuestos..." />
        </Modal>
        <Modal open={finishModal} title="Finalizar trabajo" onClose={() => setFinishModal(false)} footer={<div className="flex gap-3"><Btn variant="secondary" onClick={() => setFinishModal(false)}>Cancelar</Btn><Btn variant="success" onClick={() => { mFinishService.mutate({ id: wo.id, summary: finishSummary || 'Trabajo finalizado' }); setFinishModal(false); }}>Confirmar finalización</Btn></div>}>
          <label className="block text-sm font-medium mb-1">Resumen (opcional)</label>
          <textarea className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none" value={finishSummary} onChange={(e) => setFinishSummary(e.target.value)} placeholder="Ej: Se reemplazó flexible..." />
        </Modal>
      </div>
    </div>
  );
}