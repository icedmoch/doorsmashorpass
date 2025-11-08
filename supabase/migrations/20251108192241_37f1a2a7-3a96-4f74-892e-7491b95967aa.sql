-- Allow deliverers to claim available orders (set deliverer_id when it's currently null)
CREATE POLICY "Deliverers can claim available orders"
ON public.orders
FOR UPDATE
USING (
  deliverer_id IS NULL 
  AND status IN ('pending', 'preparing', 'ready')
)
WITH CHECK (
  auth.uid() = deliverer_id
);