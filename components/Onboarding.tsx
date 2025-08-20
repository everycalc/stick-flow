import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/db';
import { Building2 } from 'lucide-react';

const Onboarding: React.FC = () => {
    const { completeOnboarding } = useAuth();
    const [companyName, setCompanyName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (companyName.trim()) {
            completeOnboarding(companyName.trim());
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();
    
    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
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
    };

    const inputClass = "block w-full text-center text-xl rounded-lg border border-light-outline dark:border-dark-outline bg-transparent p-3 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none text-light-text dark:text-dark-text";

    return (
        <div className="min-h-screen bg-light-background dark:bg-dark-background flex flex-col justify-center items-center p-4">
            <div className="bg-light-surface dark:bg-dark-surface p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
                <Building2 className="mx-auto h-16 w-16 text-light-primary dark:text-dark-primary mb-4" />
                <h1 className="text-2xl font-bold mb-2">Welcome to Stickflow</h1>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mb-8">Let's start by setting up your company name.</p>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2 block">Company Name</label>
                            <input 
                                type="text" 
                                value={companyName} 
                                onChange={e => setCompanyName(e.target.value)}
                                className={inputClass}
                                autoFocus
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            className="w-full bg-light-primary text-white dark:bg-dark-primary dark:text-black p-3 text-base font-semibold rounded-full shadow-sm hover:opacity-90 transition disabled:opacity-50"
                            disabled={!companyName.trim()}
                        >
                            Continue
                        </button>
                    </div>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-light-outline/50 dark:border-dark-outline/50" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-light-surface dark:bg-dark-surface px-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">OR</span>
                    </div>
                </div>

                <button 
                    type="button" 
                    onClick={triggerFileSelect}
                    className="w-full p-3 text-base font-semibold rounded-full shadow-sm hover:bg-black/5 dark:hover:bg-white/5 transition border border-light-outline/50 dark:border-dark-outline/50"
                >
                    Restore from Backup
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
    );
};

export default Onboarding;