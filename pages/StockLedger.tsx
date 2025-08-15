import React, { useState, useMemo } from 'react';
import { db } from '../services/db';
import { StockMovement, StockMovementType, Product } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowDownLeft, ArrowUpRight, Factory, Trash2, Package } from 'lucide-react';

const StockLedger: React.FC = () => {
    const { t } = useTranslation();
    const allMovements = db.getStockMovements();
    const products = db.getProducts();

    const [selectedProductId, setSelectedProductId] = useState<string>('');

    const filteredMovements = selectedProductId
        ? allMovements.filter(m => m.productId === selectedProductId)
        : allMovements;
    
    // Calculate running balance
    const movementsWithBalance = useMemo(() => {
        const movementsByProduct: { [key: string]: StockMovement[] } = {};
        filteredMovements.forEach(m => {
            if (!movementsByProduct[m.productId]) {
                movementsByProduct[m.productId] = [];
            }
            movementsByProduct[m.productId].push(m);
        });

        const result: (StockMovement & { balance: number })[] = [];

        for (const productId in movementsByProduct) {
            const product = products.find(p => p.id === productId);
            if (!product) continue;

            const sorted = movementsByProduct[productId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            let currentBalance = product.quantity;

            // Iterate backwards from the most recent movement to calculate the balance at each point in time
            for (let i = sorted.length - 1; i >= 0; i--) {
                result.push({ ...sorted[i], balance: currentBalance });
                currentBalance -= sorted[i].quantityChange;
            }
        }
        
        // Sort final result by date descending for display
        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [filteredMovements, products]);


    const getMovementTypeIcon = (type: StockMovementType) => {
        const iconProps = { size: 18 };
        switch (type) {
            case StockMovementType.Purchase:
            case StockMovementType.ProductionIn:
                return <ArrowUpRight {...iconProps} className="text-green-500" />;
            case StockMovementType.Sale:
            case StockMovementType.ProductionOut:
                return <ArrowDownLeft {...iconProps} className="text-red-500" />;
            case StockMovementType.Wastage:
                return <Trash2 {...iconProps} className="text-yellow-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{t('stock_ledger.title')}</h2>
                <div className="w-full max-w-xs">
                     <select 
                        value={selectedProductId} 
                        onChange={e => setSelectedProductId(e.target.value)} 
                        className="block w-full rounded-lg border border-light-outline dark:border-dark-outline bg-transparent p-2.5 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
                    >
                         <option value="">All Products</option>
                         {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                {movementsWithBalance.length > 0 ? (
                    <table className="min-w-full">
                         <thead>
                            <tr className="border-b border-light-outline/50 dark:border-dark-outline/50">
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">{t('stock_ledger.product')}</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">{t('stock_ledger.date')}</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">{t('stock_ledger.type')}</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">{t('stock_ledger.quantity')}</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">{t('stock_ledger.balance')}</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">{t('stock_ledger.reference')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                            {movementsWithBalance.map(m => {
                                const product = products.find(p => p.id === m.productId);
                                return (
                                <tr key={m.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                    <td className="p-3 whitespace-nowrap font-medium">{product?.name || 'N/A'}</td>
                                    <td className="p-3 whitespace-nowrap text-sm">{new Date(m.date).toLocaleString()}</td>
                                    <td className="p-3 whitespace-nowrap capitalize flex items-center gap-2 text-sm">{getMovementTypeIcon(m.type)} {m.type.replace('_', ' ')}</td>
                                    <td className={`p-3 whitespace-nowrap font-semibold ${m.quantityChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange} {product?.unit || ''}</td>
                                    <td className="p-3 whitespace-nowrap">{m.balance} {product?.unit || ''}</td>
                                    <td className="p-3 whitespace-nowrap text-xs underline cursor-pointer">{m.relatedId}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                ) : (
                     <div className="text-center py-16">
                        <Package size={48} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/>
                        <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">No stock movements found for the selected product.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockLedger;