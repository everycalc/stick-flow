import React from 'react';

const translations: { [key: string]: string } = {
    'distributors.title': 'Distributors',
    'distributors.add': 'Add Distributor',
    'distributors.settlement.collected': 'Amount Collected from Customer',
    'distributors.settlement.billed': 'Amount Billed to Distributor',
    'distributors.settlement.margin': 'Final Margin / Payout',
    'cancel': 'Cancel',
    'confirm': 'Confirm Settlement',
    'search.placeholder': 'Search anything...',
    'no.results.found': 'No results found',
    'search.products': 'Products',
    'search.customers': 'Customers',
    'search.sales': 'Sales',
    'attachments.add_photo': 'Add Photo',
    'attachments.stop_recording': 'Stop Recording',
    'attachments.record_voice': 'Record Voice Note',
    'purchases.title': 'Purchases',
    'purchases.create_po': 'Create Purchase Order',
    'purchases.po_details': 'Purchase Order Details',
    'calculator.add_ingredient': 'Add Item',
    'save': 'Save',
    'sales.details': 'View Details',
    'purchases.generate_whatsapp': 'Generate WhatsApp Message',
    'purchases.whatsapp.title': 'Send PO on WhatsApp',
    'purchases.whatsapp.initial_order': 'Send Initial Order',
    'purchases.whatsapp.follow_up': 'Send Follow-up',
    'purchases.mark_received': 'Mark as Received',
    'purchases.confirm_receipt': 'Confirm Goods Receipt',
    'purchases.qty_received': 'Qty Received',
    'attendance.mark_attendance_for': 'Mark Attendance for',
    'attendance.status': 'Status',
    'attendance.status.full_day': 'Full Day',
    'attendance.status.half_day': 'Half Day',
    'attendance.status.absent': 'Absent',
    'attendance.status.holiday': 'Holiday',
    'attendance.overtime': 'Had Overtime?',
    'attendance.notes': 'Notes (Optional)',
    'suppliers.title': 'Suppliers',
    'suppliers.add': 'Add Supplier',
    'customers.title': 'Customers',
    'customers.add': 'Add Customer',
    'customers.add_payment': 'Add Payment',
    'customers.no_customers': 'No customers found. Add one to get started.',
};

export const useTranslation = () => {
    const t = (key: string): string => {
        return translations[key] || key;
    };

    return { t };
};
