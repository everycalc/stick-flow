import React, { useState } from 'react';
import { db } from '../services/db';
import { useTranslation } from '../hooks/useTranslation';
import { Customer, Payment } from '../types';
import { PlusCircle, Edit, Users, DollarSign } from 'lucide-react';
import CustomerEditorModal from '../components/CustomerEditorModal';
import AddCustomerPaymentModal from '../components/AddCustomerPaymentModal';


const Customers: React.FC = () => {
    const { t } = useTranslation();
    const [customers, setCustomers] = useState<Customer[]>(db.getCustomers());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);

    const openModal = (customer: Customer | null = null) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };
    
    const openPaymentModal = (customer: Customer) => {
        setPayingCustomer(customer);
        setIsPaymentModalOpen(true);
    };

    const handleSave = (customer: Customer) => {
        const updatedCustomers = customers.find(c => c.id === customer.id)
            ? customers.map(c => c.id === customer.id ? customer : c)
            : [...customers, customer];
        
        setCustomers(updatedCustomers);
        db.setCustomers(updatedCustomers);
        setIsModalOpen(false);
    };
    
    const handleSavePayment = (customerId: string, amount: number, mode: 'cash' | 'online' | 'cheque') => {
        let remainingAmount = amount;
        const allSales = db.getSales();
        const currentCustomers = db.getCustomers();
        
        const customerSalesToSettle = allSales
            .filter(s => s.customerId === customerId && (s.paymentStatus === 'unpaid' || s.paymentStatus === 'partial'))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const updatedSales = [...allSales];
        const allocationSummary: string[] = [];

        for (const sale of customerSalesToSettle) {
            if (remainingAmount <= 0) break;

            const totalPaidForSale = sale.payments.reduce((sum, p) => sum + p.amount, 0);
            const dueBalance = sale.totalAmount - totalPaidForSale;

            if (dueBalance > 0) {
                const amountToApply = Math.min(remainingAmount, dueBalance);
                
                const newPayment: Payment = {
                    id: `pay_${Date.now()}_${sale.id}`,
                    amount: amountToApply,
                    date: new Date().toISOString().split('T')[0],
                    mode: mode
                };
                
                const saleIndex = updatedSales.findIndex(s => s.id === sale.id);
                if (saleIndex > -1) {
                    const updatedSale = { ...updatedSales[saleIndex] };
                    updatedSale.payments = [...updatedSale.payments, newPayment];
                    
                    const newTotalPaid = updatedSale.payments.reduce((sum, p) => sum + p.amount, 0);
                    
                    if (newTotalPaid >= updatedSale.totalAmount) {
                        updatedSale.paymentStatus = 'paid';
                        allocationSummary.push(`${updatedSale.invoiceNumber} paid (₹${amountToApply.toFixed(2)})`);
                    } else {
                        updatedSale.paymentStatus = 'partial';
                        allocationSummary.push(`${updatedSale.invoiceNumber} partially paid (₹${amountToApply.toFixed(2)})`);
                    }
                    
                    updatedSales[saleIndex] = updatedSale;
                }

                remainingAmount -= amountToApply;
            }
        }

        const customerIndex = currentCustomers.findIndex(c => c.id === customerId);
        if (customerIndex > -1) {
            const updatedCustomer = {...currentCustomers[customerIndex]};
            updatedCustomer.outstandingBalance = Math.max(0, updatedCustomer.outstandingBalance - amount);
            currentCustomers[customerIndex] = updatedCustomer;
        }
        
        db.setSales(updatedSales);
        db.setCustomers(currentCustomers);
        setCustomers(currentCustomers);
        
        alert(`Payment of ₹${amount.toFixed(2)} recorded.\n\nAllocation: ${allocationSummary.join('\n')}`);
        setIsPaymentModalOpen(false);
    };

    return (
        <>
            <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">{t('customers.title')}</h2>
                    <button onClick={() => openModal()} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                        <PlusCircle size={20} className="mr-2"/> {t('customers.add')}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {customers.length > 0 ? (
                        <table className="min-w-full">
                           <thead>
                                <tr className="border-b border-light-outline/50 dark:border-dark-outline/50">
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Contact</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Address</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Balance</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Type</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                                {customers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                        <td className="p-3 whitespace-nowrap font-medium">{customer.name}</td>
                                        <td className="p-3 whitespace-nowrap">{customer.contact}</td>
                                        <td className="p-3 whitespace-nowrap max-w-xs truncate">{customer.address}</td>
                                        <td className="p-3 whitespace-nowrap font-semibold">
                                            {customer.outstandingBalance > 0 && <span className="text-red-600 dark:text-red-400">₹{customer.outstandingBalance.toFixed(2)} Cr.</span>}
                                            {customer.pendingPayment > 0 && <span className="text-green-600 dark:text-green-400">₹{customer.pendingPayment.toFixed(2)} Dr.</span>}
                                            {customer.outstandingBalance === 0 && customer.pendingPayment === 0 && <span>₹0.00</span>}
                                        </td>
                                        <td className="p-3 whitespace-nowrap">
                                            {customer.isDistributor ? 
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-800 dark:text-blue-200">Distributor</span>
                                                : <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-800 dark:text-gray-300">Retail</span>
                                            }
                                        </td>
                                        <td className="p-3 whitespace-nowrap">
                                            <button onClick={() => openPaymentModal(customer)} className="p-2 hover:bg-green-500/10 text-green-600 dark:text-green-400 rounded-full" title={t('customers.add_payment')}><DollarSign size={18} /></button>
                                            <button onClick={() => openModal(customer)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-light-text-secondary dark:text-dark-text-secondary"><Edit size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <div className="text-center py-16">
                            <Users size={48} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/>
                            <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">{t('customers.no_customers')}</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && <CustomerEditorModal customer={editingCustomer} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
            {isPaymentModalOpen && payingCustomer && (
                <AddCustomerPaymentModal
                    customer={payingCustomer}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSave={(amount, mode) => handleSavePayment(payingCustomer.id, amount, mode)}
                />
            )}
        </>
    );
};

export default Customers;