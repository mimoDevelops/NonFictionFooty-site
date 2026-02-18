import React, { useEffect } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { ToastProvider, useToast } from './ToastContext';
import Layout from './Layout';
import Homepage from './pages/Homepage';
import Dashboard from './pages/Dashboard';
import NewDraft from './pages/NewDraft';
import DraftDetail from './pages/DraftDetail';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import About from './pages/About';
import AppReview from './pages/AppReview';
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
          <Route index element={<Homepage />} />
          <Route path="drafts" element={<Dashboard />} />
          <Route path="drafts/new" element={<NewDraft />} />
          <Route path="drafts/:id" element={<DraftDetail />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="about" element={<About />} />
          <Route path="app-review" element={<AppReview />} />
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
