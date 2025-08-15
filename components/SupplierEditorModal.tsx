import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Supplier } from '../types';

interface SupplierModalProps {
    supplier: Supplier | null;
    onSave: (supplier: Supplier) => void;
    onClose: () => void;
}

const SupplierEditorModal: React.FC<SupplierModalProps> = ({ supplier, onSave, onClose }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Omit<Supplier, 'id' | 'pendingPayment'>>({
        company_name: '',
        contact_person: '',
        phone: '',
        whatsapp: '',
        whatsapp_same_as_phone: true,
        city: '',
        gstin: '',
        notes: '',
    });

    useEffect(() => {
        if (supplier) {
            setFormData({
                company_name: supplier.company_name,
                contact_person: supplier.contact_person,
                phone: supplier.phone,
                whatsapp: supplier.whatsapp,
                whatsapp_same_as_phone: supplier.whatsapp_same_as_phone,
                city: supplier.city,
                gstin: supplier.gstin || '',
                notes: supplier.notes || '',
            });
        }
    }, [supplier]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    
        setFormData(prev => {
            const newState = { ...prev, [name]: isCheckbox ? checked : value };
            if (name === 'phone' && newState.whatsapp_same_as_phone) {
                newState.whatsapp = value;
            }
            if (name === 'whatsapp_same_as_phone' && checked) {
                newState.whatsapp = newState.phone;
            }
            return newState;
        });
    };
    
    const handleSubmit = () => {
        if (!formData.company_name) return;
        
        onSave({
            id: supplier?.id || `sup_${Date.now()}`,
            ...formData,
            pendingPayment: supplier?.pendingPayment || 0,
        });
    };

    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-semibold mb-4">{supplier ? t('suppliers.edit') : t('suppliers.add')}</h3>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('suppliers.company_name')}</label>
                        <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className={inputClass} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{t('suppliers.contact_person')}</label>
                        <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('suppliers.phone')}</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('suppliers.whatsapp')}</label>
                            <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} disabled={formData.whatsapp_same_as_phone} className={`${inputClass} disabled:opacity-50`} />
                            <label className="flex items-center gap-2 mt-2 text-xs">
                                <input type="checkbox" name="whatsapp_same_as_phone" checked={formData.whatsapp_same_as_phone} onChange={handleChange} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary"/>
                                {t('suppliers.whatsapp_same')}
                            </label>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('suppliers.city')}</label>
                            <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">GSTIN (Optional)</label>
                            <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputClass}></textarea>
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

export default SupplierEditorModal;