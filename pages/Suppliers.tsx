import React, { useState } from 'react';
import { db } from '../services/db';
import { useTranslation } from '../hooks/useTranslation';
import { Supplier } from '../types';
import { PlusCircle, Edit, Trash2, Building2 } from 'lucide-react';
import SupplierEditorModal from '../components/SupplierEditorModal';

const Suppliers: React.FC = () => {
    const { t } = useTranslation();
    const [suppliers, setSuppliers] = useState<Supplier[]>(db.getSuppliers());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const openModal = (supplier: Supplier | null = null) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleSave = (supplier: Supplier) => {
        let updatedSuppliers;
        if (suppliers.find(s => s.id === supplier.id)) {
            updatedSuppliers = suppliers.map(s => s.id === supplier.id ? supplier : s);
        } else {
            updatedSuppliers = [...suppliers, supplier];
        }
        setSuppliers(updatedSuppliers);
        db.setSuppliers(updatedSuppliers);
        setIsModalOpen(false);
    };

    const handleDelete = (supplierId: string) => {
        if (confirm(`Are you sure you want to delete this supplier?`)) {
            const updatedSuppliers = suppliers.filter(s => s.id !== supplierId);
            setSuppliers(updatedSuppliers);
            db.setSuppliers(updatedSuppliers);
        }
    };

    return (
        <>
            <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">{t('suppliers.title')}</h2>
                    <button onClick={() => openModal()} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                        <PlusCircle size={20} className="mr-2"/> {t('suppliers.add')}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {suppliers.length > 0 ? (
                        <table className="min-w-full">
                           <thead>
                                <tr className="border-b border-light-outline/50 dark:border-dark-outline/50">
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Company Name</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Contact Person</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Phone</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">City</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                                {suppliers.map(supplier => (
                                    <tr key={supplier.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                        <td className="p-3 whitespace-nowrap font-medium">{supplier.company_name}</td>
                                        <td className="p-3 whitespace-nowrap">{supplier.contact_person}</td>
                                        <td className="p-3 whitespace-nowrap">{supplier.phone}</td>
                                        <td className="p-3 whitespace-nowrap">{supplier.city}</td>
                                        <td className="p-3 whitespace-nowrap">
                                            <button onClick={() => openModal(supplier)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-light-text-secondary dark:text-dark-text-secondary"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(supplier.id)} className="p-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <div className="text-center py-16">
                            <Building2 size={48} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/>
                            <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">No suppliers found. Add one to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && <SupplierEditorModal supplier={editingSupplier} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </>
    );
};

export default Suppliers;