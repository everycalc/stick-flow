import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import AlertBar from './components/AlertBar';
import Summary from './pages/Summary';
import Inventory from './pages/Inventory';
import Manufacturing from './pages/Manufacturing';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Attendance from './pages/Attendance';
import { UserRole, Permission } from './types';
import Distributors from './pages/Distributors';
import InitialSetup from './components/InitialSetup';
import Onboarding from './components/Onboarding';
import Purchases from './pages/Purchases';
import StockLedger from './pages/StockLedger';
import Sidebar from './components/Sidebar';
import CalculatorPage from './pages/CalculatorPage';
import TabBar from './components/TabBar';
import Staff from './pages/Staff';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Bin from './pages/Bin';

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AuthProvider>
                <HashRouter>
                    <AppContent />
                </HashRouter>
            </AuthProvider>
        </LanguageProvider>
    );
};

const AppContent: React.FC = () => {
    const { user, isLoading, isInitialSetup, isOnboarding, hasPermission } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-light-background dark:bg-dark-background">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-light-primary dark:border-dark-primary"></div>
            </div>
        );
    }
    
    if (isOnboarding) {
        return <Onboarding />;
    }

    if (isInitialSetup) {
        return <InitialSetup />;
    }

    if (!user) {
        return <Login />;
    }

    const PermissionProtectedRoute: React.FC<{ children: React.ReactNode; requiredPermission: Permission }> = ({ children, requiredPermission }) => {
        if (!hasPermission(requiredPermission)) {
            return <Navigate to="/" replace />;
        }
        return <>{children}</>;
    };

    return (
        <div className="flex h-screen bg-light-background dark:bg-dark-background text-sm">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="flex flex-col flex-1 w-full lg:w-[calc(100%-16rem)]">
                <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <TabBar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light-background dark:bg-dark-background p-4 md:p-6">
                    <AlertBar />
                    <Routes>
                        <Route path="/" element={<Summary />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/manufacturing" element={<Manufacturing />} />
                        <Route path="/sales" element={<Sales />} />
                        <Route path="/attendance" element={<Attendance />} />
                        <Route path="/calculator" element={<CalculatorPage />} />
                        <Route path="/purchases" element={<PermissionProtectedRoute requiredPermission={Permission.VIEW_PURCHASES}><Purchases /></PermissionProtectedRoute>} />
                        <Route path="/suppliers" element={<PermissionProtectedRoute requiredPermission={Permission.MANAGE_SUPPLIERS}><Suppliers /></PermissionProtectedRoute>} />
                        <Route path="/customers" element={<PermissionProtectedRoute requiredPermission={Permission.MANAGE_CUSTOMERS}><Customers /></PermissionProtectedRoute>} />
                        <Route path="/stock_ledger" element={<PermissionProtectedRoute requiredPermission={Permission.VIEW_STOCK_LEDGER}><StockLedger /></PermissionProtectedRoute>} />
                        <Route path="/distributors" element={<PermissionProtectedRoute requiredPermission={Permission.VIEW_DISTRIBUTORS}><Distributors /></PermissionProtectedRoute>} />
                        <Route path="/reports" element={<PermissionProtectedRoute requiredPermission={Permission.VIEW_REPORTS}><Reports /></PermissionProtectedRoute>} />
                        <Route path="/settings" element={<PermissionProtectedRoute requiredPermission={Permission.VIEW_SETTINGS}><Settings /></PermissionProtectedRoute>} />
                        <Route path="/staff" element={<PermissionProtectedRoute requiredPermission={Permission.MANAGE_STAFF}><Staff /></PermissionProtectedRoute>} />
                        <Route path="/bin" element={<PermissionProtectedRoute requiredPermission={Permission.VIEW_BIN}><Bin /></PermissionProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default App;