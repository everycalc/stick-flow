import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../services/db';
import { PlusCircle, ShoppingCart, Eye, Download, Truck, CreditCard, Paperclip, Filter, Trash2, Phone, Star, Check, MessageSquare, Search, User, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from '../hooks/useTranslation';
import { Sale, Payment, Attachment, DispatchInfo, ItemType, StockMovementType, StockMovement, SaleItem, Product, Customer } from '../types';
import AttachmentManager from '../components/AttachmentManager';

const InvoiceEditorModal: React.FC<{
    onSave: (sale: Sale, newCustomer?: Customer | null) => void;
    onClose: () => void;
    customers: Customer[];
}> = ({ onSave, onClose, customers }) => {
    const { t } = useTranslation();
    const products = db.getProducts().filter(p => p.type === ItemType.FinishedGood && !p.isDeleted);
    const distributors = customers.filter(c => c.isDistributor);

    const [step, setStep] = useState<'customer' | 'invoice'>('customer');
    
    // Customer search state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ name: '', address: '', contact: '' });
    const [saveCustomer, setSaveCustomer] = useState(true);

    // Invoice state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<SaleItem[]>([]);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
    const [discountValue, setDiscountValue] = useState(0);
    const [taxRate, setTaxRate] = useState(0);
    const [deliveryCharges, setDeliveryCharges] = useState(0);
    const [dispatchDate, setDispatchDate] = useState(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [isPriority, setIsPriority] = useState(false);
    const [distributorId, setDistributorId] = useState<string | undefined>(undefined);
    
    // Payment state
    const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | 'partial' | 'advance'>('unpaid');
    const [amountPaid, setAmountPaid] = useState(0);
    const [paymentMode, setPaymentMode] = useState<'cash' | 'online' | 'cheque'>('cash');
    
    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        const lowerCaseQuery = searchQuery.toLowerCase();
        return customers.filter(c => 
            c.name.toLowerCase().includes(lowerCaseQuery) || 
            c.contact.includes(lowerCaseQuery) ||
            c.address?.toLowerCase().includes(lowerCaseQuery)
        );
    }, [searchQuery, customers]);

    const subTotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.price, 0), [items]);
    const discountAmount = useMemo(() => discountType === 'percentage' ? (subTotal * discountValue) / 100 : discountValue, [subTotal, discountType, discountValue]);
    const taxableAmount = subTotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const totalAmount = taxableAmount + taxAmount + deliveryCharges;

    useEffect(() => {
        if(paymentStatus === 'paid') setAmountPaid(totalAmount);
    }, [paymentStatus, totalAmount]);
    
    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        if (customer.affiliatedDistributorId) {
            setDistributorId(customer.affiliatedDistributorId);
        }
        setStep('invoice');
    };

    const handleCreateNewCustomer = () => {
        setNewCustomerData({ name: '', address: '', contact: '' });
        setIsCreatingNewCustomer(true);
        setSelectedCustomer(null);
        setStep('invoice');
    };
    
    const handleBackToSearch = () => {
        setStep('customer');
        setSelectedCustomer(null);
        setIsCreatingNewCustomer(false);
        setDistributorId(undefined);
    };

    const handleAddItem = () => setItems([...items, { productId: '', quantity: 1, price: 0, costToDistributor: 0 }]);
    const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));
    const handleItemChange = (index: number, field: keyof SaleItem, value: string | number) => {
        const newItems = [...items];
        const item = newItems[index];
        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            newItems[index] = { ...item, productId: value as string, price: product?.selling_price || 0, costToDistributor: product?.selling_price || 0 }; 
        } else {
            newItems[index] = { ...item, [field]: Number(value) };
        }
        setItems(newItems);
    };

    const handleSubmit = () => {
        let customerId: string;
        let customerToSave: Customer | null = null;
        
        if (selectedCustomer) {
            customerId = selectedCustomer.id;
        } else if (isCreatingNewCustomer) {
            if (!newCustomerData.name || !newCustomerData.contact) {
                alert("Please provide a name and contact for the new customer.");
                return;
            }
            customerId = `cust_${Date.now()}`;
            if (saveCustomer) {
                customerToSave = {
                    id: customerId,
                    name: newCustomerData.name,
                    contact: newCustomerData.contact,
                    address: newCustomerData.address,
                    outstandingBalance: 0, creditDays: 0, creditLimit: 0, isDistributor: false
                };
            }
        } else {
             alert("Please select or create a customer.");
             return;
        }

        if (items.length === 0 || items.some(i => !i.productId || i.quantity <= 0)) {
            alert("Please add at least one valid item.");
            return;
        }

        const payments: Payment[] = [];
        if (paymentStatus !== 'unpaid' && amountPaid > 0) {
            payments.push({ id: `pay_${Date.now()}`, amount: amountPaid, date, mode: paymentMode });
        }
        
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const finalPaymentStatus = totalPaid >= totalAmount ? 'paid' : (totalPaid > 0 ? paymentStatus : 'unpaid');

        const newSale: Sale = {
            id: `SALE${Date.now()}`,
            invoiceNumber: db.getNextInvoiceNumber(),
            customerId,
            date,
            items,
            subTotal,
            discount: { type: discountType, value: discountValue },
            tax: { rate: taxRate, amount: taxAmount },
            deliveryCharges,
            totalAmount,
            payments,
            paymentStatus: finalPaymentStatus,
            dispatchDate,
            isDispatched: false,
            isPriority,
            distributorId
        };
        onSave(newSale, customerToSave);
    };

    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{t('sales.create_invoice')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><X size={20}/></button>
                </div>

                {step === 'customer' ? (
                    <div className="flex flex-col h-full">
                        <div className="relative mb-4">
                           <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                           <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={inputClass + " pl-10"} placeholder={t('sales.search_customer_placeholder')} autoFocus/>
                        </div>
                        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                           {searchResults.map(cust => (
                               <button key={cust.id} onClick={() => handleCustomerSelect(cust)} className="w-full text-left flex items-center gap-3 p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                                   <User size={18} />
                                   <div>
                                       <p className="font-semibold">{cust.name}</p>
                                       <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{cust.contact} - {cust.address}</p>
                                   </div>
                               </button>
                           ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                            <button onClick={handleCreateNewCustomer} className="w-full bg-light-primary-container text-light-primary dark:bg-dark-primary-container dark:text-dark-primary font-semibold py-2.5 rounded-full">{t('sales.create_new_customer')}</button>
                        </div>
                    </div>
                ) : (
                <>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium">Customer:</p>
                                <p className="font-semibold">{selectedCustomer?.name || newCustomerData.name || 'New Customer'}</p>
                            </div>
                            <button onClick={handleBackToSearch} className="text-sm font-semibold text-light-primary dark:text-dark-primary hover:underline">Change</button>
                        </div>

                         {isCreatingNewCustomer && (
                             <div className="p-4 border border-light-outline dark:border-dark-outline rounded-lg space-y-3">
                                <h4 className="font-semibold">{t('sales.new_customer')}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input type="text" placeholder="Customer Name*" value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} className={inputClass} />
                                    <input type="tel" placeholder="Contact Number*" value={newCustomerData.contact} onChange={e => setNewCustomerData({...newCustomerData, contact: e.target.value})} className={inputClass} />
                                    <input type="text" placeholder="Customer Address" value={newCustomerData.address} onChange={e => setNewCustomerData({...newCustomerData, address: e.target.value})} className={inputClass} />
                                </div>
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={saveCustomer} onChange={e => setSaveCustomer(e.target.checked)} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary"/>{t('sales.save_customer_prompt')}</label>
                             </div>
                         )}
                        
                        <div className="space-y-2">
                            <h4 className="font-medium">Items</h4>
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg items-end">
                                    <div className={`col-span-12 ${distributorId ? 'sm:col-span-4' : 'sm:col-span-5'}`}>
                                        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">{t('sales.product')}</label>
                                        <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className={inputClass}>
                                            <option value="">Select Product</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-4 sm:col-span-2">
                                        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">{t('sales.quantity')}</label>
                                        <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', +e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="col-span-4 sm:col-span-2">
                                        <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">{t('sales.sale_price')}</label>
                                        <input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', +e.target.value)} className={inputClass} />
                                    </div>
                                    {distributorId && (
                                        <div className="col-span-4 sm:col-span-3">
                                            <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">{t('sales.distributor_price')}</label>
                                            <input type="number" value={item.costToDistributor} onChange={e => handleItemChange(index, 'costToDistributor', +e.target.value)} className={inputClass} />
                                        </div>
                                    )}
                                    <div className="col-span-2 sm:col-span-1">
                                        <button onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full flex justify-center items-center w-full"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={handleAddItem} className="text-sm font-semibold text-light-primary dark:text-dark-primary hover:underline">{t('calculator.add_ingredient')}</button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">{t('sales.select_distributor')}</label>
                            <select value={distributorId || ''} onChange={e => setDistributorId(e.target.value)} className={inputClass}>
                                <option value="">None</option>
                                {distributors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        
                        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div><label className="block text-sm font-medium mb-1">{t('sales.delivery_charges')}</label><input type="number" value={deliveryCharges} onChange={e => setDeliveryCharges(Number(e.target.value))} className={inputClass} /></div>
                            <div><label className="block text-sm font-medium mb-1">Discount</label><div className="flex"><input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} className={`${inputClass} rounded-r-none`} /><select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className={`${inputClass} rounded-l-none w-20`}><option value="fixed">₹</option><option value="percentage">%</option></select></div></div>
                            <div><label className="block text-sm font-medium mb-1">Tax Rate (%)</label><input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className={inputClass} /></div>
                            <div><label className="block text-sm font-medium mb-1">{t('sales.dispatch_date')}</label><input type="date" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} className={inputClass} /></div>
                        </div>

                        <div className="pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                             <h4 className="font-medium mb-2">{t('sales.payments')}</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div><label className="block text-sm font-medium mb-1">{t('sales.payment_status')}</label><select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as any)} className={inputClass}><option value="unpaid">{t('sales.status.unpaid')}</option><option value="paid">{t('sales.status.paid')}</option><option value="partial">{t('sales.status.partial')}</option><option value="advance">{t('sales.status.advance')}</option></select></div>
                                {(paymentStatus === 'partial' || paymentStatus === 'advance') && <div><label className="block text-sm font-medium mb-1">{t('sales.amount_paid')}</label><input type="number" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} className={inputClass}/></div>}
                                {(paymentStatus !== 'unpaid') && <div><label className="block text-sm font-medium mb-1">{t('sales.payment_mode')}</label><select value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)} className={inputClass}><option value="cash">Cash</option><option value="online">Online</option><option value="cheque">Cheque</option></select></div>}
                             </div>
                        </div>

                        <div className="text-right space-y-1 mt-4">
                            <p>Subtotal: ₹{subTotal.toFixed(2)}</p>
                            <p>Discount: - ₹{discountAmount.toFixed(2)}</p>
                            <p>Tax ({taxRate}%): + ₹{taxAmount.toFixed(2)}</p>
                            <p>Delivery: + ₹{deliveryCharges.toFixed(2)}</p>
                            <p className="font-bold text-lg">Grand Total: ₹{totalAmount.toFixed(2)}</p>
                        </div>
                        
                        <label className="flex items-center gap-2"><input type="checkbox" checked={isPriority} onChange={e => setIsPriority(e.target.checked)} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary"/>{t('sales.priority_order')}</label>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">{t('cancel')}</button>
                        <button type="button" onClick={handleSubmit} className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black">{t('save')}</button>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
};

const Sales: React.FC = () => {
    const { t } = useTranslation();
    const [sales, setSales] = useState<Sale[]>(db.getSales());
    const [customers, setCustomers] = useState<Customer[]>(db.getCustomers());
    const products = db.getProducts();

    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'unpaid' | 'not_dispatched'>('all');
    const [isInvoiceEditorOpen, setIsInvoiceEditorOpen] = useState(false);
    const [whatsAppModalState, setWhatsAppModalState] = useState<{ isOpen: boolean, sale: Sale | null }>({ isOpen: false, sale: null });

    const filteredSales = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        let filtered = sales;

        switch(activeFilter) {
            case 'today':
                filtered = sales.filter(s => s.date === todayStr);
                break;
            case 'unpaid':
                filtered = sales.filter(s => s.paymentStatus === 'unpaid' || s.paymentStatus === 'partial');
                break;
            case 'not_dispatched':
                 filtered = sales.filter(s => !s.isDispatched);
                break;
            default:
                 filtered = sales;
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activeFilter, sales]);

    const handleSaveSale = (newSale: Sale, newCustomer?: Customer | null) => {
        if(newCustomer) {
            const updatedCustomers = [...customers, newCustomer];
            setCustomers(updatedCustomers);
            db.setCustomers(updatedCustomers);
        }

        const currentProducts = db.getProducts();
        const updatedProducts = [...currentProducts];
        let stockOk = true;

        newSale.items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (productIndex > -1) {
                if (updatedProducts[productIndex].quantity >= item.quantity) {
                    updatedProducts[productIndex].quantity -= item.quantity;
                } else {
                    alert(`Not enough stock for ${updatedProducts[productIndex].name}. Available: ${updatedProducts[productIndex].quantity}, Required: ${item.quantity}`);
                    stockOk = false;
                }
            }
        });

        if (!stockOk) return;

        const updatedSales = [...sales, newSale];
        db.setSales(updatedSales);
        db.setProducts(updatedProducts);
        // db.setStockMovements(...) should be handled here too
        setSales(updatedSales);
        setIsInvoiceEditorOpen(false);
        alert(t('sales.invoice_saved_success'));
    };
    
    const handleMarkDispatched = (saleId: string) => {
        const updatedSales = sales.map(s => s.id === saleId ? { ...s, isDispatched: true } : s);
        setSales(updatedSales);
        db.setSales(updatedSales);
    };

    const getCustomerName = (customerId: string) => customers.find(c => c.id === customerId)?.name || 'Unknown';

    const getStatusChip = (status: 'paid' | 'unpaid' | 'partial' | 'advance') => {
        const styles = {
            paid: 'bg-green-500/20 text-green-800 dark:text-green-200',
            unpaid: 'bg-red-500/20 text-red-800 dark:text-red-200',
            partial: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-200',
            advance: 'bg-blue-500/20 text-blue-800 dark:text-blue-200'
        }
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{t(`sales.status.${status}`)}</span>;
    };
    
     const calculateTotalWeight = (items: SaleItem[]): string => {
        let totalWeightKg = 0;
        items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const unit = product.unit.toLowerCase();
                if (unit === 'kg' || unit === 'ltr') totalWeightKg += item.quantity;
                else if (unit === 'g' || unit === 'ml') totalWeightKg += item.quantity / 1000;
            }
        });
        return totalWeightKg > 0 ? `${totalWeightKg.toFixed(2)} kg` : '-';
    };

    const FilterButton: React.FC<{ label: string; filter: typeof activeFilter }> = ({ label, filter }) => (
        <button 
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${activeFilter === filter ? 'bg-light-primary text-white dark:bg-dark-primary dark:text-dark-background' : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'}`}
        >
            {label}
        </button>
    );

    return (
        <>
            <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                 <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold">{t('nav.sales')}</h2>
                    <button onClick={() => setIsInvoiceEditorOpen(true)} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition"><PlusCircle size={20} className="mr-2"/> {t('sales.create_invoice')}</button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <FilterButton label={t('sales.filter.all')} filter='all' />
                    <FilterButton label={t('sales.filter.today')} filter='today' />
                    <FilterButton label={t('sales.filter.unpaid')} filter='unpaid' />
                    <FilterButton label={t('sales.filter.not_dispatched')} filter='not_dispatched' />
                </div>
                 <div className="overflow-x-auto">
                    {filteredSales.length > 0 ? (
                        <table className="min-w-full text-sm">
                           <thead><tr className="border-b border-light-outline/50 dark:border-dark-outline/50">
                               <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider"></th>
                               <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Invoice</th>
                               <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Customer</th>
                               <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th>
                               <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Amount</th>
                               <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">{t('sales.total_weight')}</th>
                               <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Payment</th>
                               <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Dispatch</th>
                               <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                           </tr></thead>
                            <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                                {filteredSales.map(sale => {
                                    const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
                                    const dueBalance = sale.totalAmount - totalPaid;
                                    return (
                                    <tr key={sale.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                        <td className="p-3">{sale.isPriority && <Star size={16} className="text-yellow-500 fill-current"/>}</td>
                                        <td className="p-3 font-medium">{sale.invoiceNumber}</td>
                                        <td className="p-3">{getCustomerName(sale.customerId)}</td>
                                        <td className="p-3">{new Date(sale.date).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            ₹{sale.totalAmount.toFixed(2)}
                                            {dueBalance > 0 && sale.paymentStatus !== 'paid' && (
                                                <div className="text-xs text-red-600 dark:text-red-400">
                                                    Due: ₹{dueBalance.toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3">{calculateTotalWeight(sale.items)}</td>
                                        <td className="p-3">{getStatusChip(sale.paymentStatus)}</td>
                                        <td className="p-3">
                                            {sale.isDispatched ? <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><Check size={16}/> {t('sales.dispatched')}</span> : (
                                                <button onClick={() => handleMarkDispatched(sale.id)} className="text-blue-600 dark:text-blue-400 font-semibold">{t('sales.mark_dispatched')}</button>
                                            )}
                                        </td>
                                        <td className="p-3 space-x-1">
                                            <button onClick={() => setSelectedSale(sale)} title={t('sales.details')} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><Eye size={18}/></button>
                                            <button onClick={() => setWhatsAppModalState({ isOpen: true, sale: sale })} title={t('whatsapp.title')} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><MessageSquare size={18}/></button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-16"><ShoppingCart size={48} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/><p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">No sales records found.</p></div>
                    )}
                </div>
            </div>
            {selectedSale && <SaleDetailsModal sale={selectedSale} onClose={() => setSelectedSale(null)} onUpdate={(updatedSale) => {
                const updatedSales = sales.map(s => s.id === updatedSale.id ? updatedSale : s);
                setSales(updatedSales);
                db.setSales(updatedSales);
                setSelectedSale(updatedSale);
            }} />}
            {isInvoiceEditorOpen && <InvoiceEditorModal onSave={handleSaveSale} onClose={() => setIsInvoiceEditorOpen(false)} customers={customers}/>}
            {whatsAppModalState.isOpen && whatsAppModalState.sale && (
                <WhatsAppOptionsModal
                    sale={whatsAppModalState.sale}
                    customers={customers}
                    products={products}
                    onClose={() => setWhatsAppModalState({ isOpen: false, sale: null })}
                />
            )}
        </>
    );
};

const SaleDetailsModal: React.FC<{ sale: Sale; onClose: () => void; onUpdate: (updatedSale: Sale) => void }> = ({ sale, onClose, onUpdate }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('details');
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMode, setPaymentMode] = useState<'cash'|'online'|'cheque'>('cash');
    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";
    const customers = db.getCustomers();
    const getCustomerName = (customerId: string) => customers.find(c => c.id === customerId)?.name || 'Unknown';

    const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
    const dueBalance = sale.totalAmount - totalPaid;

    const handleAddPayment = () => {
        if (paymentAmount <= 0) return;
        const newPayment: Payment = { id: `pay_${Date.now()}`, amount: paymentAmount, date: new Date().toISOString().split('T')[0], mode: paymentMode };
        const updatedPayments = [...sale.payments, newPayment];
        const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const newStatus: Sale['paymentStatus'] = newTotalPaid >= sale.totalAmount ? 'paid' : 'partial';
        const updatedSale = { ...sale, payments: updatedPayments, paymentStatus: newStatus };
        onUpdate(updatedSale);
        setPaymentAmount(0);
    };
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-lg p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-semibold">{t('sales.invoice_details')}: {sale.invoiceNumber}</h3>
                 <div className="border-b border-light-outline/50 dark:border-dark-outline/50 mt-4">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('details')} className={`${activeTab === 'details' ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>{t('sales.details')}</button>
                        <button onClick={() => setActiveTab('payments')} className={`${activeTab === 'payments' ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>{t('sales.payments')}</button>
                    </nav>
                </div>
                <div className="flex-grow overflow-y-auto mt-4 pr-2">
                     {activeTab === 'details' && (
                         <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="font-medium text-light-text-secondary dark:text-dark-text-secondary">Customer:</span> <span>{getCustomerName(sale.customerId)}</span></div>
                            <div className="flex justify-between"><span className="font-medium text-light-text-secondary dark:text-dark-text-secondary">Date:</span> <span>{new Date(sale.date).toLocaleDateString()}</span></div>
                            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg space-y-2">
                                <div className="flex justify-between"><span className="text-light-text-secondary dark:text-dark-text-secondary">Subtotal:</span> <span>₹{sale.subTotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-light-text-secondary dark:text-dark-text-secondary">Discount:</span> <span>- ₹{(sale.discount.type === 'fixed' ? sale.discount.value : (sale.subTotal * sale.discount.value / 100)).toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-light-text-secondary dark:text-dark-text-secondary">Tax ({sale.tax.rate}%):</span> <span>+ ₹{sale.tax.amount.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-light-text-secondary dark:text-dark-text-secondary">Delivery:</span> <span>+ ₹{sale.deliveryCharges.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-light-outline/50 dark:border-dark-outline/50"><span>Total Amount:</span> <span>₹{sale.totalAmount.toFixed(2)}</span></div>
                            </div>
                             <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg space-y-2">
                                <div className="flex justify-between"><span>Total Paid:</span> <span className="font-semibold text-green-600 dark:text-green-400">₹{totalPaid.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold"><span>{t('sales.due_balance')}:</span> <span className="text-red-600 dark:text-red-400">₹{dueBalance.toFixed(2)}</span></div>
                            </div>
                        </div>
                     )}
                     {activeTab === 'payments' && (
                        <div>
                            <div className="space-y-2 mb-4">
                                {sale.payments.map(p => (<div key={p.id} className="flex justify-between p-2 rounded bg-black/5 dark:bg-white/5"><span>{new Date(p.date).toLocaleDateString()} via {p.mode}</span><span className="font-semibold">₹{p.amount.toFixed(2)}</span></div>))}
                                {!sale.payments.length && <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary py-4">No payments recorded.</p>}
                            </div>
                            <div className="p-4 border-t border-light-outline/50 dark:border-dark-outline/50 space-y-3">
                                <h5 className="font-medium">{t('sales.add_payment')}</h5>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" placeholder={t('sales.amount_paid')} value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className={inputClass} />
                                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)} className={inputClass}><option value="cash">Cash</option><option value="online">Online</option><option value="cheque">Cheque</option></select>
                                </div>
                                <button onClick={handleAddPayment} className="w-full bg-light-primary text-white dark:bg-dark-primary dark:text-black p-2 rounded-full font-semibold">{t('sales.add_payment')}</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end"><button onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">{t('close')}</button></div>
            </div>
        </div>
    );
}

const WhatsAppOptionsModal: React.FC<{ sale: Sale, customers: Customer[], products: Product[], onClose: () => void }> = ({ sale, customers, products, onClose }) => {
    const { t } = useTranslation();
    const customer = customers.find(c => c.id === sale.customerId);
    const distributor = sale.distributorId ? customers.find(c => c.id === sale.distributorId) : null;

    const [recipients, setRecipients] = useState({ customer: true, distributor: !!distributor });

    const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
    const dueBalance = sale.totalAmount - totalPaid;

    const messageTemplates: { key: string, title: string, condition: boolean, message: () => string }[] = [
        {
            key: 'invoice', title: t('whatsapp.invoice_confirmation'), condition: !sale.isDispatched,
            message: () => `Hi ${customer?.name},\nThank you for your order! Here is a summary of your invoice ${sale.invoiceNumber}:\n\n${sale.items.map(i => `- ${products.find(p => p.id === i.productId)?.name || 'Item'} x ${i.quantity}`).join('\n')}\n\nTotal Amount: ₹${sale.totalAmount.toFixed(2)}\n\nWe will notify you once it's dispatched.`
        },
        {
            key: 'dispatch', title: t('whatsapp.dispatch_notification'), condition: sale.isDispatched,
            message: () => `Hi ${customer?.name}, your order ${sale.invoiceNumber} has been dispatched. Thank you for your business!`
        },
        {
            key: 'reminder', title: t('whatsapp.payment_reminder'), condition: dueBalance > 0,
            message: () => `Hi ${customer?.name}, this is a friendly reminder that a payment of ₹${dueBalance.toFixed(2)} for invoice ${sale.invoiceNumber} is due. Thank you!`
        }
    ];

    const sendMessage = (message: string) => {
        if (recipients.customer && customer?.contact) {
            window.open(`https://wa.me/${customer.contact}?text=${encodeURIComponent(message)}`, '_blank');
        }
        if (recipients.distributor && distributor?.contact) {
            const distributorMessage = `FYI for your client ${customer?.name}:\n\n${message}`;
            window.open(`https://wa.me/${distributor.contact}?text=${encodeURIComponent(distributorMessage)}`, '_blank');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">{t('whatsapp.title')}</h3>
                {distributor && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">{t('whatsapp.recipient')}</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2"><input type="checkbox" checked={recipients.customer} onChange={e => setRecipients({...recipients, customer: e.target.checked})} />{t('whatsapp.customer')}</label>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={recipients.distributor} onChange={e => setRecipients({...recipients, distributor: e.target.checked})} />{t('whatsapp.distributor')}</label>
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    <label className="block text-sm font-medium">{t('whatsapp.select_message')}</label>
                    {messageTemplates.filter(t => t.condition).map(template => (
                        <button key={template.key} onClick={() => sendMessage(template.message())} className="w-full text-left p-3 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10">
                            {template.title}
                        </button>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">{t('cancel')}</button>
                </div>
            </div>
        </div>
    );
};

export default Sales;