import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingOverlay } from '../shared/ui/LoadingOverlay';
import { isMockEnv } from '../../utils/mockData';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const mockMode = isMockEnv();

  // In mock/e2e environments we still want redirects for unauthenticated flows
  // (e.g., auth tests) but avoid blocking when a synthetic user is present.
  if (mockMode && user) {
    return <>{children}</>;
  }

  if (loading) {
    return <LoadingOverlay message="Verifying Identity..." />;
  }

  if (!isAuthenticated || !user) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize role for comparison (handle case sensitivity and missing roles)
  let userRole = user.role;
  
  // Fallback: If role is missing but email is owner, treat as Owner
  if (!userRole && user.email === 'owner@growyourneed.com') {
      userRole = 'Owner';
  }

  const normalizedUserRole = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase() : '';
  
  const hasAccess = allowedRoles 
    ? allowedRoles.some(role => role.toLowerCase() === normalizedUserRole.toLowerCase())
    : true;

  if (allowedRoles && !hasAccess) {
    console.warn(`Access denied for role: ${userRole} (normalized: ${normalizedUserRole}). Allowed: ${allowedRoles?.join(', ')}`);
    // User is logged in but doesn't have permission or role is missing
    // Redirect to login to prevent infinite loops at root
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;