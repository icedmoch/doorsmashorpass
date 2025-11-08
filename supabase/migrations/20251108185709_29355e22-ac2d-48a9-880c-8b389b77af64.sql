-- Enable RLS on chat_history table
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for chat_history
CREATE POLICY "Users can view their own chat history"
ON chat_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history"
ON chat_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history"
ON chat_history FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for order_items
CREATE POLICY "Anyone can view order items"
ON order_items FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert order items"
ON order_items FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for orders
CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Deliverers can view orders they're delivering"
ON orders FOR SELECT
USING (auth.uid() = deliverer_id);

CREATE POLICY "Anyone can view available deliveries"
ON orders FOR SELECT
USING (deliverer_id IS NULL AND status IN ('pending', 'preparing', 'ready'));

CREATE POLICY "Users can create their own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deliverers can update orders they're delivering"
ON orders FOR UPDATE
USING (auth.uid() = deliverer_id);

CREATE POLICY "Users can update their own orders when marking as delivered"
ON orders FOR UPDATE
USING (auth.uid() = user_id);