import React, { useState, useRef, useMemo } from 'react';
import { 
  Boxes, 
  Plus, 
  Minus, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Search, 
  Trash2, 
  Edit3, 
  ChefHat, 
  X, 
  UtensilsCrossed,
  Sparkles,
  Info,
  Upload,
  Image as ImageIcon,
  Tag
} from 'lucide-react';
import type { MenuItem, RawProduct, RecipeIngredient } from '../types';

interface InventoryManagerProps {
  menuItems: MenuItem[];
  rawProducts: RawProduct[];
  onUpdateMenuStock: (id: number, newStock: number) => void;
  onAdjustRawStock: (productId: number, type: 'Add' | 'Minus', qty: number, notes: string) => void;
  onCreateMenuItem?: (item: Partial<MenuItem>) => Promise<void>;
  onUpdateMenuItem?: (item: MenuItem) => Promise<void>;
  onDeleteMenuItem?: (id: number) => Promise<void>;
  onBatchPrep?: (menuId: number, portions: number) => Promise<void>;
  onCreateRawProduct?: (product: Partial<RawProduct>) => Promise<void>;
  onUpdateRawProduct?: (product: RawProduct) => Promise<void>;
  onDeleteRawProduct?: (id: number) => Promise<void>;
  onRefresh: () => void;
}

const PRESET_GALLERY = [
  { name: 'Kuro Ramen', path: '/images/Ramen/Kuro.png', cat: 'Ramen' },
  { name: 'Aka Ramen', path: '/images/Ramen/Aka.png', cat: 'Ramen' },
  { name: 'TanTan Ramen', path: '/images/Ramen/TanTan.png', cat: 'Ramen' },
  { name: 'Tonkotsu Hakata', path: '/images/Ramen/TonkotsuHakata.png', cat: 'Ramen' },
  { name: 'Tonkotsu Shoyu', path: '/images/Ramen/TonkotsuShoyu.png', cat: 'Ramen' },
  { name: 'Kaisen Ramen', path: '/images/Ramen/Kaisen.png', cat: 'Ramen' },
  { name: 'Pork Katsu', path: '/images/Rice Meals/Pork Katsu.png', cat: 'Rice Meals' },
  { name: 'Beef Gyudon', path: '/images/Rice Meals/BeefGyudon.png', cat: 'Rice Meals' },
  { name: 'Chicken Karaage', path: '/images/Rice Meals/ChickenKaraage.png', cat: 'Rice Meals' },
  { name: 'Beef Teriyaki', path: '/images/Rice Meals/BeefTeriyaki.png', cat: 'Rice Meals' },
  { name: 'Chicken Teriyaki', path: '/images/Rice Meals/ChickenTeriyaki.png', cat: 'Rice Meals' },
  { name: 'Coca-Cola', path: '/images/Drinks/CocaCola.png', cat: 'Drinks' },
  { name: 'Sprite', path: '/images/Drinks/Sprite.png', cat: 'Drinks' },
  { name: 'Matcha Frappe', path: '/images/Drinks/MatchFrappe.png', cat: 'Drinks' },
  { name: 'Ramen Duo Combo', path: '/images/Bundle/RamenDuo.png', cat: 'Bundle' },
  { name: 'Default Tile', path: '/images/icons/NoPicture.png', cat: 'Icons' }
];

const COMMON_INGREDIENT_PRESETS = [
  { label: '🧅 Spring Onion (Negi)', name: 'Spring Onion (Negi)', cat: 'Vegetable', uom: 'g', price: '60', min: '500', brand: 'Fresh Market', qty: '2000' },
  { label: '🧅 White / Yellow Onion', name: 'White Onion', cat: 'Vegetable', uom: 'g', price: '70', min: '500', brand: 'Fresh Market', qty: '2000' },
  { label: '🧄 Fresh Garlic', name: 'Fresh Garlic', cat: 'Vegetable', uom: 'g', price: '80', min: '300', brand: 'Fresh Market', qty: '1500' },
  { label: '🎍 Bamboo Shoots (Menma)', name: 'Bamboo Shoots (Menma)', cat: 'Topping', uom: 'g', price: '150', min: '400', brand: 'House Special', qty: '2000' },
  { label: '🍥 Narutomaki Fish Cake', name: 'Narutomaki Fish Cake', cat: 'Topping', uom: 'pcs', price: '120', min: '30', brand: 'Tokyo Imports', qty: '100' },
  { label: '🌽 Sweet Corn Topping', name: 'Sweet Corn Topping', cat: 'Topping', uom: 'g', price: '90', min: '500', brand: 'Del Monte', qty: '2500' },
  { label: '🥩 Pork Chashu Belly', name: 'Pork Belly (Chashu)', cat: 'Meat', uom: 'g', price: '320', min: '2000', brand: 'Local Farm', qty: '5000' },
  { label: '🥚 Fresh Eggs', name: 'Fresh Eggs', cat: 'Ingredient', uom: 'pcs', price: '10', min: '30', brand: 'Magnolia', qty: '120' },
  { label: '🌾 Japanese Rice', name: 'Japanese Rice', cat: 'Grain', uom: 'g', price: '75', min: '2500', brand: 'Haru', qty: '10000' },
  { label: '🍜 Ramen Noodles', name: 'Ramen Noodles', cat: 'Ingredient', uom: 'g', price: '25', min: '1000', brand: 'Fiddle Fresh', qty: '5000' },
  { label: '🫒 Black Garlic Oil', name: 'Black Garlic Oil', cat: 'Oil', uom: 'ml', price: '350', min: '500', brand: 'House Special', qty: '2000' },
  { label: '🌶️ Chili Oil (Rayu)', name: 'Chili Oil (Rayu)', cat: 'Oil', uom: 'ml', price: '200', min: '300', brand: 'House Special', qty: '1500' },
];

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  menuItems,
  rawProducts,
  onUpdateMenuStock,
  onAdjustRawStock,
  onCreateMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onBatchPrep,
  onCreateRawProduct,
  onUpdateRawProduct,
  onDeleteRawProduct,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'raw'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw Product Modals state
  const [selectedProduct, setSelectedProduct] = useState<RawProduct | null>(null);
  const [adjustQty, setAdjustQty] = useState<string>('50');
  const [adjustNotes, setAdjustNotes] = useState<string>('Delivery restock');

  // Add / Edit Raw Ingredient Modal
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<RawProduct | null>(null);
  const [ingName, setIngName] = useState('');
  const [ingBrand, setIngBrand] = useState('Fresh Market');
  const [ingCategory, setIngCategory] = useState('Topping');
  const [ingPrice, setIngPrice] = useState('50');
  const [ingQuantity, setIngQuantity] = useState('1000');
  const [ingUom, setIngUom] = useState('g');
  const [ingMinStock, setIngMinStock] = useState('500');

  // Food Form Modal (Add / Edit Dish)
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [foodName, setFoodName] = useState('');
  const [foodCategory, setFoodCategory] = useState('Ramen');
  const [foodPrice, setFoodPrice] = useState('250');
  const [foodStock, setFoodStock] = useState('20');
  const [foodSize, setFoodSize] = useState('Regular');
  const [foodUom, setFoodUom] = useState('serving');
  const [foodImage, setFoodImage] = useState('/images/Ramen/Kuro.png');
  const [foodRecipe, setFoodRecipe] = useState<RecipeIngredient[]>([]);

  // Bundle / Promo Meal Components State
  const [bundleItems, setBundleItems] = useState<{ dishId: number; qty: number }[]>([]);

  // Check if current category is Bundle / Promo
  const isBundleCategory = useMemo(() => {
    const c = foodCategory.trim().toLowerCase();
    return c === 'bundle' || c === 'bundle / promo' || c === 'promo' || c.includes('bundle') || c.includes('promo');
  }, [foodCategory]);

  // Available existing meals/ramens/drinks to pick for bundles (exclude other bundles & itself)
  const bundleAvailableDishes = useMemo(() => {
    return menuItems.filter((m) => {
      const cat = m.category.toLowerCase();
      const isB = cat.includes('bundle') || cat.includes('promo');
      const isSelf = editingMenuItem && m.id === editingMenuItem.id;
      return !isB && !isSelf;
    });
  }, [menuItems, editingMenuItem]);

  // Combined regular a la carte price of all dishes in the bundle
  const bundleRegularTotal = useMemo(() => {
    return bundleItems.reduce((sum, item) => {
      const dish = menuItems.find((m) => m.id === item.dishId);
      return sum + (dish ? Number(dish.price) * item.qty : 0);
    }, 0);
  }, [bundleItems, menuItems]);

  // Aggregate raw ingredients from all selected bundle dishes
  const compileBundleRecipe = (items: { dishId: number; qty: number }[]): RecipeIngredient[] => {
    const map: { [prodId: number]: RecipeIngredient } = {};
    for (const b of items) {
      const dish = menuItems.find((m) => m.id === b.dishId);
      if (dish && Array.isArray(dish.recipe)) {
        for (const ing of dish.recipe) {
          if (!ing.productId || !ing.qty || Number(ing.qty) <= 0) continue;
          if (!map[ing.productId]) {
            map[ing.productId] = {
              productId: ing.productId,
              productName: ing.productName,
              qty: Number(ing.qty) * Number(b.qty),
              uom: ing.uom
            };
          } else {
            map[ing.productId].qty += Number(ing.qty) * Number(b.qty);
          }
        }
      }
    }
    return Object.values(map);
  };

  const compiledBundleRecipe = useMemo(() => {
    return compileBundleRecipe(bundleItems);
  }, [bundleItems, menuItems]);

  const handleAddBundleItem = () => {
    if (bundleAvailableDishes.length === 0) return;
    const firstUnused = bundleAvailableDishes.find(
      (d) => !bundleItems.some((b) => b.dishId === d.id)
    ) || bundleAvailableDishes[0];
    setBundleItems((prev) => [...prev, { dishId: firstUnused.id, qty: 1 }]);
  };

  const handleUpdateBundleItem = (index: number, dishId: number, qty: number) => {
    setBundleItems((prev) => {
      const next = [...prev];
      next[index] = { dishId, qty };
      return next;
    });
  };

  const handleRemoveBundleItem = (index: number) => {
    setBundleItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectCategory = (cat: string) => {
    setFoodCategory(cat);
    const isB = cat.toLowerCase().includes('bundle') || cat.toLowerCase().includes('promo');
    if (isB) {
      if (foodImage.includes('/Ramen/') || foodImage.includes('/Rice Meals/') || foodImage.includes('/Drinks/')) {
        setFoodImage('/images/Bundle/RamenDuo.png');
      }
      if (foodSize === 'Regular') {
        setFoodSize('Bundle Set');
      }
      if (foodUom === 'serving') {
        setFoodUom('set');
      }
      if (bundleItems.length === 0 && bundleAvailableDishes.length > 0) {
        const ramen = bundleAvailableDishes.find((d) => d.category === 'Ramen') || bundleAvailableDishes[0];
        const drinkOrRice = bundleAvailableDishes.find((d) => d.id !== ramen.id && (d.category === 'Drinks' || d.category === 'Rice Meals')) || bundleAvailableDishes[1];
        const initialItems = [{ dishId: ramen.id, qty: 1 }];
        if (drinkOrRice) initialItems.push({ dishId: drinkOrRice.id, qty: 1 });
        setBundleItems(initialItems);
        const sumVal = initialItems.reduce((s, it) => {
          const d = menuItems.find((m) => m.id === it.dishId);
          return s + (d ? Number(d.price) : 0);
        }, 0);
        setFoodPrice(String(Math.round(sumVal * 0.85)));
      }
    }
  };

  // Visual Image Gallery Selector Modal
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Batch Prep / Cooking Modal
  const [prepModalItem, setPrepModalItem] = useState<MenuItem | null>(null);
  const [prepPortions, setPrepPortions] = useState<number>(10);
  const [isSubmittingPrep, setIsSubmittingPrep] = useState(false);

  // Delete Confirmations
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [deletingIngredientId, setDeletingIngredientId] = useState<number | null>(null);

  const categories = ['All', ...Array.from(new Set(menuItems.map((m) => m.category)))];

  // Specific low stock ingredients ONLY (as requested: "only the ingredient not the food")
  const lowStockRaw = rawProducts.filter((p) => p.quantity <= p.minStock);

  // Calculate maximum cookable portions for a menu item based on available raw ingredients
  const calculateCookablePortions = (dish: MenuItem): number => {
    if (!dish.recipe || dish.recipe.length === 0) return 999;
    let minPortions = Infinity;
    for (const ing of dish.recipe) {
      if (!ing.productId || !ing.qty || ing.qty <= 0) continue;
      const raw = rawProducts.find((p) => p.id === ing.productId);
      const stock = raw ? raw.quantity : 0;
      const possible = Math.floor(stock / ing.qty);
      if (possible < minPortions) {
        minPortions = possible;
      }
    }
    return minPortions === Infinity ? 0 : minPortions;
  };

  // Maximum portions cookable for current modal item
  const modalMaxCookable = useMemo(() => {
    if (!prepModalItem) return 0;
    return calculateCookablePortions(prepModalItem);
  }, [prepModalItem, rawProducts]);

  // Check if any ingredient is short for current prepPortions
  const hasInsufficientIngredients = useMemo(() => {
    if (!prepModalItem || !prepModalItem.recipe || prepModalItem.recipe.length === 0) return false;
    if (prepPortions <= 0) return true;
    return prepModalItem.recipe.some((ing) => {
      if (!ing.productId || !ing.qty || ing.qty <= 0) return false;
      const raw = rawProducts.find((p) => p.id === ing.productId);
      const currentStock = raw ? raw.quantity : 0;
      return currentStock < Number(ing.qty) * prepPortions;
    });
  }, [prepModalItem, prepPortions, rawProducts]);

  // Filtered lists
  const filteredMenuItems = menuItems.filter((m) => {
    const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchQuery =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const filteredRawProducts = rawProducts.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      // Off-screen canvas compression to 400x400
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 400;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        const optimized = canvas.toDataURL('image/jpeg', 0.85);
        setFoodImage(optimized);
        setIsGalleryOpen(false);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Raw Stock Adjustment (Add/Minus)
  const handleConfirmAdjust = (type: 'Add' | 'Minus') => {
    if (!selectedProduct) return;
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty <= 0) return;

    onAdjustRawStock(selectedProduct.id, type, qty, adjustNotes);
    setSelectedProduct(null);
  };

  // Open Create Raw Ingredient Modal
  const handleOpenCreateIngredientModal = () => {
    setEditingIngredient(null);
    setIngName('');
    setIngBrand('Fresh Market');
    setIngCategory('Topping');
    setIngPrice('50');
    setIngQuantity('1000');
    setIngUom('g');
    setIngMinStock('500');
    setIsIngredientModalOpen(true);
  };

  // Open Edit Raw Ingredient Modal
  const handleOpenEditIngredientModal = (prod: RawProduct) => {
    setEditingIngredient(prod);
    setIngName(prod.name);
    setIngBrand(prod.brand);
    setIngCategory(prod.category);
    setIngPrice(String(prod.unitPrice));
    setIngQuantity(String(prod.quantity));
    setIngUom(prod.uom);
    setIngMinStock(String(prod.minStock));
    setIsIngredientModalOpen(true);
  };

  // Save Raw Ingredient
  const handleSubmitIngredientForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName.trim()) return;

    const priceNum = parseFloat(ingPrice) || 0;
    const qtyNum = parseFloat(ingQuantity) || 0;
    const minStockNum = parseFloat(ingMinStock) || 0;

    if (editingIngredient && onUpdateRawProduct) {
      await onUpdateRawProduct({
        ...editingIngredient,
        name: ingName.trim(),
        brand: ingBrand.trim(),
        category: ingCategory.trim(),
        unitPrice: priceNum,
        quantity: qtyNum,
        uom: ingUom.trim(),
        minStock: minStockNum
      });
    } else if (onCreateRawProduct) {
      await onCreateRawProduct({
        name: ingName.trim(),
        brand: ingBrand.trim(),
        category: ingCategory.trim(),
        unitPrice: priceNum,
        quantity: qtyNum,
        uom: ingUom.trim(),
        minStock: minStockNum,
        status: 'Active'
      });
    }

    setIsIngredientModalOpen(false);
  };

  // Open Create Food Modal
  const handleOpenCreateModal = () => {
    setEditingMenuItem(null);
    setFoodName('');
    setFoodCategory('Ramen');
    setFoodPrice('250');
    setFoodStock('20');
    setFoodSize('Regular');
    setFoodUom('serving');
    setFoodImage('/images/Ramen/Kuro.png');
    setBundleItems([]);
    if (rawProducts.length > 0) {
      setFoodRecipe([
        {
          productId: rawProducts[0].id,
          productName: rawProducts[0].name,
          qty: 150,
          uom: rawProducts[0].uom
        }
      ]);
    } else {
      setFoodRecipe([]);
    }
    setIsFoodModalOpen(true);
  };

  // Open Edit Food Modal
  const handleOpenEditModal = (item: MenuItem) => {
    setEditingMenuItem(item);
    setFoodName(item.name);
    setFoodCategory(item.category);
    setFoodPrice(String(item.price));
    setFoodStock(String(item.stock));
    setFoodSize(item.size || 'Regular');
    setFoodUom(item.uom || 'serving');
    setFoodImage(item.image || '/images/icons/NoPicture.png');

    const isB = item.category.toLowerCase().includes('bundle') || item.category.toLowerCase().includes('promo');
    if (isB) {
      const meta = Array.isArray(item.recipe) ? item.recipe.find((r: any) => r.isBundleMeta) : null;
      if (meta && (meta as any)._bundleItems && Array.isArray((meta as any)._bundleItems)) {
        setBundleItems((meta as any)._bundleItems);
      } else {
        setBundleItems([]);
      }
      setFoodRecipe(Array.isArray(item.recipe) ? [...item.recipe.filter((r: any) => !r.isBundleMeta)] : []);
    } else {
      setBundleItems([]);
      setFoodRecipe(Array.isArray(item.recipe) ? [...item.recipe] : []);
    }
    setIsFoodModalOpen(true);
  };

  // Recipe Builder Handlers
  const handleAddRecipeIngredient = () => {
    const availableProd = rawProducts.find(
      (p) => !foodRecipe.some((r) => r.productId === p.id)
    ) || rawProducts[0];

    if (!availableProd) return;

    setFoodRecipe((prev) => [
      ...prev,
      {
        productId: availableProd.id,
        productName: availableProd.name,
        qty: 100,
        uom: availableProd.uom
      }
    ]);
  };

  const handleUpdateRecipeRow = (
    index: number,
    field: 'productId' | 'qty' | 'uom',
    value: string | number
  ) => {
    setFoodRecipe((prev) => {
      const next = [...prev];
      if (field === 'productId') {
        const prod = rawProducts.find((p) => p.id === Number(value));
        if (prod) {
          next[index] = {
            ...next[index],
            productId: prod.id,
            productName: prod.name,
            uom: prod.uom
          };
        }
      } else if (field === 'qty') {
        next[index] = { ...next[index], qty: Number(value) || 0 };
      } else if (field === 'uom') {
        next[index] = { ...next[index], uom: String(value) };
      }
      return next;
    });
  };

  const handleRemoveRecipeRow = (index: number) => {
    setFoodRecipe((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Food Form (Create or Edit)
  const handleSubmitFoodForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    const priceNum = parseFloat(foodPrice) || 0;
    const stockNum = parseInt(foodStock, 10) || 0;

    let finalRecipe: RecipeIngredient[] = [];
    if (isBundleCategory) {
      if (bundleItems.length === 0) {
        alert('Please add at least 1 meal or drink to this bundle promo.');
        return;
      }
      const compiled = compileBundleRecipe(bundleItems);
      finalRecipe = [
        ...compiled,
        {
          productId: 0,
          productName: '__bundle_meta__',
          qty: 0,
          uom: 'meta',
          isBundleMeta: true,
          _bundleItems: bundleItems
        } as any
      ];
    } else {
      finalRecipe = foodRecipe.filter((r) => r.productId && r.qty > 0);
    }

    let sizeDesc = foodSize.trim() || 'Regular';
    if (isBundleCategory && (sizeDesc === 'Regular' || sizeDesc === 'Bundle Set' || !sizeDesc)) {
      const parts = bundleItems.map((b) => {
        const d = menuItems.find((m) => m.id === b.dishId);
        return d ? `${b.qty}x ${d.name}` : '';
      }).filter(Boolean);
      if (parts.length > 0) {
        sizeDesc = parts.join(' + ');
      }
    }

    if (editingMenuItem && onUpdateMenuItem) {
      await onUpdateMenuItem({
        ...editingMenuItem,
        name: foodName.trim(),
        category: foodCategory.trim(),
        price: priceNum,
        stock: stockNum,
        size: sizeDesc,
        uom: foodUom.trim() || (isBundleCategory ? 'set' : 'serving'),
        image: foodImage.trim() || '/images/icons/NoPicture.png',
        recipe: finalRecipe
      });
    } else if (onCreateMenuItem) {
      await onCreateMenuItem({
        name: foodName.trim(),
        category: foodCategory.trim(),
        price: priceNum,
        stock: stockNum,
        size: sizeDesc,
        uom: foodUom.trim() || (isBundleCategory ? 'set' : 'serving'),
        image: foodImage.trim() || '/images/icons/NoPicture.png',
        isBestSeller: 0,
        status: 'Active',
        recipe: finalRecipe
      });
    }

    setIsFoodModalOpen(false);
  };

  // Batch Prep / Cooking confirmation
  const handleConfirmBatchPrep = async () => {
    if (!prepModalItem || !onBatchPrep) return;
    if (prepPortions <= 0) {
      alert('Please enter a valid portion count greater than 0.');
      return;
    }
    if (modalMaxCookable === 0) {
      alert(`Cannot cook ${prepModalItem.name}: Raw ingredients are depleted!`);
      return;
    }
    if (prepPortions > modalMaxCookable) {
      alert(`Cannot cook ${prepPortions} portions! You only have raw ingredients for ${modalMaxCookable} portions.`);
      return;
    }
    if (hasInsufficientIngredients) {
      alert('Cannot cook portions: Insufficient raw ingredients.');
      return;
    }

    setIsSubmittingPrep(true);
    try {
      await onBatchPrep(prepModalItem.id, prepPortions);
      setPrepModalItem(null);
    } finally {
      setIsSubmittingPrep(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e11] p-6 overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#212833]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0ca1e1]/10 border border-[#0ca1e1]/30 flex items-center justify-center text-[#0ca1e1] shadow-lg shadow-[#0ca1e1]/10">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
              <span>Inventory & Recipe Management</span>
              <span className="px-2 py-0.5 rounded-full bg-[#fed428]/20 text-[#fed428] text-[10px] font-mono font-bold uppercase tracking-wider">
                Real-Time BOM
              </span>
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Portion control, bill of materials (BOM), batch cooking & raw ingredient supplies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fed428] hover:bg-[#fed428]/90 text-black font-black text-xs transition-all cursor-pointer touch-manipulation active:scale-95 shadow-lg shadow-[#fed428]/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Food</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateIngredientModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0ca1e1] hover:bg-[#0ca1e1]/90 text-black font-black text-xs transition-all cursor-pointer touch-manipulation active:scale-95 shadow-lg shadow-[#0ca1e1]/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Ingredient</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#151a21] hover:bg-[#1f2633] active:bg-[#283243] text-gray-300 hover:text-white border border-[#212833] text-xs font-semibold transition-all cursor-pointer touch-manipulation active:scale-95 shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0ca1e1]" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner - ONLY NOTIFIES INGREDIENTS */}
      {lowStockRaw.length > 0 && (
        <div className="mb-3.5 p-3 rounded-2xl bg-amber-950/30 border border-amber-800/60 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>Low Stock Ingredient Alert</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono">
                    {lowStockRaw.length} item{lowStockRaw.length > 1 ? 's' : ''} low
                  </span>
                </h4>
                <p className="text-[11px] text-amber-400/80 mt-0.5">
                  The following raw ingredients are at or below minimum threshold:
                </p>
              </div>
            </div>
          </div>

          {/* List of Low Ingredients with Quick Restock Button */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {lowStockRaw.map((ing) => (
              <div
                key={ing.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#0c0e11]/80 border border-amber-800/40 text-[11px]"
              >
                <span className="font-bold text-white">{ing.name}</span>
                <span className="text-amber-400 font-mono font-bold">
                  {ing.quantity} {ing.uom}
                </span>
                <span className="text-gray-500 text-[10px]">
                  (Min: {ing.minStock})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(ing);
                    setAdjustQty('100');
                    setAdjustNotes('Low stock reorder');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-amber-400 text-black text-[10px] font-bold hover:bg-amber-300 cursor-pointer"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer touch-manipulation active:scale-95 flex items-center gap-1.5 ${
              activeTab === 'menu'
                ? 'bg-[#fed428] text-black border-[#fed428] shadow-md shadow-[#fed428]/20'
                : 'bg-[#151a21] text-gray-400 border-[#212833] hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Menu Portions & Dishes ({menuItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer touch-manipulation active:scale-95 flex items-center gap-1.5 ${
              activeTab === 'raw'
                ? 'bg-[#0ca1e1] text-black border-[#0ca1e1] shadow-md shadow-[#0ca1e1]/20'
                : 'bg-[#151a21] text-gray-400 border-[#212833] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Raw Ingredients & Supplies ({rawProducts.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'menu' ? 'Search dishes or categories...' : 'Search raw ingredients...'}
            className="w-full bg-[#151a21] border border-[#212833] focus:border-[#0ca1e1] rounded-xl pl-8 pr-4 py-1.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (For Menu tab) */}
      {activeTab === 'menu' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer touch-manipulation active:scale-95 ${
                selectedCategory === cat
                  ? 'bg-[#fed428]/20 text-[#fed428] border border-[#fed428]/40'
                  : 'bg-[#151a21] text-gray-400 border border-[#212833] hover:text-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'menu' ? (
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f1217] text-gray-400 uppercase font-bold text-[11px] border-b border-[#212833]">
                <tr>
                  <th className="py-2.5 px-3.5">Dish Details</th>
                  <th className="py-2.5 px-3.5">Category</th>
                  <th className="py-2.5 px-3.5">Price</th>
                  <th className="py-2.5 px-3.5">Recipe (BOM)</th>
                  <th className="py-2.5 px-3.5 text-center">Portions Available</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212833]">
                {filteredMenuItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No menu items found. Click "+ Add New Food" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredMenuItems.map((dish) => {
                    const recipeList = Array.isArray(dish.recipe) ? dish.recipe.filter((r: any) => !r.isBundleMeta && r.productId > 0) : [];
                    const cookable = calculateCookablePortions(dish);
                    const isOutOfIngredients = recipeList.length > 0 && cookable === 0 && dish.stock === 0;

                    return (
                      <tr key={dish.id} className="hover:bg-[#1a212b] transition-colors">
                        {/* Dish Details */}
                        <td className="py-2.5 px-3.5 font-bold text-white flex items-center gap-2.5">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="w-10 h-10 rounded-xl object-contain bg-[#0c0e11] p-1 border border-[#212833] shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/icons/NoPicture.png';
                            }}
                          />
                          <div>
                            <div className="text-xs font-black text-white">{dish.name}</div>
                            <div className="text-[10px] text-gray-400 font-normal">
                              Size: {dish.size || 'Regular'} • {dish.uom || 'serving'}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#0c0e11] border border-[#212833] text-gray-300 font-medium text-[10px]">
                            {dish.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-2.5 px-3.5 text-[#fed428] font-bold font-mono text-xs">
                          ₱{Number(dish.price).toFixed(2)}
                        </td>

                        {/* Recipe Preview */}
                        <td className="py-2.5 px-3.5 max-w-xs">
                          {recipeList.length > 0 ? (
                            <div className="flex flex-wrap gap-1 items-center">
                              {recipeList.slice(0, 3).map((ing, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded bg-[#0c0e11] border border-[#283241] text-[10px] text-gray-300 font-mono"
                                  title={`${ing.qty}${ing.uom} ${ing.productName}`}
                                >
                                  {ing.qty}{ing.uom} {ing.productName}
                                </span>
                              ))}
                              {recipeList.length > 3 && (
                                <span className="px-1 py-0.5 rounded bg-[#0ca1e1]/20 text-[#0ca1e1] text-[9px] font-bold">
                                  +{recipeList.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-500 italic flex items-center gap-1">
                              <Info className="w-3 h-3 text-amber-500/70" />
                              No recipe linked
                            </span>
                          )}
                        </td>

                        {/* Real-time Portions Available & Cookable Stock */}
                        <td className="py-2.5 px-3.5 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`px-2.5 py-0.5 rounded-lg font-bold font-mono text-[11px] ${
                              isOutOfIngredients
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                : dish.stock <= 0
                                ? 'bg-rose-950/50 text-rose-300 border border-rose-800/60'
                                : dish.stock <= 5
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60'
                            }`}>
                              {dish.stock} ready
                            </span>
                            {recipeList.length > 0 && (
                              <span className={`text-[10px] font-mono ${
                                cookable === 0 ? 'text-rose-400 font-bold' : 'text-gray-400'
                              }`}>
                                {cookable === 0 ? 'Out of raw ingredients' : `Can cook: ${cookable}`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions (COMPACT & SLEEK COOK BUTTON) */}
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Sleek Cook Button - Compact and Single Line */}
                            <button
                              type="button"
                              onClick={() => {
                                setPrepModalItem(dish);
                                setPrepPortions(cookable === 0 ? 0 : Math.min(10, cookable));
                              }}
                              className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg border font-bold text-[11px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm ${
                                cookable === 0
                                  ? 'bg-rose-950/25 hover:bg-rose-950/40 text-rose-400 border-rose-800/50'
                                  : 'bg-[#0ca1e1]/15 hover:bg-[#0ca1e1]/25 text-[#0ca1e1] border border-[#0ca1e1]/40'
                              }`}
                              title={
                                cookable === 0
                                  ? 'Out of raw ingredients (Click to view missing items)'
                                  : `Cook / Batch Restock Portions (Can cook up to ${cookable})`
                              }
                            >
                              <ChefHat className="w-3.5 h-3.5 shrink-0" />
                              <span>{cookable === 0 ? 'Out of Ing.' : 'Cook'}</span>
                            </button>

                            {/* Edit Food & Recipe */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(dish)}
                              className="p-1.5 rounded-lg bg-[#0c0e11] hover:bg-[#202733] border border-[#2b3543] text-gray-300 hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
                              title="Edit Food & Recipe"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#fed428]" />
                            </button>

                            {/* Quick Increment/Decrement Portions */}
                            <button
                              type="button"
                              onClick={() => onUpdateMenuStock(dish.id, Math.max(0, dish.stock - 1))}
                              className="w-7 h-7 rounded-lg bg-[#0c0e11] hover:bg-[#202733] border border-[#2b3543] text-gray-200 flex items-center justify-center font-black transition-all cursor-pointer active:scale-90"
                              title="Decrease Stock (-1)"
                            >
                              <Minus className="w-3 h-3 text-rose-400" />
                            </button>
                            <button
                              type="button"
                              disabled={recipeList.length > 0 && cookable === 0}
                              onClick={() => {
                                if (recipeList.length > 0) {
                                  if (cookable === 0) return;
                                  onBatchPrep ? onBatchPrep(dish.id, 1) : onUpdateMenuStock(dish.id, dish.stock + 1);
                                } else {
                                  onUpdateMenuStock(dish.id, dish.stock + 1);
                                }
                              }}
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center font-black transition-all ${
                                recipeList.length > 0 && cookable === 0
                                  ? 'bg-[#151a21] border-[#212833] text-gray-600 opacity-40 cursor-not-allowed'
                                  : 'bg-[#0c0e11] hover:bg-[#202733] border border-[#2b3543] text-gray-200 cursor-pointer active:scale-90'
                              }`}
                              title={
                                recipeList.length > 0 && cookable === 0
                                  ? 'Cannot increase: Out of raw ingredients'
                                  : 'Increase Stock (+1)'
                              }
                            >
                              <Plus className="w-3 h-3 text-emerald-400" />
                            </button>

                            {/* Delete Button */}
                            {onDeleteMenuItem && (
                              <button
                                type="button"
                                onClick={() => setDeletingItemId(dish.id)}
                                className="p-1.5 rounded-lg bg-[#0c0e11] hover:bg-rose-950/40 border border-[#2b3543] hover:border-rose-800 text-gray-400 hover:text-rose-300 transition-all cursor-pointer active:scale-95 shadow-sm"
                                title="Delete Dish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Raw Ingredients Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#151a21] border border-[#212833] shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0ca1e1]/15 border border-[#0ca1e1]/30 flex items-center justify-center text-[#0ca1e1] shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Raw Ingredients, Supplies & Toppings</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#0ca1e1]/20 text-[#0ca1e1] text-[10px] font-mono font-bold">
                      {rawProducts.length} Items
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Ramen toppings (Onions, Menma, Corn, Eggs), noodles, broths, seasonings, and meats
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateIngredientModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0ca1e1] hover:bg-[#0ca1e1]/90 text-black font-black text-xs transition-all cursor-pointer touch-manipulation active:scale-95 shadow-lg shadow-[#0ca1e1]/25 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add New Ingredient</span>
              </button>
            </div>

            <div className="bg-[#151a21] border border-[#212833] rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
              <thead className="bg-[#0f1217] text-gray-400 uppercase font-bold text-[11px] border-b border-[#212833]">
                <tr>
                  <th className="py-2.5 px-3.5">Ingredient Name</th>
                  <th className="py-2.5 px-3.5">Brand / Category</th>
                  <th className="py-2.5 px-3.5">Unit Cost</th>
                  <th className="py-2.5 px-3.5 text-center">Quantity on Hand</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212833]">
                {filteredRawProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      No raw ingredients found. Click "+ Add New Ingredient" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredRawProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-[#1a212b] transition-colors">
                      <td className="py-2.5 px-3.5 font-bold text-white text-xs">{prod.name}</td>
                      <td className="py-2.5 px-3.5 text-gray-400 font-medium">
                        {prod.brand} <span className="text-[10px] text-gray-500">({prod.category})</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-[#fed428] font-bold font-mono text-xs">
                        ₱{Number(prod.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-lg font-bold font-mono text-xs ${
                          prod.quantity <= prod.minStock
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60'
                        }`}>
                          {prod.quantity} {prod.uom}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Ingredient */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditIngredientModal(prod)}
                            className="p-1.5 rounded-lg bg-[#0c0e11] hover:bg-[#202733] border border-[#2b3543] text-gray-300 hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
                            title="Edit Ingredient"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#0ca1e1]" />
                          </button>

                          {/* Restock Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(prod);
                              setAdjustQty('50');
                              setAdjustNotes('Supplier delivery');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#0ca1e1]/20 hover:bg-[#0ca1e1]/30 text-[#0ca1e1] border border-[#0ca1e1]/50 font-bold transition-all text-[11px] cursor-pointer active:scale-95 shadow-md flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3" />
                            <span>Restock</span>
                          </button>

                          {/* Delete Ingredient */}
                          {onDeleteRawProduct && (
                            <button
                              type="button"
                              onClick={() => setDeletingIngredientId(prod.id)}
                              className="p-1.5 rounded-lg bg-[#0c0e11] hover:bg-rose-950/40 border border-[#2b3543] hover:border-rose-800 text-gray-400 hover:text-rose-300 transition-all cursor-pointer active:scale-95 shadow-sm"
                              title="Delete Ingredient"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* MODAL 1: Add / Edit Food & Recipe Form */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151a21] border border-[#2b3543] w-full max-w-2xl max-h-[90vh] rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#212833]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#fed428]/10 border border-[#fed428]/30 flex items-center justify-center text-[#fed428]">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingMenuItem ? 'Edit Food & Recipe' : 'Add New Food Item'}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Configure dish info and link raw ingredient bill of materials (BOM)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFoodModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#0c0e11] hover:bg-[#202733] border border-[#212833] text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields Body (Scrollable) */}
            <form onSubmit={handleSubmitFoodForm} className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="e.g. Spicy Miso Ramen"
                    className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3 py-2 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-300">Category *</label>
                    <span className="text-[10px] text-gray-400">Quick select preset:</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {['Ramen', 'Rice Meals', 'Drinks', 'Bundle'].map((cat) => {
                      const isSel = foodCategory.toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleSelectCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            isSel
                              ? cat === 'Bundle'
                                ? 'bg-[#fed428] text-black border-[#fed428] shadow-sm'
                                : 'bg-[#0ca1e1] text-black border-[#0ca1e1] shadow-sm'
                              : 'bg-[#0c0e11] text-gray-400 border-[#212833] hover:text-white'
                          }`}
                        >
                          {cat === 'Bundle' ? '🍱 Bundle / Promo' : cat}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    required
                    value={foodCategory}
                    onChange={(e) => handleSelectCategory(e.target.value)}
                    placeholder="e.g. Ramen, Rice Meals, Drinks, Bundle"
                    className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3 py-2 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Selling Price (₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(e.target.value)}
                    className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3 py-2 text-white font-mono font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Initial Portions on Hand</label>
                  <input
                    type="number"
                    value={foodStock}
                    onChange={(e) => setFoodStock(e.target.value)}
                    className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3 py-2 text-white font-mono font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Serving Size</label>
                  <input
                    type="text"
                    value={foodSize}
                    onChange={(e) => setFoodSize(e.target.value)}
                    placeholder="Regular, Large, Solo, Set"
                    className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3 py-2 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Unit of Measure (UOM)</label>
                  <input
                    type="text"
                    value={foodUom}
                    onChange={(e) => setFoodUom(e.target.value)}
                    placeholder="serving, bowl, can, cup"
                    className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3 py-2 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* Image Selection with Gallery Picker & File Upload */}
              <div className="p-3 rounded-2xl bg-[#0c0e11] border border-[#212833]">
                <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
                  <span>Dish Image Photo</span>
                  <span className="text-[10px] text-gray-400">Choose preset or upload from tablet</span>
                </label>

                <div className="flex items-center gap-3">
                  <img
                    src={foodImage}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-contain bg-[#151a21] p-1 border border-[#2b3543] shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/icons/NoPicture.png';
                    }}
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsGalleryOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#fed428] hover:bg-[#fed428]/90 text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#fed428]/20"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Browse Preset Gallery</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-[#151a21] hover:bg-[#202733] border border-[#2b3543] text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#0ca1e1]" />
                        <span>Upload Photo / Camera</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>

                    <input
                      type="text"
                      value={foodImage.startsWith('data:') ? 'Custom Photo Uploaded (Base64)' : foodImage}
                      onChange={(e) => setFoodImage(e.target.value)}
                      placeholder="/images/Ramen/Kuro.png or URL"
                      className="w-full bg-[#151a21] border border-[#212833] focus:border-[#0ca1e1] rounded-lg px-2.5 py-1 text-white text-[11px] outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* RECIPE BUILDER / BUNDLE COMPONENTS BUILDER */}
              {isBundleCategory ? (
                /* BUNDLE / PROMO MEAL CHOICES BUILDER */
                <div className="pt-3 border-t border-[#212833] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#fed428]" />
                        <span>Bundle / Promo Included Meals & Drinks</span>
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        Choose existing Ramens, Rice Meals, and Drinks. Raw ingredients are auto-compiled for kitchen cooking & order deductions.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddBundleItem}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fed428] hover:bg-[#fed428]/90 text-black font-black text-xs transition-all cursor-pointer shadow-md shadow-[#fed428]/20"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Add Meal / Drink</span>
                    </button>
                  </div>

                  {bundleItems.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#0c0e11] border border-dashed border-[#2b3543] text-center">
                      <p className="text-xs text-gray-400 font-bold mb-1">No meals or drinks added yet</p>
                      <p className="text-[11px] text-gray-500 mb-3">
                        Click the button below to include dishes in this bundle promo (e.g. 1 Ramen + 1 Rice Meal + 1 Drink)
                      </p>
                      <button
                        type="button"
                        onClick={handleAddBundleItem}
                        className="px-3.5 py-1.5 rounded-xl bg-[#fed428]/15 hover:bg-[#fed428]/25 text-[#fed428] border border-[#fed428]/40 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Select First Item</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bundleItems.map((bItem, idx) => {
                        const dish = menuItems.find((m) => m.id === bItem.dishId);
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-[#0c0e11] border border-[#212833] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-[#2b3543]"
                          >
                            {/* Dish Selector & Thumbnail */}
                            <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                              {dish?.image && (
                                <img
                                  src={dish.image}
                                  alt={dish.name}
                                  className="w-10 h-10 rounded-xl object-contain bg-[#151a21] p-1 border border-[#212833] shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/icons/NoPicture.png';
                                  }}
                                />
                              )}
                              <div className="flex-1">
                                <select
                                  value={bItem.dishId}
                                  onChange={(e) => handleUpdateBundleItem(idx, Number(e.target.value), bItem.qty)}
                                  className="w-full bg-[#151a21] border border-[#2b3543] focus:border-[#fed428] rounded-xl px-2.5 py-2 text-white font-bold text-xs outline-none"
                                >
                                  {bundleAvailableDishes.map((d) => (
                                    <option key={d.id} value={d.id}>
                                      [{d.category}] {d.name} — ₱{Number(d.price).toFixed(2)}
                                    </option>
                                  ))}
                                </select>
                                {dish && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-gray-400">
                                      Category: <strong className="text-gray-300">{dish.category}</strong>
                                    </span>
                                    <span className="text-[10px] text-gray-500">•</span>
                                    <span className="text-[10px] text-gray-400">
                                      Regular: <strong className="text-[#fed428]">₱{Number(dish.price).toFixed(2)}</strong>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quantity Stepper & Price Calculation */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              {/* Stepper */}
                              <div className="flex items-center gap-1.5 bg-[#151a21] border border-[#2b3543] rounded-xl p-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBundleItem(idx, bItem.dishId, Math.max(1, bItem.qty - 1))}
                                  className="w-6 h-6 rounded-lg bg-[#0c0e11] hover:bg-[#202733] text-gray-300 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-white font-mono font-bold text-xs">
                                  {bItem.qty}x
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBundleItem(idx, bItem.dishId, bItem.qty + 1)}
                                  className="w-6 h-6 rounded-lg bg-[#0c0e11] hover:bg-[#202733] text-gray-300 hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                                >
                                  +
                                </button>
                              </div>

                              {/* Subtotal */}
                              <div className="text-right min-w-[70px]">
                                <div className="text-xs font-mono font-bold text-[#fed428]">
                                  ₱{((dish?.price || 0) * bItem.qty).toFixed(2)}
                                </div>
                                <div className="text-[9px] text-gray-500 font-mono">
                                  {bItem.qty > 1 ? `(${bItem.qty} × ₱${dish?.price})` : 'solo'}
                                </div>
                              </div>

                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => handleRemoveBundleItem(idx)}
                                className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-all cursor-pointer"
                                title="Remove item from bundle"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Promo Pricing Summary Card */}
                  {bundleItems.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-[#151a21] border border-[#2b3543] space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Regular Total Value</span>
                            <span className="text-sm font-bold text-gray-300 font-mono">₱{bundleRegularTotal.toFixed(2)}</span>
                          </div>
                          <span className="text-gray-600 font-bold text-lg">→</span>
                          <div>
                            <span className="text-[10px] text-[#fed428] uppercase tracking-wider block">Bundle Promo Price</span>
                            <span className="text-base font-black text-[#fed428] font-mono">₱{Number(foodPrice || 0).toFixed(2)}</span>
                          </div>
                        </div>

                        {bundleRegularTotal > Number(foodPrice || 0) && (
                          <div className="px-2.5 py-1 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-400" />
                            <span>
                              Save ₱{(bundleRegularTotal - Number(foodPrice)).toFixed(2)} ({Math.round(((bundleRegularTotal - Number(foodPrice)) / bundleRegularTotal) * 100)}% OFF)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick Promo Preset Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#212833]">
                        <span className="text-[10px] text-gray-400 font-bold">Quick Promo Price:</span>
                        <button
                          type="button"
                          onClick={() => setFoodPrice(String(bundleRegularTotal))}
                          className="px-2 py-0.5 rounded-lg bg-[#0c0e11] hover:bg-[#202733] border border-[#2b3543] text-gray-300 text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Regular (₱{bundleRegularTotal})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFoodPrice(String(Math.round(bundleRegularTotal * 0.9)))}
                          className="px-2 py-0.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-300 text-[10px] font-bold cursor-pointer transition-all"
                        >
                          10% OFF (₱{Math.round(bundleRegularTotal * 0.9)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFoodPrice(String(Math.round(bundleRegularTotal * 0.85)))}
                          className="px-2 py-0.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-300 text-[10px] font-bold cursor-pointer transition-all"
                        >
                          15% OFF (₱{Math.round(bundleRegularTotal * 0.85)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFoodPrice(String(Math.round(bundleRegularTotal * 0.8)))}
                          className="px-2 py-0.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 text-emerald-300 text-[10px] font-bold cursor-pointer transition-all"
                        >
                          20% OFF (₱{Math.round(bundleRegularTotal * 0.8)})
                        </button>
                      </div>

                      {/* Auto-compiled Raw Ingredients Preview */}
                      <div className="pt-2 border-t border-[#212833]">
                        <div className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5 mb-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#0ca1e1]" />
                          <span>Auto-Linked Raw Ingredients ({compiledBundleRecipe.length} items to deduct)</span>
                        </div>
                        {compiledBundleRecipe.length === 0 ? (
                          <span className="text-[10px] text-gray-500 italic">
                            None of the chosen items have linked raw recipes (pre-packed portions only).
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {compiledBundleRecipe.map((ing, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-lg bg-[#0c0e11] border border-[#212833] text-[10px] font-mono text-gray-300 flex items-center gap-1"
                              >
                                <span>{ing.productName}:</span>
                                <strong className="text-[#0ca1e1]">{ing.qty} {ing.uom}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* RAW INGREDIENTS RECIPE BUILDER */
                <div className="pt-3 border-t border-[#212833]">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#0ca1e1]" />
                        <span>Recipe Ingredients (Bill of Materials)</span>
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        Raw ingredients consumed per 1 portion. Automatically deducted on order sale & batch cooking.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenCreateIngredientModal}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fed428]/15 hover:bg-[#fed428]/25 text-[#fed428] border border-[#fed428]/30 text-[11px] font-bold cursor-pointer transition-all"
                        title="Add a new ingredient to inventory"
                      >
                        <Plus className="w-3 h-3" />
                        <span>New Ingredient</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddRecipeIngredient}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0ca1e1]/20 hover:bg-[#0ca1e1]/30 text-[#0ca1e1] border border-[#0ca1e1]/40 text-[11px] font-bold cursor-pointer transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Row</span>
                      </button>
                    </div>
                  </div>

                  {foodRecipe.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-[#0c0e11] border border-dashed border-[#212833] text-center text-gray-500 text-xs">
                      No ingredients added yet. Click "+ Add Row" to link raw supplies.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {foodRecipe.map((ing, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-xl bg-[#0c0e11] border border-[#212833]"
                        >
                          {/* Ingredient Selector */}
                          <div className="flex-1">
                            <select
                              value={ing.productId}
                              onChange={(e) => handleUpdateRecipeRow(idx, 'productId', e.target.value)}
                              className="w-full bg-[#151a21] border border-[#2b3543] rounded-lg px-2.5 py-1.5 text-white text-xs outline-none"
                            >
                              {rawProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.brand}) - {p.quantity} {p.uom} on hand
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Amount per portion */}
                          <div className="w-24">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              value={ing.qty}
                              onChange={(e) => handleUpdateRecipeRow(idx, 'qty', e.target.value)}
                              placeholder="Qty"
                              className="w-full bg-[#151a21] border border-[#2b3543] rounded-lg px-2 py-1.5 text-white font-mono font-bold text-xs outline-none text-right"
                            />
                          </div>

                          {/* Unit of measure */}
                          <div className="w-16">
                            <input
                              type="text"
                              value={ing.uom}
                              onChange={(e) => handleUpdateRecipeRow(idx, 'uom', e.target.value)}
                              placeholder="uom"
                              className="w-full bg-[#151a21] border border-[#2b3543] rounded-lg px-2 py-1.5 text-gray-300 font-mono text-xs outline-none text-center"
                            />
                          </div>

                          {/* Remove Ingredient Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipeRow(idx)}
                            className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-all cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#212833]">
                <button
                  type="button"
                  onClick={() => setIsFoodModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0c0e11] hover:bg-[#1a212b] border border-[#212833] text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#fed428] hover:bg-[#fed428]/90 text-black text-xs font-black transition-all cursor-pointer shadow-lg shadow-[#fed428]/20"
                >
                  {editingMenuItem ? 'Save Dish & Recipe' : 'Create Food Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1B: Preset Visual Image Gallery Picker */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-[#151a21] border border-[#2b3543] w-full max-w-xl max-h-[85vh] rounded-3xl p-5 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#212833]">
              <div>
                <h3 className="text-base font-black text-white">Select Dish Photo</h3>
                <p className="text-[11px] text-gray-400">Click any preset image to assign to this food item</p>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#0c0e11] hover:bg-[#202733] border border-[#212833] text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
              {PRESET_GALLERY.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    setFoodImage(item.path);
                    setIsGalleryOpen(false);
                  }}
                  className={`p-2 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    foodImage === item.path
                      ? 'bg-[#fed428]/15 border-[#fed428] shadow-lg shadow-[#fed428]/10'
                      : 'bg-[#0c0e11] border-[#212833] hover:border-[#0ca1e1]/50 hover:bg-[#1a212b]'
                  }`}
                >
                  <img
                    src={item.path}
                    alt={item.name}
                    className="w-16 h-16 object-contain rounded-xl p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/icons/NoPicture.png';
                    }}
                  />
                  <span className="text-[10px] font-bold text-white text-center line-clamp-1">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add / Edit Raw Ingredient Modal */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151a21] border border-[#2b3543] w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#212833]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0ca1e1]/10 border border-[#0ca1e1]/30 flex items-center justify-center text-[#0ca1e1]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingIngredient ? 'Edit Raw Ingredient' : 'Add New Raw Ingredient'}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Supplies, toppings, garnishes, noodles, broth & meats
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIngredientModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#0c0e11] hover:bg-[#202733] border border-[#212833] text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitIngredientForm} className="py-4 space-y-3">
              {/* Quick Preset Pills for 1-Tap Fill */}
              <div>
                <label className="text-[11px] font-bold text-[#0ca1e1] block mb-1.5 flex items-center gap-1">
                  <span>⚡ Quick Presets (Tap to Auto-Fill):</span>
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                  {COMMON_INGREDIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setIngName(preset.name);
                        setIngCategory(preset.cat);
                        setIngUom(preset.uom);
                        setIngPrice(preset.price);
                        setIngMinStock(preset.min);
                        setIngBrand(preset.brand);
                        setIngQuantity(preset.qty);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                        ingName === preset.name
                          ? 'bg-[#0ca1e1] text-black border-[#0ca1e1] font-bold'
                          : 'bg-[#0c0e11] hover:bg-[#1a212b] border-[#212833] text-gray-300 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Ingredient Name *</label>
                <input
                  type="text"
                  required
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  placeholder="e.g. Spring Onion, White Onion, Bamboo Shoots"
                  className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3 py-2 text-white text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Brand / Supplier</label>
                  <input
                    type="text"
                    value={ingBrand}
                    onChange={(e) => setIngBrand(e.target.value)}
                    placeholder="e.g. Fresh Market"
                    className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3 py-2 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Category</label>
                  <select
                    value={ingCategory}
                    onChange={(e) => setIngCategory(e.target.value)}
                    className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3 py-2 text-white text-xs outline-none"
                  >
                    <option value="Topping">Topping</option>
                    <option value="Ingredient">Ingredient</option>
                    <option value="Meat">Meat</option>
                    <option value="Seasoning">Seasoning</option>
                    <option value="Vegetable">Vegetable</option>
                    <option value="Grain">Grain</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Oil">Oil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    value={ingQuantity}
                    onChange={(e) => setIngQuantity(e.target.value)}
                    className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-2.5 py-2 text-white font-mono font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Unit (UOM)</label>
                  <input
                    type="text"
                    value={ingUom}
                    onChange={(e) => setIngUom(e.target.value)}
                    placeholder="g, ml, pcs, sheets"
                    className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-2.5 py-2 text-white font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Min Stock</label>
                  <input
                    type="number"
                    step="any"
                    value={ingMinStock}
                    onChange={(e) => setIngMinStock(e.target.value)}
                    className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-2.5 py-2 text-white font-mono text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Unit Cost (₱)</label>
                <input
                  type="number"
                  step="any"
                  value={ingPrice}
                  onChange={(e) => setIngPrice(e.target.value)}
                  className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3 py-2 text-white font-mono font-bold text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#212833]">
                <button
                  type="button"
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0c0e11] hover:bg-[#1a212b] border border-[#212833] text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0ca1e1] hover:bg-[#0ca1e1]/90 text-black text-xs font-black transition-all cursor-pointer shadow-lg shadow-[#0ca1e1]/20"
                >
                  {editingIngredient ? 'Save Ingredient' : 'Create Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Batch Cook / Prep Portions Modal */}
      {prepModalItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151a21] border border-[#2b3543] w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#212833]">
              <div className="flex items-center gap-2.5">
                <img
                  src={prepModalItem.image}
                  alt={prepModalItem.name}
                  className="w-11 h-11 rounded-xl object-contain bg-[#0c0e11] p-1 border border-[#212833]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/icons/NoPicture.png';
                  }}
                />
                <div>
                  <h3 className="text-base font-black text-white">
                    Cook & Prep: {prepModalItem.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Current stock:{' '}
                    <span className="font-bold text-[#fed428] font-mono">
                      {prepModalItem.stock} {prepModalItem.uom || 'serving'}s
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrepModalItem(null)}
                className="w-8 h-8 rounded-xl bg-[#0c0e11] hover:bg-[#202733] border border-[#212833] text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="py-3 space-y-3">
              {/* If modalMaxCookable === 0, show prominent blocking alert */}
              {modalMaxCookable === 0 ? (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-sm uppercase tracking-wide text-rose-200">
                      Cooking Blocked: Out of Raw Ingredients
                    </div>
                    <div className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                      You cannot cook any portions of <strong className="text-white">{prepModalItem.name}</strong> because one or more raw ingredients are completely depleted. Please restock raw supplies first before cooking.
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label className="font-bold text-gray-300">
                      Portions to cook / restock:
                    </label>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <span>Max Available:</span>
                      <strong>{modalMaxCookable} portions</strong>
                    </span>
                  </div>

                  <input
                    type="number"
                    min="1"
                    max={modalMaxCookable}
                    value={prepPortions === 0 ? '' : prepPortions}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setPrepPortions(0);
                        return;
                      }
                      const val = parseInt(raw, 10);
                      if (isNaN(val)) setPrepPortions(0);
                      else {
                        setPrepPortions(Math.min(modalMaxCookable, Math.max(1, val)));
                      }
                    }}
                    className={`w-full bg-[#0c0e11] border rounded-xl px-4 py-2.5 text-white font-mono font-bold text-lg outline-none transition-all ${
                      prepPortions > modalMaxCookable || prepPortions <= 0
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-[#212833] focus:border-[#0ca1e1]'
                    }`}
                  />

                  {prepPortions > modalMaxCookable && (
                    <p className="text-[11px] text-rose-400 font-bold mt-1">
                      ⚠️ Entered count exceeds available raw ingredients! Maximum is {modalMaxCookable}.
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {[1, 5, 10, 20].map((num) => {
                      const isAvailable = num <= modalMaxCookable;
                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setPrepPortions(num)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                            !isAvailable
                              ? 'bg-[#0c0e11] text-gray-600 border-[#212833] opacity-40 cursor-not-allowed'
                              : prepPortions === num
                              ? 'bg-[#0ca1e1] text-black border-[#0ca1e1] cursor-pointer'
                              : 'bg-[#0c0e11] text-gray-300 border-[#212833] hover:text-white cursor-pointer'
                          }`}
                        >
                          +{num}
                        </button>
                      );
                    })}

                    {/* Max Button */}
                    <button
                      type="button"
                      onClick={() => setPrepPortions(modalMaxCookable)}
                      className="px-3 py-1 rounded-lg text-xs font-mono font-bold border border-[#fed428]/40 bg-[#fed428]/15 hover:bg-[#fed428]/25 text-[#fed428] transition-all cursor-pointer ml-auto flex items-center gap-1"
                      title={`Cook maximum possible portions (${modalMaxCookable})`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Max ({modalMaxCookable})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Recipe Breakdown & Required Ingredients Calculation */}
              <div className="p-3 rounded-2xl bg-[#0c0e11] border border-[#212833]">
                <h4 className="text-xs font-bold text-gray-300 mb-2 flex items-center justify-between">
                  <span>Raw Ingredients Deduction Preview:</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    ({prepPortions || 0} portions x recipe)
                  </span>
                </h4>

                {(!prepModalItem.recipe || prepModalItem.recipe.length === 0) ? (
                  <p className="text-xs text-amber-400 italic">
                    ⚠️ No recipe ingredients linked. Stock portions will increase without deducting raw ingredients.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {prepModalItem.recipe.map((ing, idx) => {
                      const totalNeeded = Number(ing.qty) * (prepPortions || 1);
                      const raw = rawProducts.find((p) => p.id === ing.productId);
                      const currentStock = raw ? raw.quantity : 0;
                      const hasEnough = currentStock >= totalNeeded;
                      const deficit = totalNeeded - currentStock;

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs font-mono border ${
                            hasEnough
                              ? 'bg-[#151a21] border-[#212833] text-gray-300'
                              : 'bg-rose-950/30 border-rose-800 text-rose-300'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-white">{ing.productName}</span>
                            <span className="text-gray-500 ml-1 text-[11px]">
                              ({ing.qty} {ing.uom}/serving)
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white">
                              -{totalNeeded} {ing.uom}
                            </div>
                            <div className={`text-[10px] ${hasEnough ? 'text-gray-400' : 'text-rose-400 font-bold'}`}>
                              {hasEnough
                                ? `On hand: ${currentStock} ${ing.uom} ✓`
                                : `On hand: ${currentStock} ${ing.uom} (SHORT BY ${deficit.toFixed(1)} ${ing.uom})`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#212833]">
              <button
                type="button"
                onClick={() => setPrepModalItem(null)}
                className="px-4 py-2 rounded-xl bg-[#0c0e11] hover:bg-[#1a212b] border border-[#212833] text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isSubmittingPrep ||
                  modalMaxCookable === 0 ||
                  prepPortions <= 0 ||
                  prepPortions > modalMaxCookable ||
                  hasInsufficientIngredients
                }
                onClick={handleConfirmBatchPrep}
                className="px-5 py-2 rounded-xl bg-[#fed428] hover:bg-[#fed428]/90 text-black text-xs font-black transition-all cursor-pointer shadow-lg shadow-[#fed428]/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChefHat className="w-4 h-4" />
                <span>
                  {isSubmittingPrep
                    ? 'Cooking...'
                    : modalMaxCookable === 0
                    ? '🚫 Out of Raw Ingredients (Cannot Cook)'
                    : hasInsufficientIngredients
                    ? '⚠️ Insufficient Raw Stock'
                    : `Confirm Cook (+${prepPortions} Portions)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Restock / Adjust Raw Ingredient Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151a21] border border-[#2b3543] w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-black text-white">
              Restock / Adjust: {selectedProduct.name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Current on Hand:{' '}
              <span className="font-bold text-[#fed428] font-mono text-sm">
                {selectedProduct.quantity} {selectedProduct.uom}
              </span>
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Adjustment Amount ({selectedProduct.uom})
                </label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-4 py-2.5 text-white font-mono font-bold text-lg outline-none"
                />

                {/* Quick Increment Pills */}
                <div className="flex items-center gap-1.5 mt-2">
                  {['10', '25', '50', '100', '500', '1000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdjustQty(preset)}
                      className="px-2.5 py-1 rounded-lg bg-[#0c0e11] hover:bg-[#1a212b] border border-[#212833] text-[11px] font-mono font-bold text-gray-300 hover:text-white transition-all cursor-pointer active:scale-95"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Notes / Reason
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Supplier delivery, spoilage, audit"
                  className="w-full bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3 py-2 text-white text-xs outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 mt-5 pt-3 border-t border-[#212833]">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="py-2.5 px-3.5 rounded-xl bg-[#0f1217] hover:bg-[#1a212b] text-gray-400 hover:text-white border border-[#212833] font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleConfirmAdjust('Minus')}
                className="flex-1 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-md"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Deduct</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmAdjust('Add')}
                className="flex-1 py-2.5 rounded-xl bg-[#fed428] hover:bg-[#fed428]/90 text-black font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-lg shadow-[#fed428]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Delete Dish Confirmation */}
      {deletingItemId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151a21] border border-rose-800/80 w-full max-w-sm rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-white">Delete Food Item?</h3>
            <p className="text-xs text-gray-400 mt-1">
              Are you sure you want to delete this dish from the menu? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletingItemId(null)}
                className="px-3.5 py-2 rounded-xl bg-[#0c0e11] hover:bg-[#1a212b] border border-[#212833] text-gray-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteMenuItem && deletingItemId) {
                    await onDeleteMenuItem(deletingItemId);
                  }
                  setDeletingItemId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Delete Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Delete Ingredient Confirmation */}
      {deletingIngredientId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151a21] border border-rose-800/80 w-full max-w-sm rounded-3xl p-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-white">Delete Raw Ingredient?</h3>
            <p className="text-xs text-gray-400 mt-1">
              Are you sure you want to delete this raw ingredient from inventory?
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletingIngredientId(null)}
                className="px-3.5 py-2 rounded-xl bg-[#0c0e11] hover:bg-[#1a212b] border border-[#212833] text-gray-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteRawProduct && deletingIngredientId) {
                    await onDeleteRawProduct(deletingIngredientId);
                  }
                  setDeletingIngredientId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Delete Ingredient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
