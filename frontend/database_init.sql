-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables

-- Profiles table (created by Supabase auth)
-- This is managed by Supabase for user profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'customer',
  profile_image_url TEXT,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Queue settings table
CREATE TABLE IF NOT EXISTS public.queue_settings (
  id SERIAL PRIMARY KEY,
  max_active_orders INT NOT NULL DEFAULT 50,
  interval_minutes INT NOT NULL DEFAULT 10,
  last_interval_time TIMESTAMPTZ DEFAULT now(),
  active_orders_count INT DEFAULT 0,
  is_accepting_orders BOOLEAN DEFAULT true,
  cooldown_end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Menu items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  preparation_time INT DEFAULT 15,
  tags TEXT[] DEFAULT '{}',
  ingredients TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  items JSONB NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_id TEXT,
  delivery_address JSONB,
  scheduled_for TIMESTAMPTZ,
  special_instructions TEXT,
  group_order_id UUID,
  queue_position INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id),
  menu_item JSONB, -- Denormalized menu item data
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled orders table
CREATE TABLE IF NOT EXISTS public.scheduled_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  order_template JSONB NOT NULL,
  schedule JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Group orders table
CREATE TABLE IF NOT EXISTS public.group_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  participants JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  expiry_time TIMESTAMPTZ,
  order_id UUID REFERENCES public.orders(id),
  invitation_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Analytics table
CREATE TABLE IF NOT EXISTS public.shop_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_orders INT DEFAULT 0,
  total_sales DECIMAL(10, 2) DEFAULT 0,
  status_distribution JSONB DEFAULT '{"pending": 0, "preparing": 0, "ready": 0, "completed": 0, "cancelled": 0}',
  popular_items JSONB DEFAULT '[]',
  peak_hours JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initialize queue settings
INSERT INTO public.queue_settings (id, max_active_orders, interval_minutes, is_accepting_orders)
VALUES (1, 50, 10, true)
ON CONFLICT (id) DO NOTHING;

-- Create function to update active_orders_count
CREATE OR REPLACE FUNCTION update_active_orders_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE queue_settings
  SET active_orders_count = (
    SELECT COUNT(*) FROM orders
    WHERE status IN ('pending', 'accepted', 'preparing')
  ),
  updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update order count
CREATE TRIGGER update_order_count
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH STATEMENT
EXECUTE FUNCTION update_active_orders_count();

-- Sample data for testing
-- Use these queries to populate your database with sample data

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, available)
VALUES 
('Chicken Biryani', 'Fragrant basmati rice cooked with tender chicken', 180, 'Main Course', true),
('Paneer Butter Masala', 'Cottage cheese cubes in creamy tomato gravy', 160, 'Main Course', true),
('Masala Dosa', 'Crispy rice pancake with potato filling', 120, 'Breakfast', true),
('Veg Pulao', 'Fragrant rice cooked with mixed vegetables', 140, 'Main Course', true),
('Butter Naan', 'Soft leavened bread', 40, 'Bread', true),
('Gulab Jamun', 'Sweet milk solids balls', 80, 'Dessert', true),
('Masala Chai', 'Spiced Indian tea', 30, 'Beverages', true),
('Mango Lassi', 'Sweet yogurt drink with mango', 60, 'Beverages', true),
('Veg Manchurian', 'Deep-fried vegetable balls in spicy sauce', 150, 'Starters', true),
('Chicken 65', 'Spicy deep-fried chicken', 180, 'Starters', true);

-- Initialize analytics for today
INSERT INTO shop_analytics (date, total_orders, total_sales)
VALUES (CURRENT_DATE, 0, 0)
ON CONFLICT (date) DO NOTHING; 