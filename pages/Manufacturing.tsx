import React, { useState, useMemo } from 'react';
import { db } from '../services/db';
import { Factory, PlusCircle, Download, FileText, CheckCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ProductionRun, Product, Recipe, Attachment, Supplier, StockMovementType, StockMovement } from '../types';
import AttachmentManager from '../components/AttachmentManager';

const CompleteRunModal: React.FC<{
    run: ProductionRun;
    productUnit: string;
    onClose: () => void;
    onComplete: (runId: string, producedQty: number) => void;
}> = ({ run, productUnit, onClose, onComplete }) => {
    const [producedQuantity, setProducedQuantity] = useState(run.plannedQuantity);

    const handleSubmit = () => {
        onComplete(run.id, producedQuantity);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Complete Run</h3>
                <div>
                    <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Produced Quantity</label>
                    <input
                        type="number"
                        value={producedQuantity}
                        onChange={e => setProducedQuantity(Number(e.target.value))}
                        className="block w-full rounded-lg border border-light-outline dark:border-dark-outline bg-transparent p-2.5 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"
                    />
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Planned: {run.plannedQuantity} {productUnit}</p>
                </div>
                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold rounded-full hover:bg-black/10 dark:hover:bg-white/10">Cancel</button>
                    <button onClick={handleSubmit} className="bg-light-primary text-white dark:bg-dark-primary dark:text-black px-5 py-2 text-sm font-semibold rounded-full">Confirm</button>
                </div>
            </div>
        </div>
    );
};

const ProductionRunDetailsModal: React.FC<{ run: ProductionRun, onClose: () => void }> = ({ run, onClose }) => {
    const products = db.getProducts();
    const product = products.find(p => p.id === run.productId);
    const productName = product?.name || 'Unknown';
    const productUnit = product?.unit || '';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-lg p-6 w-full max-w-xl">
                <h3 className="text-lg font-semibold mb-4">Production Run Details</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="font-medium text-light-text-secondary dark:text-dark-text-secondary">Run Name:</span> <span>{run.name}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-light-text-secondary dark:text-dark-text-secondary">Product:</span> <span>{productName}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-light-text-secondary dark:text-dark-text-secondary">Status:</span> <span>{run.status}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-light-text-secondary dark:text-dark-text-secondary">Planned Quantity:</span> <span>{run.plannedQuantity} {productUnit}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-light-text-secondary dark:text-dark-text-secondary">Produced Quantity:</span> <span>{run.producedQuantity} {productUnit}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-light-text-secondary dark:text-dark-text-secondary">Planned Date:</span> <span>{new Date(run.plannedAt).toLocaleString()}</span></div>
                    {run.completedAt && <div className="flex justify-between"><span className="font-medium text-light-text-secondary dark:text-dark-text-secondary">Completed Date:</span> <span>{new Date(run.completedAt).toLocaleString()}</span></div>}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="bg-light-primary text-white dark:bg-dark-primary dark:text-black px-5 py-2 text-sm font-semibold rounded-full">Close</button>
                </div>
            </div>
        </div>
    );
};


const Manufacturing: React.FC = () => {
    const [productionRuns, setProductionRuns] = useState(db.getProductionRuns());
    const [products, setProducts] = useState(db.getProducts());
    const recipes = db.getRecipes();
    const suppliers = db.getSuppliers();
    
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [plannedQuantity, setPlannedQuantity] = useState(100);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [activeRun, setActiveRun] = useState<ProductionRun | null>(null);

    const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || 'Unknown Product';
    
    const reservedQuantities = useMemo(() => {
        const reserved = new Map<string, number>();
        const plannedRuns = productionRuns.filter(r => r.status === 'planned');
        plannedRuns.forEach(run => {
            const recipe = recipes.find(rec => rec.finishedGoodId === run.productId);
            if(recipe) {
                recipe.items.forEach(item => {
                    const required = item.quantityPerUnit * run.plannedQuantity;
                    reserved.set(item.rawMaterialId, (reserved.get(item.rawMaterialId) || 0) + required);
                });
            }
        });
        return reserved;
    }, [productionRuns, recipes]);
    
    const getStatusChip = (status: 'planned' | 'completed' | 'cancelled') => {
        const styles = {
            planned: 'bg-blue-500/20 text-blue-800 dark:text-blue-200',
            completed: 'bg-green-500/20 text-green-800 dark:text-green-200',
            cancelled: 'bg-gray-500/20 text-gray-800 dark:text-gray-300'
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
    };

    const handleDownloadRequirementsPdf = (requirements: any[], runName: string) => {
        const doc = new jsPDF();
        doc.text(`Material Requirements for ${runName}`, 14, 16);
        doc.setFontSize(12);
        const body = requirements.map(item => [
            item.material?.name || 'Unknown',
            item.required.toFixed(2) + ` ${item.material?.unit || ''}`
        ]);
        (doc as any).autoTable({
            startY: 24,
            head: [['Raw Material', 'Required Quantity']],
            body: body,
        });
        doc.save(`requirements_${runName.replace(/ /g, '_')}.pdf`);
    };

    const finishedGoods = products.filter(p => p.type === 'finished_good' && !p.isDeleted);
    const selectedRecipe = recipes.find(r => r.finishedGoodId === selectedProduct?.id);

    const materialRequirements = useMemo(() => {
        if (!selectedRecipe || !plannedQuantity) return [];
        return selectedRecipe.items.map(item => {
            const material = products.find(p => p.id === item.rawMaterialId);
            const required = item.quantityPerUnit * plannedQuantity;
            const available = (material?.quantity || 0) - (reservedQuantities.get(item.rawMaterialId) || 0);
            const shortage = Math.max(0, required - available);
            const itemSuppliers = material ? suppliers.filter(s => material.linked_supplier_ids.includes(s.id)) : [];
            return { rawMaterialId: item.rawMaterialId, material, required, available, shortage, suppliers: itemSuppliers };
        });
    }, [selectedRecipe, plannedQuantity, products, suppliers, reservedQuantities]);
    
    const openWhatsApp = (supplier: Supplier, material: Product, quantity: number) => {
        const message = `Hi ${supplier.company_name},\nPlease book an order for ${quantity.toFixed(2)} ${material.unit} of ${material.name}.\nTarget delivery: ASAP.\n\nThank you,\n${db.getCompanyName()}`;
        window.open(`https://wa.me/${supplier.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
    };
    
    const handleCreateRun = () => {
        if (!selectedProduct || !plannedQuantity) {
            alert("Please select a product and enter a quantity.");
            return;
        }

        const runName = `${selectedProduct.name} Run - ${new Date().toLocaleDateString()}`;
        const newRun: ProductionRun = {
            id: `pr_${Date.now()}`,
            name: runName,
            productId: selectedProduct.id,
            plannedQuantity: plannedQuantity,
            producedQuantity: 0,
            plannedAt: new Date().toISOString(),
            status: 'planned',
            attachments: attachments
        };

        const updatedRuns = [...productionRuns, newRun];
        setProductionRuns(updatedRuns);
        db.setProductionRuns(updatedRuns);
        
        setIsPlanModalOpen(false);
        setSelectedProduct(null);
        setPlannedQuantity(100);
        setAttachments([]);
    };

    const handleCompleteRun = (runId: string, producedQty: number) => {
        const run = productionRuns.find(r => r.id === runId);
        if (!run) return;

        const recipe = recipes.find(r => r.finishedGoodId === run.productId);
        if (!recipe) {
            alert("Recipe not found for this product. Cannot complete run.");
            return;
        }

        let updatedProducts = [...products];
        const newStockMovements: StockMovement[] = [];
        
        // Deduct raw materials
        recipe.items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.rawMaterialId);
            if (productIndex > -1) {
                const requiredQty = item.quantityPerUnit * producedQty;
                updatedProducts[productIndex].quantity -= requiredQty;
                newStockMovements.push({
                    id: `sm_out_${Date.now()}_${item.rawMaterialId}`,
                    productId: item.rawMaterialId,
                    date: new Date().toISOString(),
                    type: StockMovementType.ProductionOut,
                    quantityChange: -requiredQty,
                    relatedId: run.id
                });
            }
        });
        
        // Add finished good
        const finishedGoodIndex = updatedProducts.findIndex(p => p.id === run.productId);
        if (finishedGoodIndex > -1) {
            updatedProducts[finishedGoodIndex].quantity += producedQty;
            newStockMovements.push({
                id: `sm_in_${Date.now()}_${run.productId}`,
                productId: run.productId,
                date: new Date().toISOString(),
                type: StockMovementType.ProductionIn,
                quantityChange: producedQty,
                relatedId: run.id
            });
        }
        
        const updatedRun: ProductionRun = {
            ...run,
            status: 'completed',
            producedQuantity: producedQty,
            completedAt: new Date().toISOString()
        };
        const updatedRuns = productionRuns.map(r => r.id === runId ? updatedRun : r);
        
        setProducts(updatedProducts);
        db.setProducts(updatedProducts);
        setProductionRuns(updatedRuns);
        db.setProductionRuns(updatedRuns);
        db.setStockMovements([...db.getStockMovements(), ...newStockMovements]);
        
        setIsCompleteModalOpen(false);
        setActiveRun(null);
    };

    return (
        <>
            <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Manufacturing</h2>
                    <button onClick={() => setIsPlanModalOpen(true)} className="flex items-center bg-light-primary text-white dark:bg-dark-primary dark:text-black px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:opacity-90 transition">
                        <PlusCircle size={20} className="mr-2"/> Plan Production Run
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {productionRuns.length > 0 ? (
                        <table className="min-w-full">
                           <thead>
                                <tr className="border-b border-light-outline/50 dark:border-dark-outline/50">
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Run Name</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Planned Date</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Completed Date</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                                {productionRuns.map(run => (
                                    <tr key={run.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                                        <td className="p-3 whitespace-nowrap font-medium">{run.name}</td>
                                        <td className="p-3 whitespace-nowrap text-sm">{new Date(run.plannedAt).toLocaleDateString()}</td>
                                        <td className="p-3 whitespace-nowrap text-sm">{run.completedAt ? new Date(run.completedAt).toLocaleDateString() : 'N/A'}</td>
                                        <td className="p-3 whitespace-nowrap">{getStatusChip(run.status)}</td>
                                        <td className="p-3 whitespace-nowrap space-x-2">
                                            {run.status === 'planned' && (
                                                <button onClick={() => { setActiveRun(run); setIsCompleteModalOpen(true); }} title="Complete Run" className="p-2 rounded-full text-green-600 dark:text-green-400 hover:bg-green-500/10"><CheckCircle size={20}/></button>
                                            )}
                                            <button onClick={() => { setActiveRun(run); setIsDetailsModalOpen(true); }} title={'View Details'} className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-black/10 dark:hover:bg-white/10"><FileText size={20}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <div className="text-center py-16">
                            <Factory size={48} className="mx-auto text-light-text-secondary dark:text-dark-text-secondary"/>
                            <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">No production runs found.</p>
                        </div>
                    )}
                </div>
            </div>

            {isPlanModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-6">Plan New Production Run</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Select Product</label>
                                <select onChange={(e) => setSelectedProduct(products.find(p => p.id === e.target.value) || null)} className="block w-full rounded-lg border border-light-outline dark:border-dark-outline bg-transparent p-2.5 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none">
                                    <option>Select a finished good</option>
                                    {finishedGoods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Planned Quantity</label>
                               <input type="number" value={plannedQuantity} onChange={e => setPlannedQuantity(Number(e.target.value))} className="block w-full rounded-lg border border-light-outline dark:border-dark-outline bg-transparent p-2.5 focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none"/>
                            </div>
                        </div>

                        {selectedProduct && !selectedRecipe && (
                            <div className="mt-6 text-center p-4 bg-yellow-500/10 text-yellow-700 dark:text-yellow-200 rounded-lg">
                                No recipe found for this product.
                            </div>
                        )}

                        {selectedProduct && selectedRecipe && (
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-base">Raw Material Availability</h4>
                                    <button onClick={() => handleDownloadRequirementsPdf(materialRequirements, `Plan_for_${selectedProduct.name}`)} className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-light-outline dark:border-dark-outline hover:bg-black/5 dark:hover:bg-white/10">
                                        <Download size={14} /> Download Requirements
                                    </button>
                                </div>
                                <div className="overflow-x-auto border border-light-outline/50 dark:border-dark-outline/50 rounded-lg">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-black/5 dark:bg-white/5">
                                            <tr>
                                                <th className="p-2 text-left font-semibold">Material</th>
                                                <th className="p-2 text-left font-semibold">Required</th>
                                                <th className="p-2 text-left font-semibold">Available</th>
                                                <th className="p-2 text-left font-semibold">Shortage</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-light-outline/50 dark:divide-dark-outline/50">
                                            {materialRequirements.map(item => (
                                                <tr key={item.rawMaterialId} className={item.shortage > 0 ? 'bg-red-500/10' : ''}>
                                                    <td className="p-2 font-medium">{item.material?.name}</td>
                                                    <td className="p-2">{item.required.toFixed(2)} {item.material?.unit}</td>
                                                    <td className="p-2">{item.available.toFixed(2)} {item.material?.unit}</td>
                                                    <td className="p-2 font-bold text-red-600 dark:text-red-400">{item.shortage > 0 ? item.shortage.toFixed(2) : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-6">
                             <h4 className="font-semibold text-base">Attachments</h4>
                             <AttachmentManager attachments={attachments} setAttachments={setAttachments} />
                        </div>

                        <div className="mt-8 flex justify-end space-x-3">
                            <button onClick={() => setIsPlanModalOpen(false)} className="px-5 py-2 text-sm font-semibold rounded-full text-light-text dark:text-dark-text hover:bg-black/10 dark:hover:bg-white/10 transition">Cancel</button>
                            <button onClick={handleCreateRun} className="bg-light-primary text-white dark:bg-dark-primary dark:text-black px-5 py-2 text-sm font-semibold rounded-full shadow-sm hover:opacity-90 transition">Create Production Run</button>
                        </div>
                    </div>
                </div>
            )}
            {isCompleteModalOpen && activeRun && <CompleteRunModal run={activeRun} productUnit={products.find(p => p.id === activeRun.productId)?.unit || ''} onClose={() => setIsCompleteModalOpen(false)} onComplete={handleCompleteRun} />}
            {isDetailsModalOpen && activeRun && <ProductionRunDetailsModal run={activeRun} onClose={() => setIsDetailsModalOpen(false)} />}
        </>
    );
};

export default Manufacturing;