import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import DocumentsPage from "../features/documents/DocumentsPage";
import DocumentDetailPage from '../features/documents/DocumentDetailPage';
import Protected from "../components/Protected";
import ItemsPage from "../features/items/ItemsPage";
import ItemNewPage from "../features/items/ItemNewPage";
import ItemEditPage from "../features/items/ItemEditPage";

// Importaciones de Work Orders
import WorkOrdersPage from "../features/workorders/WorkOrdersPage";
import WorkOrderDetailPage from '../features/workorders/WorkOrderDetailPage';
import WorkOrderNewPage from "../features/workorders/WorkOrderNewPage"; // <-- Asegúrate de que esta línea esté


export const router = createBrowserRouter([
  // Rutas públicas
  { path: "/login", element: <LoginPage /> },

  // Rutas protegidas
  { path: "/", element: <Protected><DashboardPage /></Protected> },
  { path: "/documents", element: <Protected><DocumentsPage /></Protected> },
  { path: '/documents/:id', element: <Protected><DocumentDetailPage/></Protected> },

  // Rutas de Work Orders
  { path: "/workorders", element: <Protected><WorkOrdersPage /></Protected> },
  { path: "/workorders/new", element: <Protected><WorkOrderNewPage /></Protected> }, // <-- Ruta para el nuevo formulario
  { path: "/workorders/:id", element: <Protected><WorkOrderDetailPage /></Protected> },
  
  { path: "/items", element: <ItemsPage /> },
  { path: "/items/new", element: <ItemNewPage />},
  { path: "/items/:id/edit", element: <ItemEditPage />}, 

  // Redirección para cualquier otra ruta
  { path: "*", element: <Navigate to="/" /> }
]);