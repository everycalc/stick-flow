import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('stickflow_theme') || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('stickflow_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('stickflow_theme', 'light');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:ring-offset-light-background dark:focus:ring-offset-dark-background bg-light-primary-container dark:bg-dark-primary-container"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? <Moon size={20} className="text-light-text"/> : <Sun size={20} className="text-dark-text"/>}
        </button>
    );
};

export default ThemeToggle;