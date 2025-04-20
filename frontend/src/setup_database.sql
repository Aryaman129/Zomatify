-- Setup required tables and storage buckets

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total DECIMAL(10, 2) NOT NULL,
    items JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id)
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    preparation_time INTEGER DEFAULT 15,
    tags TEXT[] DEFAULT '{}',
    ingredients TEXT[] DEFAULT '{}',
    nutritional_info JSONB,
    rating DECIMAL(3, 2),
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create queue_settings table
CREATE TABLE IF NOT EXISTS public.queue_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    max_active_orders INTEGER DEFAULT 10,
    is_accepting_orders BOOLEAN DEFAULT TRUE,
    interval_minutes INTEGER DEFAULT 10,
    last_interval_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default queue settings if not exists
INSERT INTO public.queue_settings (id, max_active_orders, is_accepting_orders, interval_minutes)
SELECT '1', 10, true, 10
WHERE NOT EXISTS (SELECT 1 FROM public.queue_settings WHERE id = '1');

-- Create storage bucket for images
-- Run this in Supabase dashboard or API
-- NOTE: This SQL cannot directly create storage buckets
-- You'll need to use the Supabase dashboard or REST API

-- Add RLS policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Shopkeepers can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Shopkeepers can manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Everyone can view menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Shopkeepers can manage queue settings" ON public.queue_settings;
DROP POLICY IF EXISTS "Everyone can view queue settings" ON public.queue_settings;

-- Allow authenticated users to view their own orders
CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

-- Allow authenticated shopkeepers to view all orders
CREATE POLICY "Shopkeepers can view all orders" 
ON public.orders FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'shopkeeper'
  )
);

-- Allow shopkeepers to manage menu items
CREATE POLICY "Shopkeepers can manage menu items" 
ON public.menu_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'shopkeeper'
  )
);

-- Allow any authenticated user to view menu items
CREATE POLICY "Everyone can view menu items" 
ON public.menu_items
FOR SELECT
USING (true);

-- Allow shopkeepers to manage queue settings
CREATE POLICY "Shopkeepers can manage queue settings" 
ON public.queue_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'shopkeeper'
  )
);

-- Allow any authenticated user to view queue settings
CREATE POLICY "Everyone can view queue settings" 
ON public.queue_settings
FOR SELECT
USING (true);

-- Help text for creating storage bucket
COMMENT ON TABLE public.orders IS 'To create storage bucket, go to Storage in Supabase dashboard and create a new bucket named "images" with public access.';

-- Sample data for menu_items (only inserts if table is empty)
INSERT INTO public.menu_items (name, description, price, category, preparation_time, tags, ingredients)
SELECT 
  'Veggie Burger', 
  'Delicious vegetarian burger with fresh vegetables and special sauce', 
  120.00, 
  'Burgers', 
  15, 
  ARRAY['Vegetarian', 'Popular'], 
  ARRAY['Veggie patty', 'Lettuce', 'Tomato', 'Cheese']
WHERE NOT EXISTS (SELECT 1 FROM public.menu_items LIMIT 1);

INSERT INTO public.menu_items (name, description, price, category, preparation_time, tags, ingredients)
SELECT 
  'Masala Dosa', 
  'South Indian crispy crepe filled with spiced potato filling', 
  80.00, 
  'South Indian', 
  10, 
  ARRAY['Vegetarian', 'Spicy'], 
  ARRAY['Rice batter', 'Potatoes', 'Spices']
WHERE NOT EXISTS (SELECT 1 FROM public.menu_items LIMIT 1);

INSERT INTO public.menu_items (name, description, price, category, preparation_time, tags, ingredients)
SELECT 
  'Chocolate Shake', 
  'Creamy milk shake with chocolate ice cream and chocolate sauce', 
  90.00, 
  'Beverages', 
  5, 
  ARRAY['Sweet', 'Cold'], 
  ARRAY['Milk', 'Chocolate ice cream', 'Chocolate sauce']
WHERE NOT EXISTS (SELECT 1 FROM public.menu_items LIMIT 1);

-- Enable RLS for shop_analytics table
ALTER TABLE public.shop_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Shopkeepers can view analytics" ON public.shop_analytics;
DROP POLICY IF EXISTS "Shopkeepers can manage analytics" ON public.shop_analytics;

-- Allow authenticated shopkeepers to view analytics
CREATE POLICY "Shopkeepers can view analytics" 
ON public.shop_analytics FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'shopkeeper'
  )
);

-- Allow authenticated shopkeepers to manage analytics
CREATE POLICY "Shopkeepers can manage analytics" 
ON public.shop_analytics FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'shopkeeper'
  )
); 