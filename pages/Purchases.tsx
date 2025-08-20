import React, { useState, useMemo } from 'react';
import { db } from '../services/db';
import { PurchaseOrder, Supplier, Product, StockMovementType } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { PlusCircle, ShoppingCart, Eye, Download, MessageSquare, Trash2, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// PurchaseOrderEditorModal Component
const PurchaseOrderEditorModal: React.FC<{
    order: PurchaseOrder | null;
    onSave: (order: PurchaseOrder) => void;
    onClose: () => void;
}> = ({ order, onSave, onClose }) => {
    const { t } = useTranslation();
    const suppliers = db.getSuppliers();
    const products = db.getProducts().filter(p => p.type === 'raw_material');
    
    const [supplierId, setSupplierId] = useState(order?.supplierId || '');
    const [items, setItems] = useState(order?.items || []);
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(order?.expectedDeliveryDate || new Date().toISOString().split('T')[0]);

    const availableProducts = useMemo(() => {
        if (!supplierId) {
            return [];
        }
        return products.filter(p => p.linked_supplier_ids.includes(supplierId));
    }, [supplierId, products]);

    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1, price: 0 }]);
    };
    
    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...items];
        const item = newItems[index];

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            newItems[index] = { ...item, productId: value as string, price: product?.last_purchase_price || 0 };
        } else if (field === 'quantity') {
            newItems[index] = { ...item, quantity: Number(value) };
        } else if (field === 'price') {
            newItems[index] = { ...item, price: Number(value) };
        }
        
        setItems(newItems);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const handleSubmit = () => {
        if (!supplierId || items.length === 0) return alert("Please select a supplier and add at least one item.");

        onSave({
            id: order?.id || db.getNextPurchaseOrderNumber(),
            supplierId,
            items,
            expectedDeliveryDate,
            totalAmount,
            orderDate: order?.orderDate || new Date().toISOString().split('T')[0],
            status: order?.status || 'ordered',
        });
    };

    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-semibold mb-4">{order ? t('purchases.po_details') : t('purchases.create_po')}</h3>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Supplier</label>
                            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={inputClass}>
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Expected Delivery</label>
                            <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className={inputClass} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h4 className="font-medium">Items</h4>
                        {items.map((item, index) => {
                             const selectedProduct = products.find(p => p.id === item.productId);
                            return (
                                <div key={index} className="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                                    <select 
                                        value={item.productId} 
                                        onChange={e => handleItemChange(index, 'productId', e.target.value)} 
                                        className={`${inputClass} flex-grow`}
                                        disabled={!supplierId}
                                    >
                                        <option value="">{supplierId ? 'Select Product' : 'Select a supplier first'}</option>
                                        {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <div className="relative flex-shrink-0 w-32">
                                        <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', +e.target.value)} className={inputClass + " pr-10"} />
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-light-text-secondary dark:text-dark-text-secondary">{selectedProduct?.unit}</span>
                                    </div>
                                    <input type="number" placeholder="Price" value={item.price} onChange={e => handleItemChange(index, 'price', +e.target.value)} className={`${inputClass} flex-shrink-0 w-28`} />
                                    <button onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full flex-shrink-0"><Trash2 size={16}/></button>
                                </div>
                            )
                        })}
                         <button onClick={handleAddItem} disabled={!supplierId} className="text-sm font-semibold text-light-primary dark:text-dark-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed">{t('calculator.add_ingredient')}</button>
                    </div>

                    <div className="text-right font-bold text-lg">Total: {totalAmount.toFixed(2)}</div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">{t('cancel')}</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

const PurchaseOrderWhatsAppModal: React.FC<{
    order: PurchaseOrder;
    onClose: () => void;
}> = ({ order, onClose }) => {
    const { t } = useTranslation();
    const supplier = db.getSuppliers().find(s => s.id === order.supplierId);
    const products = db.getProducts();

    const sendMessage = (type: 'initial' | 'follow_up') => {
        if (!supplier) return;

        let message = '';
        if (type === 'initial') {
            const itemsList = order.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return `- ${product?.name}: ${item.quantity} ${product?.unit}`;
            }).join('\n');
            message = `Hi ${supplier.company_name},\nPlease book the following order:\n\n${itemsList}\n\nExpected Delivery: ${order.expectedDeliveryDate}\nPO Ref: ${order.id}\n\nThank you,\n${db.getCompanyName()}`;
        } else {
            message = `Hi ${supplier.company_name},\nThis is a follow-up regarding PO ${order.id} placed on ${order.orderDate}. Could you please provide an update on the dispatch status?\n\nThank you.`;
        }
        
        window.open(`https://wa.me/${supplier.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-md">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{t('purchases.whatsapp.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><X size={20}/></button>
                </div>
                <div className="space-y-2">
                    <button onClick={() => sendMessage('initial')} className="w-full text-left p-3 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10">
                        {t('purchases.whatsapp.initial_order')}
                    </button>
                    <button onClick={() => sendMessage('follow_up')} className="w-full text-left p-3 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10">
                        {t('purchases.whatsapp.follow_up')}
                    </button>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">{t('cancel')}</button>
                </div>
            </div>
        </div>
    );
};


const Purchases: React.FC = () => {
    const { t } = useTranslation();
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(db.getPurchaseOrders());
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [receiptQuantities, setReceiptQuantities] = useState<Record<string, number>>({});
    const [isPOModalOpen, setIsPOModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

    const suppliers = db.getSuppliers();
    const products = db.getProducts();

    const getSupplier = (supplierId: string): Supplier | undefined => suppliers.find(s => s.id === supplierId);

    const getStatusChip = (status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled') => {
        const styles = {
            draft: 'bg-gray-500/20 text-gray-800 dark:text-gray-300',
            ordered: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-200',
            partially_received: 'bg-blue-500/20 text-blue-800 dark:text-blue-200',
            received: 'bg-green-500/20 text-green-800 dark:text-green-200',
            cancelled: 'bg-red-500/20 text-red-800 dark:text-red-300',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status.replace('_', ' ').toUpperCase()}</span>;
    };
    
    const handleDownloadPdf = (order: PurchaseOrder) => {
        const doc = new jsPDF();
        const supplier = getSupplier(order.supplierId);

        doc.setFontSize(20);
        doc.text("Purchase Order", 14, 22);
        doc.setFontSize(12);
        doc.text(`PO #: ${order.id}`, 14, 32);
        doc.text(`Order Date: ${order.orderDate}`, 14, 38);

        doc.text(`Supplier:`, 14, 48);
        doc.text(supplier?.company_name || '', 14, 54);
        doc.text(supplier?.contact_person || '', 14, 60);

        const tableColumn = ["Product", "Quantity", "Price", "Total"];
        const tableRows: (string|number)[][] = [];

        order.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            const row = [
                product?.name || 'Unknown', 
                `${item.quantity} ${product?.unit || ''}`,
                item.price.toFixed(2), 
                (item.quantity * item.price).toFixed(2)
            ];
            tableRows.push(row);
        });

        (doc as any).autoTable({ head: [tableColumn], body: tableRows, startY: 70 });
        const finalY = (doc as any).lastAutoTable.finalY;
        doc.text(`Total Amount: ${order.totalAmount.toFixed(2)}`, 14, finalY + 10);
        doc.save(`PO_${order.id}.pdf`);
    };

    const openWhatsAppModal = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsWhatsAppModalOpen(true);
    };

    const openReceiptModal = (order: PurchaseOrder) => {
        const initialQtys = order.items.reduce((acc, item) => {
            acc[item.productId] = item.quantity; // Pre-fill with ordered quantity
            return acc;
        }, {} as Record<string, number>);
        setReceiptQuantities(initialQtys);
        setSelectedOrder(order);
        setIsReceiptModalOpen(true);
    };

    const handleConfirmReceipt = () => {
        if (!selectedOrder) return;
        
        const updatedProducts = [...db.getProducts()];
        const newStockMovements = [...db.getStockMovements()];

        Object.entries(receiptQuantities).forEach(([productId, receivedQty]) => {
            const productIndex = updatedProducts.findIndex(p => p.id === productId);
            if (productIndex > -1) {
                const poItem = selectedOrder.items.find(i => i.productId === productId);
                updatedProducts[productIndex].quantity += receivedQty;
                if(poItem) {
                   updatedProducts[productIndex].last_purchase_price = poItem.price;
                }

                newStockMovements.push({
                    id: `sm_${Date.now()}_${productId}`,
                    productId,
                    date: new Date().toISOString(),
                    type: StockMovementType.Purchase,
                    quantityChange: receivedQty,
                    relatedId: selectedOrder.id,
                });
            }
        });
        
        db.setProducts(updatedProducts);
        db.setStockMovements(newStockMovements);

        const updatedOrder = { ...selectedOrder, status: 'received' as const };
        const updatedPOs = purchaseOrders.map(po => po.id === updatedOrder.id ? updatedOrder : po);
        setPurchaseOrders(updatedPOs);
        db.setPurchaseOrders(updatedPOs);

        setIsReceiptModalOpen(false);
        setSelectedOrder(null);
    };

    const handleSaveOrder = (order: PurchaseOrder) => {
        const exists = purchaseOrders.some(p => p.id === order.id);
        const updatedOrders = exists
            ? purchaseOrders.map(p => p.id === order.id ? order : p)
            : [...purchaseOrders, order];
        
        setPurchaseOrders(updatedOrders);
        db.setPurchaseOrders(updatedOrders);
        setIsPOModalOpen(false);
    };


    return (
        <>
            <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">{t('purchases.title')}</h2>
                    <button onClick={() => setIsPOModalOpen(true)} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                        <PlusCircle size={20} className="mr-2"/> {t('purchases.create_po')}
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    {purchaseOrders.length > 0 ? (
                        <table className="min-w-full">
                           <thead>
                                <tr className="border-b border-light-outline/50 dark:border-dark-outline/50">
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">PO #</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Supplier</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Amount</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                                {purchaseOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                        <td className="p-3 whitespace-nowrap font-medium">{order.id}</td>
                                        <td className="p-3 whitespace-nowrap">{getSupplier(order.supplierId)?.company_name}</td>
                                        <td className="p-3 whitespace-nowrap">{order.totalAmount.toFixed(2)}</td>
                                        <td className="p-3 whitespace-nowrap">{getStatusChip(order.status)}</td>
                                        <td className="p-3 whitespace-nowrap space-x-1">
                                            <button onClick={() => setSelectedOrder(order)} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" title={t('sales.details')}><Eye size={18}/></button>
                                            <button onClick={() => openWhatsAppModal(order)} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" title={t('purchases.generate_whatsapp')}><MessageSquare size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-16"><ShoppingCart size={48} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/><p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">No purchase orders found.</p></div>
                    )}
                </div>
            </div>

            {isPOModalOpen && (
                <PurchaseOrderEditorModal 
                    order={null} 
                    onSave={handleSaveOrder} 
                    onClose={() => setIsPOModalOpen(false)} 
                />
            )}
             {isWhatsAppModalOpen && selectedOrder && (
                <PurchaseOrderWhatsAppModal
                    order={selectedOrder}
                    onClose={() => setIsWhatsAppModalOpen(false)}
                />
            )}

            {selectedOrder && !isReceiptModalOpen && !isWhatsAppModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-lg p-6 w-full max-w-2xl">
                        <h3 className="text-lg font-semibold">{t('purchases.po_details')}: {selectedOrder.id}</h3>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Supplier: {getSupplier(selectedOrder.supplierId)?.company_name}</p>
                        
                        <div className="my-4 overflow-y-auto max-h-64 rounded-xl border border-light-outline/50 dark:border-dark-outline/50">
                             <table className="min-w-full">
                                <thead className="bg-black/5 dark:bg-white/5"><tr><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Product</th><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Qty</th><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Price</th><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Total</th></tr></thead>
                                <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">{selectedOrder.items.map((item, index) => { const product = products.find(p => p.id === item.productId); return (<tr key={index}><td className="p-3">{product?.name}</td><td className="p-3">{item.quantity} {product?.unit || ''}</td><td className="p-3">{item.price.toFixed(2)}</td><td className="p-3">{(item.quantity * item.price).toFixed(2)}</td></tr>)})}</tbody>
                             </table>
                        </div>
                        <p className="text-right font-bold text-xl">Total: {selectedOrder.totalAmount.toFixed(2)}</p>

                        <div className="mt-8 flex flex-wrap justify-between items-center gap-4">
                             <div className="flex gap-2">
                                <button onClick={() => handleDownloadPdf(selectedOrder)} className="flex items-center bg-blue-500/20 text-blue-700 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-500/30 transition"><Download size={18} className="mr-2"/> Download PO</button>
                             </div>
                             <div>
                                <button onClick={() => setSelectedOrder(null)} className="px-5 py-2 mr-2 text-sm font-semibold rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition">Close</button>
                                {selectedOrder.status !== 'received' && (
                                <button onClick={() => openReceiptModal(selectedOrder)} className="bg-light-primary text-white dark:bg-dark-primary dark:text-black px-5 py-2 text-sm font-semibold rounded-full shadow-sm hover:opacity-90 transition">{t('purchases.mark_received')}</button>
                                )}
                             </div>
                        </div>
                    </div>
                </div>
            )}
            {isReceiptModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-lg p-6 w-full max-w-xl">
                        <h3 className="text-lg font-semibold">{t('purchases.confirm_receipt')} for PO #{selectedOrder.id}</h3>
                        <div className="my-4 overflow-y-auto max-h-72">
                            {selectedOrder.items.map(item => {
                                const product = products.find(p => p.id === item.productId);
                                return (
                                    <div key={item.productId} className="grid grid-cols-3 items-center gap-4 py-2 border-b border-light-outline/50 dark:border-dark-outline/50">
                                        <span className="font-medium col-span-2">{product?.name} ({item.quantity} {product?.unit || ''})</span>
                                        <div className="col-span-1">
                                            <label className="text-xs">{t('purchases.qty_received')}</label>
                                            <input type="number" value={receiptQuantities[item.productId] || ''} onChange={e => setReceiptQuantities({...receiptQuantities, [item.productId]: +e.target.value})} className="block w-full rounded-lg border border-light-outline dark:border-dark-outline bg-transparent p-2 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"/>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                         <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setIsReceiptModalOpen(false)} className="px-5 py-2 text-sm font-semibold rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition">{t('cancel')}</button>
                            <button onClick={handleConfirmReceipt} className="bg-light-primary text-white dark:bg-dark-primary dark:text-black px-5 py-2 text-sm font-semibold rounded-full shadow-sm hover:opacity-90 transition">{t('confirm')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Purchases;