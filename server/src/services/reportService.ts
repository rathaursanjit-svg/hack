import { queryAll, queryOne } from '../db/database';

export interface DashboardMetrics {
  totalSalesRevenuePaise: number; // Excluding GST
  totalGrossProfitPaise: number;
  totalOperatingExpensesPaise: number;
  estimatedNetProfitPaise: number;
  gstOutputTaxPaise: number;
  gstInputTaxPaise: number;
  estimatedNetGstPayablePaise: number;
  itcReviewStatus: string;
  totalOrdersCount: number;
  totalPurchasesCount: number;
  lowStockItemsCount: number;
  totalInventoryValuationPaise: number;
  salesByDay: { date: string; salesPaise: number; profitPaise: number }[];
}

export async function getRetailerDashboard(shopId: string, startDate?: string, endDate?: string): Promise<DashboardMetrics> {
  // Base filters for orders (excluding cancelled)
  let orderFilter = `shop_id = ? AND status != 'CANCELLED'`;
  const orderParams: any[] = [shopId];

  if (startDate) {
    orderFilter += ` AND date >= ?`;
    orderParams.push(startDate);
  }
  if (endDate) {
    orderFilter += ` AND date <= ?`;
    orderParams.push(endDate);
  }

  // 1. Sales revenue (excluding GST) & GST output tax collected
  const salesAgg = await queryOne<any>(
    `SELECT 
      COUNT(*) as count,
      COALESCE(SUM(taxable_subtotal_paise), 0) as total_taxable,
      COALESCE(SUM(total_tax_paise), 0) as total_tax,
      COALESCE(SUM(total_paise), 0) as grand_total
    FROM orders 
    WHERE ${orderFilter}`,
    orderParams
  );

  const totalSalesRevenuePaise = salesAgg?.total_taxable || 0;
  const gstOutputTaxPaise = salesAgg?.total_tax || 0;
  const totalOrdersCount = salesAgg?.count || 0;

  // 2. Cost of goods sold (COGS) for completed/active orders
  let cogsSql = `
    SELECT COALESCE(SUM(ol.quantity * ol.cost_price_paise), 0) as total_cogs
    FROM order_lines ol
    JOIN orders o ON ol.order_id = o.id
    WHERE o.shop_id = ? AND o.status != 'CANCELLED'
  `;
  const cogsParams: any[] = [shopId];
  if (startDate) {
    cogsSql += ` AND o.date >= ?`;
    cogsParams.push(startDate);
  }
  if (endDate) {
    cogsSql += ` AND o.date <= ?`;
    cogsParams.push(endDate);
  }
  const cogsRes = await queryOne<any>(cogsSql, cogsParams);
  const totalCogsPaise = cogsRes?.total_cogs || 0;

  // 3. Operating expenses
  let expFilter = `shop_id = ?`;
  const expParams: any[] = [shopId];
  if (startDate) {
    expFilter += ` AND date >= ?`;
    expParams.push(startDate);
  }
  if (endDate) {
    expFilter += ` AND date <= ?`;
    expParams.push(endDate);
  }
  const expRes = await queryOne<any>(
    `SELECT COALESCE(SUM(amount_paise), 0) as total_exp FROM expenses WHERE ${expFilter}`,
    expParams
  );
  const totalOperatingExpensesPaise = expRes?.total_exp || 0;

  // 4. Purchases and GST input tax
  let purFilter = `shop_id = ? AND status = 'RECEIVED'`;
  const purParams: any[] = [shopId];
  if (startDate) {
    purFilter += ` AND date >= ?`;
    purParams.push(startDate);
  }
  if (endDate) {
    purFilter += ` AND date <= ?`;
    purParams.push(endDate);
  }
  const purRes = await queryOne<any>(
    `SELECT 
      COUNT(*) as count,
      COALESCE(SUM(total_tax_paise), 0) as total_tax,
      COALESCE(SUM(total_paise), 0) as grand_total
    FROM purchases WHERE ${purFilter}`,
    purParams
  );
  const gstInputTaxPaise = purRes?.total_tax || 0;
  const totalPurchasesCount = purRes?.count || 0;

  // Calculations
  const totalGrossProfitPaise = totalSalesRevenuePaise - totalCogsPaise;
  const estimatedNetProfitPaise = totalGrossProfitPaise - totalOperatingExpensesPaise;
  
  // Net GST payable estimate (Output GST - Eligible Input GST).
  // Under the SRS specification: Potential ITC must be flagged as "Needs review"
  const estimatedNetGstPayablePaise = Math.max(0, gstOutputTaxPaise - gstInputTaxPaise);

  // 5. Inventory valuation & low stock items
  const invRes = await queryOne<any>(
    `SELECT 
      COALESCE(SUM(stock * cost_price_paise), 0) as valuation,
      COALESCE(SUM(CASE WHEN stock <= min_stock_alert THEN 1 ELSE 0 END), 0) as low_stock_count
    FROM products
    WHERE (shop_id = ? OR shop_id IS NULL) AND active = 1`,
    [shopId]
  );
  const totalInventoryValuationPaise = invRes?.valuation || 0;
  const lowStockItemsCount = invRes?.low_stock_count || 0;

  // 6. Recent sales trend for charts
  const trendRows = await queryAll<any>(
    `SELECT 
      substr(o.date, 1, 10) as day,
      COALESCE(SUM(o.taxable_subtotal_paise), 0) as sales_paise,
      COALESCE(SUM(o.taxable_subtotal_paise - (ol.cogs_sum)), 0) as profit_paise
    FROM orders o
    LEFT JOIN (
      SELECT order_id, SUM(quantity * cost_price_paise) as cogs_sum
      FROM order_lines
      GROUP BY order_id
    ) ol ON o.id = ol.order_id
    WHERE o.shop_id = ? AND o.status != 'CANCELLED'
    GROUP BY substr(o.date, 1, 10)
    ORDER BY day DESC
    LIMIT 7`,
    [shopId]
  );

  const salesByDay = trendRows.reverse().map(r => ({
    date: r.day,
    salesPaise: r.sales_paise,
    profitPaise: r.profit_paise
  }));

  return {
    totalSalesRevenuePaise,
    totalGrossProfitPaise,
    totalOperatingExpensesPaise,
    estimatedNetProfitPaise,
    gstOutputTaxPaise,
    gstInputTaxPaise,
    estimatedNetGstPayablePaise,
    itcReviewStatus: 'Needs review (Sample Calculation Only)',
    totalOrdersCount,
    totalPurchasesCount,
    lowStockItemsCount,
    totalInventoryValuationPaise,
    salesByDay
  };
}

export async function getSalesRegister(shopId: string, startDate?: string, endDate?: string) {
  let sql = `
    SELECT 
      o.id, o.order_number, o.date, o.customer_name, o.payment_status, o.status,
      o.supply_type, o.taxable_subtotal_paise, o.cgst_paise, o.sgst_paise, o.igst_paise,
      o.total_tax_paise, o.total_paise,
      inv.invoice_number
    FROM orders o
    LEFT JOIN invoices inv ON o.id = inv.order_id
    WHERE o.shop_id = ?
  `;
  const params: any[] = [shopId];

  if (startDate) {
    sql += ` AND o.date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    sql += ` AND o.date <= ?`;
    params.push(endDate);
  }

  sql += ` ORDER BY o.date DESC`;
  return queryAll(sql, params);
}

export async function getPurchaseRegister(shopId: string, startDate?: string, endDate?: string) {
  let sql = `
    SELECT 
      p.id, p.invoice_no, p.date, p.status, p.supply_type,
      p.taxable_subtotal_paise, p.cgst_paise, p.sgst_paise, p.igst_paise,
      p.total_tax_paise, p.total_paise, p.itc_status, p.itc_notes,
      s.business_name as supplier_name, s.demo_gstin as supplier_gstin
    FROM purchases p
    JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.shop_id = ?
  `;
  const params: any[] = [shopId];

  if (startDate) {
    sql += ` AND p.date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    sql += ` AND p.date <= ?`;
    params.push(endDate);
  }

  sql += ` ORDER BY p.date DESC`;
  return queryAll(sql, params);
}

export function generateCsvString(headers: string[], rows: (string | number)[][]): string {
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCsv).join(',');
  const rowLines = rows.map(r => r.map(escapeCsv).join(','));
  return [headerLine, ...rowLines].join('\n');
}
