import { queryAll, queryOne, execute } from '../db/database';
import { calculateLineTax, formatPaiseToInr, SupplyType } from './taxService';
import { recordInventoryMovement } from './inventoryService';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerId: string;
  shopId: string;
  items: CreateOrderItemInput[];
  supplyType: SupplyType;
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  paymentStatus: 'PENDING' | 'SIMULATED_PAID' | 'PAY_ON_PICKUP';
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  notes?: string;
}

export async function createOrder(input: CreateOrderInput) {
  const { customerId, shopId, items, supplyType, fulfillmentType, paymentStatus, customerName, customerPhone, deliveryAddress, notes } = input;

  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // Fetch shop details
  const shop = await queryOne<{ id: string; name: string; address: string; state: string; demo_gstin: string; contact_phone: string }>(
    `SELECT * FROM shops WHERE id = ?`,
    [shopId]
  );
  if (!shop) {
    throw new Error(`Shop ${shopId} not found`);
  }

  // Pre-check stock for all products to prevent partial failure or negative stock
  const productIds = items.map(i => i.productId);
  const placeholders = productIds.map(() => '?').join(',');
  const products = await queryAll<any>(
    `SELECT * FROM products WHERE id IN (${placeholders})`,
    productIds
  );

  const productMap = new Map<string, any>();
  for (const p of products) {
    productMap.set(p.id, p);
  }

  for (const item of items) {
    const prod = productMap.get(item.productId);
    if (!prod) {
      throw new Error(`Product ${item.productId} not found`);
    }
    if (prod.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${item.quantity}`);
    }
  }

  // Calculate order lines and totals
  let taxableSubtotalPaise = 0;
  let totalCgstPaise = 0;
  let totalSgstPaise = 0;
  let totalIgstPaise = 0;
  let totalTaxPaise = 0;
  let grandTotalPaise = 0;

  const orderLinesData: any[] = [];

  for (const item of items) {
    const prod = productMap.get(item.productId);
    const taxRes = calculateLineTax({
      quantity: item.quantity,
      unitPricePaise: prod.price_paise,
      taxRatePercent: prod.tax_rate_percent,
      priceIncludesTax: Boolean(prod.price_includes_tax),
      supplyType,
    });

    taxableSubtotalPaise += taxRes.taxableAmountPaise;
    totalCgstPaise += taxRes.cgstPaise;
    totalSgstPaise += taxRes.sgstPaise;
    totalIgstPaise += taxRes.igstPaise;
    totalTaxPaise += taxRes.totalTaxPaise;
    grandTotalPaise += taxRes.totalPaise;

    orderLinesData.push({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unit: prod.unit,
      quantity: item.quantity,
      unitPricePaise: prod.price_paise,
      costPricePaise: prod.cost_price_paise || 0,
      taxRatePercent: prod.tax_rate_percent,
      priceIncludesTax: prod.price_includes_tax,
      taxableAmountPaise: taxRes.taxableAmountPaise,
      cgstPaise: taxRes.cgstPaise,
      sgstPaise: taxRes.sgstPaise,
      igstPaise: taxRes.igstPaise,
      totalPaise: taxRes.totalPaise,
    });
  }

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const orderNumber = `SRI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  // Deduct stock and record in ledger
  for (const line of orderLinesData) {
    await recordInventoryMovement({
      shopId,
      productId: line.productId,
      movementType: 'SALE_ORDER',
      quantityDelta: -line.quantity,
      referenceType: 'ORDER',
      referenceId: orderId,
      reason: `Customer Order placed (${orderNumber})`,
      actorId: customerId,
    });
  }

  // Insert Order
  await execute(
    `INSERT INTO orders (
      id, order_number, customer_id, shop_id, status, date, payment_status, supply_type,
      fulfillment_type, customer_name, customer_phone, delivery_address,
      taxable_subtotal_paise, cgst_paise, sgst_paise, igst_paise, total_tax_paise, total_paise,
      notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderId,
      orderNumber,
      customerId,
      shopId,
      'PLACED',
      now,
      paymentStatus,
      supplyType,
      fulfillmentType,
      customerName,
      customerPhone,
      deliveryAddress || 'Store Pickup',
      taxableSubtotalPaise,
      totalCgstPaise,
      totalSgstPaise,
      totalIgstPaise,
      totalTaxPaise,
      grandTotalPaise,
      notes || null,
      now
    ]
  );

  // Insert Order Lines with immutable snapshots
  for (const line of orderLinesData) {
    const lineId = `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await execute(
      `INSERT INTO order_lines (
        id, order_id, product_id, product_name, sku, unit, quantity,
        unit_price_paise, cost_price_paise, tax_rate_percent, price_includes_tax,
        taxable_amount_paise, cgst_paise, sgst_paise, igst_paise, total_paise
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lineId,
        orderId,
        line.productId,
        line.productName,
        line.sku,
        line.unit,
        line.quantity,
        line.unitPricePaise,
        line.costPricePaise,
        line.taxRatePercent,
        line.priceIncludesTax,
        line.taxableAmountPaise,
        line.cgstPaise,
        line.sgstPaise,
        line.igstPaise,
        line.totalPaise
      ]
    );
  }

  // Create Demo Invoice Preview Record
  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const invoiceNumber = `INV-${orderNumber}`;
  const sellerSnapshot = JSON.stringify({
    shopName: shop.name,
    address: shop.address,
    state: shop.state,
    demoGstin: shop.demo_gstin,
    phone: shop.contact_phone
  });
  const buyerSnapshot = JSON.stringify({
    name: customerName,
    phone: customerPhone,
    address: deliveryAddress || 'Counter Pickup'
  });
  const linesSnapshot = JSON.stringify(orderLinesData);

  await execute(
    `INSERT INTO invoices (
      id, invoice_number, order_id, shop_id, issue_date, seller_snapshot_json,
      buyer_snapshot_json, lines_snapshot_json, taxable_subtotal_paise,
      cgst_paise, sgst_paise, igst_paise, total_tax_paise, total_paise,
      supply_type, status, is_prototype, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      invoiceId,
      invoiceNumber,
      orderId,
      shopId,
      now,
      sellerSnapshot,
      buyerSnapshot,
      linesSnapshot,
      taxableSubtotalPaise,
      totalCgstPaise,
      totalSgstPaise,
      totalIgstPaise,
      totalTaxPaise,
      grandTotalPaise,
      supplyType,
      'ISSUED',
      now
    ]
  );

  return {
    orderId,
    orderNumber,
    invoiceId,
    invoiceNumber,
    grandTotalPaise,
    totalTaxPaise,
    status: 'PLACED'
  };
}

export async function updateOrderStatus(orderId: string, newStatus: string, actorId: string) {
  const allowedTransitions: Record<string, string[]> = {
    PLACED: ['ACCEPTED', 'CANCELLED'],
    ACCEPTED: ['READY', 'CANCELLED'],
    READY: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: []
  };

  const order = await queryOne<any>(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const currentStatus = order.status;
  const validTargets = allowedTransitions[currentStatus] || [];

  if (!validTargets.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }

  // If transitioning to CANCELLED, restore inventory safely (only once)
  if (newStatus === 'CANCELLED') {
    const lines = await queryAll<any>(`SELECT * FROM order_lines WHERE order_id = ?`, [orderId]);
    for (const line of lines) {
      await recordInventoryMovement({
        shopId: order.shop_id,
        productId: line.product_id,
        movementType: 'ORDER_CANCELLED',
        quantityDelta: line.quantity, // Positive restoration
        referenceType: 'ORDER_CANCELLATION',
        referenceId: orderId,
        reason: `Restoration due to order cancellation (${order.order_number})`,
        actorId,
      });
    }
  }

  await execute(`UPDATE orders SET status = ? WHERE id = ?`, [newStatus, orderId]);

  return { success: true, orderId, previousStatus: currentStatus, newStatus };
}
