import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Permission } from '../types';
import { LayoutDashboard, Calculator, ShoppingCart, Package, BarChart2 } from 'lucide-react';

const TabBar: React.FC = () => {
    const { hasPermission } = useAuth();
    const location = useLocation();

    const tabs = [
        { to: '/', label: 'Summary', icon: LayoutDashboard, permission: Permission.VIEW_SUMMARY },
        { to: '/calculator', label: 'Calculator', icon: Calculator, permission: Permission.VIEW_CALCULATOR },
        { to: '/sales', label: 'Sales', icon: ShoppingCart, permission: Permission.VIEW_SALES },
        { to: '/inventory', label: 'Inventory', icon: Package, permission: Permission.VIEW_INVENTORY },
        { to: '/reports', label: 'Reports', icon: BarChart2, permission: Permission.VIEW_REPORTS },
    ];
    
    const visibleTabs = tabs.filter(tab => hasPermission(tab.permission));
    
    const isCurrentPathInTabs = visibleTabs.some(tab => {
        // Exact match for root, prefix match for others to support nested routes like /sales/123
        if (tab.to === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(tab.to);
    });

    if (visibleTabs.length === 0 || !isCurrentPathInTabs) {
        return null;
    }

    const activeLinkClass = "bg-light-primary-container text-light-primary dark:bg-dark-primary-container dark:text-dark-primary";
    const inactiveLinkClass = "hover:bg-black/5 dark:hover:bg-white/5 text-light-text-secondary dark:text-dark-text-secondary";

    return (
        <div className="bg-light-surface dark:bg-dark-surface border-b border-light-outline/50 dark:border-dark-outline/50 px-4">
            <nav className="flex space-x-2 sm:space-x-4" aria-label="Tabs">
                {visibleTabs.map(tab => (
                     <NavLink
                        key={tab.to}
                        to={tab.to}
                        end={tab.to === '/'}
                        className={({ isActive }) =>
                            `flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 rounded-t-lg transition-colors text-xs sm:text-sm font-semibold w-full sm:w-auto ${isActive ? activeLinkClass : inactiveLinkClass}`
                        }
                    >
                        <tab.icon size={20} />
                        <span>{tab.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default TabBar;