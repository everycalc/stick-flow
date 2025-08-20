import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { X } from 'lucide-react';

interface ExpenseEditorModalProps {
    expense: Expense | null;
    onSave: (expense: Expense) => void;
    onClose: () => void;
}

const ExpenseEditorModal: React.FC<ExpenseEditorModalProps> = ({ expense, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        title: expense?.title || '',
        amount: expense?.amount || 0,
        category: expense?.category || ExpenseCategory.Other,
        date: expense?.date || new Date().toISOString().split('T')[0],
        notes: expense?.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || formData.amount <= 0) {
            alert("Please enter a title and a valid amount.");
            return;
        }
        onSave({
            ...formData,
            id: expense?.id || `exp_${Date.now()}`,
        });
    };

    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{expense ? 'Edit Expense' : 'Add New Expense'}</h3>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><X size={20}/></button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Amount</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} className={inputClass} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                                {Object.values(ExpenseCategory).map(cat => (
                                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputClass}></textarea>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black">Save</button>
                </div>
            </form>
        </div>
    );
};

export default ExpenseEditorModal;