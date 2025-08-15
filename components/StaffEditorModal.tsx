import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Role, StaffMember } from '../types';

interface StaffModalProps {
    staffMember: StaffMember | null;
    roles: Role[];
    onSave: (staffMember: StaffMember) => void;
    onClose: () => void;
}

const StaffEditorModal: React.FC<StaffModalProps> = ({ staffMember, roles, onSave, onClose }) => {
    const { t } = useTranslation();
    const [name, setName] = useState(staffMember?.name || '');
    const [rates, setRates] = useState(staffMember?.rates || { fullDay: 0, halfDay: 0, overtimeBonus: 0 });
    const [grantsAccess, setGrantsAccess] = useState(!!staffMember?.pin);
    const [pin, setPin] = useState(staffMember?.pin || '');
    const [roleId, setRoleId] = useState(staffMember?.roleId || '');
    
    const handleSubmit = () => {
        if (!name) return;
        if(grantsAccess && (pin.length !== 4 || !roleId)) return;
        
        onSave({
            id: staffMember?.id || `staff_${Date.now()}`,
            name,
            rates,
            pin: grantsAccess ? pin : undefined,
            roleId: grantsAccess ? roleId : undefined,
        });
    };

    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
                <h3 className="text-lg font-semibold mb-4">{staffMember ? t('staff.edit_staff') : t('staff.add_staff')}</h3>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('staff.staff_name')}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
                    </div>
                    
                    <div>
                        <h4 className="text-sm font-medium mb-2">{t('staff.pay_rates')}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs font-medium mb-1">{t('staff.rate_full_day')}</label>
                                <input type="number" value={rates.fullDay} onChange={e => setRates({...rates, fullDay: +e.target.value})} className={inputClass} />
                            </div>
                             <div>
                                <label className="block text-xs font-medium mb-1">{t('staff.rate_half_day')}</label>
                                <input type="number" value={rates.halfDay} onChange={e => setRates({...rates, halfDay: +e.target.value})} className={inputClass} />
                            </div>
                             <div>
                                <label className="block text-xs font-medium mb-1">{t('staff.rate_overtime')}</label>
                                <input type="number" value={rates.overtimeBonus} onChange={e => setRates({...rates, overtimeBonus: +e.target.value})} className={inputClass} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                        <label className="flex items-center gap-2">
                           <input type="checkbox" checked={grantsAccess} onChange={e => setGrantsAccess(e.target.checked)} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary"/>
                           <span className="text-sm font-medium">{t('staff.grant_app_access')}</span>
                        </label>
                    </div>

                    {grantsAccess && (
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium mb-1">{t('staff.staff_pin')}</label>
                                <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} maxLength={4} className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('staff.assign_role')}</label>
                                <select value={roleId} onChange={e => setRoleId(e.target.value)} className={inputClass}>
                                    <option value="">Select a role</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
                 <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                    <button onClick={onClose} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">{t('cancel')}</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

export default StaffEditorModal;