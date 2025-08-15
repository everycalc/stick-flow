import { User, UserRole, Permission } from './types';

export const ADMIN_PIN = '4957';

export const ADMIN_USER: User = {
    id: 'admin01',
    name: 'Admin',
    role: UserRole.Admin,
    pin: ADMIN_PIN,
    permissions: Object.values(Permission),
};
