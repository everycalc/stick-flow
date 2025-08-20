import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Settings, LogOut, User as UserIcon, Search, X, Package, ShoppingCart } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/db';
import { Product, Customer, Sale } from '../types';

const Header: React.FC<{ toggleSidebar: () => void }> = ({ toggleSidebar }) => {
    const { user, logout, companyName } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<{ products: Product[], customers: Customer[], sales: Sale[] }>({ products: [], customers: [], sales: [] });

    const menuRef = useRef<HTMLDivElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    
    const performSearch = useCallback(() => {
        if (searchTerm.trim() === '') {
            setResults({ products: [], customers: [], sales: [] });
            return;
        }
        const lowerCaseTerm = searchTerm.toLowerCase();
        setResults({
            products: db.getProducts().filter(p => p.name.toLowerCase().includes(lowerCaseTerm)),
            customers: db.getCustomers().filter(c => c.name.toLowerCase().includes(lowerCaseTerm)),
            sales: db.getSales().filter(s => s.invoiceNumber.toLowerCase().includes(lowerCaseTerm))
        });
    }, [searchTerm]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => performSearch(), 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, performSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const hasResults = results.products.length > 0 || results.customers.length > 0 || results.sales.length > 0;

    return (
        <header className="relative flex items-center justify-between h-20 px-4 sm:px-6 bg-light-surface dark:bg-dark-surface border-b border-light-outline/50 dark:border-dark-outline/50 shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="p-2 rounded-full lg:hidden hover:bg-black/10 dark:hover:bg-white/10">
                    <Menu size={24} />
                </button>
                <h1 className="text-xl font-bold tracking-wider text-light-text dark:text-dark-text">{companyName || 'Stickflow'}</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <button onClick={() => setIsSearchOpen(true)} className="p-3 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                    <Search size={22} />
                </button>

                <ThemeToggle />
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none">
                        <div className="w-10 h-10 rounded-full bg-light-primary-container dark:bg-dark-primary-container flex items-center justify-center font-bold text-light-secondary dark:text-dark-primary">{user?.name.charAt(0)}</div>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-light-surface dark:bg-dark-surface rounded-xl shadow-lg border border-light-outline/50 dark:border-dark-outline/50 p-2 z-20">
                            <div className="flex items-center p-3 mb-2">
                                <div className="w-12 h-12 rounded-full bg-light-primary-container dark:bg-dark-primary-container p-2 mr-3 flex items-center justify-center">
                                   <UserIcon className="h-7 w-7 text-light-secondary dark:text-dark-secondary"/>
                                </div>
                                <div>
                                    <p className="font-semibold text-base">{user?.name}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary capitalize">{user?.role}</p>
                                </div>
                            </div>
                            <div className="border-t border-light-outline/50 dark:border-dark-outline/50 my-2"></div>
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-red-500/10 text-red-700 dark:text-red-300"
                            >
                                <LogOut size={20} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

             {/* Search Overlay */}
            {isSearchOpen && (
                <div ref={searchContainerRef} className="absolute top-0 left-0 right-0 z-30">
                    <div className="bg-light-surface dark:bg-dark-surface flex items-center h-20 px-4 sm:px-6 border-b border-light-outline/50 dark:border-dark-outline/50">
                         <div className="flex items-center gap-4">
                            <button onClick={toggleSidebar} className="p-2 rounded-full lg:hidden hover:bg-black/10 dark:hover:bg-white/10"><Menu size={24} /></button>
                            <Search size={22} className="text-light-text-secondary dark:text-dark-text-secondary" />
                         </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search anything..."
                            className="w-full h-full bg-transparent focus:outline-none text-base pl-4 flex-1"
                            autoFocus
                        />
                        <button onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><X size={24} /></button>
                    </div>
                     {searchTerm && (
                        <div className="bg-light-surface dark:bg-dark-surface rounded-b-2xl shadow-lg border-x border-b border-light-outline/50 dark:border-dark-outline/50 max-h-[60vh] overflow-y-auto p-2">
                           {!hasResults && <div className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">No results found</div>}
                           {results.products.length > 0 && (
                                <div className="p-2"><h3 className="px-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-2">Products</h3><ul>{results.products.map(p => <li key={p.id} className="p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3"><Package size={18}/>{p.name}</li>)}</ul></div>
                           )}
                           {results.customers.length > 0 && (
                                <div className="p-2"><h3 className="px-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-2">Customers</h3><ul>{results.customers.map(c => <li key={c.id} className="p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3"><UserIcon size={18}/>{c.name}</li>)}</ul></div>
                           )}
                            {results.sales.length > 0 && (
                                <div className="p-2"><h3 className="px-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-2">Sales</h3><ul>{results.sales.map(s => <li key={s.id} className="p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3"><ShoppingCart size={18}/>{s.invoiceNumber}</li>)}</ul></div>
                           )}
                        </div>
                     )}
                </div>
            )}
        </header>
    );
};

export default Header;