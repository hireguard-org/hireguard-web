import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from './i18n';
import { AppLayout } from './layouts/AppLayout';
import { Landing } from './screens/Landing/Landing';
import { Generator } from './screens/Generator/Generator';
import { Spec } from './screens/Spec/Spec';
import { Adopt } from './screens/Adopt/Adopt';
import { Verify } from './screens/Verify/Verify';
import { Placeholder } from './screens/Placeholder';

function detectLanguage(): string {
  const stored = localStorage.getItem('i18nextLng');
  if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
    return stored;
  }
  return 'en';
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={`/${detectLanguage()}`} replace />,
  },
  {
    path: '/:lang',
    element: <AppLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'generator', element: <Generator /> },
      { path: 'verify', element: <Verify /> },
      { path: 'spec', element: <Spec /> },
      { path: 'adopt', element: <Adopt /> },
      { path: 'about', element: <Placeholder titleKey="nav.about" /> },
    ],
  },
]);
