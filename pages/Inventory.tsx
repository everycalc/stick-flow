import React, { useState } from 'react';
import { ItemType, Product, Supplier } from '../types';
import { db } from '../services/db';
import { PlusCircle, Package, Trash2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';


// ConfirmActionModal Component
const ConfirmActionModal: React.FC<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    onClose: () => void;
}> = ({ title, message, confirmText, onConfirm, onClose }) => {
    const { t } = useTranslation();
    const [inputText, setInputText] = useState('');
    const isConfirmed = inputText === confirmText;

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">{message}</p>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t('inventory.delete.type_to_confirm')}
                    className="w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">{t('cancel')}</button>
                    <button
                        onClick={onConfirm}
                        disabled={!isConfirmed}
                        className="px-4 py-2 rounded-full bg-red-600 text-white disabled:bg-red-600/50 disabled:cursor-not-allowed"
                    >
                        {t('delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};


// ProductEditorModal Component
const ProductEditorModal: React.FC<{
    product: Product | null;
    onSave: (product: Product) => void;
    onDelete: (productId: string) => void;
    onClose: () => void;
}> = ({ product, onSave, onDelete, onClose }) => {
    const { t } = useTranslation();
    const suppliers = db.getSuppliers();
    const [formData, setFormData] = useState<Omit<Product, 'id'>>({
        name: product?.name || '',
        type: product?.type || ItemType.RawMaterial,
        quantity: product?.quantity || 0,
        unit: product?.unit || 'kg',
        lowStockThreshold: product?.lowStockThreshold || 0,
        linked_supplier_ids: product?.linked_supplier_ids || [],
        sku: product?.sku || '',
        hsnCode: product?.hsnCode || '',
        last_purchase_price: product?.last_purchase_price || 0,
        selling_price: product?.selling_price || 0,
        isDeleted: product?.isDeleted || false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'quantity' || name === 'lowStockThreshold' || name === 'last_purchase_price' || name === 'selling_price' ? parseFloat(value) : value }));
    };

    const handleSupplierChange = (supplierId: string) => {
        const currentIds = formData.linked_supplier_ids || [];
        const newIds = currentIds.includes(supplierId)
            ? currentIds.filter(id => id !== supplierId)
            : [...currentIds, supplierId];
        setFormData(prev => ({ ...prev, linked_supplier_ids: newIds }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: product?.id || `prod_${Date.now()}`
        });
    };

    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-semibold mb-4">{product ? 'Edit Product' : 'Add New Product'}</h3>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Product Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Product Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                                <option value={ItemType.RawMaterial}>Raw Material</option>
                                <option value={ItemType.FinishedGood}>Finished Good</option>
                                <option value={ItemType.PackagingMaterial}>Packaging Material</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <div>
                            <label className="block text-sm font-medium mb-1">Quantity</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Unit (kg, ltr, pcs)</label>
                            <input type="text" name="unit" value={formData.unit} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Low Stock Threshold</label>
                            <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                    
                    {formData.type === ItemType.RawMaterial && (
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('inventory.suppliers')}</label>
                            <div className="max-h-32 overflow-y-auto p-2 border rounded-lg border-light-outline dark:border-dark-outline bg-transparent space-y-1">
                                {suppliers.length > 0 ? suppliers.map(supplier => (
                                    <label key={supplier.id} className="flex items-center gap-2 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded text-light-primary focus:ring-light-primary border-light-outline/50 dark:border-dark-outline/50"
                                            checked={formData.linked_supplier_ids.includes(supplier.id)}
                                            onChange={() => handleSupplierChange(supplier.id)}
                                        />
                                        {supplier.company_name}
                                    </label>
                                )) : <p className="text-xs text-center text-light-text-secondary dark:text-dark-text-secondary">No suppliers found. Add a supplier first.</p>}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">Last Purchase Price (per unit)</label>
                        <input type="number" step="0.01" name="last_purchase_price" value={formData.last_purchase_price} onChange={handleChange} className={inputClass} />
                    </div>
                    
                    {formData.type === ItemType.FinishedGood && (
                         <div>
                            <label className="block text-sm font-medium mb-1">Selling Price (per unit)</label>
                            <input type="number" step="0.01" name="selling_price" value={formData.selling_price} onChange={handleChange} className={inputClass} />
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                    <div>
                        {product && (
                             <button type="button" onClick={() => onDelete(product.id)} className="flex items-center gap-2 px-4 py-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-500/10 text-sm font-semibold">
                                <Trash2 size={16} /> {t('delete')}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black">Save Product</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const Inventory: React.FC = () => {
    const { t } = useTranslation();
    const [products, setProducts] = useState(db.getProducts());
    const [activeTab, setActiveTab] = useState<ItemType>(ItemType.RawMaterial);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

    const filteredProducts = products.filter(p => p.type === activeTab && !p.isDeleted);

    const handleOpenModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setIsProductModalOpen(true);
    };
    
    const handleCloseProductModal = () => {
        setIsProductModalOpen(false);
        setEditingProduct(null);
    };

    const handleSaveProduct = (product: Product) => {
        const exists = products.some(p => p.id === product.id);
        const updatedProducts = exists 
            ? products.map(p => p.id === product.id ? product : p)
            : [...products, product];
        
        setProducts(updatedProducts);
        db.setProducts(updatedProducts);
        handleCloseProductModal();
    };
    
    const handleDeleteRequest = (productId: string) => {
        setDeletingProductId(productId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!deletingProductId) return;
        
        const updatedProducts = products.map(p => 
            p.id === deletingProductId ? { ...p, isDeleted: true } : p
        );
        
        setProducts(updatedProducts);
        db.setProducts(updatedProducts);

        setIsDeleteModalOpen(false);
        setDeletingProductId(null);
        handleCloseProductModal(); // Close the editor modal as well
    };


    const ProductTable: React.FC<{ products: Product[] }> = ({ products }) => (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-light-outline/50 dark:border-dark-outline/50">
                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">Product Name</th>
                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">Quantity</th>
                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">Threshold</th>
                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                    {products.map(product => (
                        <tr key={product.id} className={`hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${product.quantity < product.lowStockThreshold ? 'bg-yellow-500/10' : ''}`} onClick={() => handleOpenModal(product)}>
                            <td className="p-3 whitespace-nowrap font-medium">{product.name}</td>
                            <td className="p-3 whitespace-nowrap">{product.quantity} {product.unit}</td>
                            <td className="p-3 whitespace-nowrap">{product.lowStockThreshold} {product.unit}</td>
                            <td className="p-3 whitespace-nowrap">
                                {product.quantity < product.lowStockThreshold ? 
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-800 dark:text-yellow-200">Low Stock</span>
                                    : <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-800 dark:text-green-200">In Stock</span>
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );


    return (
        <>
        <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Inventory</h2>
                <button onClick={() => handleOpenModal()} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                    <PlusCircle size={20} className="mr-2"/> Add Item
                </button>
            </div>
            
            <div className="border-b border-light-outline/50 dark:border-dark-outline/50">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab(ItemType.RawMaterial)}
                        className={`${activeTab === ItemType.RawMaterial ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        Raw Materials
                    </button>
                    <button
                        onClick={() => setActiveTab(ItemType.FinishedGood)}
                        className={`${activeTab === ItemType.FinishedGood ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        Finished Goods
                    </button>
                </nav>
            </div>

            <div className="mt-4">
                {filteredProducts.length > 0 ? (
                    <ProductTable products={filteredProducts} />
                ) : (
                    <div className="text-center py-16">
                        <Package size={48} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/>
                        <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">No items found.</p>
                    </div>
                )}
            </div>

        </div>
        {isProductModalOpen && (
            <ProductEditorModal 
                product={editingProduct}
                onSave={handleSaveProduct}
                onDelete={handleDeleteRequest}
                onClose={handleCloseProductModal}
            />
        )}
        {isDeleteModalOpen && (
            <ConfirmActionModal
                title={t('inventory.delete.title')}
                message={t('inventory.delete.confirm_text')}
                confirmText="delete"
                onConfirm={handleConfirmDelete}
                onClose={() => setIsDeleteModalOpen(false)}
            />
        )}
        </>
    );
};

export default Inventory;