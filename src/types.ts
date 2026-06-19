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
