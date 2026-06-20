import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSkeleton } from '@/components/Skeletons';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, profile, isLoading, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <h2 className="text-xl font-bold text-dark">Setting up your account...</h2>
        <p className="mt-2 text-muted max-w-xs">
          We're fetching your profile details. This should only take a moment.
        </p>
      </div>
    );
  }

  if (!profile.is_active) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-surface p-8 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm">
          <AlertTriangle size={40} />
        </div>
        <h1 className="text-2xl font-bold text-dark">Account Deactivated</h1>
        <p className="mt-3 text-muted max-w-sm leading-relaxed">
          Your account has been deactivated by the system administrator.
          Please contact your programme manager for assistance.
        </p>
        <button
          onClick={() => signOut()}
          className="mt-8 rounded-xl bg-dark px-6 py-3 font-semibold text-white transition-transform active:scale-95"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
