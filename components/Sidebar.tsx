import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { Permission } from '../types';
import { 
    LayoutDashboard, Package, Factory, ShoppingCart, Truck, ClipboardList, 
    Users, BarChart2, Settings, Calculator, BookOpen, X, UsersRound, Building2, Trash2, Briefcase
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();

    const navItems = [
        { to: '/', label: t('nav.summary'), icon: LayoutDashboard, permission: Permission.VIEW_SUMMARY },
        { to: '/inventory', label: t('nav.inventory'), icon: Package, permission: Permission.VIEW_INVENTORY },
        { to: '/manufacturing', label: t('nav.manufacturing'), icon: Factory, permission: Permission.VIEW_MANUFACTURING },
        { to: '/sales', label: t('nav.sales'), icon: ShoppingCart, permission: Permission.VIEW_SALES },
        { to: '/purchases', label: t('nav.purchases'), icon: Truck, permission: Permission.VIEW_PURCHASES },
        { to: '/suppliers', label: t('nav.suppliers'), icon: Building2, permission: Permission.MANAGE_SUPPLIERS },
        { to: '/customers', label: t('nav.customers'), icon: Users, permission: Permission.MANAGE_CUSTOMERS },
        { to: '/attendance', label: t('nav.attendance'), icon: ClipboardList, permission: Permission.MANAGE_ATTENDANCE },
        { to: '/calculator', label: t('nav.calculator'), icon: Calculator, permission: Permission.VIEW_CALCULATOR },
        { to: '/stock_ledger', label: t('nav.stock_ledger'), icon: BookOpen, permission: Permission.VIEW_STOCK_LEDGER },
        { to: '/distributors', label: t('nav.distributors'), icon: Briefcase, permission: Permission.VIEW_DISTRIBUTORS },
        { to: '/reports', label: t('nav.reports'), icon: BarChart2, permission: Permission.VIEW_REPORTS },
        { to: '/staff', label: t('nav.staff'), icon: UsersRound, permission: Permission.MANAGE_STAFF },
        { to: '/settings', label: t('nav.settings'), icon: Settings, permission: Permission.VIEW_SETTINGS },
        { to: '/bin', label: t('nav.bin'), icon: Trash2, permission: Permission.VIEW_BIN },
    ];
    
    const activeLinkClass = "bg-light-primary-container text-light-primary dark:bg-dark-primary-container dark:text-dark-primary font-semibold";
    const inactiveLinkClass = "hover:bg-black/5 dark:hover:bg-white/5 text-light-text-secondary dark:text-dark-text-secondary";

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-20 px-6 shrink-0">
                <h1 className="text-2xl font-bold tracking-wider text-light-primary dark:text-dark-primary">{t('app.name')}</h1>
                 <button onClick={() => setIsOpen(false)} className="p-2 rounded-full lg:hidden hover:bg-black/10 dark:hover:bg-white/10">
                    <X size={24} />
                </button>
            </div>
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                {navItems.map(item => (
                    hasPermission(item.permission) && (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${isActive ? activeLinkClass : inactiveLinkClass}`
                            }
                        >
                            <item.icon size={22} />
                            <span>{item.label}</span>
                        </NavLink>
                    )
                ))}
            </nav>
        </div>
    );


    return (
        <>
             {/* Overlay for mobile */}
            <div
                className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity ${
                isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
            />
            {/* Sidebar */}
            <aside
                className={`fixed lg:relative lg:translate-x-0 top-0 left-0 h-full w-64 bg-light-surface dark:bg-dark-surface border-r border-light-outline/50 dark:border-dark-outline/50 z-40 transition-transform transform ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {sidebarContent}
            </aside>
        </>
    );
};

export default Sidebar;