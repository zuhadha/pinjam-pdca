-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  nik TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'user'  NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Text icon/emoji
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Items table (removed status column per user feedback)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  stock_total INTEGER DEFAULT 0 NOT NULL CHECK (stock_total >= 0),
  stock_available INTEGER DEFAULT 0 NOT NULL CHECK (stock_available >= 0 AND stock_available <= stock_total),
  location TEXT,
  photo_url TEXT,
  is_sensitive BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Borrow requests table
CREATE TABLE borrow_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  purpose TEXT NOT NULL,
  notes TEXT,
  status request_status DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  return_declared_at TIMESTAMPTZ,
  return_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Borrow items junction table (for multiple items per request)
CREATE TABLE borrow_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES borrow_requests(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Borrow logs table (audit trail)
CREATE TABLE borrow_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES borrow_requests(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_nik ON users(nik);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_items_category_id ON items(category_id);
CREATE INDEX idx_items_is_sensitive ON items(is_sensitive);
CREATE INDEX idx_items_is_active ON items(is_active);
CREATE INDEX idx_borrow_requests_user_id ON borrow_requests(user_id);
CREATE INDEX idx_borrow_requests_status ON borrow_requests(status);
CREATE INDEX idx_borrow_requests_end_date ON borrow_requests(end_date);
CREATE INDEX idx_borrow_items_request_id ON borrow_items(request_id);
CREATE INDEX idx_borrow_items_item_id ON borrow_items(item_id);
CREATE INDEX idx_borrow_logs_request_id ON borrow_logs(request_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrow_requests_updated_at BEFORE UPDATE ON borrow_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Allow users to view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow admins to update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Categories policies (public read, admin write)
CREATE POLICY "Allow everyone to view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Items policies (public read active items, admin write)
CREATE POLICY "Allow everyone to view active items" ON items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admins to view all items" ON items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow admins to manage items" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Borrow requests policies
CREATE POLICY "Allow users to view own requests" ON borrow_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow admins to view all requests" ON borrow_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow users to create own requests" ON borrow_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow admins to update requests" ON borrow_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Borrow items policies
CREATE POLICY "Allow users to view own request items" ON borrow_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM borrow_requests
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Allow admins to view all request items" ON borrow_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow users to create request items" ON borrow_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM borrow_requests
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Allow admins to manage request items" ON borrow_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Borrow logs policies (read-only for users, admin can write)
CREATE POLICY "Allow users to view own request logs" ON borrow_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM borrow_requests
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Allow admins to view all logs" ON borrow_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow admins to create logs" ON borrow_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
