export interface MenuItem {
  id: string;
  nameGeo: string;
  nameEng: string;
  category: string;
  description: string;
  price: number;
  priceGlass?: number;
  priceBottle?: number;
  isAvailable: boolean;
  tags: string[];
  image: string;
}

export interface Table {
  id: string;
  number: number;
  name: string;
  status: 'free' | 'occupied' | 'service_requested';
  activeGreeting?: string;
  currentOrderId?: string; // Links to the active order, if any
}

export interface CartItem {
  id: string; // generated combination string or random uuid
  menuItemId: string; // Original item ID
  name: string;      // Translated/Local name
  price: number;
  quantity: number;
  selectedOption?: 'glass' | 'bottle' | 'standard';
  note?: string;
}

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  items: CartItem[];
  totalPrice: number;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  estimatedWaitMinutes?: number;
  createdAt: string;
  isViewedByTablet?: boolean;
}

export interface Category {
  id: string;
  nameGeo: string;
  nameEng: string;
  iconName: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  guestName: string;
  date: string;
}
