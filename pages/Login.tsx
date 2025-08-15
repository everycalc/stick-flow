import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { Delete } from 'lucide-react';

const Login: React.FC = () => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handlePinChange = (value: string) => {
        if (pin.length < 4) {
            setPin(pin + value);
        }
    };
    
    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const success = login(pin);
        if (success) {
            navigate('/', { replace: true });
        } else {
            setError('Invalid PIN');
            setTimeout(() => {
                setError('');
                setPin('');
            }, 1000)
        }
    };
    
    const keypadBtnClass = "flex items-center justify-center h-16 w-16 rounded-full bg-light-primary-container dark:bg-dark-primary-container text-2xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors";

    return (
        <div className="min-h-screen bg-light-background dark:bg-dark-background flex flex-col justify-center items-center p-4">
            <h1 className="text-3xl sm:text-4xl text-light-text dark:text-dark-text mb-6 font-bold tracking-wider text-light-primary dark:text-dark-primary">{t('app.name')}</h1>
            <div className="bg-light-surface dark:bg-dark-surface p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-sm">
                <h2 className="text-xl font-semibold text-center mb-2">{t('login.title')}</h2>
                <p className="text-sm text-center text-light-text-secondary dark:text-dark-text-secondary mb-8">Enter your PIN to continue</p>
                
                <form onSubmit={handleLogin}>
                    <div className="flex justify-center space-x-4 mb-4">
                        {Array(4).fill(0).map((_, i) => (
                           <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-light-primary dark:bg-dark-primary' : 'bg-light-outline/50 dark:bg-dark-outline/50'} ${error ? 'animate-shake' : ''}`} />
                        ))}
                    </div>
                    
                    {error && <p className="text-red-500 text-sm text-center mb-4 h-5">{error}</p>}
                    {!error && <div className="h-5 mb-4"></div>}


                    <div className="grid grid-cols-3 gap-4 my-4 place-items-center">
                       {[...Array(9).keys()].map(i => i + 1).map(n => (
                            <button type="button" key={n} onClick={() => handlePinChange(n.toString())} className={keypadBtnClass}>
                                {n}
                            </button>
                        ))}
                         <div/>
                         <button type="button" onClick={() => handlePinChange('0')} className={keypadBtnClass}>
                           0
                        </button>
                         <button type="button" onClick={handleBackspace} className={`${keypadBtnClass} text-light-text-secondary dark:text-dark-text-secondary`}>
                           <Delete size={24}/>
                        </button>
                    </div>

                    <button type="submit" disabled={pin.length !== 4} className="w-full bg-light-primary text-white dark:bg-dark-primary dark:text-black p-3 text-base font-semibold rounded-full shadow-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                        {t('login.button')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;