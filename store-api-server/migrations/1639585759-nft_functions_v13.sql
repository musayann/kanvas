-- Migration: nft_functions_v13
-- Created at: 2021-12-15 17:29:19
-- ====  UP  ====

BEGIN;

-- Diff between previous and this version:
--   - take into account onchain state wrt nfts owned by address
ALTER FUNCTION nft_ids_filtered RENAME TO __nft_ids_filtered_v12;
CREATE FUNCTION nft_ids_filtered(
    address TEXT, categories INTEGER[],
    price_at_least NUMERIC, price_at_most NUMERIC,
    availability TEXT[],
    order_by TEXT, order_direction TEXT,
    "offset" INTEGER, "limit" INTEGER,
    until TIMESTAMP WITHOUT TIME ZONE)
  RETURNS TABLE(nft_id nft.id%TYPE, total_nft_count bigint)
AS $$
BEGIN
  IF order_direction NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'nft_ids_filtered(): invalid order_direction';
  END IF;
  IF NOT (availability <@ '{soldOut, onSale, upcoming}'::text[]) THEN
    RAISE EXCEPTION 'nft_ids_filtered(): invalid availability';
  END IF;
  RETURN QUERY EXECUTE '
    SELECT
      nft_id,
      total_nft_count
    FROM (
      SELECT
        nft.id as nft_id,
        nft.created_at as nft_created_at,
        COUNT(1) OVER () AS total_nft_count
      FROM nft
      JOIN mtm_nft_category
        ON mtm_nft_category.nft_id = nft.id
      LEFT JOIN mtm_kanvas_user_nft
        ON mtm_kanvas_user_nft.nft_id = nft.id
      LEFT JOIN kanvas_user
        ON mtm_kanvas_user_nft.kanvas_user_id = kanvas_user.id
      LEFT JOIN onchain_kanvas."storage.ledger_ordered" ledger
        ON ledger.idx_assets_nat = nft.id
      WHERE ($1 IS NULL OR nft.created_at <= $1)
        AND ($2 IS NULL OR (
              (kanvas_user.address = $2 AND NOT EXISTS (
                SELECT 1
                FROM onchain_kanvas."storage.ledger_ordered"
                WHERE idx_assets_address = $2
                  AND idx_assets_nat = nft.id
              )) OR
              EXISTS (
                SELECT 1
                FROM onchain_kanvas."storage.ledger_live"
                WHERE idx_assets_address = $2
                  AND idx_assets_nat = nft.id
              )
            ))
        AND ($3 IS NULL OR nft_category_id = ANY($3))
        AND ($4 IS NULL OR nft.price >= $4)
        AND ($5 IS NULL OR nft.price <= $5)
        AND ($6 IS NULL OR (
              (' || quote_literal('onSale') || ' = ANY($6) AND (
                nft.launch_at <= now() AT TIME ZONE ' || quote_literal('UTC') || '
                AND (
                   SELECT reserved + owned FROM nft_editions_locked(nft.id)
                ) < nft.editions_size
              )) OR
              (' || quote_literal('soldOut') || ' = ANY($6) AND (
                (
                  SELECT reserved + owned FROM nft_editions_locked(nft.id)
                ) >= nft.editions_size
              )) OR
              (' || quote_literal('upcoming') || ' = ANY($6) AND (
                nft.launch_at > now() AT TIME ZONE ' || quote_literal('UTC') || '
              ))
            ))
      GROUP BY nft.id, nft.created_at
      ORDER BY ' || quote_ident(order_by) || ' ' || order_direction || '
      OFFSET $7
      LIMIT  $8
    ) q'
    USING until, address, categories, price_at_least, price_at_most, availability, "offset", "limit";
END
$$
LANGUAGE plpgsql;

COMMIT;

-- ==== DOWN ====

BEGIN;

DROP FUNCTION nft_ids_filtered(
    TEXT, INTEGER[],
    NUMERIC, NUMERIC,
    TEXT[],
    TEXT, TEXT,
    INTEGER, INTEGER,
    TIMESTAMP WITHOUT TIME ZONE);
ALTER FUNCTION __nft_ids_filtered_v12 RENAME TO nft_ids_filtered;

COMMIT;