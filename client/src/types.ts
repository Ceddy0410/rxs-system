export interface RecipeIngredient {
  productId: number;
  productName: string;
  qty: number;
  uom: string;
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  size: string;
  uom: string;
  isBestSeller: number;
  stock: number;
  status: string;
  recipe?: RecipeIngredient[];
}

export interface CartItem {
  cartId: string;
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  qty: number;
  spiceLevel?: 'Mild' | 'Hot' | 'Extra Hot' | 'None';
  addons?: string[];
  addonPrice?: number;
}

export interface RawProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  unitPrice: number;
  quantity: number;
  uom: string;
  minStock: number;
  status: string;
}

export interface Order {
  id: number;
  transactionId: string;
  items: CartItem[];
  subtotal: number;
  discountType: string;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  amountPaid: number;
  changeAmount: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  cashier: string;
  createdAt: string;
}

export interface User {
  id: string | number;
  username: string;
  name: string;
  role: 'Admin' | 'Cashier' | 'Kitchen';
  avatar?: string;
  status?: string;
  password?: string;
}
