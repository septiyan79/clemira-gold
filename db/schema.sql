-- =============================================================================
-- Antam Reseller Stock Database Schema
-- Physical gold (logam mulia) inventory and sales tracking
-- Run with: psql $DATABASE_URL -f db/schema.sql
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE owners (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL,
  type       VARCHAR(20)  NOT NULL CHECK (type IN ('entity', 'personal')),
  notes      TEXT,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE owners IS 'Tracks who owns each physical gold unit (e.g. Toko, Pribadi, or named individuals).';


CREATE TABLE products (
  id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku         VARCHAR(50)    NOT NULL UNIQUE,
  name        VARCHAR(100)   NOT NULL,
  weight_gram DECIMAL(8, 3)  NOT NULL,
  purity      VARCHAR(10)    NOT NULL DEFAULT '999.9',
  brand       VARCHAR(50),   -- 'antam' | 'ubs' | 'galeri24' | etc
  series      VARCHAR(50),   -- 'regular' | 'gift' | 'batik' | etc
  created_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Gold product catalog: defines SKU, weight, brand, and series for each product type.';


CREATE TABLE counterparties (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL,
  type       VARCHAR[]   NOT NULL,  -- e.g. ARRAY['buyer'], ARRAY['supplier'], ARRAY['buyer','supplier']
  phone      VARCHAR(20),
  notes      TEXT,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE counterparties IS 'External parties (buyers, suppliers, or both) — a single entity can have multiple roles.';


CREATE TABLE stock_units (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID        NOT NULL REFERENCES products(id),
  owner_id            UUID        NOT NULL REFERENCES owners(id),
  purchase_source_id  UUID        REFERENCES counterparties(id),  -- nullable
  serial_number       VARCHAR(100),
  cert_code           VARCHAR(100),
  mint_year           SMALLINT,
  condition             VARCHAR(20)    NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used')),
  status                VARCHAR(20)    NOT NULL DEFAULT 'available'
                          CHECK (status IN ('available', 'reserved', 'sold', 'swapped_out')),
  actual_purchase_price DECIMAL(14,2),  -- real price paid for this specific unit
  reference_price       DECIMAL(14,2),  -- valuation anchor; inherited through swap chains
  created_at            TIMESTAMP      NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stock_units IS 'One row per physical gold piece, tracked individually by serial number and cert code.';


CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_units_updated_at
  BEFORE UPDATE ON stock_units
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE purchase_orders (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id      UUID           NOT NULL REFERENCES counterparties(id),
  gold_spot_price  DECIMAL(12, 2), -- gold spot price per gram at time of purchase
  total_amount     DECIMAL(16, 2)  NOT NULL,
  purchased_at     TIMESTAMP      NOT NULL DEFAULT NOW(),
  notes            TEXT,
  created_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE purchase_orders IS 'Records a single purchase transaction from a supplier, containing one or more gold units.';


CREATE TABLE purchase_order_lines (
  id                UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID           NOT NULL REFERENCES purchase_orders(id),
  stock_unit_id     UUID           NOT NULL REFERENCES stock_units(id),
  unit_price        DECIMAL(14, 2) NOT NULL,  -- becomes COGS for own_stock and swap sales
  notes             TEXT,
  created_at        TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE purchase_order_lines IS 'Line items within a purchase order; unit_price here is the COGS for own_stock and swap fulfillment modes.';


CREATE TABLE transactions (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id         UUID           REFERENCES counterparties(id),  -- nullable for anonymous/cash buyers
  gold_spot_price  DECIMAL(12, 2), -- gold spot price per gram at time of sale
  transacted_at    TIMESTAMP      NOT NULL DEFAULT NOW(),
  notes            TEXT,
  created_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE transactions IS 'A sales transaction header; may have an anonymous buyer (buyer_id nullable).';


CREATE TABLE transaction_lines (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id   UUID           NOT NULL REFERENCES transactions(id),
  stock_unit_id    UUID           REFERENCES stock_units(id),  -- nullable for pure consignment
  fulfillment_mode VARCHAR(20)    NOT NULL
                     CHECK (fulfillment_mode IN ('own_stock', 'consignment', 'swap')),
  sell_price       DECIMAL(14, 2) NOT NULL,
  cogs             DECIMAL(14, 2) NOT NULL,  -- stored explicitly at time of sale; must not be recomputed
  margin           DECIMAL(14, 2) GENERATED ALWAYS AS (sell_price - cogs) STORED,
  created_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE transaction_lines IS 'One sold unit per row; cogs is stored explicitly at sale time to preserve historical accuracy.';


CREATE TABLE consignment_lines (
  id                       UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_line_id      UUID           NOT NULL REFERENCES transaction_lines(id),
  supplier_id              UUID           NOT NULL REFERENCES counterparties(id),
  serial_number            VARCHAR(100),
  cert_code                VARCHAR(100),
  mint_year                SMALLINT,
  supplier_purchase_price  DECIMAL(14, 2) NOT NULL,  -- amount paid to the external supplier
  status                   VARCHAR(20)    NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'settled')),
  notes                    TEXT,
  created_at               TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE consignment_lines IS 'Details for consignment-mode sales: unit sourced externally, supplier payment tracked separately.';


CREATE TABLE swap_events (
  id                   UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_line_id  UUID           NOT NULL REFERENCES transaction_lines(id),
  original_unit_id     UUID           NOT NULL REFERENCES stock_units(id),   -- own unit used immediately
  replacement_unit_id  UUID           REFERENCES stock_units(id),            -- filled when replacement arrives
  supplier_id          UUID           REFERENCES counterparties(id),
  replacement_cost     DECIMAL(14, 2),  -- cost of the replacement unit
  swapped_at           TIMESTAMP,       -- when the replacement unit arrived
  notes                TEXT,
  created_at           TIMESTAMP      NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE swap_events IS 'Tracks swap-mode sales: own unit used immediately for urgent buyer, replacement sourced later.';


CREATE TABLE ownership_transfers (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_unit_id  UUID        NOT NULL REFERENCES stock_units(id),
  from_owner_id  UUID        NOT NULL REFERENCES owners(id),
  to_owner_id    UUID        NOT NULL REFERENCES owners(id),
  transferred_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  notes          TEXT,
  created_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ownership_transfers IS 'Audit log for unit ownership changes between registered owners.';


-- =============================================================================
-- INDEXES
-- =============================================================================

-- stock_units (most frequently queried)
CREATE INDEX ON stock_units(product_id);
CREATE INDEX ON stock_units(owner_id);
CREATE INDEX ON stock_units(status);
CREATE INDEX ON stock_units(mint_year);
CREATE INDEX ON stock_units(serial_number);

-- transactions (monthly reports)
CREATE INDEX ON transactions(transacted_at);
CREATE INDEX ON transactions(buyer_id);

-- purchase_orders
CREATE INDEX ON purchase_orders(purchased_at);
CREATE INDEX ON purchase_orders(supplier_id);


-- =============================================================================
-- VIEWS
-- =============================================================================

-- Available stock grouped by owner, brand, weight, series, mint_year
-- with unit count and total COGS
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
  o.name                        AS owner,
  p.brand,
  p.weight_gram,
  p.series,
  su.mint_year,
  COUNT(*)                      AS unit_count,
  SUM(su.reference_price)       AS total_reference_value
FROM stock_units su
JOIN  products   p  ON p.id = su.product_id
JOIN  owners     o  ON o.id = su.owner_id
WHERE su.status = 'available'
GROUP BY o.name, p.brand, p.weight_gram, p.series, su.mint_year;


-- All sales with full margin detail per line
CREATE OR REPLACE VIEW v_transaction_margin AS
SELECT
  t.transacted_at,
  t.id                      AS transaction_id,
  cp.name                   AS buyer,
  p.brand,
  p.weight_gram,
  su.mint_year,
  tl.fulfillment_mode,
  tl.sell_price,
  tl.cogs,
  tl.margin,
  o.name                    AS owner
FROM transaction_lines tl
JOIN  transactions          t   ON t.id  = tl.transaction_id
LEFT JOIN counterparties    cp  ON cp.id = t.buyer_id
LEFT JOIN stock_units       su  ON su.id = tl.stock_unit_id
LEFT JOIN products          p   ON p.id  = su.product_id
LEFT JOIN owners            o   ON o.id  = su.owner_id;


-- Available stock with current market value vs COGS (unrealized gain)
-- References "HargaAntam" (Prisma-managed table) joined on today's date.
-- gramasi format assumed: '1gr', '5gr', '10gr' (whole-gram denominations).
-- Rows include per-owner breakdown plus a grand total row (GROUPING SETS).
CREATE OR REPLACE VIEW v_stock_value_growth AS
SELECT
  o.name                                        AS owner,
  p.brand,
  p.weight_gram,
  p.series,
  su.mint_year,
  COUNT(*)                                      AS unit_count,
  SUM(su.reference_price)                       AS total_reference_value,
  SUM(h.harga)                                  AS current_market_value,
  SUM(h.harga) - SUM(su.reference_price)        AS unrealized_gain
FROM stock_units su
JOIN  products        p  ON p.id = su.product_id
JOIN  owners          o  ON o.id = su.owner_id
LEFT JOIN "HargaAntam" h
  ON  h.tanggal = CURRENT_DATE
  AND h.gramasi = CAST(p.weight_gram::INTEGER AS TEXT) || 'gr'
WHERE su.status = 'available'
GROUP BY GROUPING SETS (
  (o.name, p.brand, p.weight_gram, p.series, su.mint_year),
  ()  -- grand total row
);


-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT INTO owners (id, name, type) VALUES
  (uuid_generate_v4(), 'Toko',    'entity'),
  (uuid_generate_v4(), 'Pribadi', 'personal');

INSERT INTO products (id, sku, name, weight_gram, brand, series) VALUES
  (uuid_generate_v4(), 'LM-ANTAM-1GR',  'LM Antam 1gr Regular',  1.000, 'antam', 'regular'),
  (uuid_generate_v4(), 'LM-ANTAM-5GR',  'LM Antam 5gr Regular',  5.000, 'antam', 'regular'),
  (uuid_generate_v4(), 'LM-ANTAM-10GR', 'LM Antam 10gr Regular', 10.000, 'antam', 'regular');

INSERT INTO counterparties (id, name, type) VALUES
  (uuid_generate_v4(), 'Supplier Utama', ARRAY['supplier']);

COMMIT;
