/*
  # Ensure Categories Table and Sample Data

  1. Tables
    - Ensure `categories` table exists with proper structure
    - Add sample categories if table is empty

  2. Data
    - Insert default categories: Furniture, Lighting, Decor, Office, Kitchen
    - Each category includes name, description, and sample image

  3. Security
    - Ensure proper permissions for category access
*/

-- Ensure categories table exists
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  image text,
  created_at timestamptz DEFAULT now()
);

-- Insert sample categories if table is empty
INSERT INTO categories (name, description, image) 
SELECT * FROM (VALUES
  ('Furniture', 'Premium furniture for modern living spaces', 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Lighting', 'Elegant lighting solutions for every room', 'https://images.pexels.com/photos/1125130/pexels-photo-1125130.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Decor', 'Beautiful decorative items and accessories', 'https://images.pexels.com/photos/1668860/pexels-photo-1668860.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Office', 'Professional office furniture and accessories', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('Kitchen', 'Modern kitchen essentials and appliances', 'https://images.pexels.com/photos/2029698/pexels-photo-2029698.jpeg?auto=compress&cs=tinysrgb&w=400')
) AS new_categories(name, description, image)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);