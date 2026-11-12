-- Checkout inventory reservation and cancellation.
-- Apply after fix-phaseE-variants-qa-reviews.sql, which adds
-- order_items.variant_id and the product_variants table.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS inventory_reserved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS inventory_released_at TIMESTAMPTZ;

-- Existing active orders were created by code that deducted inventory before
-- returning checkout success. Mark those reservations so cancellation can
-- release them. Previously cancelled orders stay marked as released because
-- the old buyer cancellation handler already attempted stock restoration.
UPDATE public.orders AS o
  SET inventory_reserved_at = COALESCE(o.created_at, NOW()),
      inventory_released_at = CASE
        WHEN o.order_status = 'cancelled' THEN COALESCE(o.updated_at, o.created_at, NOW())
        ELSE NULL
      END
  WHERE o.inventory_reserved_at IS NULL
    AND EXISTS (SELECT 1 FROM public.order_items AS oi WHERE oi.order_id = o.id);

CREATE OR REPLACE FUNCTION public.reserve_checkout_inventory(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserved_at TIMESTAMPTZ;
  v_released_at TIMESTAMPTZ;
  v_item RECORD;
  v_rows INTEGER;
BEGIN
  SELECT inventory_reserved_at, inventory_released_at
    INTO v_reserved_at, v_released_at
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF v_reserved_at IS NOT NULL THEN
    RETURN v_released_at IS NULL;
  END IF;

  FOR v_item IN
    SELECT product_id, variant_id, quantity
      FROM public.order_items
      WHERE order_id = p_order_id
      ORDER BY product_id, variant_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
        SET stock = stock - v_item.quantity
        WHERE id = v_item.variant_id
          AND product_id = v_item.product_id
          AND stock >= v_item.quantity;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK';
      END IF;

      UPDATE public.products
        SET sold_count = COALESCE(sold_count, 0) + v_item.quantity
        WHERE id = v_item.product_id;
    ELSE
      UPDATE public.products
        SET stock = stock - v_item.quantity,
            sold_count = COALESCE(sold_count, 0) + v_item.quantity
        WHERE id = v_item.product_id
          AND stock >= v_item.quantity;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      IF v_rows <> 1 THEN
        RAISE EXCEPTION 'INSUFFICIENT_STOCK';
      END IF;
    END IF;
  END LOOP;

  UPDATE public.orders
    SET inventory_reserved_at = NOW(), inventory_released_at = NULL
    WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_unpaid_order_and_release_inventory(
  p_order_id UUID,
  p_buyer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
BEGIN
  SELECT user_id, order_status, payment_status,
         inventory_reserved_at, inventory_released_at
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id AND user_id = p_buyer_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF v_order.order_status NOT IN ('pending', 'confirmed')
     OR v_order.payment_status NOT IN ('pending', 'failed') THEN
    RETURN FALSE;
  END IF;

  UPDATE public.orders
    SET order_status = 'cancelled', updated_at = NOW()
    WHERE id = p_order_id;

  IF v_order.inventory_reserved_at IS NULL OR v_order.inventory_released_at IS NOT NULL THEN
    RETURN TRUE;
  END IF;

  FOR v_item IN
    SELECT product_id, variant_id, quantity
      FROM public.order_items
      WHERE order_id = p_order_id
      ORDER BY product_id, variant_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
        SET stock = stock + v_item.quantity
        WHERE id = v_item.variant_id AND product_id = v_item.product_id;
      UPDATE public.products
        SET sold_count = GREATEST(0, COALESCE(sold_count, 0) - v_item.quantity)
        WHERE id = v_item.product_id;
    ELSE
      UPDATE public.products
        SET stock = stock + v_item.quantity,
            sold_count = GREATEST(0, COALESCE(sold_count, 0) - v_item.quantity)
        WHERE id = v_item.product_id;
    END IF;
  END LOOP;

  UPDATE public.orders
    SET inventory_released_at = NOW(), updated_at = NOW()
    WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_checkout_inventory(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_unpaid_order_and_release_inventory(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_checkout_inventory(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_unpaid_order_and_release_inventory(UUID, UUID) TO service_role;
