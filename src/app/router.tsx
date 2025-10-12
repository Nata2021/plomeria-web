import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import WorkOrdersPage from "../features/workorders/WorkOrdersPage";
import DocumentsPage from "../features/documents/DocumentsPage";
import Protected from "../components/Protected";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/", element: <Protected><DashboardPage /></Protected> },
  { path: "/workorders", element: <Protected><WorkOrdersPage /></Protected> },
  { path: "/documents", element: <Protected><DocumentsPage /></Protected> },
  { path: "*", element: <Navigate to="/" /> }
]);
