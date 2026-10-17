import { describe, it, expect, beforeAll } from 'vitest';
import { seedDatabase } from '../db/seed';
import { queryOne, queryAll } from '../db/database';
import { createOrder, updateOrderStatus } from '../services/orderService';
import { recordInventoryMovement } from '../services/inventoryService';

describe('Inventory Ledger & Order Lifecycle Integration', () => {
  beforeAll(async () => {
    await seedDatabase();
  });

  it('reserves inventory atomically on order placement', async () => {
    // Check initial stock for Atta (prd_1)
    const initialProduct = await queryOne<any>(`SELECT stock FROM products WHERE id = 'prd_1'`);
    const initialStock = initialProduct.stock;

    // Place an order for 2 units
    const order = await createOrder({
      customerId: 'usr_con_1',
      shopId: 'shp_1',
      items: [{ productId: 'prd_1', quantity: 2 }],
      supplyType: 'INTRA_STATE',
      fulfillmentType: 'DELIVERY',
      paymentStatus: 'SIMULATED_PAID',
      customerName: 'Test Buyer',
      customerPhone: '+91 99999 88888',
      deliveryAddress: 'Delhi Test Addr',
    });

    expect(order.status).toBe('PLACED');
    expect(order.orderNumber).toBeDefined();

    // Verify stock is decremented by exactly 2
    const afterOrderProduct = await queryOne<any>(`SELECT stock FROM products WHERE id = 'prd_1'`);
    expect(afterOrderProduct.stock).toBe(initialStock - 2);

    // Verify inventory movement ledger record exists
    const movement = await queryOne<any>(
      `SELECT * FROM inventory_movements WHERE reference_id = ? AND product_id = 'prd_1'`,
      [order.orderId]
    );
    expect(movement).toBeDefined();
    expect(movement.movement_type).toBe('SALE_ORDER');
    expect(movement.quantity_delta).toBe(-2);
  });

  it('safely restores stock exactly once when an order is cancelled (idempotent)', async () => {
    // Create an order
    const order = await createOrder({
      customerId: 'usr_con_2',
      shopId: 'shp_1',
      items: [{ productId: 'prd_2', quantity: 3 }],
      supplyType: 'INTRA_STATE',
      fulfillmentType: 'PICKUP',
      paymentStatus: 'PAY_ON_PICKUP',
      customerName: 'Test Cancellation Buyer',
      customerPhone: '+91 99999 77777',
    });

    const stockBeforeCancel = (await queryOne<any>(`SELECT stock FROM products WHERE id = 'prd_2'`)).stock;

    // Cancel order
    const cancelRes = await updateOrderStatus(order.orderId, 'CANCELLED', 'usr_ret_1');
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.newStatus).toBe('CANCELLED');

    // Stock should be restored by exactly 3
    const stockAfterCancel = (await queryOne<any>(`SELECT stock FROM products WHERE id = 'prd_2'`)).stock;
    expect(stockAfterCancel).toBe(stockBeforeCancel + 3);

    // Attempting to cancel an already cancelled order should throw an error
    await expect(updateOrderStatus(order.orderId, 'CANCELLED', 'usr_ret_1')).rejects.toThrow();

    // Stock must not change on subsequent invalid attempts
    const stockAfterSecondTry = (await queryOne<any>(`SELECT stock FROM products WHERE id = 'prd_2'`)).stock;
    expect(stockAfterSecondTry).toBe(stockAfterCancel);
  });

  it('prevents overselling when requested quantity exceeds available stock', async () => {
    const product = await queryOne<any>(`SELECT stock FROM products WHERE id = 'prd_4'`);
    const available = product.stock;

    await expect(
      createOrder({
        customerId: 'usr_con_1',
        shopId: 'shp_1',
        items: [{ productId: 'prd_4', quantity: available + 50 }],
        supplyType: 'INTRA_STATE',
        fulfillmentType: 'DELIVERY',
        paymentStatus: 'SIMULATED_PAID',
        customerName: 'Oversell Test',
        customerPhone: '+91 99999 66666',
      })
    ).rejects.toThrow(/Insufficient stock/);
  });
});
