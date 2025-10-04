-- Create products table for food items
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    barcode VARCHAR(50),
    calories_per_100g INTEGER NOT NULL,
    protein_per_100g DECIMAL(5,2) NOT NULL,
    fat_per_100g DECIMAL(5,2) NOT NULL,
    carbs_per_100g DECIMAL(5,2) NOT NULL,
    is_global BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_meal_items table
CREATE TABLE public.daily_meal_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    daily_meal_id UUID REFERENCES public.daily_meals(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity_grams DECIMAL(8,2) NOT NULL,
    quantity_portions DECIMAL(3,2) DEFAULT 1.0,
    calories INTEGER NOT NULL,
    protein DECIMAL(5,2) NOT NULL,
    fat DECIMAL(5,2) NOT NULL,
    carbs DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_daily_meal_items_meal_id ON public.daily_meal_items(daily_meal_id);
CREATE INDEX idx_daily_meal_items_product_id ON public.daily_meal_items(product_id);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_meal_items ENABLE ROW LEVEL SECURITY;

-- Products policies (global products are readable by all, user products only by owner)
CREATE POLICY "Users can view products" ON public.products
    FOR SELECT USING (is_global = true OR auth.uid() = created_by);

CREATE POLICY "Users can insert own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own products" ON public.products
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own products" ON public.products
    FOR DELETE USING (auth.uid() = created_by);

-- Daily meal items policies
CREATE POLICY "Users can view own daily meal items" ON public.daily_meal_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.daily_meals 
            WHERE id = daily_meal_items.daily_meal_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own daily meal items" ON public.daily_meal_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.daily_meals 
            WHERE id = daily_meal_items.daily_meal_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own daily meal items" ON public.daily_meal_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.daily_meals 
            WHERE id = daily_meal_items.daily_meal_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own daily meal items" ON public.daily_meal_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.daily_meals 
            WHERE id = daily_meal_items.daily_meal_id 
            AND user_id = auth.uid()
        )
    );

-- Create trigger for updated_at on products
CREATE OR REPLACE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some common global products
INSERT INTO public.products (name, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, is_global) VALUES
('Ryż biały, gotowany', 130, 2.7, 0.3, 28.0, true),
('Kurczak, pierś, gotowana', 165, 31.0, 3.6, 0.0, true),
('Brokuły, gotowane', 34, 2.8, 0.4, 7.0, true),
('Jajko, całe, gotowane', 155, 12.6, 10.6, 1.1, true),
('Płatki owsiane', 389, 16.9, 6.9, 66.3, true),
('Mleko 2%', 50, 3.3, 2.0, 4.8, true),
('Banana', 89, 1.1, 0.3, 22.8, true),
('Łosoś, gotowany', 208, 25.0, 12.0, 0.0, true),
('Sól kuchenna', 0, 0.0, 0.0, 0.0, true),
('Oliwa z oliwek', 884, 0.0, 100.0, 0.0, true);
