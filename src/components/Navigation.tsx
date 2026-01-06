import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = memo(() => {
    const location = useLocation();
    const hideNavRoutes = [
        '/login', '/admin', '/', '/features', '/services', '/contact',
        '/enterprise', '/security', '/changelog', '/resources', '/docs', '/api', '/community', '/help', '/status',
        '/school-admin', '/teacher', '/student', '/parent', '/individual'
    ];

    if (hideNavRoutes.includes(location.pathname)) {
        return null;
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 p-4 bg-carbonFiberBase/80 backdrop-blur-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-machina text-vibrantTeal hover:text-energeticOrange transition-colors">
                    Grow Your Need
                </Link>
                <div className="space-x-4">
                    <Link to="/" className="text-gray-300 hover:text-vibrantTeal transition-colors">Home</Link>
                    <Link to="/login" className="bg-energeticOrange text-white font-machina px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                        Login
                    </Link>
                </div>
            </div>
        </nav>
    );
});

Navigation.displayName = 'Navigation';

export default Navigation;
