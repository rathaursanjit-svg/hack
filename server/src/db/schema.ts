import { runScript } from './database';

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'supplier', 'retailer', 'consumer')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Delhi',
  service_area TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  demo_gstin TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  contact_phone TEXT NOT NULL,
  demo_gstin TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  supplier_id TEXT,
  shop_id TEXT,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  price_paise INTEGER NOT NULL,
  cost_price_paise INTEGER NOT NULL DEFAULT 0,
  tax_rate_percent REAL NOT NULL DEFAULT 5.0,
  price_includes_tax INTEGER NOT NULL DEFAULT 1,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER NOT NULL DEFAULT 10,
  active INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK(movement_type IN ('INITIAL_STOCK', 'PURCHASE_RECEIPT', 'SALE_ORDER', 'ORDER_CANCELLED', 'MANUAL_ADJUSTMENT')),
  quantity_delta INTEGER NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  reason TEXT,
  actor_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  invoice_no TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('DRAFT', 'RECEIVED', 'CANCELLED')),
  supply_type TEXT NOT NULL CHECK(supply_type IN ('INTRA_STATE', 'INTER_STATE')),
  taxable_subtotal_paise INTEGER NOT NULL,
  cgst_paise INTEGER NOT NULL DEFAULT 0,
  sgst_paise INTEGER NOT NULL DEFAULT 0,
  igst_paise INTEGER NOT NULL DEFAULT 0,
  total_tax_paise INTEGER NOT NULL DEFAULT 0,
  total_paise INTEGER NOT NULL,
  itc_status TEXT NOT NULL DEFAULT 'Needs review',
  itc_notes TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_lines (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_paise INTEGER NOT NULL,
  tax_rate_percent REAL NOT NULL,
  taxable_amount_paise INTEGER NOT NULL,
  cgst_paise INTEGER NOT NULL DEFAULT 0,
  sgst_paise INTEGER NOT NULL DEFAULT 0,
  igst_paise INTEGER NOT NULL DEFAULT 0,
  total_paise INTEGER NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PLACED', 'ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED')),
  date TEXT NOT NULL,
  payment_status TEXT NOT NULL CHECK(payment_status IN ('PENDING', 'SIMULATED_PAID', 'PAY_ON_PICKUP')),
  supply_type TEXT NOT NULL CHECK(supply_type IN ('INTRA_STATE', 'INTER_STATE')),
  fulfillment_type TEXT NOT NULL CHECK(fulfillment_type IN ('DELIVERY', 'PICKUP')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT,
  taxable_subtotal_paise INTEGER NOT NULL,
  cgst_paise INTEGER NOT NULL DEFAULT 0,
  sgst_paise INTEGER NOT NULL DEFAULT 0,
  igst_paise INTEGER NOT NULL DEFAULT 0,
  total_tax_paise INTEGER NOT NULL DEFAULT 0,
  total_paise INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_lines (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_paise INTEGER NOT NULL,
  cost_price_paise INTEGER NOT NULL DEFAULT 0,
  tax_rate_percent REAL NOT NULL,
  price_includes_tax INTEGER NOT NULL,
  taxable_amount_paise INTEGER NOT NULL,
  cgst_paise INTEGER NOT NULL DEFAULT 0,
  sgst_paise INTEGER NOT NULL DEFAULT 0,
  igst_paise INTEGER NOT NULL DEFAULT 0,
  total_paise INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  seller_snapshot_json TEXT NOT NULL,
  buyer_snapshot_json TEXT NOT NULL,
  lines_snapshot_json TEXT NOT NULL,
  taxable_subtotal_paise INTEGER NOT NULL,
  cgst_paise INTEGER NOT NULL DEFAULT 0,
  sgst_paise INTEGER NOT NULL DEFAULT 0,
  igst_paise INTEGER NOT NULL DEFAULT 0,
  total_tax_paise INTEGER NOT NULL DEFAULT 0,
  total_paise INTEGER NOT NULL,
  supply_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ISSUED',
  is_prototype INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('RENT', 'UTILITIES', 'STAFF', 'LOGISTICS', 'PACKAGING', 'MAINTENANCE', 'OTHER')),
  description TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  tax_treatment_note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_configs (
  id TEXT PRIMARY KEY,
  category TEXT UNIQUE NOT NULL,
  tax_rate_percent REAL NOT NULL,
  default_inclusive INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_role TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  details_json TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_shop_product ON inventory_movements(shop_id, product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_shop ON purchases(shop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_shop ON expenses(shop_id);
`;

export async function initSchema(): Promise<void> {
  await runScript(SCHEMA_SQL);
}
