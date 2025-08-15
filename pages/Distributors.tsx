import React, { useState, useMemo } from 'react';
import { db } from '../services/db';
import { useTranslation } from '../hooks/useTranslation';
import { User, Briefcase, ShoppingCart, FileText, CheckSquare, X, PlusCircle } from 'lucide-react';
import { Sale, Customer, DistributorSettlement } from '../types';
import CustomerEditorModal from '../components/CustomerEditorModal';

const Distributors: React.FC = () => {
    const { t } = useTranslation();
    const [sales, setSales] = useState(db.getSales());
    const [settlements, setSettlements] = useState(db.getDistributorSettlements());
    const [customers, setCustomers] = useState(db.getCustomers());
    const distributors = useMemo(() => customers.filter(c => c.isDistributor), [customers]);
    
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
    
    const handleSaveSettlement = (newSettlement: DistributorSettlement) => {
        // 1. Save the new settlement record
        const newSettlements = [...settlements, newSettlement];
        setSettlements(newSettlements);
        db.setDistributorSettlements(newSettlements);

        // 2. Update the settled sales records
        const updatedSales = sales.map(s => 
            newSettlement.saleIds.includes(s.id) ? { ...s, settlementId: newSettlement.id } : s
        );
        setSales(updatedSales);
        db.setSales(updatedSales);
        
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
                            <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">No distributors found.</p>
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
            ) : (
                <div className="text-center py-10">
                    <ShoppingCart size={40} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/>
                    <p className="mt-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">No sales recorded for this distributor.</p>
                </div>
            )}
        </div>
    )
}

const DistributorSettlementsTab: React.FC<{ distributor: Customer, sales: Sale[], settlements: DistributorSettlement[], onNewSettlement: () => void }> = ({ distributor, settlements, onNewSettlement }) => {
    const distributorSettlements = settlements.filter(s => s.distributorId === distributor.id);
    return (
        <div>
             <div className="flex justify-end mb-4">
                <button onClick={onNewSettlement} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                    <PlusCircle size={20} className="mr-2"/> Create New Settlement
                </button>
            </div>
            {distributorSettlements.length > 0 ? (
                <div className="space-y-4">
                    {distributorSettlements.map(settlement => (
                        <div key={settlement.id} className="p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                            <p className="font-semibold">Settlement ID: {settlement.id}</p>
                            <p className="text-sm">Period: {settlement.periodStartDate} to {settlement.periodEndDate}</p>
                            <p className="text-sm">Settled On: {new Date(settlement.settledOn).toLocaleDateString()}</p>
                            <p className="font-bold text-lg mt-2">Settlement Amount: ₹{settlement.settlementAmount.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <FileText size={40} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/>
                    <p className="mt-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">No settlements found for this distributor.</p>
                </div>
            )}
        </div>
    )
}

const SettlementModal: React.FC<{ distributor: Customer, sales: Sale[], onSave: (settlement: DistributorSettlement) => void, onClose: () => void }> = ({ distributor, sales, onSave, onClose }) => {
    const { t } = useTranslation();
    const today = new Date();
    const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstOfLastMonth);
    const [endDate, setEndDate] = useState(endOfLastMonth);
    const [adjustments, setAdjustments] = useState(0);

    const unsettledSales = useMemo(() => {
        return sales.filter(s => 
            s.distributorId === distributor.id && 
            !s.settlementId && 
            s.date >= startDate && 
            s.date <= endDate
        );
    }, [sales, distributor.id, startDate, endDate]);

    const calculations = useMemo(() => {
        const totalCustomerSubTotal = unsettledSales.reduce((sum, sale) => sum + sale.subTotal, 0);
        const totalDistributorCost = unsettledSales.reduce((sum, sale) => {
            return sum + sale.items.reduce((itemSum, item) => itemSum + (item.costToDistributor || item.price) * item.quantity, 0)
        }, 0);

        const finalMargin = totalCustomerSubTotal - totalDistributorCost;
        const settlementAmount = finalMargin - adjustments;
        return { totalCustomerSubTotal, totalDistributorCost, finalMargin, settlementAmount };
    }, [unsettledSales, adjustments]);

    const handleSave = () => {
        if (unsettledSales.length === 0) return alert("No sales to settle in this period.");
        
        const newSettlement: DistributorSettlement = {
            id: `settle_${Date.now()}`,
            distributorId: distributor.id,
            periodStartDate: startDate,
            periodEndDate: endDate,
            settledOn: new Date().toISOString(),
            saleIds: unsettledSales.map(s => s.id),
            totalSalesValue: calculations.totalCustomerSubTotal,
            totalDistributorValue: calculations.totalDistributorCost,
            finalMargin: calculations.finalMargin,
            adjustments: adjustments,
            settlementAmount: calculations.settlementAmount
        };

        onSave(newSettlement);
    };
    
    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Create Settlement for {distributor.name}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><X size={20}/></button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} /></div>
                        <div><label className="text-sm">End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} /></div>
                    </div>
                    <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg space-y-2">
                        <p className="text-sm">Found <span className="font-bold">{unsettledSales.length}</span> unsettled sale(s) in this period.</p>
                        <div className="flex justify-between"><span className="text-light-text-secondary dark:text-dark-text-secondary">{t('distributors.settlement.customer_subtotal')}:</span> <span>₹{calculations.totalCustomerSubTotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-light-text-secondary dark:text-dark-text-secondary">{t('distributors.settlement.distributor_cost')}:</span> <span>- ₹{calculations.totalDistributorCost.toFixed(2)}</span></div>
                        <div className="flex justify-between font-semibold border-t border-light-outline/50 dark:border-dark-outline/50 pt-2 mt-2"><span className="text-light-text-secondary dark:text-dark-text-secondary">{t('distributors.settlement.gross_margin')}:</span> <span>₹{calculations.finalMargin.toFixed(2)}</span></div>
                    </div>
                    <div>
                        <label className="text-sm">Adjustments / Discounts (deducted from margin)</label>
                        <input type="number" value={adjustments} onChange={e => setAdjustments(Number(e.target.value))} className={inputClass} />
                    </div>
                     <div className="font-bold text-lg text-right">
                        {t('distributors.settlement.payout')}: ₹{calculations.settlementAmount.toFixed(2)}
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                    <button onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black">Confirm & Settle</button>
                </div>
            </div>
        </div>
    )
}

export default Distributors;