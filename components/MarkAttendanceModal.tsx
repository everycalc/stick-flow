import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { StaffMember, AttendanceRecord, AttendanceStatus } from '../types';

interface MarkAttendanceModalProps {
    staffMember: StaffMember;
    date: Date;
    record: AttendanceRecord | null;
    onSave: (record: Omit<AttendanceRecord, 'id'>) => void;
    onClose: () => void;
}

const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({ staffMember, date, record, onSave, onClose }) => {
    const { t } = useTranslation();
    const [status, setStatus] = useState<AttendanceStatus>(record?.status || AttendanceStatus.FULL_DAY);
    const [hadOvertime, setHadOvertime] = useState(record?.hadOvertime || false);
    const [notes, setNotes] = useState(record?.notes || '');
    
    const handleSubmit = () => {
        onSave({
            staffId: staffMember.id,
            date: date.toISOString().split('T')[0], // YYYY-MM-DD
            status,
            hadOvertime,
            notes
        });
    };
    
    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";
    const radioLabelClass = "flex items-center gap-2 p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-light-text dark:text-dark-text";
    const radioInputClass = "h-4 w-4 text-light-primary focus:ring-light-primary border-light-outline dark:border-dark-outline";

    return (
        <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold mb-1">{t('attendance.mark_attendance_for')}</h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">{staffMember.name} on {date.toLocaleDateString()}</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('attendance.status')}</label>
                        <div className="grid grid-cols-2 gap-2">
                             {(Object.values(AttendanceStatus) as AttendanceStatus[]).map(s => (
                                <label key={s} className={radioLabelClass}>
                                    <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className={radioInputClass}/>
                                    <span className="text-sm">{t(`attendance.status.${s}`)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={hadOvertime} onChange={e => setHadOvertime(e.target.checked)} className="h-4 w-4 rounded text-light-primary focus:ring-light-primary" />
                            <span className="text-sm font-medium">{t('attendance.overtime')}</span>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('attendance.notes')}</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputClass}></textarea>
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

export default MarkAttendanceModal;