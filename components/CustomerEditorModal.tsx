import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Customer } from '../types';
import { db } from '../services/db';

interface CustomerEditorModalProps {
    customer: Customer | null;
    onSave: (customer: Customer) => void;
    onClose: () => void;
    defaultIsDistributor?: boolean;
}

const CustomerEditorModal: React.FC<CustomerEditorModalProps> = ({ customer, onSave, onClose, defaultIsDistributor = false }) => {
    const { t } = useTranslation();
    const distributors = db.getCustomers().filter(c => c.isDistributor);
    const [formData, setFormData] = useState<Omit<Customer, 'id' | 'outstandingBalance'>>({
        name: customer?.name || '',
        contact: customer?.contact || '',
        address: customer?.address || '',
        gstin: customer?.gstin || '',
        creditLimit: customer?.creditLimit || 0,
        creditDays: customer?.creditDays || 0,
        isDistributor: customer?.isDistributor || defaultIsDistributor,
        affiliatedDistributorId: customer?.affiliatedDistributorId || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;

        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
        }));
    };

    const handleSubmit = () => {
        if (!formData.name) return;
        onSave({
            ...formData,
            id: customer?.id || `cust_${Date.now()}`,
            outstandingBalance: customer?.outstandingBalance || 0,
        });
    };

    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-semibold mb-4">{customer ? t('customers.edit') : t('customers.add')}</h3>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1">{t('customers.name')}</label><input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium mb-1">{t('customers.contact')}</label><input type="text" name="contact" value={formData.contact} onChange={handleChange} className={inputClass} /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('customers.address')}</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} className={inputClass} rows={2}></textarea>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">{t('customers.gstin')}</label><input type="text" name="gstin" value={formData.gstin} onChange={handleChange} className={inputClass} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1">{t('customers.credit_limit')}</label><input type="number" name="creditLimit" value={formData.creditLimit} onChange={handleChange} className={inputClass} /></div>
                        <div><label className="block text-sm font-medium mb-1">{t('customers.credit_days')}</label><input type="number" name="creditDays" value={formData.creditDays} onChange={handleChange} className={inputClass} /></div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('customers.affiliated_distributor')}</label>
                        <select name="affiliatedDistributorId" value={formData.affiliatedDistributorId} onChange={handleChange} className={inputClass}>
                            <option value="">None</option>
                            {distributors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" name="isDistributor" checked={formData.isDistributor} onChange={handleChange} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary" />
                            <span className="text-sm font-medium">{t('customers.is_distributor')}</span>
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                    <button onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">{t('cancel')}</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

export default CustomerEditorModal;