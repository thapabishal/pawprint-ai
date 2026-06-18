import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Camera, Search, Map as MapIcon, LayoutDashboard, Dog } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

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

const LoadingScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-surface">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex min-h-[100dvh] flex-col bg-surface overflow-hidden">
          <main className="flex-1 overflow-y-auto pb-[calc(68px+env(safe-area-inset-bottom))]">
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/catch" element={<CatchPage />} />
                <Route path="/identify" element={<IdentifyPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/dogs" element={<DogsPage />} />
                <Route path="/dog/:id" element={<DogProfilePage />} />
              </Routes>
            </Suspense>
          </main>

          <nav className="fixed bottom-0 left-0 right-0 z-50 h-[68px] backdrop-blur-nav border-t border-border px-4 pb-safe bg-white/80">
            <div className="flex h-full items-center justify-around">
              <NavLink
                to="/catch"
                className={({ isActive }) =>
                  `relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Camera size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Catch</span>
                    {isActive && (
                      <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/identify"
                className={({ isActive }) =>
                  `relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Search size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Identify</span>
                    {isActive && (
                      <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/dogs"
                className={({ isActive }) =>
                  `relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Dog size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Dogs</span>
                    {isActive && (
                      <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/map"
                className={({ isActive }) =>
                  `relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <MapIcon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Map</span>
                    {isActive && (
                      <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </>
                )}
              </NavLink>

              <NavLink
                to="/"
                className={({ isActive }) =>
                  `relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <LayoutDashboard size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Stats</span>
                    {isActive && (
                      <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </>
                )}
              </NavLink>
            </div>
          </nav>
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
