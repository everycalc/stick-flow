import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { db } from '../services/db';
import { Alert, ItemType } from '../types';

const AlertBar: React.FC = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
    const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

    useEffect(() => {
        const fetchAlerts = () => {
            const activeAlerts = db.getAlerts();
            setAlerts(activeAlerts);
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000); // Re-check for alerts every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const activeAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

    useEffect(() => {
        if (activeAlerts.length > 1) {
            const timer = setTimeout(() => {
                setCurrentAlertIndex((prevIndex) => (prevIndex + 1) % activeAlerts.length);
            }, 5000); // Cycle through alerts every 5 seconds
            return () => clearTimeout(timer);
        } else {
            setCurrentAlertIndex(0);
        }
    }, [currentAlertIndex, activeAlerts.length]);

    const handleDismiss = (alertId: string) => {
        setDismissedAlerts(prev => [...prev, alertId]);
    };

    const handlePrepareOrder = (productId: string) => {
        const product = db.getProducts().find(p => p.id === productId);
        if (!product) return;

        const supplier = db.getSuppliers().find(s => product.linked_supplier_ids.includes(s.id));
        const quantityToOrder = product.lowStockThreshold * 2; // Example logic: order twice the threshold
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 7); // 1 week from now

        const message = `
Hello ${supplier?.company_name || 'Supplier'},

Please place an order for the following item:
- Product: ${product.name}
- Quantity: ${quantityToOrder} ${product.unit}
- Expected Delivery Date: ${deliveryDate.toLocaleDateString()}

Thank you,
Stickflow
        `.trim();

        navigator.clipboard.writeText(message).then(() => {
            alert('Order message copied to clipboard!');
        });
    };

    if (activeAlerts.length === 0) {
        return null;
    }

    const currentAlert = activeAlerts[currentAlertIndex];
    if (!currentAlert) return null;
    
    const productForAlert = currentAlert.type === 'low_stock' 
      ? db.getProducts().find(p => p.id === currentAlert.relatedId) 
      : null;

    const isWarning = currentAlert.type === 'low_stock' || currentAlert.type === 'production_warning';
    const alertClasses = isWarning 
      ? 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-200' 
      : 'bg-red-500/20 text-red-800 dark:text-red-200';
    const iconClasses = isWarning
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-red-600 dark:text-red-400';

    return (
        <div className={`flex items-center p-3 mb-4 rounded-xl ${alertClasses}`}>
            <div className={`mr-3 flex-shrink-0 ${iconClasses}`}>
                {isWarning ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </div>
            <div className="flex-grow">
                <span className="font-medium text-sm">
                  {currentAlert.message}
                </span>
                {currentAlert.type === 'low_stock' && productForAlert?.type === ItemType.RawMaterial && (
                    <button 
                        onClick={() => handlePrepareOrder(currentAlert.relatedId)} 
                        className="ml-4 text-xs bg-light-primary text-white dark:bg-dark-primary dark:text-black px-3 py-1 rounded-full font-semibold"
                    >
                        Prepare Order
                    </button>
                )}
            </div>
            {activeAlerts.length > 1 && (
                <div className="text-xs ml-3 px-2">
                    {currentAlertIndex + 1}/{activeAlerts.length}
                </div>
            )}
             <button onClick={() => handleDismiss(currentAlert.id)} className="ml-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                <X size={18} />
            </button>
        </div>
    );
};

export default AlertBar;