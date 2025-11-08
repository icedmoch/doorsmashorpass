-- Fix search_path for existing functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_order_totals(order_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE orders
    SET
        total_calories = COALESCE((
            SELECT SUM(calories * quantity)
            FROM order_items
            WHERE order_id = order_uuid
        ), 0),
        total_protein = COALESCE((
            SELECT SUM(protein * quantity)
            FROM order_items
            WHERE order_id = order_uuid
        ), 0),
        total_carbs = COALESCE((
            SELECT SUM(carbs * quantity)
            FROM order_items
            WHERE order_id = order_uuid
        ), 0),
        total_fat = COALESCE((
            SELECT SUM(fat * quantity)
            FROM order_items
            WHERE order_id = order_uuid
        ), 0)
    WHERE id = order_uuid;
END;
$function$;