export type Role = 'admin' | 'supplier' | 'retailer' | 'consumer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: number;
  shop_id?: string;
  shop_name?: string;
  shop_gstin?: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_gstin?: string;
}

export interface Shop {
  id: string;
  owner_user_id: string;
  name: string;
  address: string;
  state: string;
  service_area: string;
  contact_phone: string;
  demo_gstin: string;
  product_count?: number;
}

export interface Product {
  id: string;
  supplier_id: string;
  shop_id?: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  price_paise: number;
  cost_price_paise?: number;
  tax_rate_percent: number;
  price_includes_tax: number;
  stock: number;
  min_stock_alert: number;
  active: number;
  image_url?: string;
  supplier_name?: string;
  shop_name?: string;
  stock_status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderLine {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  unit: string;
  quantity: number;
  unit_price_paise: number;
  cost_price_paise: number;
  tax_rate_percent: number;
  price_includes_tax: number;
  taxable_amount_paise: number;
  cgst_paise: number;
  sgst_paise: number;
  igst_paise: number;
  total_paise: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  shop_id: string;
  shop_name?: string;
  status: 'PLACED' | 'ACCEPTED' | 'READY' | 'COMPLETED' | 'CANCELLED';
  date: string;
  payment_status: 'PENDING' | 'SIMULATED_PAID' | 'PAY_ON_PICKUP';
  supply_type: 'INTRA_STATE' | 'INTER_STATE';
  fulfillment_type: 'DELIVERY' | 'PICKUP';
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  taxable_subtotal_paise: number;
  cgst_paise: number;
  sgst_paise: number;
  igst_paise: number;
  total_tax_paise: number;
  total_paise: number;
  notes?: string;
  invoice_id?: string;
  invoice_number?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  seller: {
    shopName: string;
    address: string;
    state: string;
    demoGstin: string;
    phone: string;
  };
  buyer: {
    name: string;
    phone: string;
    address: string;
  };
  lines: Array<{
    productId: string;
    productName: string;
    sku: string;
    unit: string;
    quantity: number;
    unitPricePaise: number;
    taxRatePercent: number;
    taxableAmountPaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    totalPaise: number;
  }>;
  taxableSubtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  totalPaise: number;
  supplyType: 'INTRA_STATE' | 'INTER_STATE';
  status: string;
  isPrototype: boolean;
  disclaimer: string;
}

export interface DashboardMetrics {
  totalSalesRevenuePaise: number;
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
