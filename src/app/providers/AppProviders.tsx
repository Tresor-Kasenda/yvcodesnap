import type { ReactNode } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import FontLoader from '../../components/FontLoader';
import SeoManager from '../seo/SeoManager';

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <Router>
      <FontLoader />
      <SeoManager />
      <Toaster theme="dark" position="top-center" toastOptions={{ duration: 2600 }} />
      {children}
    </Router>
  );
}
