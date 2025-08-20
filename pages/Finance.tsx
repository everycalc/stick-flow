import React, { useState, useMemo } from 'react';
import { db } from '../services/db';
import { Expense, Sale, ProductionRun, Product, Recipe, ItemType, ExpenseCategory, PurchaseOrder } from '../types';
import { DollarSign, TrendingUp, TrendingDown, BarChart, FileText, PlusCircle, ChevronsRight, Factory, Users, ShoppingCart } from 'lucide-react';
import ExpenseEditorModal from '../components/ExpenseEditorModal';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-light-surface dark:bg-dark-surface p-5 rounded-2xl shadow-md">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold text-light-text-secondary dark:text-dark-text-secondary">{title}</h3>
            <div className={`p-2 rounded-full ${color}`}>
                {icon}
            </div>
        </div>
        <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
);

const Finance: React.FC = () => {
    const [expenses, setExpenses] = useState(db.getExpenses());
    const [period, setPeriod] = useState('this_month');
    
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        let start = new Date();
        let end = new Date();
        
        if (period === 'this_month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (period === 'last_month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (period === 'this_year') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
        }

        return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
    }, [period]);

    const filteredData = useMemo(() => {
        const sales = db.getSales().filter(s => s.date >= startDate && s.date <= endDate);
        const productionRuns = db.getProductionRuns().filter(p => p.status === 'completed' && p.completedAt && p.completedAt >= startDate && p.completedAt <= endDate);
        const filteredExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate);
        const purchases = db.getPurchaseOrders().filter(p => p.orderDate >= startDate && p.orderDate <= endDate && p.status === 'received');
        return { sales, productionRuns, filteredExpenses, purchases };
    }, [startDate, endDate, expenses]);

    const products = useMemo(() => db.getProducts(), []);
    const recipes = useMemo(() => db.getRecipes(), []);

    const calculations = useMemo(() => {
        const totalRevenue = filteredData.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

        let totalCOGS = 0;
        for (const sale of filteredData.sales) {
            for (const saleItem of sale.items) {
                const finishedGood = products.find(p => p.id === saleItem.productId);
                if (!finishedGood || finishedGood.type !== ItemType.FinishedGood) continue;

                const recipe = recipes.find(r => r.finishedGoodId === finishedGood.id);
                if (!recipe) continue;

                let costOfOneUnitFG = 0;
                for (const recipeItem of recipe.items) {
                    const rawMaterial = products.find(p => p.id === recipeItem.rawMaterialId);
                    if (!rawMaterial || typeof rawMaterial.last_purchase_price !== 'number') continue;

                    let rmCostPerKg = 0;
                    const unit = rawMaterial.unit.toLowerCase();
                    if (['kg', 'ltr'].includes(unit)) rmCostPerKg = rawMaterial.last_purchase_price;
                    else if (['g', 'ml'].includes(unit)) rmCostPerKg = rawMaterial.last_purchase_price * 1000;
                    
                    if (rmCostPerKg > 0) {
                        costOfOneUnitFG += recipeItem.quantityPerUnit * rmCostPerKg;
                    }
                }
                totalCOGS += costOfOneUnitFG * saleItem.quantity;
            }
        }

        const grossProfit = totalRevenue - totalCOGS;
        const operatingExpenses = filteredData.filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netProfit = grossProfit - operatingExpenses;

        const totalPurchases = filteredData.purchases.reduce((sum, p) => sum + p.totalAmount, 0);

        const totalSalaryExpense = filteredData.filteredExpenses
            .filter(e => e.category === ExpenseCategory.Salaries)
            .reduce((sum, exp) => sum + exp.amount, 0);

        let totalProductionKg = 0;
        for (const run of filteredData.productionRuns) {
            const product = products.find(p => p.id === run.productId);
            if (product) {
                const unit = product.unit.toLowerCase();
                if (unit === 'kg') totalProductionKg += run.producedQuantity;
                else if (unit === 'g') totalProductionKg += run.producedQuantity / 1000;
            }
        }
        
        const laborCostPerKg = totalProductionKg > 0 ? totalSalaryExpense / totalProductionKg : 0;

        return { totalRevenue, totalCOGS, grossProfit, operatingExpenses, netProfit, totalSalaryExpense, totalProductionKg, laborCostPerKg, totalPurchases };
    }, [filteredData, products, recipes]);

    const handleSaveExpense = (expense: Expense) => {
        // Save expense first
        const isNew = !expenses.some(e => e.id === expense.id);
        const updatedExpenses = isNew
            ? [...expenses, expense]
            : expenses.map(e => e.id === expense.id ? expense : e);
        setExpenses(updatedExpenses);
        db.setExpenses(updatedExpenses);
        
        // If it's a distributor payment, update their pending payment balance
        if (expense.category === ExpenseCategory.DistributorPayment && expense.distributorId) {
            const customers = db.getCustomers();
            const customerIndex = customers.findIndex(c => c.id === expense.distributorId);
            if (customerIndex > -1) {
                customers[customerIndex].pendingPayment = Math.max(0, customers[customerIndex].pendingPayment - expense.amount);
                db.setCustomers(customers);
            }
        }

        setEditingExpense(null);
        setIsExpenseModalOpen(false);
    };
    
    const openExpenseModal = (expense: Expense | null = null) => {
        setEditingExpense(expense);
        setIsExpenseModalOpen(true);
    };

    return (
        <>
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">Financial Overview</h1>
                <div>
                    <select value={period} onChange={e => setPeriod(e.target.value)} className="rounded-lg border border-light-outline dark:border-dark-outline bg-light-surface dark:bg-dark-surface p-2.5 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none">
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                        <option value="this_year">This Year</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={`₹${calculations.totalRevenue.toLocaleString()}`} icon={<TrendingUp size={22} />} color="bg-green-500/20 text-green-700 dark:text-green-300"/>
                <StatCard title="Total Purchases" value={`₹${calculations.totalPurchases.toLocaleString()}`} icon={<ShoppingCart size={22} />} color="bg-blue-500/20 text-blue-700 dark:text-blue-300"/>
                <StatCard title="Operating Expenses" value={`₹${calculations.operatingExpenses.toLocaleString()}`} icon={<FileText size={22} />} color="bg-red-500/20 text-red-700 dark:text-red-300"/>
                <StatCard title="Net Profit" value={`₹${calculations.netProfit.toLocaleString()}`} icon={<BarChart size={22} />} color="bg-purple-500/20 text-purple-700 dark:text-purple-300"/>
            </div>

            <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Profitability Analysis</h2>
                 <div className="space-y-2 text-lg p-4 bg-black/5 dark:bg-white/5 rounded-xl">
                    <div className="flex justify-between items-center">
                        <span className="text-light-text-secondary dark:text-dark-text-secondary">Total Revenue</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">₹{calculations.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-light-text-secondary dark:text-dark-text-secondary">- Cost of Goods Sold</span>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">₹{calculations.totalCOGS.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="border-t border-light-outline/50 dark:border-dark-outline/50 my-2"></div>
                    <div className="flex justify-between items-center font-bold text-xl">
                        <span>= Gross Profit</span>
                        <span className="text-blue-600 dark:text-blue-400">₹{calculations.grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                     <div className="flex justify-between items-center pt-4">
                        <span className="text-light-text-secondary dark:text-dark-text-secondary">- Operating Expenses</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">₹{calculations.operatingExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="border-t border-light-outline/50 dark:border-dark-outline/50 my-2"></div>
                    <div className="flex justify-between items-center font-bold text-2xl">
                        <span>= Net Profit</span>
                        <span className="text-purple-600 dark:text-purple-400">₹{calculations.netProfit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Labor Cost Analysis</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-black/5 dark:bg-white/5 rounded-lg"><span className="font-medium">Total Production (Kg)</span><span className="font-bold text-lg">{calculations.totalProductionKg.toFixed(2)} Kg</span></div>
                        <div className="flex justify-between items-center p-3 bg-black/5 dark:bg-white/5 rounded-lg"><span className="font-medium">Total Salary Expense</span><span className="font-bold text-lg">₹{calculations.totalSalaryExpense.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center p-3 bg-light-primary-container dark:bg-dark-primary-container rounded-lg"><span className="font-semibold">Labor Cost / Kg</span><span className="font-bold text-xl">₹{calculations.laborCostPerKg.toFixed(2)}</span></div>
                    </div>
                </div>

                <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Expense Management</h2>
                        <button onClick={() => openExpenseModal()} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                            <PlusCircle size={20} className="mr-2"/> Add Expense
                        </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {filteredData.filteredExpenses.length > 0 ? filteredData.filteredExpenses.map(exp => (
                            <div key={exp.id} onClick={() => openExpenseModal(exp)} className="p-3 bg-black/5 dark:bg-white/5 rounded-lg cursor-pointer hover:bg-black/10 dark:hover:bg-white/10">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium">{exp.title}</p>
                                    <p className="font-bold">₹{exp.amount.toLocaleString()}</p>
                                </div>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{exp.category} - {exp.date}</p>
                            </div>
                        )) : <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary py-8">No expenses in this period.</p>}
                    </div>
                </div>
            </div>

        </div>
        {isExpenseModalOpen && (
            <ExpenseEditorModal
                expense={editingExpense}
                onSave={handleSaveExpense}
                onClose={() => setIsExpenseModalOpen(false)}
            />
        )}
        </>
    );
};

export default Finance;