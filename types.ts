export enum Language {
    EN = 'en',
    HI = 'hi',
    GU = 'gu',
}

export enum UserRole {
    Admin = 'admin',
    Staff = 'staff',
}

export enum Permission {
    VIEW_SUMMARY = 'VIEW_SUMMARY',
    VIEW_INVENTORY = 'VIEW_INVENTORY',
    MANAGE_INVENTORY = 'MANAGE_INVENTORY',
    VIEW_MANUFACTURING = 'VIEW_MANUFACTURING',
    MANAGE_MANUFACTURING = 'MANAGE_MANUFACTURING',
    VIEW_SALES = 'VIEW_SALES',
    CREATE_SALE = 'CREATE_SALE',
    VIEW_REPORTS = 'VIEW_REPORTS',
    VIEW_SETTINGS = 'VIEW_SETTINGS',
    MANAGE_STAFF = 'MANAGE_STAFF',
    VIEW_PURCHASES = 'VIEW_PURCHASES',
    MANAGE_PURCHASES = 'MANAGE_PURCHASES',
    VIEW_DISTRIBUTORS = 'VIEW_DISTRIBUTORS',
    MANAGE_SUPPLIERS = 'MANAGE_SUPPLIERS',
    VIEW_STOCK_LEDGER = 'VIEW_STOCK_LEDGER',
    MANAGE_ATTENDANCE = 'MANAGE_ATTENDANCE',
    VIEW_CALCULATOR = 'VIEW_CALCULATOR',
    VIEW_BIN = 'VIEW_BIN',
    MANAGE_CUSTOMERS = 'MANAGE_CUSTOMERS',
}

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface StaffMember {
    id: string;
    name: string;
    pin?: string; // Optional: for staff who can log in
    roleId?: string; // Optional: for staff who can log in
    rates: {
        fullDay: number;
        halfDay: number;
        overtimeBonus: number;
    };
}

export interface User {
    id: string;
    name: string;
    role: UserRole;
    pin?: string; // For changeable PIN
    permissions: Permission[];
}

export enum ItemType {
    RawMaterial = 'raw_material',
    FinishedGood = 'finished_good',
    PackagingMaterial = 'packaging_material',
}

export interface Product {
    id: string;
    name: string;
    type: ItemType;
    sku?: string;
    quantity: number;
    unit: string;
    lowStockThreshold: number;
    linked_supplier_ids: string[];
    last_purchase_price?: number;
    selling_price?: number;
    hsnCode?: string;
    expiryDate?: string;
    isDeleted?: boolean;
}

export interface Supplier {
    id: string;
    company_name: string;
    contact_person: string;
    phone: string;
    whatsapp: string;
    whatsapp_same_as_phone: boolean;
    city: string;
    gstin?: string;
    notes?: string;
    pendingPayment: number;
}

export interface Customer {
    id: string;
    name: string;
    contact: string;
    address?: string;
    gstin?: string;
    creditLimit: number;
    creditDays: number;
    outstandingBalance: number;
    isDistributor?: boolean;
    affiliatedDistributorId?: string;
    isDeleted?: boolean;
}

export interface RecipeItem {
    rawMaterialId: string;
    quantityPerUnit: number; // e.g., 0.1 kg of powder per 1 packet of incense
}

export interface Recipe {
    id: string;
    finishedGoodId: string;
    items: RecipeItem[];
    name: string;
    yieldQuantity?: number;
    yieldUnit?: string;
}

export interface Attachment {
    id: string;
    type: 'photo' | 'voice';
    data: string; // base64 data URI for photo, or data URI for audio
    timestamp: string;
}

export interface ProductionRun {
    id: string;
    name: string;
    productId: string;
    plannedQuantity: number;
    producedQuantity: number;
    plannedAt: string;
    completedAt?: string;
    status: 'planned' | 'completed' | 'cancelled';
    attachments?: Attachment[];
}

export interface Payment {
    id:string;
    amount: number;
    date: string;
    mode: 'cash' | 'online' | 'cheque';
}

export interface DispatchInfo {
    transporterName: string;
    vehicleNumber: string;
    trackingNumber?: string;
}

export interface SaleItem {
    productId: string;
    quantity: number;
    price: number;
    costToDistributor?: number;
}


export interface Sale {
    id: string;
    invoiceNumber: string;
    customerId: string;
    date: string; // Order taken date
    items: SaleItem[];
    subTotal: number;
    discount: {
        type: 'percentage' | 'fixed';
        value: number;
    };
    tax: {
        rate: number;
        amount: number;
    };
    deliveryCharges: number;
    totalAmount: number;
    payments: Payment[];
    paymentStatus: 'paid' | 'unpaid' | 'partial' | 'advance';
    dispatchDate: string; // Expected delivery date
    isDispatched: boolean;
    isPriority: boolean;
    dispatchInfo?: DispatchInfo;
    distributorId?: string;
    attachments?: Attachment[];
    settlementId?: string;
}

export enum AttendanceStatus {
    FULL_DAY = 'full_day',
    HALF_DAY = 'half_day',
    ABSENT = 'absent',
    HOLIDAY = 'holiday'
}

export interface AttendanceRecord {
    id: string;
    staffId: string;
    date: string; // YYYY-MM-DD format
    status: AttendanceStatus;
    hadOvertime?: boolean;
    notes?: string;
}

export interface Alert {
    id: string;
    type: 'low_stock' | 'payment_due_customer' | 'payment_due_supplier' | 'production_warning' | 'dispatch_reminder';
    message: string;
    relatedId: string; // e.g., productId or customerId
}

export interface PurchaseOrder {
    id: string;
    supplierId: string;
    orderDate: string;
    expectedDeliveryDate: string;
    items: { productId: string; quantity: number; price: number }[];
    totalAmount: number;
    status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
}

export enum StockMovementType {
    Purchase = 'purchase',
    Sale = 'sale',
    ProductionIn = 'production_in',
    ProductionOut = 'production_out',
    Wastage = 'wastage',
    Adjustment = 'adjustment'
}

export interface StockMovement {
    id: string;
    productId: string;
    date: string;
    type: StockMovementType;
    quantityChange: number; // positive for IN, negative for OUT
    relatedId: string; // e.g., Sale ID, Purchase Order ID, ProductionRun ID
}

export interface OutboxMessage {
    id: string;
    type: 'supplier_order';
    supplier_id: string;
    message_text: string;
    created_at: string;
    sent_via: 'whatsapp' | 'copied' | 'none';
    sent_at?: string;
}

export interface DistributorSettlement {
    id: string;
    distributorId: string;
    periodStartDate: string;
    periodEndDate: string;
    settledOn: string;
    totalSalesValue: number;
    totalDistributorValue: number;
    finalMargin: number;
    adjustments: number;
    settlementAmount: number;
    saleIds: string[];
}