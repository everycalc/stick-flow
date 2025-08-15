import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole, Permission, Role, StaffMember } from '../types';
import { ADMIN_USER as DEFAULT_ADMIN_USER } from '../constants';
import { db } from '../services/db';

// Define the shape of the stored admin user to only include what we need to persist
interface StoredAdminUser {
    id: string;
    name: string;
    role: UserRole;
    pin: string;
}

interface AuthContextType {
    user: User | null;
    companyName: string;
    isInitialSetup: boolean;
    isOnboarding: boolean;
    isLoading: boolean;
    login: (pin: string) => boolean;
    logout: () => void;
    changePin: (oldPin: string, newPin: string) => boolean;
    completeInitialSetup: (pin: string) => void;
    completeOnboarding: (name: string) => void;
    adminPin: string;
    hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredAdmin = (): User => {
    const stored = localStorage.getItem('stickflow_admin_user');
    if (stored) {
        const parsed = JSON.parse(stored) as StoredAdminUser;
        return { ...parsed, role: UserRole.Admin, permissions: Object.values(Permission) };
    }
    return DEFAULT_ADMIN_USER;
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [adminUser, setAdminUser] = useState<User>(getStoredAdmin);
    const [companyName, setCompanyName] = useState('');
    const [isInitialSetup, setIsInitialSetup] = useState(false);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);


    useEffect(() => {
        const name = db.getCompanyName();
        const isPinSet = localStorage.getItem('stickflow_initialized') === 'true';
        const savedUser = sessionStorage.getItem('stickflow_user');
        
        setCompanyName(name);
        setRoles(db.getRoles());
        setStaff(db.getStaff());

        if (savedUser) {
            setUser(JSON.parse(savedUser));
        } else if (!name) {
            setIsOnboarding(true);
        } else if (!isPinSet) {
            setIsInitialSetup(true);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (user) {
            sessionStorage.setItem('stickflow_user', JSON.stringify(user));
        } else {
            sessionStorage.removeItem('stickflow_user');
        }
    }, [user]);

    const login = (pin: string): boolean => {
        // Admin login
        if (pin === adminUser.pin) {
            setUser(adminUser);
            return true;
        }

        // Staff login
        const staffMember = db.getStaff().find(s => s.pin === pin);
        if (staffMember) {
            const staffRole = db.getRoles().find(r => r.id === staffMember.roleId);
            const loggedInUser: User = {
                id: staffMember.id,
                name: staffMember.name,
                role: UserRole.Staff,
                permissions: staffRole?.permissions || []
            };
            setUser(loggedInUser);
            return true;
        }

        return false;
    };
    
    const logout = () => {
        setUser(null);
    };
    
    const persistAdminUser = (updatedAdmin: User) => {
        const toStore: StoredAdminUser = {
            id: updatedAdmin.id,
            name: updatedAdmin.name,
            role: UserRole.Admin,
            pin: updatedAdmin.pin!,
        };
        localStorage.setItem('stickflow_admin_user', JSON.stringify(toStore));
    };


    const changePin = (oldPin: string, newPin: string): boolean => {
        if (user?.role === UserRole.Admin && oldPin === adminUser.pin) {
            const updatedAdmin = { ...adminUser, pin: newPin };
            setAdminUser(updatedAdmin);
            setUser(updatedAdmin);
            persistAdminUser(updatedAdmin);
            return true;
        }
        return false;
    };
    
    const completeInitialSetup = (pin: string) => {
        const updatedAdmin = { ...adminUser, pin: pin };
        setAdminUser(updatedAdmin);
        setUser(updatedAdmin);
        persistAdminUser(updatedAdmin);
        
        setIsInitialSetup(false);
        localStorage.setItem('stickflow_initialized', 'true');
    };
    
    const completeOnboarding = (name: string) => {
        db.setCompanyName(name);
        setCompanyName(name);
        setIsOnboarding(false);
        setIsInitialSetup(true);
    };

    const hasPermission = (permission: Permission): boolean => {
        if (!user) return false;
        // Admin has all permissions implicitly
        if (user.role === UserRole.Admin) return true;
        return user.permissions.includes(permission);
    };


    return (
        <AuthContext.Provider value={{ user, isLoading, isInitialSetup, isOnboarding, companyName, login, logout, changePin, completeInitialSetup, completeOnboarding, adminPin: adminUser.pin || '', hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};