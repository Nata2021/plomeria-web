import * as signalR from '@microsoft/signalr';
import { API_URL } from './env';

// Derivar la URL del hub a partir del API_URL (…/api/v1 -> …/hubs/workorders)
function deriveHubUrl() {
  try {
    const u = new URL(API_URL);
    // quita /api/... y pone /hubs/workorders
    const base = u.origin;
    return `${base}/hubs/workorders`;
  } catch {
    // fallback típico dev
    return 'https://localhost:7227/hubs/workorders';
  }
}

export function createWorkOrdersHub(token?: string) {
  const hubUrl = deriveHubUrl();

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => token ?? '',
      withCredentials: true
    })
    .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Information)
    .build();

  return connection;
}
