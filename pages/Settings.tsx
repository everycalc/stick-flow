import React, { useContext, useRef, useState } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { Language, Permission, UserRole } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { db } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import PinConfirmModal from '../components/PinConfirmModal';
import { useNavigate } from 'react-router-dom';
import { Users2, DollarSign } from 'lucide-react';

const Settings: React.FC = () => {
    const { language, setLanguage } = useContext(LanguageContext);
    const { user, changePin, hasPermission } = useAuth();
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinMessage, setPinMessage] = useState({ text: '', success: false });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const products = db.getProducts();
    const totalStockValue = products.reduce((acc, p) => acc + (p.quantity * (p.last_purchase_price || 0)), 0);


    const handleBackup = () => {
        const data = db.getAllData();
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `stickflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (confirm("Are you sure you want to restore data? This will overwrite all current data.")) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const text = e.target?.result;
                        if (typeof text === 'string') {
                            const data = JSON.parse(text);
                            db.restoreAllData(data);
                            alert("Data restored successfully! The app will now reload.");
                            window.location.reload();
                        }
                    } catch (error) {
                        console.error("Failed to parse backup file:", error);
                        alert("Error: Invalid backup file.");
                    }
                };
                reader.readAsText(file);
            }
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();

    const handlePinChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPin.length !== 4) {
            setPinMessage({ text: "New PIN must be 4 digits.", success: false });
            return;
        }
        if (newPin !== confirmPin) {
            setPinMessage({ text: "New PINs do not match.", success: false });
            return;
        }
        const success = changePin(currentPin, newPin);
        if(success) {
            setPinMessage({ text: t('settings.pin_changed'), success: true });
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
        } else {
            setPinMessage({ text: "Current PIN is incorrect.", success: false });
        }
        setTimeout(() => setPinMessage({ text: '', success: false }), 3000);
    };

    const handleDeleteData = () => {
        db.clearAllData();
        alert("All data has been deleted. The application will now reload.");
        window.location.reload();
    };

    const btnPrimary = "bg-light-primary text-white dark:bg-dark-primary dark:text-black px-5 py-2 text-sm font-semibold rounded-full shadow-sm hover:opacity-90 transition";
    const btnSecondary = "px-5 py-2 text-sm font-semibold rounded-full text-light-text dark:text-dark-text hover:bg-black/10 dark:hover:bg-white/10 transition border border-light-outline/50 dark:border-dark-outline/50";
    const btnDanger = "bg-red-600 text-white px-5 py-2 text-sm font-semibold rounded-full shadow-sm hover:bg-red-700 transition";
    const inputClass = "block w-full rounded-lg border border-light-outline dark:border-dark-outline bg-transparent p-2.5 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";

    return (
        <>
            <div className="space-y-6">
                <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4">{t('settings.language')}</h2>
                    <div className="flex space-x-2">
                        {(Object.values(Language) as Language[]).map(lang => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                className={`${language === lang ? 'bg-light-primary-container text-light-secondary dark:bg-dark-primary-container dark:text-dark-primary font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5 text-light-text-secondary dark:text-dark-text-secondary'} px-5 py-2 text-sm rounded-full transition`}
                            >
                                {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {hasPermission(Permission.MANAGE_STAFF) && (
                     <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md">
                        <h2 className="text-xl font-semibold mb-4">{t('staff.title')}</h2>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary my-2">Create roles with specific permissions and manage your staff members.</p>
                        <button onClick={() => navigate('/staff')} className={btnSecondary}>
                           {t('settings.manage_staff')}
                        </button>
                    </div>
                )}
                
                {user?.role === UserRole.Admin && (
                    <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md">
                        <h2 className="text-xl font-semibold mb-4">{t('settings.stock_valuation')}</h2>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 rounded-full">
                                <DollarSign size={24} className="text-green-700 dark:text-green-300"/>
                            </div>
                            <div>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('settings.total_value')}</p>
                                <p className="text-2xl font-bold">₹{totalStockValue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4">{t('settings.security')}</h2>
                    <form onSubmit={handlePinChange} className="max-w-sm space-y-4">
                        <h3 className="font-semibold">{t('settings.change_pin')}</h3>
                        <div>
                            <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1 block">{t('settings.current_pin')}</label>
                            <input type="password" value={currentPin} onChange={e => setCurrentPin(e.target.value)} maxLength={4} className={inputClass} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1 block">{t('settings.new_pin')}</label>
                            <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} maxLength={4} className={inputClass} />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1 block">{t('settings.confirm_pin')}</label>
                            <input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} maxLength={4} className={inputClass} />
                        </div>
                        <button type="submit" className={btnPrimary}>
                            {t('settings.update_pin')}
                        </button>
                        {pinMessage.text && <p className={`text-sm mt-2 ${pinMessage.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{pinMessage.text}</p>}
                    </form>
                </div>

                <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4">{t('settings.data_management')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold">{t('settings.backup_data')}</h3>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary my-2">{t('settings.backup_desc')}</p>
                            <button onClick={handleBackup} className={btnSecondary}>
                                {t('settings.backup_data')}
                            </button>
                        </div>
                         <div>
                            <h3 className="font-semibold">{t('settings.restore_data')}</h3>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary my-2">{t('settings.restore_desc')}</p>
                            <button onClick={triggerFileSelect} className={btnSecondary}>
                                 {t('settings.restore_data')}
                            </button>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleRestore}
                                className="hidden"
                                accept=".json"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="border-red-500/50 border-2 bg-red-500/10 p-6 rounded-2xl shadow-md">
                    <h2 className="text-xl font-semibold mb-2 text-red-700 dark:text-red-300">{t('settings.danger_zone')}</h2>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-4">{t('settings.delete_data_desc')}</p>
                    <button onClick={() => setIsDeleteModalOpen(true)} className={btnDanger}>
                        {t('settings.delete_data')}
                    </button>
                </div>
            </div>
            {isDeleteModalOpen && (
                <PinConfirmModal 
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDeleteData}
                    title={t('settings.delete_confirmation_title')}
                    description={t('settings.delete_confirmation_text')}
                />
            )}
        </>
    );
};

export default Settings;