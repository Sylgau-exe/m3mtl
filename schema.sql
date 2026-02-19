-- M3 Style Database Schema
-- Run this in Neon SQL Editor (https://console.neon.tech)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  is_admin BOOLEAN DEFAULT false,
  is_designer BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  google_id VARCHAR(255),
  auth_provider VARCHAR(50) DEFAULT 'email',
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  plan VARCHAR(20) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- User measurements and style profile
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  height_cm INTEGER,
  weight_kg INTEGER,
  chest_cm INTEGER,
  waist_cm INTEGER,
  hips_cm INTEGER,
  inseam_cm INTEGER,
  shoulder_cm INTEGER,
  neck_cm INTEGER,
  arm_length_cm INTEGER,
  shoe_size VARCHAR(10),
  shoe_system VARCHAR(10) DEFAULT 'US',
  body_type VARCHAR(30),
  style_preferences TEXT[],
  preferred_colors TEXT[],
  avoid_colors TEXT[],
  preferred_fit VARCHAR(20),
  budget_min INTEGER DEFAULT 0,
  budget_max INTEGER DEFAULT 500,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wardrobe items
CREATE TABLE IF NOT EXISTS wardrobe_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  color_primary VARCHAR(50),
  color_secondary VARCHAR(50),
  pattern VARCHAR(50),
  material VARCHAR(100),
  brand VARCHAR(255),
  size VARCHAR(20),
  fit VARCHAR(20),
  season TEXT[],
  occasion TEXT[],
  ai_tags TEXT[],
  ai_description TEXT,
  image_url TEXT,
  condition VARCHAR(20) DEFAULT 'good',
  is_favorite BOOLEAN DEFAULT false,
  wear_count INTEGER DEFAULT 0,
  last_worn DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Designer profiles
CREATE TABLE IF NOT EXISTS designers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  brand_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  description_fr TEXT,
  logo_url TEXT,
  banner_url TEXT,
  website VARCHAR(500),
  instagram VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Canada',
  specialties TEXT[],
  style_tags TEXT[],
  price_range VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  subscription_plan VARCHAR(50),
  subscription_expires DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  designer_id INTEGER REFERENCES designers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_fr VARCHAR(255),
  description TEXT,
  description_fr TEXT,
  season VARCHAR(50),
  year INTEGER,
  cover_image_url TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  designer_id INTEGER REFERENCES designers(id) ON DELETE CASCADE,
  collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  name_fr VARCHAR(255),
  description TEXT,
  description_fr TEXT,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'CAD',
  color_primary VARCHAR(50),
  color_secondary VARCHAR(50),
  pattern VARCHAR(50),
  material VARCHAR(100),
  care_instructions TEXT,
  available_sizes TEXT[],
  size_chart JSONB,
  fit VARCHAR(20),
  season TEXT[],
  occasion TEXT[],
  style_tags TEXT[],
  images TEXT[],
  in_stock BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  ai_recommend_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved looks
CREATE TABLE IF NOT EXISTS looks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  occasion VARCHAR(100),
  description TEXT,
  total_price DECIMAL(10,2),
  items JSONB NOT NULL,
  stylist_notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stylist conversations
CREATE TABLE IF NOT EXISTS stylist_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  occasion VARCHAR(100),
  budget_min INTEGER,
  budget_max INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stylist messages
CREATE TABLE IF NOT EXISTS stylist_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES stylist_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  recommendations JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved products / wishlist
CREATE TABLE IF NOT EXISTS saved_products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD',
  shipping_address JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  designer_id INTEGER REFERENCES designers(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  size VARCHAR(20),
  price DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(4,2) DEFAULT 0.175,
  commission_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_user ON wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_category ON wardrobe_items(category);
CREATE INDEX IF NOT EXISTS idx_designers_slug ON designers(slug);
CREATE INDEX IF NOT EXISTS idx_designers_status ON designers(status);
CREATE INDEX IF NOT EXISTS idx_products_designer ON products(designer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_collections_designer ON collections(designer_id);
CREATE INDEX IF NOT EXISTS idx_looks_user ON looks(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON stylist_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON stylist_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_products(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
