import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb, queryAll, queryOne, execute, saveDb } from './db/database';
import { initSchema } from './db/schema';
import { seedDatabase } from './db/seed';
import { authenticateDemoUser, requireRole } from './middleware/auth';
import { calculateLineTax, summarizeInvoiceTaxes, formatPaiseToInr, SupplyType } from './services/taxService';
import { recordInventoryMovement, getShopInventory, getStockMovements, getReorderSuggestions } from './services/inventoryService';
import { createOrder, updateOrderStatus } from './services/orderService';
import { getRetailerDashboard, getSalesRegister, getPurchaseRegister, generateCsvString } from './services/reportService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(authenticateDemoUser);

// System health and prototype status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    prototypeVersion: '1.0.0',
    app: 'Smart Retail India',
    mode: 'DEMO MODE - SAMPLE DATA',
    gstIntegrationStatus: 'PROTOTYPE_SIMULATION_ONLY - No live GSTN filing',
    paymentStatus: 'SIMULATED - No real transactions',
  });
});

// Demo accounts list for role-switcher
app.get('/api/auth/demo-users', async (req: Request, res: Response) => {
  try {
    const users = await queryAll(`
      SELECT u.id, u.name, u.email, u.role, u.active,
        sh.id as shop_id, sh.name as shop_name, sh.demo_gstin as shop_gstin,
        sp.id as supplier_id, sp.business_name as supplier_name, sp.demo_gstin as supplier_gstin
      FROM users u
      LEFT JOIN shops sh ON u.id = sh.owner_user_id
      LEFT JOIN suppliers sp ON u.id = sp.user_id
      ORDER BY 
        CASE u.role 
          WHEN 'consumer' THEN 1 
          WHEN 'retailer' THEN 2 
          WHEN 'supplier' THEN 3 
          WHEN 'admin' THEN 4 
        END, u.name ASC
    `);
    res.json({ users, currentUser: req.user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Current user profile
app.get('/api/auth/me', (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// Shops list
app.get('/api/shops', async (req: Request, res: Response) => {
  try {
    const shops = await queryAll(`
      SELECT s.*, u.name as owner_name, u.email as owner_email,
        (SELECT COUNT(*) FROM products p WHERE (p.shop_id = s.id OR p.shop_id IS NULL) AND p.active = 1) as product_count
      FROM shops s
      JOIN users u ON s.owner_user_id = u.id
      ORDER BY s.name ASC
    `);
    res.json({ shops });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Tax Configs
app.get('/api/tax-configs', async (req: Request, res: Response) => {
  try {
    const configs = await queryAll(`SELECT * FROM tax_configs ORDER BY tax_rate_percent ASC`);
    res.json({ configs, disclaimer: 'Sample test rates only. Consult tax professional for official schedules.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Marketplace Products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { category, shopId, search } = req.query;
    let sql = `
      SELECT 
        p.id, p.supplier_id, p.shop_id, p.name, p.sku, p.category, p.unit,
        p.price_paise, p.tax_rate_percent, p.price_includes_tax, p.stock, p.min_stock_alert,
        p.image_url, p.active,
        sp.business_name as supplier_name,
        sh.name as shop_name,
        CASE 
          WHEN p.stock = 0 THEN 'OUT_OF_STOCK'
          WHEN p.stock <= p.min_stock_alert THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END as stock_status
      FROM products p
      LEFT JOIN suppliers sp ON p.supplier_id = sp.id
      LEFT JOIN shops sh ON p.shop_id = sh.id
      WHERE p.active = 1
    `;
    const params: any[] = [];

    if (category && category !== 'ALL') {
      sql += ` AND p.category = ?`;
      params.push(category);
    }

    if (shopId && shopId !== 'ALL') {
      sql += ` AND (p.shop_id = ? OR p.shop_id IS NULL)`;
      params.push(shopId);
    }

    if (search && String(search).trim() !== '') {
      sql += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY p.name ASC`;
    const products = await queryAll(sql, params);
    res.json({ products });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single Product Detail
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await queryOne(`
      SELECT 
        p.*,
        sp.business_name as supplier_name, sp.demo_gstin as supplier_gstin,
        sh.name as shop_name, sh.address as shop_address, sh.demo_gstin as shop_gstin
      FROM products p
      LEFT JOIN suppliers sp ON p.supplier_id = sp.id
      LEFT JOIN shops sh ON p.shop_id = sh.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Consumer / Public: Create Order
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const { items, shopId, supplyType, fulfillmentType, paymentStatus, customerName, customerPhone, deliveryAddress, notes } = req.body;
    const customerId = req.user?.id || 'usr_con_1';

    const orderResult = await createOrder({
      customerId,
      shopId: shopId || 'shp_1',
      items,
      supplyType: supplyType || 'INTRA_STATE',
      fulfillmentType: fulfillmentType || 'DELIVERY',
      paymentStatus: paymentStatus || 'SIMULATED_PAID',
      customerName: customerName || req.user?.name || 'Demo Customer',
      customerPhone: customerPhone || '+91 98000 00000',
      deliveryAddress,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Demo order successfully placed and stock reserved',
      order: orderResult
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// List Orders
app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const role = req.user?.role;
    let sql = `
      SELECT 
        o.*,
        sh.name as shop_name,
        inv.id as invoice_id, inv.invoice_number
      FROM orders o
      JOIN shops sh ON o.shop_id = sh.id
      LEFT JOIN invoices inv ON o.id = inv.order_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Role-based scoping
    if (role === 'consumer') {
      sql += ` AND o.customer_id = ?`;
      params.push(req.user?.id);
    } else if (role === 'retailer') {
      sql += ` AND o.shop_id = ?`;
      params.push(req.user?.shopId || 'shp_1');
    }
    // Admin sees all orders

    sql += ` ORDER BY o.date DESC`;
    const orders = await queryAll(sql, params);
    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Order with Line Items
app.get('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await queryOne(`
      SELECT 
        o.*,
        sh.name as shop_name, sh.address as shop_address, sh.demo_gstin as shop_gstin, sh.contact_phone as shop_phone,
        inv.id as invoice_id, inv.invoice_number
      FROM orders o
      JOIN shops sh ON o.shop_id = sh.id
      LEFT JOIN invoices inv ON o.id = inv.order_id
      WHERE o.id = ?
    `, [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Role verification
    if (req.user?.role === 'consumer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You cannot view orders placed by other consumers' });
    }
    if (req.user?.role === 'retailer' && order.shop_id !== req.user.shopId) {
      return res.status(403).json({ error: 'Forbidden: You cannot view orders from other retail stores' });
    }

    const lines = await queryAll(`SELECT * FROM order_lines WHERE order_id = ?`, [order.id]);
    res.json({ order, lines });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Order Status (Accept, Ready, Complete, Cancel)
app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const actorId = req.user?.id || 'system';

    const orderId = String(req.params.id);
    const result = await updateOrderStatus(orderId, status, actorId);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get Printable Demo Invoice
app.get('/api/invoices/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await queryOne(`
      SELECT 
        i.*,
        o.order_number, o.fulfillment_type, o.payment_status
      FROM invoices i
      JOIN orders o ON i.order_id = o.id
      WHERE i.id = ? OR i.order_id = ?
    `, [req.params.id, req.params.id]);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const seller = JSON.parse(invoice.seller_snapshot_json);
    const buyer = JSON.parse(invoice.buyer_snapshot_json);
    const lines = JSON.parse(invoice.lines_snapshot_json);

    res.json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.issue_date,
        seller,
        buyer,
        lines,
        taxableSubtotalPaise: invoice.taxable_subtotal_paise,
        cgstPaise: invoice.cgst_paise,
        sgstPaise: invoice.sgst_paise,
        igstPaise: invoice.igst_paise,
        totalTaxPaise: invoice.total_tax_paise,
        totalPaise: invoice.total_paise,
        supplyType: invoice.supply_type,
        status: invoice.status,
        isPrototype: Boolean(invoice.is_prototype),
        disclaimer: 'PROTOTYPE DEMO INVOICE — NOT AN OFFICIAL TAX INVOICE OR GOVT FILING'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= RETAILER OPERATIONAL ROUTES =================
app.get('/api/retailer/dashboard', requireRole('retailer', 'admin'), async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId || 'shp_1';
    const { startDate, endDate } = req.query;
    const metrics = await getRetailerDashboard(shopId, startDate as string, endDate as string);
    res.json({ metrics, shopId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/retailer/inventory', requireRole('retailer', 'admin'), async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId || 'shp_1';
    const { category, search } = req.query;
    const inventory = await getShopInventory(shopId, category as string, search as string);
    res.json({ inventory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/retailer/inventory/adjust', requireRole('retailer', 'admin'), async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId || 'shp_1';
    const { productId, quantityDelta, reason } = req.body;

    if (!productId || quantityDelta === undefined || !reason) {
      return res.status(400).json({ error: 'Missing required adjustment fields (productId, quantityDelta, reason)' });
    }

    const result = await recordInventoryMovement({
      shopId,
      productId,
      movementType: 'MANUAL_ADJUSTMENT',
      quantityDelta: Number(quantityDelta),
      reason,
      actorId: req.user?.id
    });

    res.json({ success: true, message: 'Stock adjusted successfully', result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/retailer/inventory/movements', requireRole('retailer', 'admin'), async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId || 'shp_1';
    const { productId } = req.query;
    const movements = await getStockMovements(shopId, productId as string);
    res.json({ movements });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/retailer/inventory/reorder-suggestions', requireRole('retailer', 'admin'), async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId || 'shp_1';
    const suggestions = await getReorderSuggestions(shopId);
    res.json({
      suggestions,
      disclaimer: 'Rule-based estimate from minimum stock thresholds, not predictive AI.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/retailer/purchases', requireRole('retailer', 'admin'), async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId || 'shp_1';
    const { startDate, endDate } = req.query;
    const purchases = await getPurchaseRegister(shopId, startDate as string, endDate as string);
    res.json({ purchases });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Record a new purchase from supplier (atomic inventory increase)
app.post('/api/retailer/purchases', requireRole('retailer', 'admin'), async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId || 'shp_1';
    const { supplierId, invoiceNo, supplyType, lines, notes } = req.body;

    if (!supplierId || !invoiceNo || !lines || lines.length === 0) {
      return res.status(400).json({ error: 'Supplier, Invoice Number, and at least one item line are required' });
    }

    const purchaseId = `pur_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    let subtotalPaise = 0;
    let cgstPaise = 0;
    let sgstPaise = 0;
    let igstPaise = 0;
    let totalTaxPaise = 0;
    let grandTotalPaise = 0;

    const calculatedLines = lines.map((l: any, idx: number) => {
      const taxRes = calculateLineTax({
        quantity: Number(l.quantity),
        unitPricePaise: Number(l.unitCostPaise),
        taxRatePercent: Number(l.taxRatePercent),
        priceIncludesTax: false,
        supplyType: supplyType || 'INTRA_STATE',
      });

      subtotalPaise += taxRes.taxableAmountPaise;
      cgstPaise += taxRes.cgstPaise;
      sgstPaise += taxRes.sgstPaise;
      igstPaise += taxRes.igstPaise;
      totalTaxPaise += taxRes.totalTaxPaise;
      grandTotalPaise += taxRes.totalPaise;

      return {
        id: `pline_${purchaseId}_${idx}`,
        productId: l.productId,
        productName: l.productName,
        quantity: l.quantity,
        unitCostPaise: l.unitCostPaise,
        taxRatePercent: l.taxRatePercent,
        taxRes
      };
    });

    await execute(
      `INSERT INTO purchases (
        id, shop_id, supplier_id, invoice_no, date, status, supply_type,
        taxable_subtotal_paise, cgst_paise, sgst_paise, igst_paise, total_tax_paise, total_paise,
        itc_status, itc_notes, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, 'RECEIVED', ?, ?, ?, ?, ?, ?, ?, 'Needs review', 'Requires 2B match against supplier filing (Sample)', ?, ?)`,
      [
        purchaseId, shopId, supplierId, invoiceNo, now, supplyType || 'INTRA_STATE',
        subtotalPaise, cgstPaise, sgstPaise, igstPaise, totalTaxPaise, grandTotalPaise,
        notes || null, now
      ]
    );

    for (const cl of calculatedLines) {
      await execute(
        `INSERT INTO purchase_lines (
          id, purchase_id, product_id, product_name, quantity, unit_price_paise,
          tax_rate_percent, taxable_amount_paise, cgst_paise, sgst_paise, igst_paise, total_paise
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cl.id, purchaseId, cl.productId, cl.productName, cl.quantity, cl.unitCostPaise,
          cl.taxRatePercent, cl.taxRes.taxableAmountPaise, cl.taxRes.cgstPaise, cl.taxRes.sgstPaise, cl.taxRes.igstPaise, cl.taxRes.totalPaise
        ]
      );

      // Increment inventory in ledger
      await recordInventoryMovement({
        shopId,
        productId: cl.productId,
        movementType: 'PURCHASE_RECEIPT',
        quantityDelta: cl.quantity,
        referenceType: 'PURCHASE_ORDER',
        referenceId: invoiceNo,
        reason: `Inward stock received via Invoice #${invoiceNo}`,
        actorId: req.user?.id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Purchase recorded and inventory updated exactly once',
      purchaseId,
      grandTotalPaise
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Expenses
app.get('/api/retailer/expenses', requireRole('retailer', 'admin'), async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId || 'shp_1';
    const expenses = await queryAll(`SELECT * FROM expenses WHERE shop_id = ? ORDER BY date DESC`, [shopId]);
    res.json({ expenses });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/retailer/expenses', requireRole('retailer', 'admin'), async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId || 'shp_1';
    const { category, description, amountPaise, taxTreatmentNote } = req.body;

    if (!category || !description || !amountPaise) {
      return res.status(400).json({ error: 'Category, description, and amount are required' });
    }

    const expenseId = `exp_${Date.now()}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO expenses (id, shop_id, date, category, description, amount_paise, tax_treatment_note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [expenseId, shopId, now, category, description, Number(amountPaise), taxTreatmentNote || null, now]
    );

    res.status(201).json({ success: true, message: 'Expense recorded successfully', expenseId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Registers & CSV Export
app.get('/api/retailer/registers/sales', requireRole('retailer', 'admin'), async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId || 'shp_1';
    const { startDate, endDate } = req.query;
    const register = await getSalesRegister(shopId, startDate as string, endDate as string);
    res.json({ register });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/retailer/reports/export-csv', requireRole('retailer', 'admin'), async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId || 'shp_1';
    const { type, startDate, endDate } = req.query;

    if (type === 'sales') {
      const rows = await getSalesRegister(shopId, startDate as string, endDate as string);
      const headers = ['Order Number', 'Date', 'Customer Name', 'Status', 'Payment', 'Supply Type', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)', 'Grand Total (₹)'];
      const data = rows.map(r => [
        r.order_number,
        r.date.substring(0, 10),
        r.customer_name,
        r.status,
        r.payment_status,
        r.supply_type,
        (r.taxable_subtotal_paise / 100).toFixed(2),
        (r.cgst_paise / 100).toFixed(2),
        (r.sgst_paise / 100).toFixed(2),
        (r.igst_paise / 100).toFixed(2),
        (r.total_tax_paise / 100).toFixed(2),
        (r.total_paise / 100).toFixed(2),
      ]);
      const csv = generateCsvString(headers, data);
      res.header('Content-Type', 'text/csv');
      res.attachment(`Sales_Register_${shopId}.csv`);
      return res.send(csv);
    }

    if (type === 'purchases') {
      const rows = await getPurchaseRegister(shopId, startDate as string, endDate as string);
      const headers = ['Invoice No', 'Date', 'Supplier', 'Supplier GSTIN', 'Supply Type', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)', 'Grand Total (₹)', 'ITC Status'];
      const data = rows.map(r => [
        r.invoice_no,
        r.date.substring(0, 10),
        r.supplier_name,
        r.supplier_gstin,
        r.supply_type,
        (r.taxable_subtotal_paise / 100).toFixed(2),
        (r.cgst_paise / 100).toFixed(2),
        (r.sgst_paise / 100).toFixed(2),
        (r.igst_paise / 100).toFixed(2),
        (r.total_tax_paise / 100).toFixed(2),
        (r.total_paise / 100).toFixed(2),
        r.itc_status,
      ]);
      const csv = generateCsvString(headers, data);
      res.header('Content-Type', 'text/csv');
      res.attachment(`Purchase_Register_${shopId}.csv`);
      return res.send(csv);
    }

    if (type === 'inventory') {
      const rows = await getShopInventory(shopId);
      const headers = ['Product Name', 'SKU', 'Category', 'Unit', 'Stock Qty', 'Min Threshold', 'Status', 'Cost Price (₹)', 'Selling Price (₹)', 'Tax Rate (%)'];
      const data = rows.map((r: any) => [
        r.name,
        r.sku,
        r.category,
        r.unit,
        r.stock,
        r.min_stock_alert,
        r.stock_status,
        (r.cost_price_paise / 100).toFixed(2),
        (r.price_paise / 100).toFixed(2),
        `${r.tax_rate_percent}%`
      ]);
      const csv = generateCsvString(headers, data);
      res.header('Content-Type', 'text/csv');
      res.attachment(`Inventory_Valuation_${shopId}.csv`);
      return res.send(csv);
    }

    res.status(400).json({ error: 'Invalid CSV export type. Supported: sales, purchases, inventory' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= SUPPLIER / DISTRIBUTOR ROUTES =================
app.get('/api/supplier/products', requireRole('supplier', 'admin'), async (req: Request, res: Response) => {
  try {
    const supplierId = req.user?.supplierId || 'sup_1';
    const products = await queryAll(`SELECT * FROM products WHERE supplier_id = ? ORDER BY created_at DESC`, [supplierId]);
    res.json({ products });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/supplier/products', requireRole('supplier', 'admin'), async (req: Request, res: Response) => {
  try {
    const supplierId = req.user?.supplierId || 'sup_1';
    const { name, sku, category, unit, pricePaise, costPricePaise, taxRatePercent, priceIncludesTax, stock, minStockAlert, imageUrl } = req.body;

    if (!name || !sku || !category || pricePaise === undefined) {
      return res.status(400).json({ error: 'Name, SKU, category, and price are required' });
    }

    const productId = `prd_${Date.now()}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO products (
        id, supplier_id, shop_id, name, sku, category, unit,
        price_paise, cost_price_paise, tax_rate_percent, price_includes_tax,
        stock, min_stock_alert, active, image_url, created_at
      ) VALUES (?, ?, 'shp_1', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        productId, supplierId, name, sku, category, unit || 'pcs',
        Number(pricePaise), Number(costPricePaise || 0), Number(taxRatePercent || 5.0),
        priceIncludesTax ? 1 : 0, Number(stock || 0), Number(minStockAlert || 10),
        imageUrl || null, now
      ]
    );

    res.status(201).json({ success: true, message: 'Product created successfully', productId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/supplier/products/:id', requireRole('supplier', 'admin'), async (req: Request, res: Response) => {
  try {
    const supplierId = req.user?.supplierId || 'sup_1';
    const { name, sku, category, unit, pricePaise, costPricePaise, taxRatePercent, priceIncludesTax, stock, minStockAlert, imageUrl } = req.body;

    // Verify ownership
    const existing = await queryOne(`SELECT * FROM products WHERE id = ?`, [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (req.user?.role === 'supplier' && existing.supplier_id !== supplierId) {
      return res.status(403).json({ error: 'Forbidden: You cannot modify products owned by another supplier' });
    }

    await execute(
      `UPDATE products SET 
        name = ?, sku = ?, category = ?, unit = ?,
        price_paise = ?, cost_price_paise = ?, tax_rate_percent = ?,
        price_includes_tax = ?, stock = ?, min_stock_alert = ?, image_url = ?
       WHERE id = ?`,
      [
        name, sku, category, unit,
        Number(pricePaise), Number(costPricePaise), Number(taxRatePercent),
        priceIncludesTax ? 1 : 0, Number(stock), Number(minStockAlert), imageUrl,
        req.params.id
      ]
    );

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/supplier/products/:id/toggle', requireRole('supplier', 'admin'), async (req: Request, res: Response) => {
  try {
    const existing = await queryOne<any>(`SELECT * FROM products WHERE id = ?`, [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const newActive = existing.active === 1 ? 0 : 1;
    await execute(`UPDATE products SET active = ? WHERE id = ?`, [newActive, req.params.id]);
    res.json({ success: true, active: newActive });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Supplier incoming retailer purchase orders
app.get('/api/supplier/orders', requireRole('supplier', 'admin'), async (req: Request, res: Response) => {
  try {
    const supplierId = req.user?.supplierId || 'sup_1';
    const orders = await queryAll(`
      SELECT 
        p.*,
        sh.name as shop_name, sh.address as shop_address, sh.demo_gstin as shop_gstin, sh.contact_phone as shop_phone
      FROM purchases p
      JOIN shops sh ON p.shop_id = sh.id
      WHERE p.supplier_id = ?
      ORDER BY p.date DESC
    `, [supplierId]);
    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ADMIN PORTAL ROUTES =================
app.get('/api/admin/system-status', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const usersCount = (await queryOne<any>(`SELECT COUNT(*) as c FROM users`))?.c || 0;
    const shopsCount = (await queryOne<any>(`SELECT COUNT(*) as c FROM shops`))?.c || 0;
    const suppliersCount = (await queryOne<any>(`SELECT COUNT(*) as c FROM suppliers`))?.c || 0;
    const productsCount = (await queryOne<any>(`SELECT COUNT(*) as c FROM products`))?.c || 0;
    const ordersCount = (await queryOne<any>(`SELECT COUNT(*) as c FROM orders`))?.c || 0;
    const purchasesCount = (await queryOne<any>(`SELECT COUNT(*) as c FROM purchases`))?.c || 0;
    const auditEvents = await queryAll(`SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 30`);

    const shops = await queryAll(`
      SELECT s.*, u.name as owner_name, u.email as owner_email,
        (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id) as order_count,
        (SELECT COALESCE(SUM(o.total_paise), 0) FROM orders o WHERE o.shop_id = s.id AND o.status != 'CANCELLED') as total_sales_paise
      FROM shops s
      JOIN users u ON s.owner_user_id = u.id
    `);

    const suppliers = await queryAll(`
      SELECT sp.*, u.name as contact_name, u.email as contact_email,
        (SELECT COUNT(*) FROM products p WHERE p.supplier_id = sp.id) as product_count,
        (SELECT COUNT(*) FROM purchases pu WHERE pu.supplier_id = sp.id) as incoming_orders_count
      FROM suppliers sp
      JOIN users u ON sp.user_id = u.id
    `);

    const recentOrders = await queryAll(`
      SELECT o.*, sh.name as shop_name 
      FROM orders o
      JOIN shops sh ON o.shop_id = sh.id
      ORDER BY o.date DESC
      LIMIT 15
    `);

    res.json({
      system: {
        usersCount,
        shopsCount,
        suppliersCount,
        productsCount,
        ordersCount,
        purchasesCount,
      },
      shops,
      suppliers,
      recentOrders,
      auditEvents,
      environment: 'Prototype Demonstration (Local SQLite)',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin reset demo data
app.post('/api/admin/reset-demo-data', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { confirmed } = req.body;
    if (!confirmed) {
      return res.status(400).json({ error: 'Reset confirmation must be true' });
    }

    await seedDatabase();
    res.json({ success: true, message: 'Seeded demo database successfully reset to clean state' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize database schema and start server
async function startServer() {
  await getDb();
  await initSchema();

  app.listen(PORT, () => {
    console.log(`[Smart Retail India API] Server running on http://localhost:${PORT}`);
    console.log(`[Status] Demo Mode Active - Sample Data Only - No live GSTN / Payment integrations`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
  });
}

export default app;
