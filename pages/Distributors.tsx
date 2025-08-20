import React, { useState, useMemo } from 'react';
import { db } from '../services/db';
import { useTranslation } from '../hooks/useTranslation';
import { User, Briefcase, ShoppingCart, FileText, CheckSquare, X, PlusCircle } from 'lucide-react';
import { Sale, Customer, DistributorSettlement, Expense, ExpenseCategory } from '../types';
import CustomerEditorModal from '../components/CustomerEditorModal';

const Distributors: React.FC = () => {
    const { t } = useTranslation();
    const [sales, setSales] = useState(db.getSales());
    const [settlements, setSettlements] = useState(db.getDistributorSettlements());
    const [customers, setCustomers] = useState(db.getCustomers());
    const distributors = useMemo(() => customers.filter(c => c.isDistributor && !c.isDeleted), [customers]);
    
    const [selectedDistributorId, setSelectedDistributorId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('sales');
    const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
    const [isAddDistributorModalOpen, setIsAddDistributorModalOpen] = useState(false);

    const selectedDistributor = useMemo(() => {
        return distributors.find(d => d.id === selectedDistributorId) || null;
    }, [selectedDistributorId, distributors]);

    const handleSelectDistributor = (distributorId: string) => {
        setSelectedDistributorId(distributorId);
        setActiveTab('sales');
    };
    
    const handleSaveSettlement = (newSettlement: DistributorSettlement, appliedExpenseIds: string[]) => {
        const allCustomers = db.getCustomers();
        const distributorIndex = allCustomers.findIndex(c => c.id === newSettlement.distributorId);
    
        if (distributorIndex > -1) {
            const distributor = allCustomers[distributorIndex];
            let newOutstanding = distributor.outstandingBalance;
            let newPending = distributor.pendingPayment;
    
            // 1. Reduce their own debt by the amount cleared in the settlement
            newOutstanding -= (newSettlement.appliedOutstandingBalance || 0);
    
            // 2. Adjust balances based on the final net settlement amount
            const finalAmount = newSettlement.settlementAmount;
            if (finalAmount > 0) { // We still owe them, add to pending payment
                newPending += finalAmount;
            } else if (finalAmount < 0) { // They still owe us (e.g., advances > margin), add to their outstanding debt
                newOutstanding += Math.abs(finalAmount);
            }
    
            allCustomers[distributorIndex] = {
                ...distributor,
                outstandingBalance: newOutstanding,
                pendingPayment: newPending,
            };
    
            db.setCustomers(allCustomers);
            setCustomers(allCustomers);
        }
    
        // 3. Save the new settlement record
        const newSettlements = [...settlements, newSettlement];
        setSettlements(newSettlements);
        db.setDistributorSettlements(newSettlements);
    
        // 4. Update the settled sales records
        const updatedSales = sales.map(s => 
            newSettlement.saleIds.includes(s.id) ? { ...s, settlementId: newSettlement.id } : s
        );
        setSales(updatedSales);
        db.setSales(updatedSales);
    
        // 5. Mark applied advance payments (expenses) as settled
        if (appliedExpenseIds.length > 0) {
            const allExpenses = db.getExpenses();
            const updatedExpenses = allExpenses.map(exp => 
                appliedExpenseIds.includes(exp.id) ? { ...exp, settlementId: newSettlement.id } : exp
            );
            db.setExpenses(updatedExpenses);
        }
        
        setIsSettlementModalOpen(false);
    };

    const handleSaveDistributor = (customer: Customer) => {
        const distributorData = { ...customer, isDistributor: true };
        const allCustomers = db.getCustomers();
        const existing = allCustomers.find(c => c.id === distributorData.id);
        let updatedCustomers;
        if (existing) {
            updatedCustomers = allCustomers.map(c => c.id === distributorData.id ? distributorData : c);
        } else {
            updatedCustomers = [...allCustomers, distributorData];
        }
        db.setCustomers(updatedCustomers);
        setCustomers(updatedCustomers); // Update local state to re-render
        setIsAddDistributorModalOpen(false);
    };

    if (!selectedDistributor) {
        return (
             <>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold">{t('distributors.title')}</h2>
                        <button onClick={() => setIsAddDistributorModalOpen(true)} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                            <PlusCircle size={20} className="mr-2"/> {t('distributors.add')}
                        </button>
                    </div>
                    {distributors.length > 0 ? distributors.map(dist => (
                        <div key={dist.id} className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="p-3 bg-light-primary-container dark:bg-dark-primary-container rounded-full mr-4">
                                        <Briefcase className="w-6 h-6 text-light-secondary dark:text-dark-secondary" />
                                    </div>
                                    <h3 className="text-xl font-semibold">{dist.name}</h3>
                                </div>
                                <button onClick={() => handleSelectDistributor(dist.id)} className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black text-sm font-semibold">View Details</button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-16 bg-light-surface dark:bg-dark-surface rounded-2xl">
                            <User size={48} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/>
                            <p className="mt-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">No distributors found.</p>
                        </div>
                    )}
                </div>
                {isAddDistributorModalOpen && <CustomerEditorModal customer={null} onSave={handleSaveDistributor} onClose={() => setIsAddDistributorModalOpen(false)} defaultIsDistributor={true} />}
             </>
        )
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                     <button onClick={() => setSelectedDistributorId(null)} className="text-sm font-semibold hover:underline">{'< Back to List'}</button>
                    <h2 className="text-2xl font-semibold">{selectedDistributor.name}</h2>
                </div>
                
                <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                    <div className="border-b border-light-outline/50 dark:border-dark-outline/50">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button onClick={() => setActiveTab('sales')} className={`${activeTab === 'sales' ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}><ShoppingCart size={16} /> Sales</button>
                            <button onClick={() => setActiveTab('settlements')} className={`${activeTab === 'settlements' ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}><FileText size={16} /> Settlements</button>
                        </nav>
                    </div>
                    <div className="mt-6">
                        {activeTab === 'sales' && <DistributorSalesTab distributor={selectedDistributor} sales={sales} customers={customers} />}
                        {activeTab === 'settlements' && <DistributorSettlementsTab distributor={selectedDistributor} sales={sales} settlements={settlements} onNewSettlement={() => setIsSettlementModalOpen(true)} />}
                    </div>
                </div>
            </div>
            {isSettlementModalOpen && (
                <SettlementModal 
                    distributor={selectedDistributor} 
                    sales={sales} 
                    onSave={handleSaveSettlement}
                    onClose={() => setIsSettlementModalOpen(false)} 
                />
            )}
        </>
    );
}

const DistributorSalesTab: React.FC<{ distributor: Customer, sales: Sale[], customers: Customer[] }> = ({ distributor, sales, customers }) => {
    const distributorSales = sales.filter(s => s.distributorId === distributor.id);
    return (
        <div>
            {distributorSales.length > 0 ? (
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-light-outline/50 dark:border-dark-outline/50">
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Invoice #</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">End Customer</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Amount</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Settlement Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                            {distributorSales.map(sale => {
                                const endCustomer = customers.find(c => c.id === sale.customerId);
                                return (
                                    <tr key={sale.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                        <td className="p-3 whitespace-nowrap">{sale.invoiceNumber}</td>
                                        <td className="p-3 whitespace-nowrap">{endCustomer?.name || 'N/A'}</td>
                                        <td className="p-3 whitespace-nowrap">{sale.date}</td>
                                        <td className="p-3 whitespace-nowrap">{sale.totalAmount.toFixed(2)}</td>
                                        <td className="p-3 whitespace-nowrap">
                                            {sale.settlementId ? <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-800 dark:text-green-200">Settled</span> : <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-800 dark:text-yellow-200">Unsettled</span>}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : <p>No sales records found for this distributor.</p>}
        </div>
    );
};

const DistributorSettlementsTab: React.FC<{ distributor: Customer, sales: Sale[], settlements: DistributorSettlement[], onNewSettlement: () => void }> = ({ distributor, sales, settlements, onNewSettlement }) => {
    const distributorSettlements = settlements.filter(s => s.distributorId === distributor.id);
    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={onNewSettlement} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                    <PlusCircle size={20} className="mr-2"/> New Settlement
                </button>
            </div>
             {distributorSettlements.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-light-outline/50 dark:border-dark-outline/50">
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Settlement Date</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Period</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Total Sales</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Distributor Margin</th>
                                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Settlement Amount</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                             {distributorSettlements.map(settlement => (
                                <tr key={settlement.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                    <td className="p-3 whitespace-nowrap">{settlement.settledOn}</td>
                                    <td className="p-3 whitespace-nowrap">{`${settlement.periodStartDate} to ${settlement.periodEndDate}`}</td>
                                    <td className="p-3 whitespace-nowrap">{settlement.totalSalesValue.toFixed(2)}</td>
                                    <td className="p-3 whitespace-nowrap">{settlement.finalMargin.toFixed(2)}</td>
                                    <td className="p-3 whitespace-nowrap font-bold">{settlement.settlementAmount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <p>No settlements found for this distributor.</p>}
        </div>
    );
};

// SettlementModal
const SettlementModal: React.FC<{ distributor: Customer, sales: Sale[], onSave: (settlement: DistributorSettlement, appliedExpenseIds: string[]) => void, onClose: () => void }> = ({ distributor, sales, onSave, onClose }) => {
    const { t } = useTranslation();
    const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
    const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
    
    const unsettledSales = useMemo(() => {
        return sales.filter(s => s.distributorId === distributor.id && !s.settlementId);
    }, [sales, distributor.id]);

    const unsettledExpenses = useMemo(() => {
        return db.getExpenses().filter(e => 
            e.category === ExpenseCategory.DistributorPayment &&
            e.distributorId === distributor.id && 
            !e.settlementId
        );
    }, [distributor.id]);

    const handleToggleSale = (saleId: string) => {
        setSelectedSaleIds(prev => prev.includes(saleId) ? prev.filter(id => id !== saleId) : [...prev, saleId]);
    };
    
    const handleToggleExpense = (expenseId: string) => {
        setSelectedExpenseIds(prev => prev.includes(expenseId) ? prev.filter(id => id !== expenseId) : [...prev, expenseId]);
    };

    const salesForSettlement = useMemo(() => {
        return unsettledSales.filter(s => selectedSaleIds.includes(s.id));
    }, [unsettledSales, selectedSaleIds]);

    const { totalAmountCollected, amountBilledToDistributor, finalMargin } = useMemo(() => {
        let collected = 0;
        let billed = 0;
        
        salesForSettlement.forEach(sale => {
            const salePaymentsTotal = sale.payments.reduce((sum, p) => sum + p.amount, 0);
            collected += salePaymentsTotal;
            
            const saleDistributorCost = sale.items.reduce((sum, item) => sum + ((item.costToDistributor || item.price) * item.quantity), 0);
            billed += saleDistributorCost;
        });

        const margin = collected - billed;
        return { totalAmountCollected: collected, amountBilledToDistributor: billed, finalMargin: margin };
    }, [salesForSettlement]);

    const totalAdjustments = useMemo(() => { // Advance payments
        return unsettledExpenses
            .filter(e => selectedExpenseIds.includes(e.id))
            .reduce((sum, e) => sum + e.amount, 0);
    }, [unsettledExpenses, selectedExpenseIds]);

    // Core logic update: Settle outstanding balance first
    const amountAfterAdvances = finalMargin - totalAdjustments;
    const appliedOutstandingBalance = Math.min(distributor.outstandingBalance, Math.max(0, amountAfterAdvances));
    const netSettlementAmount = amountAfterAdvances - appliedOutstandingBalance;
    const isPayable = netSettlementAmount >= 0;


    const handleConfirmSettlement = () => {
        if (selectedSaleIds.length === 0) return;
        
        const dates = salesForSettlement.map(s => new Date(s.date).getTime());
        const startDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
        const endDate = new Date(Math.max(...dates)).toISOString().split('T')[0];

        const newSettlement: DistributorSettlement = {
            id: `settle_${Date.now()}`,
            distributorId: distributor.id,
            periodStartDate: startDate,
            periodEndDate: endDate,
            settledOn: new Date().toISOString().split('T')[0],
            totalSalesValue: totalAmountCollected,
            totalDistributorValue: amountBilledToDistributor,
            finalMargin: finalMargin,
            adjustments: totalAdjustments,
            appliedOutstandingBalance: appliedOutstandingBalance,
            settlementAmount: netSettlementAmount,
            saleIds: selectedSaleIds,
        };
        onSave(newSettlement, selectedExpenseIds);
    };

    return (
         <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">New Settlement for {distributor.name}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><X size={20}/></button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium mb-2">Select Unsettled Sales:</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto border border-light-outline/50 dark:border-dark-outline/50 rounded-lg p-2">
                             {unsettledSales.length > 0 ? unsettledSales.map(sale => (
                                <label key={sale.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                                    <input type="checkbox" checked={selectedSaleIds.includes(sale.id)} onChange={() => handleToggleSale(sale.id)} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary"/>
                                    <span>{sale.invoiceNumber} - {sale.date} - ₹{sale.totalAmount.toFixed(2)}</span>
                                </label>
                            )) : <p className="p-4 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">No unsettled sales.</p>}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-medium mb-2">Apply Advance Payments:</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto border border-light-outline/50 dark:border-dark-outline/50 rounded-lg p-2">
                            {unsettledExpenses.length > 0 ? unsettledExpenses.map(exp => (
                                <label key={exp.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                                    <input type="checkbox" checked={selectedExpenseIds.includes(exp.id)} onChange={() => handleToggleExpense(exp.id)} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary"/>
                                    <span>{exp.title} - {exp.date} - ₹{exp.amount.toFixed(2)}</span>
                                </label>
                            )) : <p className="p-4 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">No advance payments found.</p>}
                        </div>
                    </div>

                </div>
                 <div className="mt-6 p-4 bg-black/5 dark:bg-white/5 rounded-lg space-y-2">
                    <div className="flex justify-between"><span className="text-light-text-secondary dark:text-dark-text-secondary">{t('distributors.settlement.collected')}:</span> <span className="font-semibold">₹{totalAmountCollected.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-light-text-secondary dark:text-dark-text-secondary">{t('distributors.settlement.billed')}:</span> <span className="font-semibold">₹{amountBilledToDistributor.toFixed(2)}</span></div>
                    <div className="border-t border-light-outline/50 dark:border-dark-outline/50 my-1"></div>
                    <div className="flex justify-between font-medium"><span className="text-light-text-secondary dark:text-dark-text-secondary">Margin from Sales:</span> <span className="font-semibold">₹{finalMargin.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-light-text-secondary dark:text-dark-text-secondary">Less Applied Advances:</span> <span className="font-semibold text-red-600 dark:text-red-400">- ₹{totalAdjustments.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-light-text-secondary dark:text-dark-text-secondary">Less Own Outstanding Balance:</span> <span className="font-semibold text-red-600 dark:text-red-400">- ₹{appliedOutstandingBalance.toFixed(2)}</span></div>
                    <div className="border-t-2 border-light-outline/50 dark:border-dark-outline/50 my-1"></div>
                    <div className="flex justify-between font-bold text-lg mt-2 pt-2">
                        <span>{isPayable ? 'Net Payable to Distributor' : 'Net Receivable from Distributor'}:</span> 
                        <span className={isPayable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                           ₹{Math.abs(netSettlementAmount).toFixed(2)}
                        </span>
                    </div>
                </div>
                 <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                    <button onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">{t('cancel')}</button>
                    <button onClick={handleConfirmSettlement} disabled={selectedSaleIds.length === 0} className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black disabled:opacity-50">Confirm & Settle</button>
                </div>
            </div>
        </div>
    );
};


export default Distributors;