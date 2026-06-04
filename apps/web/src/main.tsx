import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './i18n';
import './design/tokens.css';
import './design/base.css';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="container" style={{ paddingBlockStart: 80 }}>Loading…</div>}>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>,
);
