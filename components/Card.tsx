import React from 'react';

interface CardProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ title, icon, children, className = '' }) => {
    return (
        <div className={`bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md ${className}`}>
            <div className="flex items-center mb-4">
                <div className="p-3 bg-light-primary-container dark:bg-dark-primary-container rounded-full mr-4">
                    <div className="text-light-secondary dark:text-dark-secondary">
                        {icon}
                    </div>
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
            </div>
            <div>{children}</div>
        </div>
    );
};

export default Card;