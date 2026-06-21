import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    // In this app, we usually expect the user to be logged in via Supabase Auth
    // If not, we might redirect to a login page if it exists, or just show an error.
    // Assuming there is a login flow or it's handled by AuthProvider.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Profile not loaded or inactive
  if (!profile || !profile.is_active) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface p-6">
        <Card className="w-full max-w-md border-red-100 bg-red-50/50">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">Access Denied</h3>
              <p className="mt-1 text-sm text-red-700">
                {!profile ? 'User profile not found.' : 'Your account has been deactivated. Please contact an administrator.'}
              </p>
            </div>
            <Button variant="outline" className="mt-2 border-red-200 text-red-700 hover:bg-red-100" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Role check
  if (requiredRole && profile.role !== requiredRole && profile.role !== 'admin') {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center p-6">
        <Card className="w-full max-w-md border-amber-100 bg-amber-50/50">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900">403 - Unauthorized</h3>
              <p className="mt-1 text-sm text-amber-700">
                You do not have the required permissions to access this page.
                This area is restricted to {requiredRole.replace('_', ' ')}s.
              </p>
            </div>
            <Button variant="outline" className="mt-2 border-amber-200 text-amber-700 hover:bg-amber-100" asChild>
              <a href="/">Return to Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
