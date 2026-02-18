import React, { useEffect } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { ToastProvider, useToast } from './ToastContext';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import NewDraft from './pages/NewDraft';
import DraftDetail from './pages/DraftDetail';
import { api, routes } from './api';

function AuthHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  useEffect(() => {
    const auth = searchParams.get('auth');
    const authError = searchParams.get('auth_error');
    if (auth === 'success') {
      toast.success('Connected to TikTok');
      setSearchParams({});
    } else if (authError) {
      toast.error(`TikTok: ${decodeURIComponent(authError)}`);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast]);
  return null;
}

function AppInner() {
  return (
    <>
      <AuthHandler />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="drafts/new" element={<NewDraft />} />
          <Route path="drafts/:id" element={<DraftDetail />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
