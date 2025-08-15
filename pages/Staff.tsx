import React, { useState } from 'react';
import { db } from '../services/db';
import { useTranslation } from '../hooks/useTranslation';
import { Role, StaffMember, Permission } from '../types';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import StaffEditorModal from '../components/StaffEditorModal';

const Staff: React.FC = () => {
    const { t } = useTranslation();
    const [roles, setRoles] = useState<Role[]>(db.getRoles());
    const [staff, setStaff] = useState<StaffMember[]>(db.getStaff());

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

    const openRoleModal = (role: Role | null = null) => {
        setEditingRole(role);
        setIsRoleModalOpen(true);
    };

    const openStaffModal = (staffMember: StaffMember | null = null) => {
        setEditingStaff(staffMember);
        setIsStaffModalOpen(true);
    };

    const handleSaveRole = (role: Role) => {
        let updatedRoles;
        if (roles.find(r => r.id === role.id)) {
            updatedRoles = roles.map(r => r.id === role.id ? role : r);
        } else {
            updatedRoles = [...roles, role];
        }
        setRoles(updatedRoles);
        db.setRoles(updatedRoles);
        setIsRoleModalOpen(false);
    };

    const handleDeleteRole = (roleId: string) => {
        if (confirm(`Are you sure you want to delete this role? Staff assigned to this role will lose their permissions.`)) {
            const updatedRoles = roles.filter(r => r.id !== roleId);
            setRoles(updatedRoles);
            db.setRoles(updatedRoles);
            // Also un-assign this role from staff
            const updatedStaff = staff.map(s => s.roleId === roleId ? { ...s, roleId: undefined } : s);
            setStaff(updatedStaff);
            db.setStaff(updatedStaff);
        }
    };

    const handleSaveStaff = (staffMember: StaffMember) => {
        let updatedStaff;
        if (staff.find(s => s.id === staffMember.id)) {
            updatedStaff = staff.map(s => s.id === staffMember.id ? staffMember : s);
        } else {
            updatedStaff = [...staff, staffMember];
        }
        setStaff(updatedStaff);
        db.setStaff(updatedStaff);
        setIsStaffModalOpen(false);
    };

    const handleDeleteStaff = (staffId: string) => {
        if (confirm(`Are you sure you want to delete this staff member?`)) {
            const updatedStaff = staff.filter(s => s.id !== staffId);
            setStaff(updatedStaff);
            db.setStaff(updatedStaff);
        }
    };
    
    const getRoleName = (roleId?: string) => roles.find(r => r.id === roleId)?.name || 'No Role';

    return (
        <div className="space-y-6">
            <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t('staff.roles')}</h2>
                    <button onClick={() => openRoleModal()} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                        <PlusCircle size={20} className="mr-2"/> {t('staff.add_role')}
                    </button>
                </div>
                <div className="space-y-3">
                    {roles.map(role => (
                        <div key={role.id} className="flex justify-between items-center p-3 bg-black/5 dark:bg-white/5 rounded-lg">
                            <div>
                                <p className="font-semibold">{role.name}</p>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{role.permissions.length} permissions</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openRoleModal(role)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-light-text-secondary dark:text-dark-text-secondary"><Edit size={18} /></button>
                                <button onClick={() => handleDeleteRole(role.id)} className="p-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t('staff.staff_members')}</h2>
                    <button onClick={() => openStaffModal()} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                        <PlusCircle size={20} className="mr-2"/> {t('staff.add_staff')}
                    </button>
                </div>
                 <div className="space-y-3">
                    {staff.map(member => (
                        <div key={member.id} className="flex justify-between items-center p-3 bg-black/5 dark:bg-white/5 rounded-lg">
                            <div>
                                <p className="font-semibold">{member.name}</p>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{getRoleName(member.roleId)}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => openStaffModal(member)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-light-text-secondary dark:text-dark-text-secondary"><Edit size={18} /></button>
                                <button onClick={() => handleDeleteStaff(member.id)} className="p-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {isRoleModalOpen && <RoleModal role={editingRole} onSave={handleSaveRole} onClose={() => setIsRoleModalOpen(false)} />}
            {isStaffModalOpen && <StaffEditorModal staffMember={editingStaff} roles={roles} onSave={handleSaveStaff} onClose={() => setIsStaffModalOpen(false)} />}
        </div>
    );
};

// --- RoleModal Component ---
interface RoleModalProps {
    role: Role | null;
    onSave: (role: Role) => void;
    onClose: () => void;
}
const RoleModal: React.FC<RoleModalProps> = ({ role, onSave, onClose }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(role?.name || '');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role?.permissions || []);

    const handlePermissionChange = (permission: string, checked: boolean) => {
        if (checked) {
            setSelectedPermissions([...selectedPermissions, permission]);
        } else {
            setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
        }
    };

    const handleSubmit = () => {
        if (!name) return;
        onSave({
            id: role?.id || `role_${Date.now()}`,
            name,
            permissions: selectedPermissions as any[]
        });
    };

    const permissionGroups = {
        'General': [Permission.VIEW_SUMMARY, Permission.VIEW_CALCULATOR],
        'Inventory & Production': [Permission.VIEW_INVENTORY, Permission.MANAGE_INVENTORY, Permission.VIEW_MANUFACTURING, Permission.MANAGE_MANUFACTURING, Permission.VIEW_STOCK_LEDGER],
        'Sales & Purchases': [Permission.VIEW_SALES, Permission.CREATE_SALE, Permission.VIEW_PURCHASES, Permission.MANAGE_PURCHASES, Permission.VIEW_DISTRIBUTORS, Permission.MANAGE_CUSTOMERS],
        'Admin': [Permission.VIEW_REPORTS, Permission.VIEW_SETTINGS, Permission.MANAGE_STAFF, Permission.MANAGE_ATTENDANCE, Permission.MANAGE_SUPPLIERS, Permission.VIEW_BIN],
    };

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-semibold mb-4">{role ? t('staff.edit_role') : t('staff.add_role')}</h3>
                <div className="flex-grow overflow-y-auto pr-2">
                    <label className="block text-sm font-medium mb-1">{t('staff.role_name')}</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent" />
                    
                    <h4 className="font-semibold mt-6 mb-2">{t('staff.permissions')}</h4>
                    <div className="space-y-4">
                        {Object.entries(permissionGroups).map(([groupName, permissions]) => (
                            <div key={groupName}>
                                <p className="font-medium text-sm mb-2">{groupName}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {permissions.map(p => (
                                        <label key={p} className="flex items-center gap-2 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-light-text dark:text-dark-text cursor-pointer">
                                            <input type="checkbox" checked={selectedPermissions.includes(p)} onChange={e => handlePermissionChange(p, e.target.checked)} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary"/>
                                            <span className="text-sm">{p.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                    <button onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-light-text dark:text-dark-text">{t('cancel')}</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

export default Staff;