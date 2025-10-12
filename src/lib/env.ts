// Asegurate de tener este archivo
export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'https://localhost:7227/api/v1'; // fallback seguro para dev
