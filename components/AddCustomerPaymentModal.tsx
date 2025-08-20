import React, { useState } from 'react';
import { Customer } from '../types';
import { X } from 'lucide-react';

interface AddCustomerPaymentModalProps {
    customer: Customer;
    onSave: (amount: number, mode: 'cash' | 'online' | 'cheque') => void;
    onClose: () => void;
}

const AddCustomerPaymentModal: React.FC<AddCustomerPaymentModalProps> = ({ customer, onSave, onClose }) => {
    const [amount, setAmount] = useState<number>(0);
    const [mode, setMode] = useState<'cash' | 'online' | 'cheque'>('cash');

    const handleSave = () => {
        if (amount > 0) {
            onSave(amount, mode);
        }
    };

    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Payment for {customer.name}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount Paid</label>
                        <input
                            type="number"
                            value={amount || ''}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            className={inputClass}
                            placeholder="Enter amount"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Payment Mode</label>
                        <select value={mode} onChange={(e) => setMode(e.target.value as any)} className={inputClass}>
                            <option value="cash">Cash</option>
                            <option value="online">Online</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                    <button onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black">Save</button>
                </div>
            </div>
        </div>
    );
};

export default AddCustomerPaymentModal;