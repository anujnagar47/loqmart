-- Checkout inventory reservation and cancellation.
-- Apply after fix-phaseE-variants-qa-reviews.sql, which adds
-- order_items.variant_id and the product_variants table.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS inventory_reserved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS inventory_released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS reservation_status TEXT NOT NULL DEFAULT 'pending_confirmation'
    CHECK (reservation_status IN ('pending_confirmation', 'confirmed', 'cancelled'));

CREATE TABLE IF NOT EXISTS public.checkout_idempotency_keys (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  order_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, idempotency_key)
);
ALTER TABLE public.checkout_idempotency_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.checkout_idempotency_keys FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkout_idempotency_keys TO service_role;

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
    ELSE
      UPDATE public.products
        SET stock = stock - v_item.quantity
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
    SET order_status = 'cancelled', reservation_status = 'cancelled', updated_at = NOW()
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
    ELSE
      UPDATE public.products
        SET stock = stock + v_item.quantity
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

-- Creates all seller-specific reservations and reserves inventory as one
-- transaction. Idempotency rows serialize concurrent retries for one buyer.
CREATE OR REPLACE FUNCTION public.create_intent_reservations(
  p_user_id UUID,
  p_address_id UUID,
  p_idempotency_key TEXT,
  p_orders JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order JSONB;
  v_item JSONB;
  v_order_id UUID;
  v_order_ids UUID[];
  v_order_numbers TEXT[];
BEGIN
  IF p_idempotency_key IS NULL OR length(p_idempotency_key) < 8 OR length(p_idempotency_key) > 120 THEN
    RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY';
  END IF;
  IF jsonb_typeof(p_orders) <> 'array' OR jsonb_array_length(p_orders) = 0 THEN
    RAISE EXCEPTION 'EMPTY_RESERVATION';
  END IF;

  INSERT INTO public.checkout_idempotency_keys(user_id, idempotency_key)
  VALUES (p_user_id, p_idempotency_key)
  ON CONFLICT (user_id, idempotency_key) DO NOTHING;

  SELECT order_ids INTO v_order_ids
  FROM public.checkout_idempotency_keys
  WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
  FOR UPDATE;

  IF cardinality(v_order_ids) > 0 THEN
    SELECT array_agg(order_number ORDER BY created_at, id)
      INTO v_order_numbers FROM public.orders WHERE id = ANY(v_order_ids);
    RETURN jsonb_build_object('order_ids', to_jsonb(v_order_ids), 'order_numbers', to_jsonb(COALESCE(v_order_numbers, ARRAY[]::TEXT[])), 'replayed', TRUE);
  END IF;

  v_order_ids := ARRAY[]::UUID[];
  v_order_numbers := ARRAY[]::TEXT[];
  FOR v_order IN SELECT value FROM jsonb_array_elements(p_orders)
  LOOP
    INSERT INTO public.orders(
      user_id, seller_id, address_id, order_number, subtotal, shipping_cost,
      tax, total, order_status, payment_status, shipping_address, reservation_status
    ) VALUES (
      p_user_id, (v_order->>'seller_id')::UUID, p_address_id,
      v_order->>'order_number', (v_order->>'subtotal')::NUMERIC,
      (v_order->>'shipping_cost')::NUMERIC, (v_order->>'tax')::NUMERIC,
      (v_order->>'total')::NUMERIC, 'pending', 'pending',
      v_order->'shipping_address', 'pending_confirmation'
    ) RETURNING id INTO v_order_id;

    FOR v_item IN SELECT value FROM jsonb_array_elements(v_order->'items')
    LOOP
      INSERT INTO public.order_items(
        order_id, product_id, seller_id, quantity, price, total,
        coins_earned, variant_id, variant_name
      ) VALUES (
        v_order_id, (v_item->>'product_id')::UUID, (v_item->>'seller_id')::UUID,
        (v_item->>'quantity')::INTEGER, (v_item->>'price')::NUMERIC,
        (v_item->>'total')::NUMERIC, 0,
        NULLIF(v_item->>'variant_id', '')::UUID, v_item->>'variant_name'
      );
    END LOOP;

    PERFORM public.reserve_checkout_inventory(v_order_id);
    v_order_ids := array_append(v_order_ids, v_order_id);
    v_order_numbers := array_append(v_order_numbers, v_order->>'order_number');
  END LOOP;

  UPDATE public.checkout_idempotency_keys
    SET order_ids = v_order_ids
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;

  RETURN jsonb_build_object('order_ids', to_jsonb(v_order_ids), 'order_numbers', to_jsonb(v_order_numbers), 'replayed', FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.create_intent_reservations(UUID, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_intent_reservations(UUID, UUID, TEXT, JSONB) TO service_role;
