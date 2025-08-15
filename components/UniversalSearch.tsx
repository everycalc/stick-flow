import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Package, User, ShoppingCart } from 'lucide-react';
import { db } from '../services/db';
import { Product, Customer, Sale } from '../types';
import { useTranslation } from '../hooks/useTranslation';

const UniversalSearch: React.FC = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<{ products: Product[], customers: Customer[], sales: Sale[] }>({ products: [], customers: [], sales: [] });

    const performSearch = useCallback(() => {
        if (searchTerm.trim() === '') {
            setResults({ products: [], customers: [], sales: [] });
            return;
        }

        const lowerCaseTerm = searchTerm.toLowerCase();
        
        const products = db.getProducts().filter(p => p.name.toLowerCase().includes(lowerCaseTerm));
        const customers = db.getCustomers().filter(c => c.name.toLowerCase().includes(lowerCaseTerm));
        const sales = db.getSales().filter(s => s.invoiceNumber.toLowerCase().includes(lowerCaseTerm));

        setResults({ products, customers, sales });
    }, [searchTerm]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm, performSearch]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                setIsOpen(prev => !prev);
            }
             if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    const hasResults = results.products.length > 0 || results.customers.length > 0 || results.sales.length > 0;

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 text-sm p-2 rounded-full bg-light-surface dark:bg-dark-surface border border-light-outline/50 dark:border-dark-outline/50 text-light-text-secondary dark:text-dark-text-secondary w-40 md:w-64">
                <Search size={18} />
                <span className="flex-grow text-left">{t('search.placeholder')}</span>
                <kbd className="hidden md:inline-block font-sans text-xs bg-black/10 dark:bg-white/10 p-1 rounded">⌘K</kbd>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-start z-50 pt-16 md:pt-24 p-4">
                    <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-lg w-full max-w-2xl" role="dialog" aria-modal="true">
                        <div className="flex items-center p-4 border-b border-light-outline/50 dark:border-dark-outline/50">
                            <Search size={20} className="text-light-text-secondary dark:text-dark-text-secondary mr-3"/>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={t('search.placeholder')}
                                className="w-full bg-transparent focus:outline-none text-base"
                                autoFocus
                            />
                            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><X size={20}/></button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                           {searchTerm.trim() && !hasResults && <div className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">{t('no.results.found')}</div>}
                           {results.products.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('search.products')}</h3>
                                    <ul>{results.products.map(p => <li key={p.id} className="p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3"><Package size={18}/>{p.name}</li>)}</ul>
                                </div>
                           )}
                           {results.customers.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('search.customers')}</h3>
                                    <ul>{results.customers.map(c => <li key={c.id} className="p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3"><User size={18}/>{c.name}</li>)}</ul>
                                </div>
                           )}
                            {results.sales.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-2">{t('search.sales')}</h3>
                                    <ul>{results.sales.map(s => <li key={s.id} className="p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3"><ShoppingCart size={18}/>{s.invoiceNumber}</li>)}</ul>
                                </div>
                           )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UniversalSearch;