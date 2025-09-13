export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_available: boolean;
  preparation_time: number;
  tags: string[];
  ingredients: string[];
  created_at?: string;
  updated_at?: string;
  rating?: number;
  review_count?: number;
}

export interface MenuItemOption {
  id: string;
  name: string;
  price: number;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  allergens?: string[];
} 