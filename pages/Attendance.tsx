import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../services/db';
import { useTranslation } from '../hooks/useTranslation';
import { StaffMember, AttendanceRecord, Role, AttendanceStatus } from '../types';
import { ChevronLeft, ChevronRight, UserPlus, Calendar, ListChecks } from 'lucide-react';
import StaffEditorModal from '../components/StaffEditorModal';
import AttendanceCalendar from '../components/AttendanceCalendar';
import MarkAttendanceModal from '../components/MarkAttendanceModal';

// Helper to format date to YYYY-MM-DD
const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

// Sub-component for the new Daily Entry Checklist
const DailyAttendanceChecklist: React.FC<{
    staff: StaffMember[];
    allRecords: AttendanceRecord[];
    onSave: (changes: Map<string, Partial<AttendanceRecord>>, date: Date) => void;
}> = ({ staff, allRecords, onSave }) => {
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [changes, setChanges] = useState<Map<string, Partial<AttendanceRecord>>>(new Map());

    const todayStr = toYYYYMMDD(new Date());
    const isFuture = toYYYYMMDD(selectedDate) > todayStr;

    useEffect(() => {
        // Clear changes when date changes
        setChanges(new Map());
    }, [selectedDate]);

    const recordsForSelectedDate = useMemo(() => {
        const dateStr = toYYYYMMDD(selectedDate);
        return allRecords.filter(r => r.date === dateStr);
    }, [allRecords, selectedDate]);

    const getStaffRecord = (staffId: string): Partial<AttendanceRecord> => {
        return changes.get(staffId) 
            || recordsForSelectedDate.find(r => r.staffId === staffId) 
            || { status: AttendanceStatus.FULL_DAY, hadOvertime: false };
    };

    const handleUpdate = (staffId: string, update: Partial<AttendanceRecord>) => {
        const currentRecord = getStaffRecord(staffId);
        const newRecord = { ...currentRecord, ...update };
        setChanges(new Map(changes.set(staffId, newRecord)));
    };

    const handleBulkUpdate = (status: AttendanceStatus) => {
        const newChanges = new Map(changes);
        staff.forEach(s => {
            const currentRecord = getStaffRecord(s.id);
            newChanges.set(s.id, { ...currentRecord, status });
        });
        setChanges(newChanges);
    };

    const handleSave = () => {
        if (isFuture) return;
        onSave(changes, selectedDate);
        setChanges(new Map());
    };
    
    const statusBtnClass = (active: boolean) => `px-3 py-1.5 text-xs font-semibold rounded-full transition ${active ? 'bg-light-primary text-white dark:bg-dark-primary dark:text-dark-background' : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-light-text-secondary dark:text-dark-text-secondary'}`;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                <div>
                    <label htmlFor="attendance-date" className="text-xs font-medium">{t('attendance.select_date')}</label>
                    <input 
                        type="date"
                        id="attendance-date"
                        value={toYYYYMMDD(selectedDate)}
                        max={todayStr}
                        onChange={e => setSelectedDate(new Date(e.target.value))}
                        className="w-full mt-1 p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-light-surface dark:bg-dark-surface focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t('attendance.mark_all_as')}</span>
                    <button onClick={() => handleBulkUpdate(AttendanceStatus.FULL_DAY)} className={statusBtnClass(false)} disabled={isFuture}>{t('attendance.status.full_day')}</button>
                    <button onClick={() => handleBulkUpdate(AttendanceStatus.HOLIDAY)} className={statusBtnClass(false)} disabled={isFuture}>{t('attendance.status.holiday')}</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-light-outline/50 dark:border-dark-outline/50">
                             <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Employee</th>
                             <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                             <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider">{t('attendance.overtime_short')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                        {staff.map(s => {
                            const record = getStaffRecord(s.id);
                            return (
                                <tr key={s.id}>
                                    <td className="p-2 whitespace-nowrap font-medium">{s.name}</td>
                                    <td className="p-2 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => handleUpdate(s.id, { status: AttendanceStatus.FULL_DAY })} disabled={isFuture} className={statusBtnClass(record.status === AttendanceStatus.FULL_DAY)}>Full</button>
                                            <button onClick={() => handleUpdate(s.id, { status: AttendanceStatus.HALF_DAY })} disabled={isFuture} className={statusBtnClass(record.status === AttendanceStatus.HALF_DAY)}>Half</button>
                                            <button onClick={() => handleUpdate(s.id, { status: AttendanceStatus.ABSENT })} disabled={isFuture} className={statusBtnClass(record.status === AttendanceStatus.ABSENT)}>Absent</button>
                                        </div>
                                    </td>
                                    <td className="p-2 whitespace-nowrap text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={record.hadOvertime || false}
                                            disabled={isFuture}
                                            onChange={e => handleUpdate(s.id, { hadOvertime: e.target.checked })}
                                            className="h-5 w-5 rounded text-light-primary focus:ring-light-primary border-light-outline dark:border-dark-outline"
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

             <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={isFuture} className="bg-light-primary text-white dark:bg-dark-primary dark:text-black px-6 py-2.5 text-sm font-semibold rounded-full shadow-sm hover:opacity-90 transition disabled:opacity-50">
                    {t('attendance.save_attendance')}
                </button>
            </div>
        </div>
    );
};

// Sub-component for the Monthly Report view
const MonthlyReportView: React.FC<{
    staff: StaffMember[];
    allRecords: AttendanceRecord[];
    setAllRecords: (records: AttendanceRecord[]) => void;
}> = ({ staff, allRecords, setAllRecords }) => {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(staff.length > 0 ? staff[0].id : null);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const selectedStaff = useMemo(() => staff.find(s => s.id === selectedStaffId), [staff, selectedStaffId]);

    const handleDateChange = (months: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + months);
        setCurrentDate(newDate);
    };

    const handleSaveAttendance = (record: Omit<AttendanceRecord, 'id'>) => {
        const existingRecord = allRecords.find(r => r.staffId === record.staffId && r.date === record.date);
        const newRecord = { ...record, id: existingRecord?.id || `att_${Date.now()}` };

        const updatedAttendance = existingRecord
            ? allRecords.map(r => r.id === existingRecord.id ? newRecord : r)
            : [...allRecords, newRecord];
        
        setAllRecords(updatedAttendance);
        db.setAttendanceRecords(updatedAttendance);
        setIsAttendanceModalOpen(false);
    };

    const handleDayClick = (day: Date) => {
        if (!selectedStaff) return;
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Allow clicking today
        if (day > today) return; // Prevent opening modal for future dates

        setSelectedDate(day);
        setIsAttendanceModalOpen(true);
    };

    const calculateMonthlyReport = useCallback(() => {
        if (!selectedStaff) return null;
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const records = allRecords.filter(r => {
            const recordDate = new Date(r.date);
            return r.staffId === selectedStaff.id && recordDate.getMonth() === month && recordDate.getFullYear() === year;
        });

        const report = {
            fullDays: records.filter(r => r.status === AttendanceStatus.FULL_DAY).length,
            halfDays: records.filter(r => r.status === AttendanceStatus.HALF_DAY).length,
            absent: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
            holidays: records.filter(r => r.status === AttendanceStatus.HOLIDAY).length,
            overtimeDays: records.filter(r => r.hadOvertime).length
        };
        
        const salary = (report.fullDays * selectedStaff.rates.fullDay) +
                       (report.halfDays * selectedStaff.rates.halfDay) +
                       (report.holidays * selectedStaff.rates.fullDay) +
                       (report.overtimeDays * selectedStaff.rates.overtimeBonus);

        return { ...report, salary };
    }, [selectedStaff, currentDate, allRecords]);
    
    const monthlyReport = calculateMonthlyReport();

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                <div className="w-full sm:w-auto sm:flex-1">
                    <label className="text-xs font-medium">{t('attendance.select_employee')}</label>
                    <select value={selectedStaffId || ''} onChange={e => setSelectedStaffId(e.target.value)} className="w-full mt-1 p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-light-surface dark:bg-dark-surface focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none">
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center justify-center">
                    <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><ChevronLeft size={24}/></button>
                    <span className="w-40 text-center font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><ChevronRight size={24}/></button>
                </div>
            </div>

            {selectedStaff ? (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <div className="lg:col-span-2">
                        <AttendanceCalendar 
                            staffId={selectedStaff.id}
                            date={currentDate}
                            records={allRecords}
                            onDayClick={handleDayClick}
                        />
                    </div>
                    {monthlyReport && (
                        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                            <h3 className="font-semibold mb-4">{t('attendance.monthly_report_for')} {selectedStaff.name}</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center"><span className="text-light-text-secondary dark:text-dark-text-secondary">{t('attendance.full_days')}</span><span className="font-bold">{monthlyReport.fullDays}</span></div>
                                <div className="flex justify-between items-center"><span className="text-light-text-secondary dark:text-dark-text-secondary">{t('attendance.half_days')}</span><span className="font-bold">{monthlyReport.halfDays}</span></div>
                                <div className="flex justify-between items-center"><span className="text-light-text-secondary dark:text-dark-text-secondary">{t('attendance.absent')}</span><span className="font-bold">{monthlyReport.absent}</span></div>
                                <div className="flex justify-between items-center"><span className="text-light-text-secondary dark:text-dark-text-secondary">{t('attendance.holidays')}</span><span className="font-bold">{monthlyReport.holidays}</span></div>
                                <div className="flex justify-between items-center"><span className="text-light-text-secondary dark:text-dark-text-secondary">{t('attendance.overtime_days')}</span><span className="font-bold">{monthlyReport.overtimeDays}</span></div>
                                <div className="mt-4 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                                    <div className="flex justify-between items-center text-base">
                                        <span className="font-semibold">{t('attendance.projected_salary')}</span>
                                        <span className="font-bold text-lg text-green-600 dark:text-green-400">₹{monthlyReport.salary.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                 <div className="text-center py-16 text-light-text-secondary dark:text-dark-text-secondary">
                    <p>{t('attendance.select_employee')}</p>
                </div>
            )}
            {isAttendanceModalOpen && selectedStaff && selectedDate && (
                <MarkAttendanceModal
                    staffMember={selectedStaff}
                    date={selectedDate}
                    record={allRecords.find(r => r.staffId === selectedStaffId && r.date === toYYYYMMDD(selectedDate)) || null}
                    onSave={handleSaveAttendance}
                    onClose={() => setIsAttendanceModalOpen(false)}
                />
            )}
        </div>
    );
}

const Attendance: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('entry');
    const [staff, setStaff] = useState<StaffMember[]>(db.getStaff());
    const [roles, setRoles] = useState<Role[]>(db.getRoles());
    const [allRecords, setAllRecords] = useState<AttendanceRecord[]>(db.getAttendanceRecords());
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

    const handleSaveStaff = (member: StaffMember) => {
        const updatedStaff = staff.find(s => s.id === member.id)
            ? staff.map(s => s.id === member.id ? member : s)
            : [...staff, member];
        setStaff(updatedStaff);
        db.setStaff(updatedStaff);
        setIsStaffModalOpen(false);
    };

    const handleSaveDailyChanges = (changes: Map<string, Partial<AttendanceRecord>>, date: Date) => {
        const dateStr = toYYYYMMDD(date);

        setAllRecords(currentAllRecords => {
            const otherDaysRecords = currentAllRecords.filter(r => r.date !== dateStr);
            const recordsForSelectedDate = currentAllRecords.filter(r => r.date === dateStr);
            
            const updatedDayRecords: AttendanceRecord[] = [];
            
            staff.forEach(s => {
                const change = changes.get(s.id);
                const existing = recordsForSelectedDate.find(r => r.staffId === s.id);

                if (change) {
                    updatedDayRecords.push({
                        id: existing?.id || `att_${Date.now()}_${s.id}`,
                        staffId: s.id,
                        date: dateStr,
                        status: change.status!,
                        hadOvertime: !!change.hadOvertime,
                        notes: change.notes || '',
                    });
                } else if (existing) {
                    updatedDayRecords.push(existing);
                }
            });

            const newTotalRecords = [...otherDaysRecords, ...updatedDayRecords];
            db.setAttendanceRecords(newTotalRecords);
            alert(t('attendance.changes_saved'));
            return newTotalRecords;
        });
    };

    return (
        <>
            <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-semibold">{t('attendance.title')}</h2>
                    <button onClick={() => setIsStaffModalOpen(true)} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                        <UserPlus size={18} className="mr-2"/> {t('attendance.add_employee')}
                    </button>
                </div>
                
                <div className="border-b border-light-outline/50 dark:border-dark-outline/50">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('entry')} className={`${activeTab === 'entry' ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}><ListChecks size={16} />{t('attendance.daily_entry')}</button>
                        <button onClick={() => setActiveTab('report')} className={`${activeTab === 'report' ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}><Calendar size={16} />{t('attendance.monthly_report')}</button>
                    </nav>
                </div>
                
                <div className="mt-6">
                    {staff.length > 0 ? (
                        activeTab === 'entry' 
                            ? <DailyAttendanceChecklist staff={staff} allRecords={allRecords} onSave={handleSaveDailyChanges} /> 
                            : <MonthlyReportView staff={staff} allRecords={allRecords} setAllRecords={setAllRecords} />
                    ) : (
                        <div className="text-center py-16">
                            <Calendar size={48} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/>
                            <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">{t('attendance.no_staff_add_one')}</p>
                        </div>
                    )}
                </div>

            </div>
            {isStaffModalOpen && (
                <StaffEditorModal 
                    staffMember={null} 
                    roles={roles} 
                    onSave={handleSaveStaff}
                    onClose={() => setIsStaffModalOpen(false)}
                />
            )}
        </>
    );
};

export default Attendance;