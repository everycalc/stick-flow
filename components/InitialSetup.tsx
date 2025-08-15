import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';

const InitialSetup: React.FC = () => {
    const { completeInitialSetup } = useAuth();
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPin.length !== 4) {
            setError("PIN must be exactly 4 digits.");
            return;
        }
        if (newPin !== confirmPin) {
            setError("PINs do not match. Please try again.");
            return;
        }
        setError('');
        completeInitialSetup(newPin);
    };

    const inputClass = "block w-full text-center tracking-[1em] text-2xl rounded-lg border border-light-outline dark:border-dark-outline bg-transparent p-2.5 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none text-light-text dark:text-dark-text";

    return (
        <div className="min-h-screen bg-light-background dark:bg-dark-background flex flex-col justify-center items-center p-4">
            <div className="bg-light-surface dark:bg-dark-surface p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
                <ShieldCheck className="mx-auto h-16 w-16 text-light-primary dark:text-dark-primary mb-4" />
                <h1 className="text-2xl font-bold mb-2">Welcome to Stickflow!</h1>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-8">Let's secure your account. Please set a 4-digit PIN for the Admin user.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2 block">New Admin PIN</label>
                        <input 
                            type="password" 
                            value={newPin} 
                            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} 
                            maxLength={4} 
                            className={inputClass}
                            autoComplete="new-password"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2 block">Confirm PIN</label>
                        <input 
                            type="password" 
                            value={confirmPin} 
                            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} 
                            maxLength={4} 
                            className={inputClass}
                            autoComplete="new-password"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <button 
                        type="submit" 
                        className="w-full bg-light-primary text-white dark:bg-dark-primary dark:text-black p-3 text-base font-semibold rounded-full shadow-sm hover:opacity-90 transition disabled:opacity-50"
                        disabled={!newPin || !confirmPin}
                    >
                        Save & Get Started
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InitialSetup;