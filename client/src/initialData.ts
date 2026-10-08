import type { MenuItem, RawProduct } from './types';

export const FALLBACK_MENU: MenuItem[] = [
  // RAMEN
  { 
    id: 1, name: 'Kuro Ramen', category: 'Ramen', price: 250, image: '/images/Ramen/Kuro.png', isBestSeller: 1, stock: 25, size: 'Regular', uom: 'serving', status: 'Active',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 80, uom: 'g' },
      { productId: 5, productName: 'Black Garlic Oil', qty: 20, uom: 'ml' },
      { productId: 8, productName: 'Fresh Eggs', qty: 1, uom: 'pcs' },
      { productId: 7, productName: 'Nori Sheets', qty: 1, uom: 'sheets' }
    ]
  },
  { 
    id: 2, name: 'Aka Ramen', category: 'Ramen', price: 260, image: '/images/Ramen/Aka.png', isBestSeller: 1, stock: 20, size: 'Regular', uom: 'serving', status: 'Active',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 80, uom: 'g' },
      { productId: 4, productName: 'Miso Paste', qty: 30, uom: 'g' },
      { productId: 8, productName: 'Fresh Eggs', qty: 1, uom: 'pcs' }
    ]
  },
  { 
    id: 3, name: 'Kaisen Ramen', category: 'Ramen', price: 280, image: '/images/Ramen/Kaisen.png', isBestSeller: 0, stock: 15, size: 'Regular', uom: 'serving', status: 'Active',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 30, uom: 'ml' },
      { productId: 7, productName: 'Nori Sheets', qty: 1, uom: 'sheets' }
    ]
  },
  { 
    id: 4, name: 'TanTan Ramen', category: 'Ramen', price: 270, image: '/images/Ramen/TanTan.png', isBestSeller: 1, stock: 18, size: 'Regular', uom: 'serving', status: 'Active',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 80, uom: 'g' },
      { productId: 6, productName: 'Sesame Oil', qty: 20, uom: 'ml' },
      { productId: 9, productName: 'Bean Sprouts', qty: 50, uom: 'g' }
    ]
  },
  { 
    id: 5, name: 'Tonkotsu Hakata', category: 'Ramen', price: 265, image: '/images/Ramen/TonkotsuHakata.png', isBestSeller: 0, stock: 22, size: 'Regular', uom: 'serving', status: 'Active',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 80, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 25, uom: 'ml' },
      { productId: 8, productName: 'Fresh Eggs', qty: 1, uom: 'pcs' }
    ]
  },
  { 
    id: 6, name: 'Tonkotsu Shoyu', category: 'Ramen', price: 255, image: '/images/Ramen/TonkotsuShoyu.png', isBestSeller: 0, stock: 19, size: 'Regular', uom: 'serving', status: 'Active',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 80, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 30, uom: 'ml' }
    ]
  },
  
  // RICE MEALS
  { 
    id: 7, name: 'Pork Katsu', category: 'Rice Meals', price: 180, image: '/images/Rice Meals/Pork Katsu.png', isBestSeller: 1, stock: 20, size: 'Regular', uom: 'serving', status: 'Active',
    recipe: [
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 150, uom: 'g' },
      { productId: 10, productName: 'Japanese Rice', qty: 200, uom: 'g' },
      { productId: 8, productName: 'Fresh Eggs', qty: 1, uom: 'pcs' }
    ]
  },
  { 
    id: 8, name: 'Beef Gyudon', category: 'Rice Meals', price: 210, image: '/images/Rice Meals/BeefGyudon.png', isBestSeller: 1, stock: 15, size: 'Regular', uom: 'serving', status: 'Active',
    recipe: [
      { productId: 10, productName: 'Japanese Rice', qty: 200, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 30, uom: 'ml' },
      { productId: 8, productName: 'Fresh Eggs', qty: 1, uom: 'pcs' }
    ]
  },
  { 
    id: 9, name: 'Beef Teriyaki', category: 'Rice Meals', price: 220, image: '/images/Rice Meals/BeefTeriyaki.png', isBestSeller: 0, stock: 14, size: 'Regular', uom: 'serving', status: 'Active',
    recipe: [
      { productId: 10, productName: 'Japanese Rice', qty: 200, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 25, uom: 'ml' }
    ]
  },
  { 
    id: 10, name: 'Chicken Karaage', category: 'Rice Meals', price: 175, image: '/images/Rice Meals/ChickenKaraage.png', isBestSeller: 0, stock: 18, size: 'Regular', uom: 'serving', status: 'Active',
    recipe: [
      { productId: 10, productName: 'Japanese Rice', qty: 200, uom: 'g' },
      { productId: 6, productName: 'Sesame Oil', qty: 15, uom: 'ml' }
    ]
  },
  { 
    id: 11, name: 'Chicken Teriyaki', category: 'Rice Meals', price: 185, image: '/images/Rice Meals/ChickenTeriyaki.png', isBestSeller: 0, stock: 16, size: 'Regular', uom: 'serving', status: 'Active',
    recipe: [
      { productId: 10, productName: 'Japanese Rice', qty: 200, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 20, uom: 'ml' }
    ]
  },

  // DRINKS
  { id: 12, name: 'Coca-Cola', category: 'Drinks', price: 45, image: '/images/Drinks/CocaCola.png', isBestSeller: 1, stock: 40, size: '330ml', uom: 'can', status: 'Active', recipe: [] },
  { id: 13, name: 'Sprite', category: 'Drinks', price: 45, image: '/images/Drinks/Sprite.png', isBestSeller: 0, stock: 35, size: '330ml', uom: 'can', status: 'Active', recipe: [] },
  { id: 14, name: 'Matcha Frappe', category: 'Drinks', price: 95, image: '/images/Drinks/MatchFrappe.png', isBestSeller: 1, stock: 25, size: '16oz', uom: 'cup', status: 'Active', recipe: [] },
  { id: 15, name: 'Strawberry Float', category: 'Drinks', price: 85, image: '/images/Drinks/Strawberry.png', isBestSeller: 0, stock: 20, size: '16oz', uom: 'cup', status: 'Active', recipe: [] },
  { id: 16, name: 'Mango Smoothie', category: 'Drinks', price: 85, image: '/images/Drinks/Mango.png', isBestSeller: 0, stock: 20, size: '16oz', uom: 'cup', status: 'Active', recipe: [] },
  { id: 17, name: 'Green Apple Soda', category: 'Drinks', price: 75, image: '/images/Drinks/GreenApple.png', isBestSeller: 0, stock: 25, size: '16oz', uom: 'cup', status: 'Active', recipe: [] },
  { id: 18, name: 'Blueberry Cooler', category: 'Drinks', price: 80, image: '/images/Drinks/Blueberry.png', isBestSeller: 0, stock: 20, size: '16oz', uom: 'cup', status: 'Active', recipe: [] },
  { id: 19, name: 'Lychee Iced Tea', category: 'Drinks', price: 70, image: '/images/Drinks/Lychee.png', isBestSeller: 0, stock: 30, size: '16oz', uom: 'cup', status: 'Active', recipe: [] },

  // BUNDLE
  { 
    id: 20, name: 'Ramen Duo Combo', category: 'Bundle', price: 480, image: '/images/Bundle/RamenDuo.png', isBestSeller: 1, stock: 12, size: 'Bundle for 2', uom: 'set', status: 'Active',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 300, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 160, uom: 'g' },
      { productId: 8, productName: 'Fresh Eggs', qty: 2, uom: 'pcs' }
    ]
  },
];

export const FALLBACK_PRODUCTS: RawProduct[] = [
  { id: 1, name: 'Ramen Noodles', brand: 'Fiddle Fresh', category: 'Ingredient', unitPrice: 25, quantity: 5000, uom: 'g', minStock: 1000, status: 'Active' },
  { id: 2, name: 'Pork Belly (Chashu)', brand: 'Local Farm', category: 'Meat', unitPrice: 320, quantity: 8000, uom: 'g', minStock: 2000, status: 'Active' },
  { id: 3, name: 'Soy Sauce', brand: 'Kikkoman', category: 'Seasoning', unitPrice: 180, quantity: 5000, uom: 'ml', minStock: 1000, status: 'Active' },
  { id: 4, name: 'Miso Paste', brand: 'Marukome', category: 'Seasoning', unitPrice: 220, quantity: 3000, uom: 'g', minStock: 500, status: 'Active' },
  { id: 5, name: 'Black Garlic Oil', brand: 'House Special', category: 'Oil', unitPrice: 350, quantity: 2000, uom: 'ml', minStock: 500, status: 'Active' },
  { id: 6, name: 'Sesame Oil', brand: 'Kadoya', category: 'Oil', unitPrice: 280, quantity: 2500, uom: 'ml', minStock: 500, status: 'Active' },
  { id: 7, name: 'Nori Sheets', brand: 'Yamamotoyama', category: 'Garnish', unitPrice: 120, quantity: 200, uom: 'sheets', minStock: 50, status: 'Active' },
  { id: 8, name: 'Fresh Eggs', brand: 'Magnolia', category: 'Ingredient', unitPrice: 10, quantity: 150, uom: 'pcs', minStock: 30, status: 'Active' },
  { id: 9, name: 'Bean Sprouts', brand: 'Fresh Market', category: 'Vegetable', unitPrice: 50, quantity: 3000, uom: 'g', minStock: 500, status: 'Active' },
  { id: 10, name: 'Japanese Rice', brand: 'Haru', category: 'Grain', unitPrice: 75, quantity: 10000, uom: 'g', minStock: 2500, status: 'Active' }
];
