import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';
import React from 'react';
import Autocomplete from '../../components/Autocomplete';
import { searchCustomers, searchTechnicians } from '../../lib/search';
import { useState } from 'react';
import { localInputToIsoUtc } from '../../lib/datetime';

// --- Esquema de validación (simplificado de la versión anterior) ---
const schema = z.object({
  customerId: z.string().uuid({ message: 'Debe ser un UUID de cliente válido' }),
  technicianId: z.string().optional(),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  address: z.string().optional(),

  

  scheduledAt: z.string().optional()
    .refine(v => !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), {message: 'Formato inválido (usar selector de fecha y hora)',
    }),
  lat: z.string().regex(/^-?\d*\.?\d*$/, "Debe ser un número válido").optional(),
  lng: z.string().regex(/^-?\d*\.?\d*$/, "Debe ser un número válido").optional(),
});

type FormData = z.infer<typeof schema>;

// --- Helper para fechas (sin cambios) ---
function toIsoOrUndefined(dt?: string) {
  if (!dt) return undefined;
  const local = new Date(dt);
  if (isNaN(local.getTime())) return undefined;
  return new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
}

// -----------------------------------------------------------------
// -------  COMPONENTES DE UI REUTILIZABLES Y MINIMALISTAS  -------
// -----------------------------------------------------------------

const FormField = ({ label, required = false, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const Input = ({ register, ...props }: { register: UseFormRegisterReturn } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...register}
        {...props}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
    />
);

const Textarea = ({ register, ...props }: { register: UseFormRegisterReturn } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        {...register}
        {...props}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
    />
);

// --- Componente Principal del Formulario ---
export default function WorkOrderNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { customerId: '', technicianId: '', title: '', description: '', address: '', scheduledAt: '', lat: '', lng: '' }
  });

  const mCreate = useMutation({
    mutationFn: (payload: any) => api.post('/WorkOrders', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workorders'] }),
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      customerId: values.customerId,
      title: values.title.trim(),
      description: values.description || undefined,
      address: values.address || undefined,
      technicianId: values.technicianId || undefined,
      scheduledAt: localInputToIsoUtc(values.scheduledAt),
      lat: values.lat ? parseFloat(values.lat) : undefined,
      lng: values.lng ? parseFloat(values.lng) : undefined,
    };
    try {
      const response = await toast.promise(mCreate.mutateAsync(payload), {
        loading: 'Creando orden…',
        success: 'Orden creada con éxito',
        error: (e: any) => e?.response?.data?.title || e?.message || 'Error al crear la orden'
      });
      navigate(`/workorders/${response?.data?.id || ''}`);
    } catch (e) { /* El toast ya maneja el error */ }
  });
    
  
const [customer, setCustomer] = useState<{ id?: string; name?: string }>({});
const [technician, setTechnician] = useState<{ id?: string; name?: string }>({});
   
  return (
    <div className="bg-slate-50 min-h-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
            Nueva orden de trabajo
          </h1>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField label="Cliente" required error={errors.customerId?.message}>
                  <Autocomplete
                                
                    placeholder="Buscar cliente..."
                    label=""     
                    fetcher={searchCustomers}
                    onSelect={(opt) => {
                      setCustomer({ id: opt?.id, name: opt?.label });
                    }}
                    error={errors.customerId?.message}
                  />
                  {/* campo oculto para react-hook-form */}
                  <input type="hidden" value={customer.id || ''} {...register('customerId')} />
                </FormField>
              
                <FormField label="Técnico" error={errors.technicianId?.message}>
                  <Autocomplete
                    label=""
                    placeholder="Buscar técnico..."
                    fetcher={searchTechnicians}
                    onSelect={(opt) => setTechnician({ id: opt?.id, name: opt?.label })}
                    error={errors.technicianId?.message}
                  />
                  <input type="hidden" value={technician.id || ''} {...register('technicianId')} />
                </FormField>
            </div>
            
            <FormField label="Título" required error={errors.title?.message}>
              <Input register={register('title')} placeholder="Ej: Pérdida de agua en cañería de cocina" />
            </FormField>

            <FormField label="Descripción" error={errors.description?.message}>
              <Textarea register={register('description')} rows={3} placeholder="Detalles adicionales sobre el trabajo a realizar..." />
            </FormField>

            <FormField label="Dirección" error={errors.address?.message}>
              <Input register={register('address')} placeholder="Av. Siempre Viva 742, CABA" />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1">
                <FormField label="Fecha agendada" error={errors.scheduledAt?.message}>
                  <Input register={register('scheduledAt')} type="datetime-local" />
                </FormField>
              </div>
              <FormField label="Latitud" error={errors.lat?.message}>
                <Input register={register('lat')} placeholder="-34.60" />
              </FormField>
              <FormField label="Longitud" error={errors.lng?.message}>
                <Input register={register('lng')} placeholder="-58.38" />
              </FormField>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando...' : 'Crear Orden'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-transparent text-gray-600 font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}