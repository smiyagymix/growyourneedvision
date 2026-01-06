import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleBasedRoute } from '../utils/roleUtils';

/**
 * Smart redirect component that routes users based on their role.
 * Intended to be used at the root path ('/') to dispatch users.
 */
const RoleBasedRedirect: React.FC = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Don't do anything while authentication is loading
        if (loading) return;

        if (user) {
            const userRole = user.role;

            if (!userRole) {
                console.error("User has no role defined, redirecting to login");
                navigate('/login', { replace: true });
                return;
            }

            const targetRoute = getRoleBasedRoute(userRole);
            console.log(`Redirecting ${user.email} (${userRole}) to ${targetRoute}`);
            navigate(targetRoute, { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gyn-blue-medium"></div>
            </div>
        );
    }

    return null;
};

export default RoleBasedRedirect;
