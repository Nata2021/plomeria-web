import { api } from '../../lib/api';

export type WorkOrder = {
  id: string;
  code: string;
  title: string;
  description?: string;
  address?: string;
  status:
    | 'Scheduled'
    | 'Dispatched'
    | 'OnRoute'
    | 'Arrived'
    | 'InService'
    | 'Paused'
    | 'Completed'
    | 'Invoiced'
    | 'Closed';
  technicianId?: string | null;
  customerId: string;
  scheduledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  arrivedAt?: string | null;
};

export type StartRouteDto = { targetLat?: number | null; targetLng?: number | null };
export type ManualArriveDto = { atUtc?: string | null };
export type PauseServiceDto = { reason?: string | null };
export type ResumeServiceDto = { technicianId?: string | null };
export type FinishServiceDto = { summary?: string | null };
export type TimeEntry = {
  id: string;
  workOrderId: string;
  technicianId: string;
  startAt: string;
  endAt?: string | null;
  notes?: string | null;
};

// --- Endpoints ---

export async function fetchWorkOrders() {
  const { data } = await api.get<WorkOrder[]>('/WorkOrders');
  return data;
}

export async function fetchWorkOrder(id: string) {
  const { data } = await api.get<WorkOrder>(`/WorkOrders/${id}`);
  return data;
}

export async function fetchTimeEntries(id: string) {
  const { data } = await api.get<TimeEntry[]>(`/WorkOrders/${id}/time-entries`);
  return data;
}

export async function dispatchWorkOrder(id: string) {
  const { data } = await api.post(`/WorkOrders/${id}/dispatch`, {});
  return data as WorkOrder;
}

export async function startRoute(id: string, dto?: StartRouteDto) {
  await api.post(`/WorkOrders/${id}/start-route`, dto ?? {});
}

export async function arrive(id: string, dto?: ManualArriveDto) {
  await api.post(`/WorkOrders/${id}/arrive`, dto ?? {});
}

export async function startService(id: string, technicianId?: string) {
  await api.post(`/WorkOrders/${id}/start-service`, { technicianId: technicianId ?? null });
}

export async function pauseService(id: string, reason?: string) {
  await api.post(`/WorkOrders/${id}/pause-service`, { reason: reason ?? null } as PauseServiceDto);
}

export async function resumeService(id: string, technicianId?: string) {
  await api.post(`/WorkOrders/${id}/resume-service`, { technicianId: technicianId ?? null } as ResumeServiceDto);
}

export async function finishService(id: string, summary?: string) {
  await api.post(`/WorkOrders/${id}/finish-service`, { summary: summary ?? null } as FinishServiceDto);
}
