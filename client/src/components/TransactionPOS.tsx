import React, { useState } from 'react';
import { Search, Flame, Plus, Check, Sparkles } from 'lucide-react';
import type { MenuItem, CartItem } from '../types';

interface TransactionPOSProps {
  menuItems: MenuItem[];
  onAddToCart: (item: CartItem) => void;
}

// Available toppings & bundle promo upgrades
const ADDON_OPTIONS = [
  // Classic Extras
  { name: 'Pork Chashu (3 slices)', price: 60, group: 'toppings', desc: 'Extra marinated chashu slices' },
  { name: 'Tamago Egg', price: 25, group: 'toppings', desc: 'Soft-boiled seasoned ramen egg' },
  { name: 'Extra Nori', price: 20, group: 'toppings', desc: 'Crispy seaweed sheets' },

  // Promo Meal Bundles & Combos (User: "1 ramen and 1 rice meal = bundle or with drinks")
  { name: '🍱 Promo Bundle: Mini Chashu Rice Bowl', price: 95, group: 'bundles', desc: 'Add rice bowl at discounted combo price', badge: 'MEAL BUNDLE' },
  { name: '🥟 Promo Bundle: 3pcs Gyoza Side', price: 65, group: 'bundles', desc: 'Crispy Japanese pork gyoza', badge: 'COMBO' },
  { name: '🥤 Promo Bundle: Refreshing Iced Tea', price: 35, group: 'bundles', desc: 'Save ₱35 on house iced tea drink', badge: 'DRINK COMBO' },
  { name: '🥤 Promo Bundle: Lychee Fruit Tea', price: 45, group: 'bundles', desc: 'Save ₱25 on fresh fruit tea', badge: 'DRINK COMBO' }
];

export const TransactionPOS: React.FC<TransactionPOSProps> = ({ menuItems, onAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Customization Modal State (for Ramen spice/addons & promo bundle add-ons)
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [selectedSpice, setSelectedSpice] = useState<'Mild' | 'Hot' | 'Extra Hot'>('Mild');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const categories = ['All', 'Ramen', 'Rice Meals', 'Drinks', 'Bundle'];

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDishClick = (dish: MenuItem) => {
    if (dish.stock <= 0) return;

    if (dish.category === 'Ramen' || dish.category === 'Rice Meals') {
      // Open customization modal for spice & bundle addons
      setSelectedDish(dish);
      setSelectedSpice('Mild');
      setSelectedAddons([]);
    } else {
      // Direct add to cart for drinks, standalone bundles
      onAddToCart({
        cartId: `${dish.id}-${Date.now()}`,
        id: dish.id,
        name: dish.name,
        category: dish.category,
        price: dish.price,
        image: dish.image,
        qty: 1,
        spiceLevel: 'None',
        addons: []
      });
    }
  };

  const currentAddonExtra = selectedAddons.reduce((sum, name) => {
    const match = ADDON_OPTIONS.find((a) => a.name === name);
    return sum + (match ? match.price : 0);
  }, 0);

  const handleConfirmCustomization = () => {
    if (!selectedDish) return;

    onAddToCart({
      cartId: `${selectedDish.id}-${selectedSpice}-${selectedAddons.sort().join('-')}-${Date.now()}`,
      id: selectedDish.id,
      name: selectedDish.name,
      category: selectedDish.category,
      price: selectedDish.price + currentAddonExtra,
      image: selectedDish.image,
      qty: 1,
      spiceLevel: selectedDish.category === 'Ramen' ? selectedSpice : 'None',
      addons: selectedAddons
    });

    setSelectedDish(null);
  };

  const toggleAddon = (addon: string) => {
    if (selectedAddons.includes(addon)) {
      setSelectedAddons(selectedAddons.filter((a) => a !== addon));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e11] overflow-hidden p-5">
      {/* Category Pills & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        {/* Category Tabs (Fiddle Pill style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
                  isActive
                    ? 'bg-[#fed428] text-black shadow-lg shadow-[#fed428]/20 scale-105'
                    : 'bg-[#151a21] text-gray-300 hover:text-white hover:bg-[#1f2631] border border-[#212833]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dish or flavor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151a21] border border-[#212833] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0ca1e1] transition-all"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-max">
        {filteredItems.map((dish) => {
          const isOutOfStock = dish.stock <= 0;
          const isLowStock = dish.stock > 0 && dish.stock <= 5;

          return (
            <div
              key={dish.id}
              onClick={() => handleDishClick(dish)}
              className={`group relative bg-[#151a21] rounded-2xl border p-4 flex flex-col items-center text-center transition-all duration-200 select-none ${
                isOutOfStock
                  ? 'opacity-40 border-red-950/40 cursor-not-allowed'
                  : 'border-[#212833] hover:border-[#0ca1e1]/80 hover:bg-[#1a212b] hover:shadow-xl hover:shadow-[#0ca1e1]/5 active:scale-98 cursor-pointer'
              }`}
            >
              {/* Best Seller Ribbon */}
              {dish.isBestSeller === 1 && !isOutOfStock && (
                <div className="absolute top-3 left-3 bg-[#fed428] text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md shadow-[#fed428]/30">
                  ★ Best Seller
                </div>
              )}

              {/* Circular Food Image with Glow Ring */}
              <div className="relative w-32 h-32 my-2 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0ca1e1]/10 to-[#fed428]/10 group-hover:scale-105 transition-transform duration-300"></div>
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-28 h-28 object-contain rounded-full drop-shadow-xl group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/icons/NoPicture.png';
                  }}
                />
              </div>

              {/* Dish Name */}
              <h3 className="font-bold text-base text-white tracking-wide mt-1 group-hover:text-[#0ca1e1] transition-colors line-clamp-1">
                {dish.name}
              </h3>

              {/* Price (Philippine Peso ₱) */}
              <div className="text-lg font-black text-[#fed428] mt-1 font-mono">
                ₱{Number(dish.price).toFixed(2)}
              </div>

              {/* Stock Indicator */}
              <div className="mt-2 text-xs font-semibold">
                {isOutOfStock ? (
                  <span className="text-rose-400 bg-rose-950/50 px-2.5 py-0.5 rounded-md border border-rose-800/60">
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="text-amber-300 bg-amber-950/40 px-2.5 py-0.5 rounded-md border border-amber-800/50">
                    Low Stock: {dish.stock}
                  </span>
                ) : (
                  <span className="text-emerald-400 bg-emerald-950/30 px-2.5 py-0.5 rounded-md border border-emerald-800/40">
                    Available: {dish.stock}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ramen Customization Modal (Spice Level & Addons) */}
      {selectedDish && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#151a21] border border-[#2b3543] w-full max-w-md rounded-3xl p-6 shadow-2xl shadow-black/80 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center gap-4 border-b border-[#212833] pb-4">
              <img
                src={selectedDish.image}
                alt={selectedDish.name}
                className="w-16 h-16 rounded-full object-contain bg-[#0c0e11] p-1 border border-[#212833]"
              />
              <div>
                <h3 className="text-xl font-bold text-white">{selectedDish.name}</h3>
                <p className="text-sm font-black text-[#fed428] font-mono">
                  Base: ₱{Number(selectedDish.price).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Spice Level Selector (For Ramen) */}
            {selectedDish.category === 'Ramen' && (
              <div className="mt-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Select Spice Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Mild', 'Hot', 'Extra Hot'] as const).map((spice) => {
                    const isSel = selectedSpice === spice;
                    return (
                      <button
                        key={spice}
                        onClick={() => setSelectedSpice(spice)}
                        className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                          isSel
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-500/20'
                            : 'bg-[#0f1217] text-gray-400 border-[#212833] hover:text-white'
                        }`}
                      >
                        {spice}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customization Options: Toppings & Promo Bundles */}
            <div className="mt-4 space-y-4 max-h-[46vh] overflow-y-auto pr-1">
              {/* Group 1: Classic Extras & Toppings */}
              {selectedDish.category === 'Ramen' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Plus className="w-3.5 h-3.5 text-[#0ca1e1]" />
                    <span>Ramen Toppings & Extras</span>
                  </label>
                  <div className="space-y-1.5">
                    {ADDON_OPTIONS.filter((a) => a.group === 'toppings').map((addon) => {
                      const isChecked = selectedAddons.includes(addon.name);
                      return (
                        <div
                          key={addon.name}
                          onClick={() => toggleAddon(addon.name)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-[#0ca1e1]/10 border-[#0ca1e1] text-white'
                              : 'bg-[#0f1217] border-[#212833] text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                              isChecked ? 'bg-[#0ca1e1] border-[#0ca1e1] text-black' : 'border-gray-600'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div>
                              <span className="text-xs font-bold block">{addon.name}</span>
                              <span className="text-[10px] text-gray-500">{addon.desc}</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#fed428] font-mono shrink-0">+₱{addon.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group 2: Promo Meal Bundles & Combos (User: 1 ramen + 1 rice meal or drink = bundle) */}
              <div>
                <label className="text-[11px] font-bold text-[#fed428] uppercase tracking-wider flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#fed428]" />
                    <span>Promo Meal Bundles & Drink Combos</span>
                  </div>
                  <span className="text-[10px] bg-[#fed428]/15 border border-[#fed428]/30 px-1.5 py-0.5 rounded font-bold font-mono">
                    COMBO UPGRADE
                  </span>
                </label>
                <div className="space-y-1.5">
                  {ADDON_OPTIONS.filter((a) => a.group === 'bundles').map((addon) => {
                    const isChecked = selectedAddons.includes(addon.name);
                    return (
                      <div
                        key={addon.name}
                        onClick={() => toggleAddon(addon.name)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#fed428]/10 border-[#fed428] text-white shadow-sm'
                            : 'bg-[#0f1217] border-[#212833] text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            isChecked ? 'bg-[#fed428] border-[#fed428] text-black' : 'border-gray-600'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold">{addon.name}</span>
                              {addon.badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#0ca1e1]/20 text-[#0ca1e1] border border-[#0ca1e1]/30">
                                  {addon.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400">{addon.desc}</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-400 font-mono shrink-0">+₱{addon.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 mt-5 pt-3 border-t border-[#212833]">
              <button
                onClick={() => setSelectedDish(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#0f1217] text-gray-400 hover:text-white border border-[#212833] font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCustomization}
                className="flex-1 py-2.5 rounded-xl bg-[#fed428] hover:bg-[#fed428]/90 text-black font-black text-xs shadow-lg shadow-[#fed428]/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span>Add to Cart • ₱{(selectedDish.price + currentAddonExtra).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
