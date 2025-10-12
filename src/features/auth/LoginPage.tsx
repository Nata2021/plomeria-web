import { useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from './auth.store';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@plomeria.local');
  const [password, setPassword] = useState('Admin!1234');
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuth(s => s.setAuth);
  const nav = useNavigate();

const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  try {
    const { data } = await api.post('/auth/login', { email, password });
    console.log('Login response:', data);

    // Acepta distintas claves comunes para el token
    const token =
      data?.token ??
      data?.accessToken ??
      data?.jwt ??
      (typeof data === 'string' ? data : null);

    if (!token) {
      // Mostramos el contenido para entender qué devuelve tu API
      setError('Login OK pero la respuesta no contiene un token. ' + JSON.stringify(data));
      return;
    }

    const roles = data?.roles ?? (data?.role ? [data.role] : []);
    setAuth(token, roles);
    nav('/', { replace: true });
  } catch (err: any) {
    // Mostrar mensaje del backend si viene como string u objeto
    const status = err?.response?.status;
    const body = err?.response?.data;
    const msg =
      typeof body === 'string'
        ? body
        : body?.title || body?.message || JSON.stringify(body) || 'Error de autenticación';

    console.error('Error login:', status, body);
    setError(msg);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white shadow rounded p-6 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Ingresar</h1>
        <input className="border p-2 w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 w-full" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">Entrar</button>
      </form>
    </div>
  );
}
