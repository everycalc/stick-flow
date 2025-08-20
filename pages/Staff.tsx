import React, { useState, useMemo } from 'react';
import { db } from '../services/db';
import { Role, StaffMember, Permission, AttendanceStatus, AttendanceRecord } from '../types';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import StaffEditorModal from '../components/StaffEditorModal';

const Team: React.FC = () => {
    const [activeTab, setActiveTab] = useState('staff');

    return (
        <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Team Management</h2>
            <div className="border-b border-light-outline/50 dark:border-dark-outline/50">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('staff')}
                        className={`${activeTab === 'staff' ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        Staff Members
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`${activeTab === 'attendance' ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        Attendance
                    </button>
                </nav>
            </div>
            <div className="mt-6">
                {activeTab === 'staff' && <StaffManagement />}
                {activeTab === 'attendance' && <AttendanceManagement />}
            </div>
        </div>
    );
};


const StaffManagement = () => {
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
            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Roles</h3>
                    <button onClick={() => openRoleModal()} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:opacity-90 transition">
                        <PlusCircle size={16} className="mr-1"/> Add New Role
                    </button>
                </div>
                <div className="space-y-2">
                    {roles.map(role => (
                        <div key={role.id} className="flex justify-between items-center p-2 bg-light-surface dark:bg-dark-surface rounded-lg">
                            <div>
                                <p className="font-semibold text-sm">{role.name}</p>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{role.permissions.length} permissions</p>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => openRoleModal(role)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-light-text-secondary dark:text-dark-text-secondary"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteRole(role.id)} className="p-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Staff Members</h3>
                    <button onClick={() => openStaffModal()} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:opacity-90 transition">
                        <PlusCircle size={16} className="mr-1"/> Add New Staff
                    </button>
                </div>
                 <div className="space-y-2">
                    {staff.map(member => (
                        <div key={member.id} className="flex justify-between items-center p-2 bg-light-surface dark:bg-dark-surface rounded-lg">
                            <div>
                                <p className="font-semibold text-sm">{member.name}</p>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{getRoleName(member.roleId)}</p>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => openStaffModal(member)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-light-text-secondary dark:text-dark-text-secondary"><Edit size={16} /></button>
                                <button onClick={() => handleDeleteStaff(member.id)} className="p-2 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full"><Trash2 size={16} /></button>
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
interface RoleModalProps { role: Role | null; onSave: (role: Role) => void; onClose: () => void; }
const RoleModal: React.FC<RoleModalProps> = ({ role, onSave, onClose }) => {
    const [name, setName] = useState(role?.name || '');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role?.permissions || []);

    const handlePermissionChange = (permission: string, checked: boolean) => {
        setSelectedPermissions(checked ? [...selectedPermissions, permission] : selectedPermissions.filter(p => p !== permission));
    };

    const handleSubmit = () => {
        if (!name) return;
        onSave({ id: role?.id || `role_${Date.now()}`, name, permissions: selectedPermissions as any[] });
    };

    const permissionGroups = {
        'General': [Permission.VIEW_SUMMARY, Permission.VIEW_CALCULATOR],
        'Inventory & Production': [Permission.VIEW_INVENTORY, Permission.MANAGE_INVENTORY, Permission.VIEW_MANUFACTURING, Permission.MANAGE_MANUFACTURING, Permission.VIEW_STOCK_LEDGER],
        'Sales & Purchases': [Permission.VIEW_SALES, Permission.CREATE_SALE, Permission.VIEW_PURCHASES, Permission.MANAGE_PURCHASES, Permission.VIEW_DISTRIBUTORS, Permission.MANAGE_CUSTOMERS],
        'Admin': [Permission.VIEW_REPORTS, Permission.VIEW_SETTINGS, Permission.MANAGE_STAFF, Permission.MANAGE_ATTENDANCE, Permission.MANAGE_SUPPLIERS, Permission.VIEW_BIN, Permission.VIEW_FINANCE],
    };

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-semibold mb-4">{role ? 'Edit Role' : 'Add New Role'}</h3>
                <div className="flex-grow overflow-y-auto pr-2">
                    <label className="block text-sm font-medium mb-1">Role Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent" />
                    
                    <h4 className="font-semibold mt-6 mb-2">Permissions</h4>
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
                    <button onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-light-text dark:text-dark-text">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black">Save</button>
                </div>
            </div>
        </div>
    );
};

const AttendanceManagement = () => {
    const [staffList] = useState<StaffMember[]>(db.getStaff());
    const [allRecords, setAllRecords] = useState<AttendanceRecord[]>(db.getAttendanceRecords());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const dailyRecords = useMemo(() => {
        const recordsForDate = allRecords.filter(r => r.date === selectedDate);
        const recordsMap = new Map(recordsForDate.map(r => [r.staffId, r]));
        
        return staffList.map(staff => {
            const record = recordsMap.get(staff.id);
            return {
                staffId: staff.id,
                name: staff.name,
                status: record?.status || AttendanceStatus.ABSENT,
                hadOvertime: record?.hadOvertime || false,
                isSaved: !!record,
            };
        });
    }, [selectedDate, staffList, allRecords]);
    
    const [attendanceData, setAttendanceData] = useState(dailyRecords);

    React.useEffect(() => {
        setAttendanceData(dailyRecords);
    }, [dailyRecords]);


    const handleStatusChange = (staffId: string, status: AttendanceStatus) => {
        setAttendanceData(prev => prev.map(item => item.staffId === staffId ? { ...item, status } : item));
    };
    
    const handleOvertimeChange = (staffId: string, checked: boolean) => {
        setAttendanceData(prev => prev.map(item => item.staffId === staffId ? { ...item, hadOvertime: checked } : item));
    };

    const handleBulkMark = (status: AttendanceStatus) => {
        setAttendanceData(prev => prev.map(item => ({...item, status})));
    };
    
    const handleSave = () => {
        const updatedRecords = [...allRecords];
        attendanceData.forEach(data => {
            const existingRecordIndex = updatedRecords.findIndex(r => r.date === selectedDate && r.staffId === data.staffId);
            const newRecord: AttendanceRecord = {
                id: existingRecordIndex > -1 ? updatedRecords[existingRecordIndex].id : `att_${Date.now()}_${data.staffId}`,
                staffId: data.staffId,
                date: selectedDate,
                status: data.status,
                hadOvertime: data.hadOvertime,
            };
            if (existingRecordIndex > -1) {
                updatedRecords[existingRecordIndex] = newRecord;
            } else {
                updatedRecords.push(newRecord);
            }
        });
        setAllRecords(updatedRecords);
        db.setAttendanceRecords(updatedRecords);
        alert('Attendance saved successfully!');
    };


    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <label htmlFor="attendance-date" className="font-medium">Select Date:</label>
                <input
                    type="date"
                    id="attendance-date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary"
                />
            </div>

            <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium">Mark all as:</span>
                <button onClick={() => handleBulkMark(AttendanceStatus.FULL_DAY)} className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-700 dark:text-green-300">Full Day</button>
                <button onClick={() => handleBulkMark(AttendanceStatus.ABSENT)} className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-700 dark:text-red-300">Absent</button>
                <button onClick={() => handleBulkMark(AttendanceStatus.HOLIDAY)} className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">Holiday</button>
            </div>
            
            <div className="overflow-x-auto border border-light-outline/50 dark:border-dark-outline/50 rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-black/5 dark:bg-white/5">
                        <tr>
                            <th className="p-3 text-left font-semibold">Staff Name</th>
                            <th className="p-3 text-left font-semibold">Status</th>
                            <th className="p-3 text-center font-semibold">OT</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                        {attendanceData.map(item => (
                            <tr key={item.staffId}>
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3">
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {(Object.values(AttendanceStatus) as AttendanceStatus[]).map(s => (
                                            <label key={s} className="flex items-center gap-1 cursor-pointer">
                                                <input type="radio" name={`status-${item.staffId}`} value={s} checked={item.status === s} onChange={() => handleStatusChange(item.staffId, s)} className="h-4 w-4 text-light-primary focus:ring-light-primary" />
                                                <span>{s.replace('_', ' ')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    <input type="checkbox" checked={item.hadOvertime} onChange={e => handleOvertimeChange(item.staffId, e.target.checked)} className="h-5 w-5 rounded text-light-primary focus:ring-light-primary"/>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end mt-4">
                <button onClick={handleSave} className="bg-light-primary text-white dark:bg-dark-primary dark:text-black px-6 py-2 text-sm font-semibold rounded-full shadow-sm hover:opacity-90">
                    Save Attendance
                </button>
            </div>
        </div>
    );
};


export default Team;