-- Allow deliverers to unclaim orders they previously claimed
-- This lets the assigned deliverer set deliverer_id back to NULL
-- and revert status to 'pending' so it returns to the available pool.
CREATE POLICY "Deliverers can unclaim their orders"
ON public.orders
FOR UPDATE
USING (
  -- Only the currently assigned deliverer can unclaim
  auth.uid() = deliverer_id
)
WITH CHECK (
  -- After unclaim, the row must have no deliverer and be pending
  deliverer_id IS NULL AND status = 'pending'
);
