import { Product, ItemType, Supplier, Customer, Sale, ProductionRun, Alert, Recipe, PurchaseOrder, StockMovement, StockMovementType, Payment, Role, Permission, StaffMember, AttendanceRecord, DistributorSettlement, Expense } from '../types';

// --- MOCK DATA ---
const initialProducts: Product[] = [];

const initialSuppliers: Supplier[] = [];

const initialCustomers: Customer[] = [];

const initialSales: Sale[] = [];

// --- DB HELPER FUNCTIONS ---
const get = <T,>(key: string, defaultValue: T): T => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
};

const set = <T,>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
};

let saleCounter = parseInt(localStorage.getItem('stickflow_sale_counter') || '0');
let poCounter = parseInt(localStorage.getItem('stickflow_po_counter') || '0');

export const db = {
    // --- Getters ---
    getCompanyName: (): string => get<string>('stickflow_company_name', ''),
    getProducts: (): Product[] => get<Product[]>('stickflow_products', initialProducts),
    getSuppliers: (): Supplier[] => get<Supplier[]>('stickflow_suppliers', initialSuppliers),
    getCustomers: (): Customer[] => get<Customer[]>('stickflow_customers', initialCustomers),
    getRecipes: (): Recipe[] => get<Recipe[]>('stickflow_recipes', []),
    getProductionRuns: (): ProductionRun[] => get<ProductionRun[]>('stickflow_production_runs', []),
    getSales: (): Sale[] => get<Sale[]>('stickflow_sales', initialSales),
    getPurchaseOrders: (): PurchaseOrder[] => get<PurchaseOrder[]>('stickflow_purchase_orders', []),
    getStockMovements: (): StockMovement[] => get<StockMovement[]>('stickflow_stock_movements', []),
    getRoles: (): Role[] => get<Role[]>('stickflow_roles', []),
    getStaff: (): StaffMember[] => get<StaffMember[]>('stickflow_staff', []),
    getAttendanceRecords: (): AttendanceRecord[] => get<AttendanceRecord[]>('stickflow_attendance', []),
    getDistributorSettlements: (): DistributorSettlement[] => get<DistributorSettlement[]>('stickflow_settlements', []),
    getExpenses: (): Expense[] => get<Expense[]>('stickflow_expenses', []),

    // --- Setters ---
    setCompanyName: (name: string): void => set<string>('stickflow_company_name', name),
    setProducts: (products: Product[]): void => set<Product[]>('stickflow_products', products),
    setSuppliers: (suppliers: Supplier[]): void => set<Supplier[]>('stickflow_suppliers', suppliers),
    setCustomers: (customers: Customer[]): void => set<Customer[]>('stickflow_customers', customers),
    setRecipes: (recipes: Recipe[]): void => set<Recipe[]>('stickflow_recipes', recipes),
    setProductionRuns: (runs: ProductionRun[]): void => set<ProductionRun[]>('stickflow_production_runs', runs),
    setSales: (sales: Sale[]): void => set<Sale[]>('stickflow_sales', sales),
    setPurchaseOrders: (orders: PurchaseOrder[]): void => set<PurchaseOrder[]>('stickflow_purchase_orders', orders),
    setStockMovements: (movements: StockMovement[]): void => set<StockMovement[]>('stickflow_stock_movements', movements),
    setRoles: (roles: Role[]): void => set<Role[]>('stickflow_roles', roles),
    setStaff: (staff: StaffMember[]): void => set<StaffMember[]>('stickflow_staff', staff),
    setAttendanceRecords: (records: AttendanceRecord[]): void => set<AttendanceRecord[]>('stickflow_attendance', records),
    setDistributorSettlements: (settlements: DistributorSettlement[]): void => set<DistributorSettlement[]>('stickflow_settlements', settlements),
    setExpenses: (expenses: Expense[]): void => set<Expense[]>('stickflow_expenses', expenses),


    // --- Invoice & PO Numbering ---
    getNextInvoiceNumber: (): string => {
        saleCounter++;
        localStorage.setItem('stickflow_sale_counter', saleCounter.toString());
        return `INV-${saleCounter.toString().padStart(3, '0')}`;
    },

    getNextPurchaseOrderNumber: (): string => {
        poCounter++;
        localStorage.setItem('stickflow_po_counter', poCounter.toString());
        return `PO-${poCounter.toString().padStart(3, '0')}`;
    },


    // --- Alerts ---
    getAlerts: (): Alert[] => {
        const alerts: Alert[] = [];
        // Low Stock
        db.getProducts().forEach(p => {
            if (p.quantity <= p.lowStockThreshold && !p.isDeleted) {
                alerts.push({ id: `ls_${p.id}`, type: 'low_stock', message: `${p.name} is low on stock (${p.quantity} ${p.unit} remaining).`, relatedId: p.id });
            }
        });

        // Upcoming Dispatches
        db.getSales().forEach(s => {
            const dispatchDate = new Date(s.dispatchDate);
            const today = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(today.getDate() + 3);
            if (!s.isDispatched && dispatchDate > today && dispatchDate <= threeDaysFromNow) {
                 alerts.push({ id: `ud_${s.id}`, type: 'dispatch_reminder', message: `Order ${s.invoiceNumber} is due for dispatch on ${s.dispatchDate}.`, relatedId: s.id });
            }
        });
        
        return alerts;
    },

    // --- Data Management ---
    getAllData: () => ({
        companyName: db.getCompanyName(),
        products: db.getProducts(),
        suppliers: db.getSuppliers(),
        customers: db.getCustomers(),
        recipes: db.getRecipes(),
        productionRuns: db.getProductionRuns(),
        sales: db.getSales(),
        purchaseOrders: db.getPurchaseOrders(),
        stockMovements: db.getStockMovements(),
        roles: db.getRoles(),
        staff: db.getStaff(),
        attendanceRecords: db.getAttendanceRecords(),
        settlements: db.getDistributorSettlements(),
        expenses: db.getExpenses(),
        saleCounter: localStorage.getItem('stickflow_sale_counter') || '0',
        poCounter: localStorage.getItem('stickflow_po_counter') || '0',
    }),

    restoreAllData: (data: any) => {
        db.setCompanyName(data.companyName || '');
        db.setProducts(data.products || []);
        db.setSuppliers(data.suppliers || []);
        db.setCustomers(data.customers || []);
        db.setRecipes(data.recipes || []);
        db.setProductionRuns(data.productionRuns || []);
        db.setSales(data.sales || []);
        db.setPurchaseOrders(data.purchaseOrders || []);
        db.setStockMovements(data.stockMovements || []);
        db.setRoles(data.roles || []);
        db.setStaff(data.staff || []);
        db.setAttendanceRecords(data.attendanceRecords || []);
        db.setDistributorSettlements(data.settlements || []);
        db.setExpenses(data.expenses || []);
        localStorage.setItem('stickflow_sale_counter', data.saleCounter || '0');
        saleCounter = parseInt(data.saleCounter || '0');
        localStorage.setItem('stickflow_po_counter', data.poCounter || '0');
        poCounter = parseInt(data.poCounter || '0');
    },

    clearAllData: () => {
        localStorage.removeItem('stickflow_company_name');
        localStorage.removeItem('stickflow_products');
        localStorage.removeItem('stickflow_suppliers');
        localStorage.removeItem('stickflow_customers');
        localStorage.removeItem('stickflow_recipes');
        localStorage.removeItem('stickflow_production_runs');
        localStorage.removeItem('stickflow_sales');
        localStorage.removeItem('stickflow_purchase_orders');
        localStorage.removeItem('stickflow_stock_movements');
        localStorage.removeItem('stickflow_roles');
        localStorage.removeItem('stickflow_staff');
        localStorage.removeItem('stickflow_attendance');
        localStorage.removeItem('stickflow_settlements');
        localStorage.removeItem('stickflow_expenses');
        localStorage.removeItem('stickflow_sale_counter');
        localStorage.removeItem('stickflow_po_counter');
        // Keep admin user and settings
        // localStorage.removeItem('stickflow_admin_user');
        // localStorage.removeItem('stickflow_initialized');
        // localStorage.removeItem('stickflow_language');
        // localStorage.removeItem('stickflow_theme');
    }
};