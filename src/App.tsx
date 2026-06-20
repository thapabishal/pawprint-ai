import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NetworkStatus } from '@/components/NetworkStatus';
import { InstallPrompt } from '@/components/InstallPrompt';
import { DashboardSkeleton } from '@/components/Skeletons';
import { FloatingNav } from '@/components/FloatingNav';
import { AnimatePresence, motion } from 'framer-motion';

// Lazy load pages
const CatchPage = lazy(() => import('@/pages/CatchPage'));
const IdentifyPage = lazy(() => import('@/pages/IdentifyPage'));
const MapPage = lazy(() => import('@/pages/MapPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const DogProfilePage = lazy(() => import('@/pages/DogProfilePage'));
const DogsPage = lazy(() => import('@/pages/DogsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<DashboardSkeleton />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><DashboardPage /></PageWrapper>} />
          <Route path="/catch" element={<PageWrapper><CatchPage /></PageWrapper>} />
          <Route path="/identify" element={<PageWrapper><IdentifyPage /></PageWrapper>} />
          <Route path="/map" element={<PageWrapper><MapPage /></PageWrapper>} />
          <Route path="/dogs" element={<PageWrapper><DogsPage /></PageWrapper>} />
          <Route path="/dog/:id" element={<PageWrapper><DogProfilePage /></PageWrapper>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="page-transition-wrapper"
  >
    {children}
  </motion.div>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="flex min-h-[100dvh] flex-col bg-surface overflow-x-hidden relative">
            <NetworkStatus />
            <InstallPrompt />

            <main className="flex-1 pb-[100px]">
              <AnimatedRoutes />
            </main>

            <FloatingNav />
            <Toaster />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
