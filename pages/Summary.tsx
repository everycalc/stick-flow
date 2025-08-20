import React from 'react';
import { Alert, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/db';
import { useNavigate } from 'react-router-dom';
import { Package, Users, DollarSign, Truck, AlertCircle } from 'lucide-react';
import Calculator from '../components/Calculator';

const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

const Summary: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const greeting = getGreeting();

    const alerts = db.getAlerts();
    const lowStockAlerts = alerts.filter(a => a.type === 'low_stock');
    const customerDues = alerts.filter(a => a.type === 'payment_due_customer');
    const supplierDues = alerts.filter(a => a.type === 'payment_due_supplier');
    const pendingDeliveries = db.getSales().filter(s => !s.isDispatched);
    
    interface SummaryCardProps {
        title: string;
        count: number;
        icon: React.ReactNode;
        color: string;
        actionText: string;
        onActionClick: () => void;
    }

    const SummaryCard: React.FC<SummaryCardProps> = ({ title, count, icon, color, actionText, onActionClick }) => (
        <div className="bg-light-surface dark:bg-dark-surface p-5 rounded-2xl shadow-md flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-light-text-secondary dark:text-dark-text-secondary">{title}</h3>
                    <div className={`p-2 rounded-full ${color}`}>
                        {icon}
                    </div>
                </div>
                <p className="text-4xl font-bold mt-2">{count}</p>
            </div>
            <button onClick={onActionClick} className="mt-4 text-sm font-semibold text-light-primary dark:text-dark-primary text-left hover:underline">
                {actionText}
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{`${greeting}, ${user?.name}!`}</h1>
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <SummaryCard 
                    title={'Low Stock Items'}
                    count={lowStockAlerts.length}
                    icon={<Package size={22} />}
                    color="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
                    actionText={'View All'}
                    onActionClick={() => navigate('/inventory')}
                />
                 <SummaryCard 
                    title={'Pending Customer Payments'}
                    count={customerDues.length}
                    icon={<Users size={22} />}
                    color="bg-red-500/20 text-red-700 dark:text-red-300"
                    actionText={'View All'}
                    onActionClick={() => navigate('/reports')}
                />
                {user?.role === UserRole.Admin && (
                    <>
                        <SummaryCard 
                            title={'Pending Supplier Payments'}
                            count={supplierDues.length}
                            icon={<DollarSign size={22} />}
                            color="bg-blue-500/20 text-blue-700 dark:text-blue-300"
                            actionText={'View All'}
                            onActionClick={() => navigate('/purchases')}
                        />
                         <SummaryCard 
                            title={'Pending Deliveries'}
                            count={pendingDeliveries.length}
                            icon={<Truck size={22} />}
                            color="bg-green-500/20 text-green-700 dark:text-green-300"
                            actionText={'View All'}
                            onActionClick={() => navigate('/sales')}
                        />
                    </>
                )}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md">
                     <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
                     {alerts.length > 0 ? (
                        <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                           {alerts.slice(0, 10).map(alert => (
                                <li key={alert.id} className="flex items-start p-3 rounded-xl bg-black/5 dark:bg-white/5">
                                   <AlertCircle size={20} className="mr-3 mt-1 text-yellow-600 dark:text-yellow-400 shrink-0"/>
                                   <div>
                                       <p className="font-medium text-sm">{alert.message}</p>
                                   </div>
                                </li>
                           ))}
                        </ul>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center text-light-text-secondary dark:text-dark-text-secondary py-10">
                            <p>No active alerts.</p>
                        </div>
                    )}
                </div>
                 <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Quick Calculator</h3>
                    <Calculator />
                 </div>
             </div>
        </div>
    );
};

export default Summary;