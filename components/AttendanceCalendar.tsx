import React from 'react';
import { AttendanceRecord, AttendanceStatus } from '../types';

interface AttendanceCalendarProps {
    staffId: string;
    date: Date;
    records: AttendanceRecord[];
    onDayClick: (day: Date) => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ staffId, date, records, onDayClick }) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1));
    const leadingEmptyDays = Array.from({ length: firstDay.getDay() });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getStatusColor = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.FULL_DAY: return 'bg-green-500';
            case AttendanceStatus.HALF_DAY: return 'bg-yellow-500';
            case AttendanceStatus.ABSENT: return 'bg-red-500';
            case AttendanceStatus.HOLIDAY: return 'bg-blue-500';
            default: return 'bg-transparent';
        }
    };

    return (
        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {leadingEmptyDays.map((_, i) => <div key={`empty-${i}`} />)}
                {daysInMonth.map(day => {
                    const record = records.find(r => r.staffId === staffId && r.date === day.toISOString().split('T')[0]);
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isFuture = day > today;

                    return (
                        <button 
                            key={day.toString()} 
                            onClick={() => onDayClick(day)}
                            disabled={isFuture}
                            className={`h-12 w-full rounded-lg flex flex-col items-center justify-center relative transition-colors ${isToday ? 'bg-light-primary-container dark:bg-dark-primary-container' : ''} ${isFuture ? 'text-light-text-secondary/50 dark:text-dark-text-secondary/50 cursor-not-allowed' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
                        >
                            <span className="text-sm font-medium">{day.getDate()}</span>
                            {record && (
                                <div className={`absolute bottom-1.5 h-2 w-2 rounded-full ${getStatusColor(record.status)}`}></div>
                            )}
                        </button>
                    )
                })}
            </div>
             <div className="flex justify-around mt-4 text-xs">
                <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500"/>Full Day</div>
                <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-yellow-500"/>Half Day</div>
                <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500"/>Absent</div>
                <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500"/>Holiday</div>
            </div>
        </div>
    );
};

export default AttendanceCalendar;