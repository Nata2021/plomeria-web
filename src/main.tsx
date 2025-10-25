import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from "react-router-dom";
import { queryClient } from './app/queryClient';
import { router } from './app/router';
import { Toaster } from 'react-hot-toast';
import './index.css';



ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    <Toaster
      position="top-right"
      toastOptions={{
    success: { duration: 2200 },
    error: { duration: 4500 },
      }}
    />
    </QueryClientProvider>
  </React.StrictMode>
  
);
