import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './ToastContext';
import Layout from './Layout';
import Homepage from './pages/Homepage';
import Create from './pages/Create';
import Library from './pages/Library';
import Export from './pages/Export';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import About from './pages/About';
import AppReview from './pages/AppReview';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Homepage />} />
          <Route path="create" element={<Create />} />
          <Route path="library" element={<Library />} />
          <Route path="export/:jobId" element={<Export />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="about" element={<About />} />
          <Route path="app-review" element={<AppReview />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
