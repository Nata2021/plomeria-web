import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '../lib/useDebouncedValue';

export type Option = { id: string; label: string; subtitle?: string };

type Props = {
  label: string;
  placeholder?: string;
  fetcher: (q: string) => Promise<Option[]>;
  onSelect: (option: Option | null) => void;
  error?: string;
};

export default function Autocomplete({ label, placeholder, fetcher, onSelect, error }: Props) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(input, 300);
  const ref = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['autocomplete', fetcher.name, debounced],
    queryFn: () => fetcher(debounced),
    enabled: debounced.length > 0,
  });

  // cerrar al hacer click afuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-gray-50 border rounded-md focus:ring-1 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {open && (
        <div className="absolute z-10 bg-white border w-full rounded shadow max-h-48 overflow-auto">
          {isFetching && <div className="p-2 text-sm text-gray-500">Buscando...</div>}
          {data?.length ? (
            data.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                onClick={() => {
                  setInput(opt.label);
                  setOpen(false);
                  onSelect(opt);
                }}
              >
                <div className="font-medium">{opt.label}</div>
                {opt.subtitle && <div className="text-xs text-gray-500">{opt.subtitle}</div>}
              </button>
            ))
          ) : (
            !isFetching && <div className="p-2 text-sm text-gray-500">Sin resultados</div>
          )}
        </div>
      )}
    </div>
  );
}
