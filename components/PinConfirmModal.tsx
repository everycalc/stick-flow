import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface PinConfirmModalProps {
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

const PinConfirmModal: React.FC<PinConfirmModalProps> = ({ onClose, onConfirm, title, description }) => {
    const { adminPin } = useAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (pin === adminPin) {
            onConfirm();
            onClose();
        } else {
            setError('Incorrect PIN. Action denied.');
            setTimeout(() => {
                setError('');
                setPin('');
            }, 1500);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-lg p-6 w-full max-w-sm text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">{description}</p>
                
                <div className="mb-4">
                    <input 
                        type="password" 
                        value={pin}
                        onChange={e => setPin(e.target.value)}
                        maxLength={4}
                        className={`block w-40 mx-auto text-center tracking-[1em] text-2xl rounded-lg border ${error ? 'border-red-500' : 'border-light-outline dark:border-dark-outline'} bg-transparent p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none`}
                        autoFocus
                    />
                     {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                </div>

                <div className="flex justify-center gap-4 mt-8">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold rounded-full text-light-text dark:text-dark-text hover:bg-black/10 dark:hover:bg-white/10 transition">
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={pin.length !== 4}
                        className="bg-red-600 text-white px-5 py-2 text-sm font-semibold rounded-full shadow-sm hover:bg-red-700 transition disabled:opacity-50"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinConfirmModal;