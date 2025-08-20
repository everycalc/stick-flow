import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../services/db';
import { Product, ItemType, Recipe, RecipeItem } from '../types';
import { Plus, Trash2, X, Edit, Copy } from 'lucide-react';

interface Ingredient {
    id: number;
    rawMaterialId: string;
    quantity: number; // in grams
}

const CalculatorPage: React.FC = () => {
    const [products, setProducts] = useState(() => db.getProducts());
    const [recipes, setRecipes] = useState(() => db.getRecipes());

    const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
    const [recipeName, setRecipeName] = useState('');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProductData, setNewProductData] = useState({ name: '', unit: 'kg', lowStockThreshold: 10, selling_price: 0 });
    
    const rawMaterials = useMemo(() => products.filter(p => p.type === ItemType.RawMaterial && !p.isDeleted), [products]);

    const getCostForIngredient = (ing: Ingredient): number => {
        const product = rawMaterials.find(p => p.id === ing.rawMaterialId);
        if (!product || !product.last_purchase_price) return 0;

        let pricePerGram = 0;
        const unit = product.unit.toLowerCase();
        if (unit === 'kg' || unit === 'ltr') pricePerGram = product.last_purchase_price / 1000;
        else if (unit === 'g' || unit === 'ml') pricePerGram = product.last_purchase_price;
        else return 0;

        return (ing.quantity || 0) * pricePerGram;
    };
    
    const totalWeightGrams = useMemo(() => ingredients.reduce((total, ing) => total + (ing.quantity || 0), 0), [ingredients]);
    const totalBatchWeightKg = useMemo(() => totalWeightGrams / 1000, [totalWeightGrams]);
    const totalCost = useMemo(() => ingredients.reduce((total, ing) => total + getCostForIngredient(ing), 0), [ingredients, products]);
    const costPerKg = useMemo(() => (totalBatchWeightKg > 0 ? totalCost / totalBatchWeightKg : 0), [totalCost, totalBatchWeightKg]);

    const clearForm = () => {
        setEditingRecipeId(null);
        setRecipeName('');
        setIngredients([]);
    };

    const loadRecipeIntoForm = (recipe: Recipe) => {
        const recipeProduct = products.find(p => p.id === recipe.finishedGoodId);
        if (!recipeProduct) return;

        setEditingRecipeId(recipe.id);
        setRecipeName(recipe.name);
        
        // Convert recipe items back to grams for the calculator, normalized for a 1kg batch
        const batchWeight = recipe.yieldQuantity || 1; // Default to 1kg if not specified
        const formIngredients: Ingredient[] = recipe.items.map((item, index) => ({
            id: Date.now() + index,
            rawMaterialId: item.rawMaterialId,
            quantity: item.quantityPerUnit * (batchWeight * 1000),
        }));
        setIngredients(formIngredients);
    };

    const handleEdit = (recipeId: string) => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe) loadRecipeIntoForm(recipe);
    };

    const handleDuplicate = (recipeId: string) => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe) {
            loadRecipeIntoForm(recipe);
            setEditingRecipeId(null); // Clear ID to make it a new recipe
            setRecipeName(`${recipe.name} - Copy`);
        }
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { id: Date.now(), rawMaterialId: '', quantity: 0 }]);
    };

    const updateIngredient = (id: number, field: keyof Ingredient, value: string | number) => {
        setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
    };
    
    const removeIngredient = (id: number) => {
        setIngredients(ingredients.filter(ing => ing.id !== id));
    };
    
    const handleSave = () => {
        if (!recipeName || totalWeightGrams <= 0 || ingredients.some(i => !i.rawMaterialId)) {
            alert("Please provide a formula name and add at least one valid ingredient with a quantity.");
            return;
        }

        if (editingRecipeId) {
            // Update existing recipe
            const updatedRecipeItems: RecipeItem[] = ingredients.map(ing => ({
                rawMaterialId: ing.rawMaterialId,
                quantityPerUnit: (ing.quantity || 0) / totalWeightGrams,
            }));
            const updatedRecipe: Recipe = {
                id: editingRecipeId,
                name: recipeName,
                finishedGoodId: recipes.find(r => r.id === editingRecipeId)!.finishedGoodId,
                items: updatedRecipeItems,
                yieldQuantity: totalBatchWeightKg,
                yieldUnit: 'kg',
            };
            const updatedRecipes = recipes.map(r => r.id === editingRecipeId ? updatedRecipe : r);
            setRecipes(updatedRecipes);
            db.setRecipes(updatedRecipes);
            alert(`Formula "${recipeName}" updated successfully!`);
            clearForm();
        } else {
            // Create new recipe, open product modal
            setNewProductData({ name: recipeName, unit: 'kg', lowStockThreshold: 10, selling_price: 0 });
            setIsModalOpen(true);
        }
    };

    const handleCreateProductAndRecipe = () => {
        if (!newProductData.name || !newProductData.unit) return;

        const newProduct: Product = {
            id: `prod_${Date.now()}`,
            name: newProductData.name,
            type: ItemType.FinishedGood,
            unit: newProductData.unit,
            lowStockThreshold: newProductData.lowStockThreshold,
            quantity: 0,
            selling_price: newProductData.selling_price,
            linked_supplier_ids: [],
        };
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        db.setProducts(updatedProducts);
        
        const recipeItems: RecipeItem[] = ingredients.map(ing => ({
            rawMaterialId: ing.rawMaterialId,
            quantityPerUnit: (ing.quantity || 0) / totalWeightGrams
        }));

        const newRecipe: Recipe = {
            id: `rec_${Date.now()}`,
            name: recipeName,
            finishedGoodId: newProduct.id,
            items: recipeItems,
            yieldQuantity: totalBatchWeightKg,
            yieldUnit: 'kg',
        };
        const updatedRecipes = [...recipes, newRecipe];
        setRecipes(updatedRecipes);
        db.setRecipes(updatedRecipes);

        alert(`Formula "${recipeName}" and Product "${newProduct.name}" created successfully!`);
        setIsModalOpen(false);
        clearForm();
    };
    
    const inputClass = "w-full p-2 rounded-lg border border-light-outline dark:border-dark-outline bg-transparent focus:ring-1 focus:ring-light-primary dark:focus:ring-dark-primary focus:outline-none";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-light-surface dark:bg-dark-surface p-4 rounded-2xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Saved Formulas</h2>
                    <button onClick={clearForm} className="text-sm font-semibold text-light-primary dark:text-dark-primary hover:underline">New</button>
                </div>
                <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-2">
                    {recipes.map(recipe => (
                        <div key={recipe.id} className="p-3 bg-black/5 dark:bg-white/5 rounded-lg flex justify-between items-center">
                            <span className="font-medium text-sm">{recipe.name}</span>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(recipe.id)} title="Edit" className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-light-text-secondary dark:text-dark-text-secondary"><Edit size={16} /></button>
                                <button onClick={() => handleDuplicate(recipe.id)} title="Duplicate" className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-light-text-secondary dark:text-dark-text-secondary"><Copy size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-2 bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-2xl shadow-md">
                <h1 className="text-xl font-bold mb-6">{editingRecipeId ? 'Edit Formula' : 'Create New Formula'}</h1>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Formula Name</label>
                    <input type="text" value={recipeName} onChange={e => setRecipeName(e.target.value)} className={inputClass} placeholder="e.g., Premium Rose Formula" />
                </div>

                <h2 className="text-lg font-semibold mb-2">Ingredients</h2>
                <div className="space-y-3">
                    {ingredients.map((ing) => {
                        const cost = getCostForIngredient(ing);
                        return (
                        <div key={ing.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-12 sm:col-span-5">
                                <select value={ing.rawMaterialId} onChange={e => updateIngredient(ing.id, 'rawMaterialId', e.target.value)} className={inputClass}>
                                    <option value="">Select Material</option>
                                    {rawMaterials.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-5 sm:col-span-3">
                                <div className="relative">
                                    <input type="number" value={ing.quantity} onChange={e => updateIngredient(ing.id, 'quantity', parseFloat(e.target.value) || 0)} className={inputClass + " pr-7"} placeholder="grams"/>
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-light-text-secondary dark:text-dark-text-secondary text-sm">g</span>
                                </div>
                            </div>
                             <div className="col-span-5 sm:col-span-3">
                                 <div className="flex items-center h-10 px-2 rounded-lg bg-black/5 dark:bg-white/5">
                                    <span className="font-semibold">₹{cost.toFixed(2)}</span>
                                 </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1 text-right">
                                <button onClick={() => removeIngredient(ing.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    )})}
                </div>
                <button onClick={addIngredient} className="flex items-center gap-2 mt-4 text-sm font-semibold text-light-primary dark:text-dark-primary hover:underline">
                    <Plus size={16}/> Add Ingredient
                </button>

                <div className="mt-8 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50 flex flex-col items-end gap-2">
                    <div className="text-lg"><span className="text-light-text-secondary dark:text-dark-text-secondary">Total Batch Weight: </span><span className="font-bold text-xl">{totalBatchWeightKg.toFixed(3)} kg</span></div>
                    <div className="text-lg"><span className="text-light-text-secondary dark:text-dark-text-secondary">Total Batch Cost: </span><span className="font-bold text-xl">₹{totalCost.toFixed(2)}</span></div>
                    <div className="text-base"><span className="text-light-text-secondary dark:text-dark-text-secondary">Cost per KG: </span><span className="font-bold">₹{costPerKg.toFixed(2)}</span></div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} className="bg-light-primary text-white dark:bg-dark-primary dark:text-black px-6 py-2.5 text-sm font-semibold rounded-full shadow-sm hover:opacity-90 transition">
                        {editingRecipeId ? 'Update Formula' : 'Save Formula & Create Product'}
                    </button>
                </div>
            </div>

            {isModalOpen && (
                 <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-4">
                    <div className="bg-light-surface dark:bg-dark-surface rounded-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-semibold">Create New Finished Product</h3>
                             <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"><X size={20}/></button>
                        </div>
                        <div className="space-y-4">
                             <div><label className="block text-sm font-medium mb-1">Product Name</label><input type="text" value={newProductData.name} onChange={e => setNewProductData({...newProductData, name: e.target.value})} className={inputClass}/></div>
                             <div><label className="block text-sm font-medium mb-1">Product Unit (e.g., packet, box)</label><input type="text" value={newProductData.unit} onChange={e => setNewProductData({...newProductData, unit: e.target.value})} className={inputClass} /></div>
                             <div><label className="block text-sm font-medium mb-1">Low Stock Threshold</label><input type="number" value={newProductData.lowStockThreshold} onChange={e => setNewProductData({...newProductData, lowStockThreshold: parseInt(e.target.value) || 0})} className={inputClass} /></div>
                             <div><label className="block text-sm font-medium mb-1">Selling Price (per unit)</label><input type="number" value={newProductData.selling_price} onChange={e => setNewProductData({...newProductData, selling_price: parseFloat(e.target.value) || 0})} className={inputClass} /></div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-outline/50 dark:border-dark-outline/50">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">Cancel</button>
                            <button onClick={handleCreateProductAndRecipe} className="px-4 py-2 rounded-full bg-light-primary text-white dark:bg-dark-primary dark:text-black">Create Product</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalculatorPage;