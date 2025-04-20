-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'shopkeeper', 'admin')),
  profile_image_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb, -- For storing user preferences
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  preparation_time INTEGER NOT NULL, -- in minutes
  tags TEXT[] DEFAULT '{}',
  ingredients TEXT[] DEFAULT '{}',
  rating DECIMAL(3, 2),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  items JSONB NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'razorpay')),
  payment_id TEXT,
  razorpay_order_id TEXT,       -- For Razorpay integration
  razorpay_payment_id TEXT,     -- For Razorpay integration
  razorpay_signature TEXT,      -- For Razorpay integration verification
  delivery_address JSONB NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  group_order_id UUID,
  queue_position INTEGER,       -- Track position in queue
  estimated_ready_time TIMESTAMP WITH TIME ZONE,
  preparation_time INTEGER      -- Estimated preparation time in minutes
);

-- Create scheduled_orders table
CREATE TABLE IF NOT EXISTS public.scheduled_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  order_template JSONB NOT NULL,
  schedule JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_orders table
CREATE TABLE IF NOT EXISTS public.group_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  participants JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'ordered')),
  expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
  order_id UUID,
  invitation_link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order_status', 'delivery', 'system', 'alert', 'promotion', 'queue_update')),
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some sample menu items
INSERT INTO public.menu_items (name, description, price, image_url, category, preparation_time, tags, ingredients)
VALUES
  ('Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella and basil', 299, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002', 'Pizza', 20, ARRAY['vegetarian', 'bestseller'], ARRAY['dough', 'tomato sauce', 'mozzarella', 'basil']),
  ('Paneer Tikka', 'Chunks of cottage cheese marinated in spices and grilled', 249, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6', 'Appetizers', 15, ARRAY['vegetarian', 'spicy'], ARRAY['paneer', 'bell peppers', 'onions', 'spices']),
  ('Butter Chicken', 'Tender chicken in a rich buttery tomato sauce', 349, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398', 'Main Course', 25, ARRAY['non-vegetarian', 'bestseller'], ARRAY['chicken', 'butter', 'tomato', 'cream', 'spices']),
  ('Chocolate Brownie', 'Warm chocolate brownie served with vanilla ice cream', 199, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e', 'Desserts', 10, ARRAY['vegetarian', 'sweet'], ARRAY['chocolate', 'flour', 'sugar', 'butter']),
  ('Masala Dosa', 'Crispy rice pancake with spiced potato filling', 149, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc', 'South Indian', 15, ARRAY['vegetarian', 'breakfast'], ARRAY['rice batter', 'potatoes', 'spices']),
  ('Cold Coffee', 'Refreshing cold coffee with ice cream', 129, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c', 'Beverages', 5, ARRAY['vegetarian', 'cold'], ARRAY['coffee', 'milk', 'sugar', 'ice cream']);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles can be read by anyone but only updated by the owner or admin
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profiles" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profiles" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Menu items can be viewed by everyone
CREATE POLICY "Menu items are viewable by everyone" 
  ON public.menu_items FOR SELECT USING (true);

-- Only admins/shopkeepers can insert, update, delete menu items
CREATE POLICY "Only admins can manage menu items" 
  ON public.menu_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'shopkeeper')
    )
  );

-- Orders can be created by any authenticated user
CREATE POLICY "Users can create orders" 
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own orders
CREATE POLICY "Users can view their own orders" 
  ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- Shopkeepers/admins can view all orders
CREATE POLICY "Shopkeepers/admins can view all orders" 
  ON public.orders FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'shopkeeper')
    )
  );

-- Notification policies
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create queue_settings table for order queue management
CREATE TABLE IF NOT EXISTS public.queue_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Only one record is allowed
  max_active_orders INTEGER NOT NULL DEFAULT 50, -- Default max active orders is 50
  interval_minutes INTEGER NOT NULL DEFAULT 10,  -- Default interval is 10 minutes
  last_interval_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_orders_count INTEGER DEFAULT 0,
  is_accepting_orders BOOLEAN DEFAULT TRUE,
  cooldown_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default queue settings
INSERT INTO public.queue_settings 
  (max_active_orders, interval_minutes, is_accepting_orders) 
VALUES 
  (50, 10, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create shop_analytics table for tracking metrics
CREATE TABLE IF NOT EXISTS public.shop_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_orders INTEGER DEFAULT 0,
  total_sales DECIMAL(10, 2) DEFAULT 0,
  status_distribution JSONB DEFAULT '{"pending": 0, "accepted": 0, "preparing": 0, "ready": 0, "completed": 0, "cancelled": 0}'::jsonb,
  popular_items JSONB DEFAULT '[]'::jsonb,
  peak_hours JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setup real-time subscriptions
BEGIN;
  -- Drop if exists to avoid errors on re-run
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create a publication for all tables
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    orders, notifications, group_orders, scheduled_orders, queue_settings, shop_analytics;
COMMIT;

-- Create a function to update queue position for new orders
CREATE OR REPLACE FUNCTION update_queue_position()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  -- Get count of active orders (pending or preparing)
  SELECT COUNT(*) INTO active_count FROM orders 
  WHERE status IN ('pending', 'preparing', 'accepted') AND id != NEW.id;
  
  -- Update the queue position
  NEW.queue_position := active_count + 1;
  
  -- Update the queue_settings table
  UPDATE queue_settings 
  SET active_orders_count = active_count + 1,
      updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set queue position on new orders
CREATE TRIGGER set_queue_position
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION update_queue_position();

-- Create a function to update analytics when order status changes
CREATE OR REPLACE FUNCTION update_order_analytics()
RETURNS TRIGGER AS $$
DECLARE
  old_status TEXT;
  new_status TEXT;
  today DATE := CURRENT_DATE;
  analytics_record UUID;
  item_record JSONB;
  item JSONB;
BEGIN
  -- Get or create analytics record for today
  SELECT id INTO analytics_record FROM shop_analytics WHERE date = today;
  
  IF analytics_record IS NULL THEN
    INSERT INTO shop_analytics (date) VALUES (today) RETURNING id INTO analytics_record;
  END IF;
  
  -- Handle new order
  IF TG_OP = 'INSERT' THEN
    -- Increment total orders and sales
    UPDATE shop_analytics 
    SET total_orders = total_orders + 1,
        total_sales = total_sales + NEW.total_price,
        status_distribution = jsonb_set(
          status_distribution,
          '{' || NEW.status || '}',
          ((status_distribution->>NEW.status)::integer + 1)::text::jsonb
        ),
        updated_at = NOW()
    WHERE id = analytics_record;
    
    -- Update popular items
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      -- Logic to update popular items would go here
      -- This is simplified for now
    END LOOP;
    
  -- Handle status update
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    old_status := OLD.status;
    new_status := NEW.status;
    
    -- Update status distribution
    UPDATE shop_analytics 
    SET status_distribution = jsonb_set(
          jsonb_set(
            status_distribution,
            '{' || old_status || '}',
            ((status_distribution->>old_status)::integer - 1)::text::jsonb
          ),
          '{' || new_status || '}',
          ((status_distribution->>new_status)::integer + 1)::text::jsonb
        ),
        updated_at = NOW()
    WHERE id = analytics_record;
    
    -- If order is completed or cancelled, decrement active orders count
    IF NEW.status IN ('completed', 'cancelled') AND OLD.status IN ('pending', 'preparing', 'accepted') THEN
      UPDATE queue_settings 
      SET active_orders_count = GREATEST(active_orders_count - 1, 0),
          updated_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for analytics
CREATE TRIGGER update_analytics_on_insert
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_analytics();

CREATE TRIGGER update_analytics_on_update
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_analytics();

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable replication for real-time
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.group_orders REPLICA IDENTITY FULL;
ALTER TABLE public.scheduled_orders REPLICA IDENTITY FULL;
ALTER TABLE public.queue_settings REPLICA IDENTITY FULL;
ALTER TABLE public.shop_analytics REPLICA IDENTITY FULL;
