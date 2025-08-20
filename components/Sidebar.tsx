import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Permission, NavItem } from '../types';
import { 
    LayoutDashboard, Package, Factory, ShoppingCart, Truck, Users, Settings, Calculator, X, DollarSign, FileText, Briefcase, Building2, UsersRound, BookCopy, Trash2, ChevronDown
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const navStructure: NavItem[] = [
    { isHeading: true, label: 'Core' },
    { to: '/', label: 'Summary', icon: LayoutDashboard, permission: Permission.VIEW_SUMMARY },
    { to: '/inventory', label: 'Inventory', icon: Package, permission: Permission.VIEW_INVENTORY },
    { to: '/manufacturing', label: 'Manufacturing', icon: Factory, permission: Permission.VIEW_MANUFACTURING },
    { to: '/sales', label: 'Sales', icon: ShoppingCart, permission: Permission.VIEW_SALES },
    { to: '/purchases', label: 'Purchases', icon: Truck, permission: Permission.VIEW_PURCHASES },
    { isHeading: true, label: 'Relationships' },
    {
        label: 'Customers', icon: Users, permission: Permission.MANAGE_CUSTOMERS, collapsible: true, defaultOpen: false,
        subItems: [
            { to: '/customers', label: 'All Customers', permission: Permission.MANAGE_CUSTOMERS },
            { to: '/distributors', label: 'Distributors', permission: Permission.VIEW_DISTRIBUTORS },
        ]
    },
    { to: '/suppliers', label: 'Suppliers', icon: Building2, permission: Permission.MANAGE_SUPPLIERS },
    { isHeading: true, label: 'Management' },
    { to: '/finance', label: 'Finance', icon: DollarSign, permission: Permission.VIEW_FINANCE },
    { to: '/staff', label: 'Team', icon: UsersRound, permission: Permission.MANAGE_STAFF },
    { to: '/reports', label: 'Reports', icon: FileText, permission: Permission.VIEW_REPORTS },
    { to: '/stock_ledger', label: 'Stock Ledger', icon: BookCopy, permission: Permission.VIEW_STOCK_LEDGER },
    { isHeading: true, label: 'Tools' },
    { to: '/calculator', label: 'Calculator', icon: Calculator, permission: Permission.VIEW_CALCULATOR },
    { to: '/bin', label: 'Bin', icon: Trash2, permission: Permission.VIEW_BIN },
    { to: '/settings', label: 'Settings', icon: Settings, permission: Permission.VIEW_SETTINGS },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { hasPermission } = useAuth();
    const [openSections, setOpenSections] = useState<string[]>(
        navStructure.filter(item => item.collapsible && item.defaultOpen).map(item => item.label)
    );

    const toggleSection = (label: string) => {
        setOpenSections(prev => 
            prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
        );
    };

    const activeLinkClass = "bg-light-primary-container text-light-primary dark:bg-dark-primary-container dark:text-dark-primary font-semibold";
    const inactiveLinkClass = "hover:bg-black/5 dark:hover:bg-white/5 text-light-text-secondary dark:text-dark-text-secondary";

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-20 px-6 shrink-0">
                <h1 className="text-2xl font-bold tracking-wider text-light-primary dark:text-dark-primary">Stickflow</h1>
                 <button onClick={() => setIsOpen(false)} className="p-2 rounded-full lg:hidden hover:bg-black/10 dark:hover:bg-white/10">
                    <X size={24} />
                </button>
            </div>
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {navStructure.map((item, index) => {
                    if (!item.permission || hasPermission(item.permission)) {
                        if (item.isHeading) {
                            return <h3 key={index} className="px-4 pt-4 pb-1 text-xs font-bold uppercase text-light-text-secondary dark:text-dark-text-secondary">{item.label}</h3>;
                        }
                        if (item.collapsible && item.subItems) {
                            const isSectionOpen = openSections.includes(item.label);
                            return (
                                <div key={item.label}>
                                    <button onClick={() => toggleSection(item.label)} className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl transition-colors ${inactiveLinkClass}`}>
                                        <div className="flex items-center gap-4">
                                            {item.icon && <item.icon size={22} />}
                                            <span>{item.label}</span>
                                        </div>
                                        <ChevronDown size={18} className={`transition-transform ${isSectionOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isSectionOpen && (
                                        <div className="pl-8 pt-1 space-y-1">
                                            {item.subItems.map(subItem => (
                                                 hasPermission(subItem.permission!) && (
                                                    <NavLink
                                                        key={subItem.to}
                                                        to={subItem.to!}
                                                        onClick={() => setIsOpen(false)}
                                                        className={({ isActive }) =>
                                                            `flex items-center gap-4 px-4 py-2 rounded-xl transition-colors text-sm ${isActive ? activeLinkClass : inactiveLinkClass}`
                                                        }
                                                    >
                                                        <span>{subItem.label}</span>
                                                    </NavLink>
                                                 )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        if (item.to) {
                             return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/'}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${isActive ? activeLinkClass : inactiveLinkClass}`
                                    }
                                >
                                    {item.icon && <item.icon size={22} />}
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        }
                    }
                    return null;
                })}
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