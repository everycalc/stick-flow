import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { db } from '../services/db';
import { Customer, Product, Sale } from '../types';

const Reports: React.FC = () => {
    const products = db.getProducts();
    const customers = db.getCustomers();
    const sales = db.getSales();

    const salesChartData = db.getSales().map(sale => ({ name: sale.date, sales: sale.totalAmount }));

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const getCustomerLedger = () => {
        if (!selectedCustomer) return [];
        const customerSales = sales.filter(s => s.customerId === selectedCustomer.id);
        const ledger: {date: string, particulars: string, debit: number, credit: number}[] = [];

        customerSales.forEach(sale => {
            ledger.push({ date: sale.date, particulars: `Invoice ${sale.invoiceNumber}`, debit: sale.totalAmount, credit: 0 });
            sale.payments.forEach(payment => {
                ledger.push({ date: payment.date, particulars: `Payment via ${payment.mode}`, debit: 0, credit: payment.amount });
            });
        });
        
        return ledger.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return (
        <div className="space-y-6">
            <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Sales Report</h2>
                <div className="w-full h-96">
                    <ResponsiveContainer>
                        <BarChart data={salesChartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)"/>
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'currentColor' }} />
                            <YAxis tick={{ fontSize: 12, fill: 'currentColor' }}/>
                            <Tooltip contentStyle={{ backgroundColor: '#2c2b2f', color: '#e6e1e5', fontSize: '12px', borderRadius: '0.5rem', border: '1px solid #49454f' }}/>
                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                            <Bar dataKey="sales" fill="url(#colorUv)" />
                             <defs>
                                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#d0bcff" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#6750a4" stopOpacity={0.8}/>
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                 <h2 className="text-xl font-semibold mb-4">Stock Valuation Report</h2>
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead><tr className="border-b border-light-outline/50 dark:border-dark-outline/50"><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Product</th><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Quantity</th><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Purchase Price</th><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Value</th></tr></thead>
                        <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                            {products.map(p => <tr key={p.id}><td className="p-3 font-medium">{p.name}</td><td className="p-3">{p.quantity} {p.unit}</td><td className="p-3">{(p.last_purchase_price || 0).toFixed(2)}</td><td className="p-3 font-semibold">{(p.quantity * (p.last_purchase_price || 0)).toFixed(2)}</td></tr>)}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-light-outline dark:border-dark-outline"><td colSpan={3} className="p-3 text-right font-bold">Total Stock Value</td><td className="p-3 font-bold text-lg">{products.reduce((acc, p) => acc + (p.quantity * (p.last_purchase_price || 0)), 0).toFixed(2)}</td></tr>
                        </tfoot>
                    </table>
                 </div>
            </div>

            <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                 <h2 className="text-xl font-semibold mb-4">Customer Payment Ledger</h2>
                 <div className="flex flex-wrap items-center gap-4 mb-4">
                     <select onChange={e => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)} className="flex-grow rounded-lg border border-light-outline dark:border-dark-outline bg-transparent p-2.5 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none">
                         <option value="">Select Customer</option>
                         {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead><tr className="border-b border-light-outline/50 dark:border-dark-outline/50"><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Date</th><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Particulars</th><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Debit</th><th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Credit</th></tr></thead>
                        <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                            {getCustomerLedger().map((item, index) => <tr key={index}><td className="p-3">{new Date(item.date).toLocaleDateString()}</td><td className="p-3">{item.particulars}</td><td className="p-3">{item.debit > 0 ? item.debit.toFixed(2) : '-'}</td><td className="p-3">{item.credit > 0 ? item.credit.toFixed(2) : '-'}</td></tr>)}
                        </tbody>
                        <tfoot>
                             <tr className="border-t-2 border-light-outline dark:border-dark-outline"><td colSpan={2} className="p-3 text-right font-bold">Outstanding Balance</td><td colSpan={2} className="p-3 font-bold text-lg text-red-600 dark:text-red-400">{selectedCustomer?.outstandingBalance.toFixed(2)}</td></tr>
                        </tfoot>
                    </table>
                 </div>
            </div>

        </div>
    );
};

export default Reports;