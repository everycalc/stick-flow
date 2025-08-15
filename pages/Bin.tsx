import React, { useState } from 'react';
import { db } from '../services/db';
import { useTranslation } from '../hooks/useTranslation';
import { Product, Recipe } from '../types';
import { Trash2, RotateCcw } from 'lucide-react';

const Bin: React.FC = () => {
    const { t } = useTranslation();
    const [products, setProducts] = useState<Product[]>(db.getProducts());
    const recipes = db.getRecipes();

    const deletedProducts = products.filter(p => p.isDeleted);

    const getFormulaName = (productId: string): string => {
        const recipe = recipes.find(r => r.finishedGoodId === productId);
        return recipe?.name || 'No Formula';
    };

    const handleRestore = (productId: string) => {
        const updatedProducts = products.map(p => 
            p.id === productId ? { ...p, isDeleted: false } : p
        );
        setProducts(updatedProducts);
        db.setProducts(updatedProducts);
    };

    return (
        <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{t('bin.title')}</h2>
            </div>

            <div className="overflow-x-auto">
                {deletedProducts.length > 0 ? (
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-light-outline/50 dark:border-dark-outline/50">
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Product Name</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Type</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Linked Formula</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                            {deletedProducts.map(product => (
                                <tr key={product.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                    <td className="p-3 whitespace-nowrap font-medium">{product.name}</td>
                                    <td className="p-3 whitespace-nowrap">{product.type.replace('_', ' ')}</td>
                                    <td className="p-3 whitespace-nowrap">{getFormulaName(product.id)}</td>
                                    <td className="p-3 whitespace-nowrap">
                                        <button 
                                            onClick={() => handleRestore(product.id)}
                                            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-500/30"
                                        >
                                            <RotateCcw size={16} />
                                            {t('bin.restore')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-16">
                        <Trash2 size={48} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/>
                        <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">{t('bin.empty')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bin;
