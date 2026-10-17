import { queryAll, queryOne, execute } from '../db/database';

export type MovementType = 
  | 'INITIAL_STOCK' 
  | 'PURCHASE_RECEIPT' 
  | 'SALE_ORDER' 
  | 'ORDER_CANCELLED' 
  | 'MANUAL_ADJUSTMENT';

export interface RecordMovementParams {
  shopId: string;
  productId: string;
  movementType: MovementType;
  quantityDelta: number;
  referenceType?: string;
  referenceId?: string;
  reason: string;
  actorId?: string;
}

export async function recordInventoryMovement(params: RecordMovementParams): Promise<{ success: boolean; newStock: number }> {
  const { shopId, productId, movementType, quantityDelta, referenceType, referenceId, reason, actorId } = params;

  // Retrieve current product stock
  const product = await queryOne<{ id: string; stock: number; name: string }>(
    `SELECT id, stock, name FROM products WHERE id = ?`,
    [productId]
  );

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const currentStock = product.stock;
  const newStock = currentStock + quantityDelta;

  if (newStock < 0) {
    throw new Error(`Insufficient stock for "${product.name}". Current: ${currentStock}, Requested change: ${quantityDelta}`);
  }

  // Update product stock
  await execute(`UPDATE products SET stock = ? WHERE id = ?`, [newStock, productId]);

  // Insert ledger entry
  const movementId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO inventory_movements (
      id, shop_id, product_id, movement_type, quantity_delta, reference_type, reference_id, reason, actor_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movementId,
      shopId,
      productId,
      movementType,
      quantityDelta,
      referenceType || null,
      referenceId || null,
      reason,
      actorId || 'system',
      now
    ]
  );

  return { success: true, newStock };
}

export async function getShopInventory(shopId: string, filterCategory?: string, search?: string) {
  let sql = `
    SELECT 
      p.id, p.supplier_id, p.shop_id, p.name, p.sku, p.category, p.unit, 
      p.price_paise, p.cost_price_paise, p.tax_rate_percent, p.price_includes_tax, 
      p.stock, p.min_stock_alert, p.active, p.image_url,
      s.business_name as supplier_name,
      CASE 
        WHEN p.stock = 0 THEN 'OUT_OF_STOCK'
        WHEN p.stock <= p.min_stock_alert THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
      END as stock_status
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE (p.shop_id = ? OR p.shop_id IS NULL) AND p.active = 1
  `;
  const params: any[] = [shopId];

  if (filterCategory && filterCategory !== 'ALL') {
    sql += ` AND p.category = ?`;
    params.push(filterCategory);
  }

  if (search && search.trim() !== '') {
    sql += ` AND (p.name LIKE ? OR p.sku LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY p.name ASC`;
  return queryAll(sql, params);
}

export async function getStockMovements(shopId: string, productId?: string) {
  let sql = `
    SELECT 
      m.id, m.shop_id, m.product_id, m.movement_type, m.quantity_delta, 
      m.reference_type, m.reference_id, m.reason, m.actor_id, m.created_at,
      p.name as product_name, p.sku as product_sku, p.unit
    FROM inventory_movements m
    JOIN products p ON m.product_id = p.id
    WHERE m.shop_id = ?
  `;
  const params: any[] = [shopId];

  if (productId) {
    sql += ` AND m.product_id = ?`;
    params.push(productId);
  }

  sql += ` ORDER BY m.created_at DESC LIMIT 100`;
  return queryAll(sql, params);
}

export async function getReorderSuggestions(shopId: string) {
  // Suggest reorder when stock is at or below minimum threshold
  const sql = `
    SELECT 
      p.id as product_id, p.name, p.sku, p.category, p.unit, p.stock, p.min_stock_alert,
      p.cost_price_paise, p.supplier_id, s.business_name as supplier_name,
      (p.min_stock_alert * 3 - p.stock) as suggested_reorder_qty,
      'Calculated based on minimum stock threshold' as calculation_basis
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE (p.shop_id = ? OR p.shop_id IS NULL)
      AND p.active = 1
      AND p.stock <= p.min_stock_alert
    ORDER BY (p.stock - p.min_stock_alert) ASC
  `;
  return queryAll(sql, [shopId]);
}
