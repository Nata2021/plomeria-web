import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkOrders,
  dispatchWorkOrder,
  startRoute,
  arrive,
  startService,
  pauseService,
  resumeService,
  finishService,
} from './api';

export function useWorkOrders() {
  return useQuery({
    queryKey: ['workorders'],
    queryFn: fetchWorkOrders,
    staleTime: 15_000,
  });
}

function useInvalidateList() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['workorders'] });
}

export function useDispatchWO() {
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: (id: string) => dispatchWorkOrder(id),
    onSuccess: invalidate,
  });
}

export function useStartRoute() {
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => startRoute(id, {}),
    onSuccess: invalidate,
  });
}

export function useArrive() {
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => arrive(id, {}),
    onSuccess: invalidate,
  });
}

export function useStartService() {
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: ({ id, technicianId }: { id: string; technicianId?: string }) =>
      startService(id, technicianId),
    onSuccess: invalidate,
  });
}

export function usePauseService() {
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      pauseService(id, reason),
    onSuccess: invalidate,
  });
}

export function useResumeService() {
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: ({ id, technicianId }: { id: string; technicianId?: string }) =>
      resumeService(id, technicianId),
    onSuccess: invalidate,
  });
}

export function useFinishService() {
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: ({ id, summary }: { id: string; summary?: string }) =>
      finishService(id, summary),
    onSuccess: invalidate,
  });
}
