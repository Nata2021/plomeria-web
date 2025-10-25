import React from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// DTO (sin cambios)
export type ItemCreateDto = {
  name: string;
  sku?: string | null;
  type: 'Material' | 'Service';
  unit?: string | null;
  unitPrice: number;
  taxRate: number;
  stock?: number | null;
};

// --- SOLUCIÓN: Esquema sin transformaciones directas en campos numéricos ---
// Validamos como string, la conversión a número se hará ANTES de llamar a onSubmit prop.
const schema = z.object({
  name: z.string().min(2, 'El nombre es requerido y debe tener al menos 2 caracteres'),
  sku: z.string().optional(),
  type: z.enum(['Material', 'Service']),
  unit: z.string().optional(),
  unitPrice: z.string()
    .regex(/^\d*\.?\d*$/, "Debe ser un número positivo")
    .refine(val => val !== '', { message: 'Precio requerido' }), // Asegura que no esté vacío
  taxRate: z.string()
    .regex(/^\d*\.?\d*$/, "Debe ser un número")
    .refine(val => val !== '', { message: 'IVA requerido' })
    .refine(val => {
        const num = parseFloat(val);
        return num >= 0 && num <= 100;
    }, { message: "Debe estar entre 0 y 100" }),
  stock: z.string()
    .regex(/^-?\d*\.?\d*$/, "Debe ser un número válido")
    .optional()
    .or(z.literal('')), // Permite string vacío
});

// Este es el tipo que maneja react-hook-form (todo strings donde sea posible)
type FormInputValues = z.infer<typeof schema>;

// Este es el tipo que espera la prop onSubmit (con números)
export type ItemFormSubmitValues = Omit<FormInputValues, 'unitPrice' | 'taxRate' | 'stock'> & {
    unitPrice: number;
    taxRate: number;
    stock?: number; // stock es opcional
};


type Props = {
  initial?: Partial<ItemCreateDto>;
  onSubmit: (values: ItemFormSubmitValues) => void; // Espera el tipo con números
  submitting?: boolean;
};

// Componente Input (sin cambios)
const Input = ({ register, ...props }: { register: UseFormRegisterReturn } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...register} {...props} className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500" />
);

// --- Componente Principal ---
export default function ItemForm({ initial, onSubmit, submitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputValues>({ // react-hook-form usa el tipo con strings
    resolver: zodResolver(schema), // Zod valida los strings
    defaultValues: {
      name: initial?.name ?? '',
      sku: initial?.sku ?? '',
      type: initial?.type ?? 'Material',
      unit: initial?.unit ?? '',
      // SOLUCIÓN: Los defaultValues son strings, sin toString() complejo
      unitPrice: initial?.unitPrice?.toString() ?? '0',
      taxRate: initial?.taxRate?.toString() ?? '21',
      stock: initial?.stock?.toString() ?? '',
    },
  });

  // --- SOLUCIÓN: Conversión explícita ANTES de llamar a onSubmit prop ---
  // Esta función recibe los datos validados por Zod (FormInputValues)
  const handleFormSubmit = (values: FormInputValues) => {
    // Convierte los strings numéricos a números ANTES de llamar a la prop onSubmit
    const submitValues: ItemFormSubmitValues = {
        ...values,
        unitPrice: parseFloat(values.unitPrice),
        taxRate: parseFloat(values.taxRate),
        // Convierte a número solo si hay valor, si no, es undefined
        stock: values.stock ? parseFloat(values.stock) : undefined,
    };
    onSubmit(submitValues); // Llama a la prop con los datos ya convertidos
  };

  return (
    // SOLUCIÓN: Pasamos nuestra función handleFormSubmit a handleSubmit
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Nombre *</label>
        <Input register={register('name')} placeholder="Ej. Flexible 1/2”" />
        {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">SKU</label>
          <Input register={register('sku')} placeholder="Opcional" />
        </div>
        <div>
          <label className="block text-sm mb-1">Tipo</label>
          <select {...register('type')} className="w-full px-3 py-2 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="Material">Material</option>
            <option value="Service">Servicio</option> {/* Asegúrate que sea 'Service', no 'Servicio' como antes */}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1">Unidad</label>
          <Input register={register('unit')} placeholder="un, m, kg…" />
        </div>
        <div>
          <label className="block text-sm mb-1">Precio unitario *</label>
          <Input register={register('unitPrice')} type="number" step="0.01" />
          {errors.unitPrice && <p className="text-xs text-red-600">{errors.unitPrice.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">IVA % *</label>
          <Input register={register('taxRate')} type="number" step="0.01" />
          {errors.taxRate && <p className="text-xs text-red-600">{errors.taxRate.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Stock</label>
        <Input register={register('stock')} type="number" step="1" />
        {errors.stock && <p className="text-xs text-red-600">{errors.stock.message}</p>}
      </div>

      <div className="pt-2">
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
          {submitting ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}