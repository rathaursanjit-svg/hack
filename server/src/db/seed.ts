import { execute, runScript, saveDb } from './database';
import { initSchema } from './schema';
import { calculateLineTax } from '../services/taxService';

export async function seedDatabase(): Promise<void> {
  // Reset existing tables
  await runScript(`
    DROP TABLE IF EXISTS audit_events;
    DROP TABLE IF EXISTS tax_configs;
    DROP TABLE IF EXISTS expenses;
    DROP TABLE IF EXISTS invoices;
    DROP TABLE IF EXISTS order_lines;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS purchase_lines;
    DROP TABLE IF EXISTS purchases;
    DROP TABLE IF EXISTS inventory_movements;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS suppliers;
    DROP TABLE IF EXISTS shops;
    DROP TABLE IF EXISTS users;
  `);

  await initSchema();

  const now = new Date();
  const dateIso = (offsetDays: number, offsetHours = 0) => {
    const d = new Date(now.getTime() - (offsetDays * 24 + offsetHours) * 60 * 60 * 1000);
    return d.toISOString();
  };

  // 1. Seed Users (1 Admin, 3 Suppliers, 5 Retailers, 8 Consumers)
  const users = [
    { id: 'usr_admin', name: 'Rajesh Sharma (Admin)', email: 'admin@smartretail.demo', role: 'admin' },
    // Suppliers
    { id: 'usr_sup_1', name: 'Apex FMCG Distributors', email: 'apex@distributors.demo', role: 'supplier' },
    { id: 'usr_sup_2', name: 'Heritage Agro Commodities', email: 'heritage@agro.demo', role: 'supplier' },
    { id: 'usr_sup_3', name: 'Bharat Office & Stationery', email: 'bharat@supplies.demo', role: 'supplier' },
    // Retailers
    { id: 'usr_ret_1', name: 'Sharma Kirana Store', email: 'sharma@kirana.demo', role: 'retailer' },
    { id: 'usr_ret_2', name: 'Krishna Supermart', email: 'krishna@mart.demo', role: 'retailer' },
    { id: 'usr_ret_3', name: 'Lakshmi General Store', email: 'lakshmi@general.demo', role: 'retailer' },
    { id: 'usr_ret_4', name: 'Patel Provisions', email: 'patel@provisions.demo', role: 'retailer' },
    { id: 'usr_ret_5', name: 'Modern Daily Needs', email: 'modern@dailyneeds.demo', role: 'retailer' },
    // Consumers
    { id: 'usr_con_1', name: 'Aarav Mehta', email: 'aarav@customer.demo', role: 'consumer' },
    { id: 'usr_con_2', name: 'Priya Iyer', email: 'priya@customer.demo', role: 'consumer' },
    { id: 'usr_con_3', name: 'Rohit Verma', email: 'rohit@customer.demo', role: 'consumer' },
    { id: 'usr_con_4', name: 'Ananya Gupta', email: 'ananya@customer.demo', role: 'consumer' },
    { id: 'usr_con_5', name: 'Vikram Singh', email: 'vikram@customer.demo', role: 'consumer' },
    { id: 'usr_con_6', name: 'Sneha Patel', email: 'sneha@customer.demo', role: 'consumer' },
    { id: 'usr_con_7', name: 'Kavita Das', email: 'kavita@customer.demo', role: 'consumer' },
    { id: 'usr_con_8', name: 'Amitabh Sen', email: 'amitabh@customer.demo', role: 'consumer' },
  ];

  for (const u of users) {
    await execute(
      `INSERT INTO users (id, name, email, role, active, created_at) VALUES (?, ?, ?, ?, 1, ?)`,
      [u.id, u.name, u.email, u.role, dateIso(30)]
    );
  }

  // 2. Seed Suppliers
  const suppliers = [
    {
      id: 'sup_1',
      userId: 'usr_sup_1',
      businessName: 'Apex FMCG Distributors Pvt Ltd',
      state: 'Maharashtra',
      contact: '+91 98200 11223',
      demoGstin: '27AABCA1234F1Z1',
    },
    {
      id: 'sup_2',
      userId: 'usr_sup_2',
      businessName: 'Heritage Agro Commodities Corp',
      state: 'Punjab',
      contact: '+91 98140 22334',
      demoGstin: '03AABCH5678K1Z2',
    },
    {
      id: 'sup_3',
      userId: 'usr_sup_3',
      businessName: 'Bharat Office & Stationery Wholesale',
      state: 'Delhi',
      contact: '+91 98110 33445',
      demoGstin: '07AABCB9012M1Z3',
    },
  ];

  for (const s of suppliers) {
    await execute(
      `INSERT INTO suppliers (id, user_id, business_name, state, contact_phone, demo_gstin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.userId, s.businessName, s.state, s.contact, s.demoGstin, dateIso(30)]
    );
  }

  // 3. Seed Shops
  const shops = [
    {
      id: 'shp_1',
      ownerUserId: 'usr_ret_1',
      name: 'Sharma Kirana & Daily Store',
      address: 'Shop 14, Main Market, Lajpat Nagar, New Delhi',
      state: 'Delhi',
      serviceArea: 'South Delhi, Lajpat Nagar (5 km radius)',
      contact: '+91 98101 44556',
      demoGstin: '07AAACS1122Q1ZA',
    },
    {
      id: 'shp_2',
      ownerUserId: 'usr_ret_2',
      name: 'Krishna Supermart & Organics',
      address: 'Plot 22, Sector 18, Noida, Uttar Pradesh',
      state: 'Uttar Pradesh',
      serviceArea: 'Noida Sector 18, 15, 16',
      contact: '+91 98102 55667',
      demoGstin: '09AAACK3344R1ZB',
    },
    {
      id: 'shp_3',
      ownerUserId: 'usr_ret_3',
      name: 'Lakshmi General & Spices Store',
      address: 'Shop 5, Chandni Chowk, Old Delhi',
      state: 'Delhi',
      serviceArea: 'Old Delhi, Daryaganj, Civil Lines',
      contact: '+91 98103 66778',
      demoGstin: '07AAACL5566S1ZC',
    },
    {
      id: 'shp_4',
      ownerUserId: 'usr_ret_4',
      name: 'Patel Provisions & Dairy',
      address: 'Block C, Indirapuram, Ghaziabad, UP',
      state: 'Uttar Pradesh',
      serviceArea: 'Indirapuram, Vaishali',
      contact: '+91 98104 77889',
      demoGstin: '09AAACP7788T1ZD',
    },
    {
      id: 'shp_5',
      ownerUserId: 'usr_ret_5',
      name: 'Modern Daily Needs & Stationers',
      address: 'Market Complex, Malviya Nagar, New Delhi',
      state: 'Delhi',
      serviceArea: 'South Delhi, Saket, Malviya Nagar',
      contact: '+91 98105 88990',
      demoGstin: '07AAACM9900U1ZE',
    },
  ];

  for (const sh of shops) {
    await execute(
      `INSERT INTO shops (id, owner_user_id, name, address, state, service_area, contact_phone, demo_gstin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sh.id, sh.ownerUserId, sh.name, sh.address, sh.state, sh.serviceArea, sh.contact, sh.demoGstin, dateIso(30)]
    );
  }

  // 4. Seed Tax Configs
  const taxConfigs = [
    { id: 'tax_0', category: 'Essential Foodgrains', rate: 0.0, defaultInclusive: 1, desc: 'Unbranded basic grains & pulses' },
    { id: 'tax_5', category: 'Household Essentials', rate: 5.0, defaultInclusive: 1, desc: 'Branded sugar, tea, edible oils, spices' },
    { id: 'tax_12', category: 'Processed Foods', rate: 12.0, defaultInclusive: 1, desc: 'Packaged dairy products, fruit juices, namkeens' },
    { id: 'tax_18', category: 'Personal Care & Stationery', rate: 18.0, defaultInclusive: 1, desc: 'Soaps, detergents, notebooks, ball pens' },
    { id: 'tax_28', category: 'Premium / Aerated', rate: 28.0, defaultInclusive: 1, desc: 'Aerated soft drinks, luxury chocolates' },
  ];

  for (const tc of taxConfigs) {
    await execute(
      `INSERT INTO tax_configs (id, category, tax_rate_percent, default_inclusive, description, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [tc.id, tc.category, tc.rate, tc.defaultInclusive, tc.desc, 'Sample test rate; consult professional tax advisor.']
    );
  }

  // 5. Seed Products for ALL 5 Marketplace Shops
  // Shop 1 (Sharma Kirana & Daily Store - Delhi) - 26 Master Products
  const shop1Products = [
    // Heritage Agro Commodities (sup_2)
    { id: 'prd_1', sup: 'sup_2', shopId: 'shp_1', name: 'Sharbati Whole Wheat Atta 5kg', sku: 'ATT-WHT-05K', cat: 'Grocery', unit: 'pack', price: 23500, cost: 19500, tax: 5.0, inc: 1, min: 10, stock: 45, img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_2', sup: 'sup_2', shopId: 'shp_1', name: 'Royal Basmati Rice 5kg', sku: 'RIC-BAS-05K', cat: 'Grocery', unit: 'pack', price: 48000, cost: 41000, tax: 5.0, inc: 1, min: 10, stock: 32, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_3', sup: 'sup_2', shopId: 'shp_1', name: 'Organic Toor Dal 1kg', sku: 'DAL-TOO-01K', cat: 'Grocery', unit: 'kg', price: 17500, cost: 14500, tax: 0.0, inc: 1, min: 15, stock: 55, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_4', sup: 'sup_2', shopId: 'shp_1', name: 'Fortune Mustard Oil 1L', sku: 'OIL-MUS-01L', cat: 'Grocery', unit: 'bottle', price: 16500, cost: 14200, tax: 5.0, inc: 1, min: 12, stock: 6, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_5', sup: 'sup_2', shopId: 'shp_1', name: 'Tata Premium Iodized Salt 1kg', sku: 'SLT-IOD-01K', cat: 'Grocery', unit: 'pack', price: 2800, cost: 2100, tax: 0.0, inc: 1, min: 20, stock: 80, img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_22', sup: 'sup_2', shopId: 'shp_1', name: 'Catch Coriander Powder 200g', sku: 'SPC-CAT-200', cat: 'Grocery', unit: 'pack', price: 6500, cost: 5100, tax: 5.0, inc: 1, min: 10, stock: 24, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_23', sup: 'sup_2', shopId: 'shp_1', name: 'Everest Turmeric Powder 200g', sku: 'SPC-EVE-200', cat: 'Grocery', unit: 'pack', price: 5800, cost: 4500, tax: 5.0, inc: 1, min: 12, stock: 120, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_24', sup: 'sup_2', shopId: 'shp_1', name: 'Desi Chana Dal Unpolished 1kg', sku: 'DAL-CHN-01K', cat: 'Grocery', unit: 'kg', price: 13500, cost: 11000, tax: 0.0, inc: 1, min: 15, stock: 0, img: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?auto=format&fit=crop&w=400&q=80' },

    // Apex FMCG Distributors (sup_1)
    { id: 'prd_6', sup: 'sup_1', shopId: 'shp_1', name: 'Brooke Bond Red Label Tea 500g', sku: 'TEA-RED-500', cat: 'Beverages', unit: 'pack', price: 29000, cost: 24500, tax: 5.0, inc: 1, min: 10, stock: 18, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_7', sup: 'sup_1', shopId: 'shp_1', name: 'Nescafe Classic Instant Coffee 100g', sku: 'COF-NES-100', cat: 'Beverages', unit: 'jar', price: 34000, cost: 28500, tax: 18.0, inc: 1, min: 8, stock: 40, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_8', sup: 'sup_1', shopId: 'shp_1', name: 'Parle-G Glucose Biscuits 250g', sku: 'BIS-PAR-250', cat: 'Snacks', unit: 'pack', price: 2500, cost: 2000, tax: 5.0, inc: 1, min: 25, stock: 5, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_9', sup: 'sup_1', shopId: 'shp_1', name: 'Haldiram Aloo Bhujia 400g', sku: 'SNK-HAL-400', cat: 'Snacks', unit: 'pack', price: 11000, cost: 8900, tax: 12.0, inc: 1, min: 10, stock: 22, img: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_10', sup: 'sup_1', shopId: 'shp_1', name: 'Amul Pure Ghee 1L Tin', sku: 'GHE-AMU-01L', cat: 'Dairy', unit: 'tin', price: 65000, cost: 58000, tax: 12.0, inc: 1, min: 5, stock: 35, img: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_11', sup: 'sup_1', shopId: 'shp_1', name: 'Dettol Original Bathing Soap (Pack of 4)', sku: 'SOP-DET-4PK', cat: 'Personal Care', unit: 'pack', price: 19500, cost: 16000, tax: 18.0, inc: 1, min: 10, stock: 28, img: 'https://images.unsplash.com/photo-1607006314144-8cb389745e31?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_12', sup: 'sup_1', shopId: 'shp_1', name: 'Colgate Total Dental Cream 200g', sku: 'PST-COL-200', cat: 'Personal Care', unit: 'tube', price: 16500, cost: 13500, tax: 18.0, inc: 1, min: 12, stock: 45, img: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_13', sup: 'sup_1', shopId: 'shp_1', name: 'Surf Excel Matic Liquid Detergent 1L', sku: 'DET-SRF-01L', cat: 'Household', unit: 'bottle', price: 24000, cost: 19800, tax: 18.0, inc: 1, min: 8, stock: 70, img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_14', sup: 'sup_1', shopId: 'shp_1', name: 'Vim Dishwash Gel Lemon 750ml', sku: 'VIM-GEL-750', cat: 'Household', unit: 'bottle', price: 15500, cost: 12500, tax: 18.0, inc: 1, min: 10, stock: 3, img: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_15', sup: 'sup_1', shopId: 'shp_1', name: 'Lizol Floral Surface Cleaner 1L', sku: 'LIZ-FLO-01L', cat: 'Household', unit: 'bottle', price: 21000, cost: 17200, tax: 18.0, inc: 1, min: 10, stock: 50, img: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_20', sup: 'sup_1', shopId: 'shp_1', name: 'Coca-Cola Zero Sugar 750ml Pet Bottle', sku: 'BEV-CCZ-750', cat: 'Beverages', unit: 'bottle', price: 4500, cost: 3500, tax: 28.0, inc: 1, min: 15, stock: 60, img: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_21', sup: 'sup_1', shopId: 'shp_1', name: 'Cadbury Dairy Milk Silk 150g', sku: 'CHK-CAD-150', cat: 'Snacks', unit: 'bar', price: 18000, cost: 14800, tax: 18.0, inc: 1, min: 10, stock: 25, img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80' },

    // Bharat Office & Stationery (sup_3)
    { id: 'prd_16', sup: 'sup_3', shopId: 'shp_1', name: 'Classmate Ruled Notebook 172 Pgs (Pack of 6)', sku: 'STA-CLS-6PK', cat: 'Stationery', unit: 'pack', price: 36000, cost: 29000, tax: 12.0, inc: 1, min: 15, stock: 38, img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_17', sup: 'sup_3', shopId: 'shp_1', name: 'Reynolds 045 Fine Ballpoint Pens (Pack of 10)', sku: 'PEN-REY-10P', cat: 'Stationery', unit: 'box', price: 10000, cost: 7500, tax: 12.0, inc: 1, min: 20, stock: 42, img: 'https://images.unsplash.com/photo-1585336261026-6b2165089f2a?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_18', sup: 'sup_3', shopId: 'shp_1', name: 'JK Copier A4 Paper Ream (500 Sheets 75GSM)', sku: 'PPR-JKC-500', cat: 'Stationery', unit: 'ream', price: 34000, cost: 28500, tax: 12.0, inc: 1, min: 10, stock: 19, img: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_19', sup: 'sup_3', shopId: 'shp_1', name: 'Fevicol MR Squeezy Glue 100g', sku: 'GLU-FEV-100', cat: 'Stationery', unit: 'bottle', price: 4500, cost: 3400, tax: 18.0, inc: 1, min: 15, stock: 30, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_25', sup: 'sup_3', shopId: 'shp_1', name: 'Camlin Whiteboard Marker Set (4 Colors)', sku: 'STA-CAM-4MK', cat: 'Stationery', unit: 'set', price: 14000, cost: 11000, tax: 18.0, inc: 1, min: 10, stock: 14, img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_26', sup: 'sup_3', shopId: 'shp_1', name: 'Kangaro Heavy Duty Paper Stapler HD-10D', sku: 'STA-KNG-STP', cat: 'Stationery', unit: 'pcs', price: 18500, cost: 14500, tax: 18.0, inc: 1, min: 8, stock: 22, img: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80' }
  ];

  // Shop 2: Krishna Supermart & Organics (Noida, UP) - 20 Organic & Supermarket Items
  const shop2Products = [
    { id: 'prd_s2_1', sup: 'sup_2', shopId: 'shp_2', name: 'Organic Sharbati Whole Wheat Atta 5kg', sku: 'KSO-ATT-05K', cat: 'Grocery', unit: 'pack', price: 28500, cost: 23500, tax: 5.0, inc: 1, min: 10, stock: 42, img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_2', sup: 'sup_2', shopId: 'shp_2', name: 'Organic Royal Biryani Basmati Rice 5kg', sku: 'KSO-RIC-05K', cat: 'Grocery', unit: 'pack', price: 54000, cost: 46000, tax: 5.0, inc: 1, min: 10, stock: 35, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_3', sup: 'sup_2', shopId: 'shp_2', name: 'Organic Unpolished Toor Dal 1kg', sku: 'KSO-DAL-TOO', cat: 'Grocery', unit: 'kg', price: 19500, cost: 16000, tax: 0.0, inc: 1, min: 15, stock: 50, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_4', sup: 'sup_2', shopId: 'shp_2', name: 'Wood Cold-Pressed Yellow Mustard Oil 1L', sku: 'KSO-OIL-01L', cat: 'Grocery', unit: 'bottle', price: 22000, cost: 18500, tax: 5.0, inc: 1, min: 12, stock: 28, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_5', sup: 'sup_2', shopId: 'shp_2', name: 'Pure Himalayan Pink Rock Salt 1kg', sku: 'KSO-SLT-PNK', cat: 'Grocery', unit: 'pack', price: 6500, cost: 4500, tax: 0.0, inc: 1, min: 20, stock: 65, img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_6', sup: 'sup_2', shopId: 'shp_2', name: 'Organic Coriander Seeds & Powder 200g', sku: 'KSO-SPC-COR', cat: 'Grocery', unit: 'pack', price: 7500, cost: 5800, tax: 5.0, inc: 1, min: 10, stock: 30, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_7', sup: 'sup_2', shopId: 'shp_2', name: 'Pure Organic Lakadong Turmeric Powder 200g', sku: 'KSO-SPC-TUR', cat: 'Grocery', unit: 'pack', price: 9500, cost: 7200, tax: 5.0, inc: 1, min: 10, stock: 24, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_8', sup: 'sup_2', shopId: 'shp_2', name: 'Organic Kabuli Chana Chickpeas 1kg', sku: 'KSO-DAL-CHN', cat: 'Grocery', unit: 'kg', price: 18000, cost: 14500, tax: 0.0, inc: 1, min: 15, stock: 40, img: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_9', sup: 'sup_1', shopId: 'shp_2', name: 'Organic Green Tea with Tulsi & Ginger 250g', sku: 'KSO-TEA-TLS', cat: 'Beverages', unit: 'pack', price: 32000, cost: 26000, tax: 5.0, inc: 1, min: 10, stock: 22, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_10', sup: 'sup_1', shopId: 'shp_2', name: 'Artisanal Medium Roast Filter Coffee 200g', sku: 'KSO-COF-ART', cat: 'Beverages', unit: 'jar', price: 39000, cost: 32000, tax: 18.0, inc: 1, min: 8, stock: 15, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_11', sup: 'sup_1', shopId: 'shp_2', name: 'Organic Ragi Multigrain Digestive Biscuits 300g', sku: 'KSO-BIS-RAG', cat: 'Snacks', unit: 'pack', price: 8500, cost: 6800, tax: 5.0, inc: 1, min: 15, stock: 38, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_12', sup: 'sup_1', shopId: 'shp_2', name: 'Slow Roasted Herb Makhana (Foxnuts) 100g', sku: 'KSO-SNK-MKH', cat: 'Snacks', unit: 'pack', price: 14000, cost: 11000, tax: 12.0, inc: 1, min: 12, stock: 20, img: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_13', sup: 'sup_1', shopId: 'shp_2', name: 'Vedic A2 Desi Gir Cow Cultured Ghee 500ml', sku: 'KSO-GHE-A2G', cat: 'Dairy', unit: 'jar', price: 115000, cost: 95000, tax: 12.0, inc: 1, min: 5, stock: 12, img: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_14', sup: 'sup_1', shopId: 'shp_2', name: 'Organic Fresh Cow Milk Paneer 200g', sku: 'KSO-PAN-200', cat: 'Dairy', unit: 'pack', price: 11000, cost: 9000, tax: 0.0, inc: 1, min: 8, stock: 18, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_15', sup: 'sup_1', shopId: 'shp_2', name: 'Handmade Neem & Aloe Vera Ayurvedic Soap (Pack of 3)', sku: 'KSO-SOP-NEM', cat: 'Personal Care', unit: 'pack', price: 24000, cost: 19000, tax: 18.0, inc: 1, min: 10, stock: 25, img: 'https://images.unsplash.com/photo-1607006314144-8cb389745e31?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_16', sup: 'sup_1', shopId: 'shp_2', name: 'Ayurvedic Clove & Mint Herbal Toothpaste 150g', sku: 'KSO-PST-HRB', cat: 'Personal Care', unit: 'tube', price: 15000, cost: 11800, tax: 18.0, inc: 1, min: 10, stock: 22, img: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_17', sup: 'sup_1', shopId: 'shp_2', name: 'Eco-Friendly Plant-Based Laundry Detergent 1L', sku: 'KSO-DET-ECO', cat: 'Household', unit: 'bottle', price: 34000, cost: 27000, tax: 18.0, inc: 1, min: 8, stock: 16, img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_18', sup: 'sup_1', shopId: 'shp_2', name: 'Citrus Bio-Enzyme Natural Kitchen Cleaner 500ml', sku: 'KSO-CLN-BIO', cat: 'Household', unit: 'bottle', price: 19500, cost: 15500, tax: 18.0, inc: 1, min: 10, stock: 20, img: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_19', sup: 'sup_2', shopId: 'shp_2', name: 'Wild Forest Raw Unprocessed Honey 500g', sku: 'KSO-HNY-500', cat: 'Grocery', unit: 'jar', price: 36000, cost: 29000, tax: 5.0, inc: 1, min: 8, stock: 14, img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s2_20', sup: 'sup_3', shopId: 'shp_2', name: 'Recycled Eco-Kraft Ruled Journal Notebook (Pack of 3)', sku: 'KSO-STA-KRF', cat: 'Stationery', unit: 'pack', price: 29000, cost: 22000, tax: 12.0, inc: 1, min: 10, stock: 28, img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' }
  ];

  // Shop 3: Lakshmi General & Spices Store (Old Delhi) - 20 Authentic Spices & Staples
  const shop3Products = [
    { id: 'prd_s3_1', sup: 'sup_2', shopId: 'shp_3', name: 'Special Degi Mirch Kashmiri Chilli Powder 200g', sku: 'LGS-SPC-KMR', cat: 'Grocery', unit: 'pack', price: 8800, cost: 6800, tax: 5.0, inc: 1, min: 15, stock: 65, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_2', sup: 'sup_2', shopId: 'shp_3', name: 'Old Delhi Royal Shahi Garam Masala 100g', sku: 'LGS-SPC-GAR', cat: 'Grocery', unit: 'pack', price: 9200, cost: 7100, tax: 5.0, inc: 1, min: 12, stock: 45, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_3', sup: 'sup_2', shopId: 'shp_3', name: 'Whole Sabut Jeera (Cumin Seeds) 250g', sku: 'LGS-SPC-JEE', cat: 'Grocery', unit: 'pack', price: 12500, cost: 9800, tax: 5.0, inc: 1, min: 15, stock: 55, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_4', sup: 'sup_2', shopId: 'shp_3', name: 'Kasturi Methi Sun-Dried Fenugreek Leaves 100g', sku: 'LGS-SPC-MET', cat: 'Grocery', unit: 'box', price: 5500, cost: 4100, tax: 5.0, inc: 1, min: 10, stock: 32, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_5', sup: 'sup_2', shopId: 'shp_3', name: 'Badi Elaichi (Black Cardamom Large) 100g', sku: 'LGS-SPC-ELA', cat: 'Grocery', unit: 'pack', price: 18500, cost: 14800, tax: 5.0, inc: 1, min: 8, stock: 20, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_6', sup: 'sup_2', shopId: 'shp_3', name: 'Chandni Chowk Chana Masala Blend 100g', sku: 'LGS-SPC-CHN', cat: 'Grocery', unit: 'pack', price: 6800, cost: 5200, tax: 5.0, inc: 1, min: 12, stock: 48, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_7', sup: 'sup_2', shopId: 'shp_3', name: 'Wada Kolam Traditional Rice 5kg', sku: 'LGS-RIC-KOL', cat: 'Grocery', unit: 'pack', price: 39500, cost: 33000, tax: 5.0, inc: 1, min: 10, stock: 40, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_8', sup: 'sup_2', shopId: 'shp_3', name: 'Moong Dal Dhuli (Yellow Split) 1kg', sku: 'LGS-DAL-MNG', cat: 'Grocery', unit: 'kg', price: 14500, cost: 12000, tax: 0.0, inc: 1, min: 15, stock: 52, img: 'https://images.unsplash.com/photo-1585994192701-f1a505c8574a?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_9', sup: 'sup_2', shopId: 'shp_3', name: 'Kashmiri Rajma Chitra (Kidney Beans) 1kg', sku: 'LGS-DAL-RAJ', cat: 'Grocery', unit: 'kg', price: 17500, cost: 14200, tax: 0.0, inc: 1, min: 15, stock: 38, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_10', sup: 'sup_2', shopId: 'shp_3', name: 'Pure Til (Sesame Gingelly) Oil 500ml', sku: 'LGS-OIL-TIL', cat: 'Grocery', unit: 'bottle', price: 19000, cost: 15800, tax: 5.0, inc: 1, min: 10, stock: 26, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_11', sup: 'sup_1', shopId: 'shp_3', name: 'Assam CTC Masala Chai Strong Leaf Tea 500g', sku: 'LGS-TEA-ASM', cat: 'Beverages', unit: 'pack', price: 27500, cost: 22500, tax: 5.0, inc: 1, min: 12, stock: 45, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_12', sup: 'sup_1', shopId: 'shp_3', name: 'Spicy Ratlami Sev Namkeen 400g', sku: 'LGS-SNK-RAT', cat: 'Snacks', unit: 'pack', price: 12000, cost: 9500, tax: 12.0, inc: 1, min: 15, stock: 50, img: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_13', sup: 'sup_1', shopId: 'shp_3', name: 'Crispy Bikaneri Bhujia 400g', sku: 'LGS-SNK-BIK', cat: 'Snacks', unit: 'pack', price: 11500, cost: 9200, tax: 12.0, inc: 1, min: 15, stock: 48, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_14', sup: 'sup_2', shopId: 'shp_3', name: 'Traditional Mustard Mango Pickle (Aam Achar) 1kg', sku: 'LGS-PCK-AAM', cat: 'Grocery', unit: 'jar', price: 21000, cost: 16500, tax: 12.0, inc: 1, min: 10, stock: 22, img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_15', sup: 'sup_1', shopId: 'shp_3', name: 'Desi Buffalo Milk Danedar Ghee 1L Tin', sku: 'LGS-GHE-BUF', cat: 'Dairy', unit: 'tin', price: 68000, cost: 59000, tax: 12.0, inc: 1, min: 5, stock: 15, img: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_16', sup: 'sup_1', shopId: 'shp_3', name: 'Mysore Sandal Pure Sandalwood Oil Soap 150g', sku: 'LGS-SOP-MYS', cat: 'Personal Care', unit: 'bar', price: 9500, cost: 7600, tax: 18.0, inc: 1, min: 12, stock: 35, img: 'https://images.unsplash.com/photo-1607006314144-8cb389745e31?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_17', sup: 'sup_1', shopId: 'shp_3', name: 'Dabur Red Ayurvedic Toothpaste 200g', sku: 'LGS-PST-RED', cat: 'Personal Care', unit: 'tube', price: 13500, cost: 10800, tax: 18.0, inc: 1, min: 10, stock: 30, img: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_18', sup: 'sup_1', shopId: 'shp_3', name: 'Pitambari Shining Powder for Copper & Brass 200g', sku: 'LGS-CLN-PIT', cat: 'Household', unit: 'pack', price: 5500, cost: 4200, tax: 18.0, inc: 1, min: 15, stock: 40, img: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_19', sup: 'sup_2', shopId: 'shp_3', name: 'Pure Bhimseni Camphor (Kapur Tablets) 100g', sku: 'LGS-POO-KPR', cat: 'Household', unit: 'pack', price: 16000, cost: 12500, tax: 12.0, inc: 1, min: 10, stock: 25, img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s3_20', sup: 'sup_3', shopId: 'shp_3', name: 'Zed Black Premium Agarbatti Incense (Box of 6)', sku: 'LGS-POO-AGR', cat: 'Household', unit: 'box', price: 12000, cost: 9000, tax: 5.0, inc: 1, min: 15, stock: 50, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80' }
  ];

  // Shop 4: Patel Provisions & Dairy (Indirapuram, UP) - 20 Dairy, Morning Bakery & Staples
  const shop4Products = [
    { id: 'prd_s4_1', sup: 'sup_1', shopId: 'shp_4', name: 'Amul Taaza Homogenised Toned Milk 1L Tetra', sku: 'PPD-MLK-TAZ', cat: 'Dairy', unit: 'carton', price: 7400, cost: 6500, tax: 0.0, inc: 1, min: 15, stock: 60, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_2', sup: 'sup_1', shopId: 'shp_4', name: 'Mother Dairy Cow Milk Fresh 1L Pouch', sku: 'PPD-MLK-COW', cat: 'Dairy', unit: 'pouch', price: 5800, cost: 5100, tax: 0.0, inc: 1, min: 20, stock: 45, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_3', sup: 'sup_1', shopId: 'shp_4', name: 'Fresh Malai Paneer 500g Vacuum Pack', sku: 'PPD-PAN-500', cat: 'Dairy', unit: 'pack', price: 21000, cost: 18000, tax: 0.0, inc: 1, min: 10, stock: 32, img: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_4', sup: 'sup_1', shopId: 'shp_4', name: 'Amul Pasteurised Salted Table Butter 500g', sku: 'PPD-BUT-500', cat: 'Dairy', unit: 'pack', price: 27500, cost: 24500, tax: 12.0, inc: 1, min: 10, stock: 28, img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_5', sup: 'sup_1', shopId: 'shp_4', name: 'Amul Masti Dahi Set Curd 400g Tub', sku: 'PPD-CUR-400', cat: 'Dairy', unit: 'tub', price: 3800, cost: 3100, tax: 5.0, inc: 1, min: 15, stock: 36, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_6', sup: 'sup_1', shopId: 'shp_4', name: 'Amul Pure Ghee 1L Tin', sku: 'PPD-GHE-01L', cat: 'Dairy', unit: 'tin', price: 65000, cost: 58000, tax: 12.0, inc: 1, min: 5, stock: 20, img: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_7', sup: 'sup_1', shopId: 'shp_4', name: 'Britannia 100% Whole Wheat Bread 400g', sku: 'PPD-BRD-WHT', cat: 'Snacks', unit: 'pack', price: 5000, cost: 4100, tax: 0.0, inc: 1, min: 12, stock: 30, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_8', sup: 'sup_1', shopId: 'shp_4', name: 'Farm Fresh Brown Eggs (Pack of 6)', sku: 'PPD-EGG-06P', cat: 'Dairy', unit: 'pack', price: 6500, cost: 5200, tax: 0.0, inc: 1, min: 15, stock: 40, img: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_9', sup: 'sup_1', shopId: 'shp_4', name: 'Kellogg’s Real Almond & Honey Corn Flakes 500g', sku: 'PPD-CRN-500', cat: 'Snacks', unit: 'box', price: 29500, cost: 24500, tax: 18.0, inc: 1, min: 8, stock: 18, img: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_10', sup: 'sup_1', shopId: 'shp_4', name: 'Kissan Fresh Tomato Ketchup Bottle 1kg', sku: 'PPD-SAU-01K', cat: 'Grocery', unit: 'bottle', price: 14500, cost: 11800, tax: 12.0, inc: 1, min: 10, stock: 25, img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_11', sup: 'sup_1', shopId: 'shp_4', name: 'Nutella Hazelnut Cocoa Spread Jar 350g', sku: 'PPD-NUT-350', cat: 'Snacks', unit: 'jar', price: 39000, cost: 32500, tax: 18.0, inc: 1, min: 6, stock: 14, img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_12', sup: 'sup_2', shopId: 'shp_4', name: 'Quaker Rolled Wholegrain Oats 1kg', sku: 'PPD-OAT-01K', cat: 'Grocery', unit: 'pouch', price: 19500, cost: 16000, tax: 5.0, inc: 1, min: 10, stock: 28, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_13', sup: 'sup_2', shopId: 'shp_4', name: 'Fortune Sunlite Refined Sunflower Oil 1L', sku: 'PPD-OIL-SUN', cat: 'Grocery', unit: 'pouch', price: 15500, cost: 13200, tax: 5.0, inc: 1, min: 12, stock: 35, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_14', sup: 'sup_2', shopId: 'shp_4', name: 'Aashirvaad Superior MP Sharbati Atta 5kg', sku: 'PPD-ATT-AAS', cat: 'Grocery', unit: 'pack', price: 26000, cost: 22000, tax: 5.0, inc: 1, min: 10, stock: 40, img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_15', sup: 'sup_1', shopId: 'shp_4', name: 'Tata Tea Gold Rich Taste & Aroma 500g', sku: 'PPD-TEA-GLD', cat: 'Beverages', unit: 'pack', price: 31000, cost: 26000, tax: 5.0, inc: 1, min: 10, stock: 32, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_16', sup: 'sup_1', shopId: 'shp_4', name: 'Oreo Original Vanilla Creme Cookies 150g', sku: 'PPD-BIS-ORE', cat: 'Snacks', unit: 'pack', price: 4000, cost: 3200, tax: 18.0, inc: 1, min: 20, stock: 60, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_17', sup: 'sup_1', shopId: 'shp_4', name: 'Britannia Processed Cheese Slices (Pack of 10)', sku: 'PPD-CHS-10P', cat: 'Dairy', unit: 'pack', price: 16500, cost: 13800, tax: 12.0, inc: 1, min: 8, stock: 22, img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_18', sup: 'sup_1', shopId: 'shp_4', name: 'Epigamia Strawberry Greek Yogurt 100g Cup', sku: 'PPD-YOG-STR', cat: 'Dairy', unit: 'cup', price: 5000, cost: 4000, tax: 12.0, inc: 1, min: 12, stock: 26, img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_19', sup: 'sup_1', shopId: 'shp_4', name: 'Lifebuoy Total 10 Antibacterial Handwash 750ml', sku: 'PPD-HW-750', cat: 'Personal Care', unit: 'pouch', price: 12500, cost: 9800, tax: 18.0, inc: 1, min: 10, stock: 24, img: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s4_20', sup: 'sup_1', shopId: 'shp_4', name: 'Scotch-Brite Heavy Duty Kitchen Scrub Sponge (Pack of 3)', sku: 'PPD-SCB-03P', cat: 'Household', unit: 'pack', price: 9500, cost: 7400, tax: 18.0, inc: 1, min: 12, stock: 35, img: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=400&q=80' }
  ];

  // Shop 5: Modern Daily Needs & Stationers (Malviya Nagar, Delhi) - 20 Stationery & Student Supplies
  const shop5Products = [
    { id: 'prd_s5_1', sup: 'sup_3', shopId: 'shp_5', name: 'Classmate Pulse Spiral Notebook 300 Pgs (Pack of 4)', sku: 'MDN-STA-SPL', cat: 'Stationery', unit: 'pack', price: 42000, cost: 34000, tax: 12.0, inc: 1, min: 12, stock: 35, img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_2', sup: 'sup_3', shopId: 'shp_5', name: 'Reynolds 045 Fine Ballpoint Pens Blue/Black (Box of 20)', sku: 'MDN-PEN-REY', cat: 'Stationery', unit: 'box', price: 19000, cost: 14500, tax: 12.0, inc: 1, min: 15, stock: 50, img: 'https://images.unsplash.com/photo-1585336261026-6b2165089f2a?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_3', sup: 'sup_3', shopId: 'shp_5', name: 'Uni-ball Eye Fine Waterproof Roller Pen 0.5mm (Pack of 3)', sku: 'MDN-PEN-UNI', cat: 'Stationery', unit: 'pack', price: 24000, cost: 18500, tax: 18.0, inc: 1, min: 10, stock: 25, img: 'https://images.unsplash.com/photo-1585336261026-6b2165089f2a?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_4', sup: 'sup_3', shopId: 'shp_5', name: 'JK Copier A4 Paper Ream (75 GSM 500 Sheets)', sku: 'MDN-PPR-A4', cat: 'Stationery', unit: 'ream', price: 34000, cost: 28500, tax: 12.0, inc: 1, min: 10, stock: 40, img: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_5', sup: 'sup_3', shopId: 'shp_5', name: 'Faber-Castell Triangular Colour Pencils (24 Shades Set)', sku: 'MDN-CLR-FBR', cat: 'Stationery', unit: 'set', price: 19500, cost: 15000, tax: 12.0, inc: 1, min: 8, stock: 22, img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_6', sup: 'sup_3', shopId: 'shp_5', name: 'Doms Mathematical Drawing Geometry Instrument Box', sku: 'MDN-BOX-GEO', cat: 'Stationery', unit: 'box', price: 12500, cost: 9500, tax: 18.0, inc: 1, min: 10, stock: 30, img: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_7', sup: 'sup_3', shopId: 'shp_5', name: 'Fevicol MR Squeezy Glue Bottle 200g', sku: 'MDN-GLU-200', cat: 'Stationery', unit: 'bottle', price: 7500, cost: 5800, tax: 18.0, inc: 1, min: 15, stock: 45, img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_8', sup: 'sup_3', shopId: 'shp_5', name: 'Camlin Whiteboard Marker Bullet Tip (4 Assorted Colors)', sku: 'MDN-MRK-4CL', cat: 'Stationery', unit: 'pack', price: 14000, cost: 11000, tax: 18.0, inc: 1, min: 10, stock: 32, img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_9', sup: 'sup_3', shopId: 'shp_5', name: 'Kangaro Stapler HD-10D with 1000 Staple Pins', sku: 'MDN-STP-KNG', cat: 'Stationery', unit: 'set', price: 18500, cost: 14500, tax: 18.0, inc: 1, min: 8, stock: 28, img: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_10', sup: 'sup_3', shopId: 'shp_5', name: '3M Post-it Sticky Notes Cube (400 Pastel Sheets)', sku: 'MDN-STK-CUB', cat: 'Stationery', unit: 'cube', price: 21000, cost: 16500, tax: 18.0, inc: 1, min: 8, stock: 20, img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_11', sup: 'sup_3', shopId: 'shp_5', name: 'Cello Gripper Ballpoint Pens 0.7mm (Pack of 10)', sku: 'MDN-PEN-CEL', cat: 'Stationery', unit: 'pack', price: 10000, cost: 7500, tax: 12.0, inc: 1, min: 15, stock: 45, img: 'https://images.unsplash.com/photo-1585336261026-6b2165089f2a?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_12', sup: 'sup_1', shopId: 'shp_5', name: 'Nescafe Classic Instant Coffee Jar 100g', sku: 'MDN-COF-NES', cat: 'Beverages', unit: 'jar', price: 34000, cost: 28500, tax: 18.0, inc: 1, min: 8, stock: 24, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_13', sup: 'sup_1', shopId: 'shp_5', name: 'Red Bull Energy Drink 250ml Can', sku: 'MDN-BEV-RBL', cat: 'Beverages', unit: 'can', price: 12500, cost: 10000, tax: 28.0, inc: 1, min: 12, stock: 30, img: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_14', sup: 'sup_1', shopId: 'shp_5', name: 'Maggi 2-Minute Masala Instant Noodles (Pack of 12)', sku: 'MDN-MAG-12P', cat: 'Snacks', unit: 'pack', price: 16800, cost: 13800, tax: 18.0, inc: 1, min: 10, stock: 40, img: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_15', sup: 'sup_1', shopId: 'shp_5', name: 'Doritos Cheese Supreme Nacho Tortilla Chips 150g', sku: 'MDN-CHP-DOR', cat: 'Snacks', unit: 'pack', price: 9000, cost: 7200, tax: 18.0, inc: 1, min: 12, stock: 35, img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_16', sup: 'sup_1', shopId: 'shp_5', name: 'Cadbury Bournville Rich Cocoa 70% Dark Chocolate 80g', sku: 'MDN-CHK-BRN', cat: 'Snacks', unit: 'bar', price: 11000, cost: 8800, tax: 18.0, inc: 1, min: 10, stock: 26, img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_17', sup: 'sup_1', shopId: 'shp_5', name: 'Head & Shoulders Cool Menthol Anti-Dandruff Shampoo 340ml', sku: 'MDN-SHM-340', cat: 'Personal Care', unit: 'bottle', price: 36000, cost: 29500, tax: 18.0, inc: 1, min: 8, stock: 18, img: 'https://images.unsplash.com/photo-1607006314144-8cb389745e31?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_18', sup: 'sup_1', shopId: 'shp_5', name: 'Dettol Disinfectant Multi-Surface Sanitizer Spray 500ml', sku: 'MDN-DET-SPR', cat: 'Household', unit: 'bottle', price: 21500, cost: 17500, tax: 18.0, inc: 1, min: 10, stock: 22, img: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_19', sup: 'sup_1', shopId: 'shp_5', name: 'Colin Glass & Household Surface Cleaner 500ml Spray', sku: 'MDN-CLN-COL', cat: 'Household', unit: 'bottle', price: 10500, cost: 8400, tax: 18.0, inc: 1, min: 12, stock: 25, img: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=400&q=80' },
    { id: 'prd_s5_20', sup: 'sup_3', shopId: 'shp_5', name: 'Duracell Ultra Alkaline AA Batteries (Pack of 4)', sku: 'MDN-BAT-DUR', cat: 'Household', unit: 'pack', price: 16000, cost: 12800, tax: 18.0, inc: 1, min: 10, stock: 30, img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80' }
  ];

  const allProducts = [
    ...shop1Products,
    ...shop2Products,
    ...shop3Products,
    ...shop4Products,
    ...shop5Products,
  ];

  for (const p of allProducts) {
    await execute(
      `INSERT INTO products (
        id, supplier_id, shop_id, name, sku, category, unit,
        price_paise, cost_price_paise, tax_rate_percent, price_includes_tax,
        stock, min_stock_alert, active, image_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        p.id, p.sup, p.shopId, p.name, p.sku, p.cat, p.unit,
        p.price, p.cost, p.tax, p.inc,
        p.stock, p.min, p.img, dateIso(25)
      ]
    );

    // Initial stock movement
    await execute(
      `INSERT INTO inventory_movements (
        id, shop_id, product_id, movement_type, quantity_delta, reference_type, reference_id, reason, actor_id, created_at
      ) VALUES (?, ?, ?, 'INITIAL_STOCK', ?, 'SYSTEM_INIT', 'INIT_SEED', 'Initial opening inventory seed', 'usr_admin', ?)`,
      [`mov_init_${p.id}`, p.shopId, p.id, p.stock, dateIso(25)]
    );
  }

  // 6. Seed Purchases from Suppliers across ALL 5 Shops
  const purchaseScenarios = [
    // Purchases by Shop 1 (Sharma Kirana, Delhi)
    {
      id: 'pur_shp1_1',
      shop: shops[0],
      sup: suppliers[0], // Apex FMCG (Maharashtra -> Delhi = INTER_STATE)
      inv: 'APX/2026/0891',
      date: dateIso(22),
      supplyType: 'INTER_STATE',
      lines: [
        { product: shop1Products[8], qty: 30 }, // Tea
        { product: shop1Products[9], qty: 25 }, // Coffee
        { product: shop1Products[13], qty: 40 }, // Dettol Soap
      ]
    },
    {
      id: 'pur_shp1_2',
      shop: shops[0],
      sup: suppliers[1], // Heritage Agro (Punjab -> Delhi = INTER_STATE)
      inv: 'HAC/DL/4412',
      date: dateIso(15),
      supplyType: 'INTER_STATE',
      lines: [
        { product: shop1Products[0], qty: 60 }, // Atta
        { product: shop1Products[1], qty: 50 }, // Rice
        { product: shop1Products[2], qty: 45 }, // Toor Dal
      ]
    },
    {
      id: 'pur_shp1_3',
      shop: shops[0],
      sup: suppliers[2], // Bharat Stationery (Delhi -> Delhi = INTRA_STATE)
      inv: 'BOS/INV-902',
      date: dateIso(7),
      supplyType: 'INTRA_STATE',
      lines: [
        { product: shop1Products[20], qty: 40 }, // Notebooks
        { product: shop1Products[21], qty: 70 }, // Pens
        { product: shop1Products[22], qty: 20 }, // JK Paper
      ]
    },

    // Purchases by Shop 2 (Krishna Supermart, UP)
    {
      id: 'pur_shp2_1',
      shop: shops[1],
      sup: suppliers[1], // Heritage Agro (Punjab -> UP = INTER_STATE)
      inv: 'HAC/UP/5501',
      date: dateIso(20),
      supplyType: 'INTER_STATE',
      lines: [
        { product: shop2Products[0], qty: 100 }, // Atta
        { product: shop2Products[1], qty: 80 }, // Rice
        { product: shop2Products[4], qty: 100 }, // Salt
        { product: shop2Products[5], qty: 50 }, // Coriander
      ]
    },
    {
      id: 'pur_shp2_2',
      shop: shops[1],
      sup: suppliers[0], // Apex FMCG (Maharashtra -> UP = INTER_STATE)
      inv: 'APX/UP/1042',
      date: dateIso(11),
      supplyType: 'INTER_STATE',
      lines: [
        { product: shop2Products[12], qty: 30 }, // Ghee
        { product: shop2Products[16], qty: 45 }, // Plant-Based Detergent
        { product: shop2Products[11], qty: 60 }, // Makhana
      ]
    },

    // Purchases by Shop 3 (Lakshmi General Store, Delhi)
    {
      id: 'pur_shp3_1',
      shop: shops[2],
      sup: suppliers[1], // Heritage Agro
      inv: 'HAC/DL/4990',
      date: dateIso(18),
      supplyType: 'INTER_STATE',
      lines: [
        { product: shop3Products[9], qty: 50 }, // Sesame Oil
        { product: shop3Products[7], qty: 60 }, // Moong Dal
        { product: shop3Products[1], qty: 40 }, // Garam Masala
        { product: shop3Products[2], qty: 50 }, // Jeera
      ]
    },
    {
      id: 'pur_shp3_2',
      shop: shops[2],
      sup: suppliers[0], // Apex FMCG
      inv: 'APX/DL/2198',
      date: dateIso(9),
      supplyType: 'INTER_STATE',
      lines: [
        { product: shop3Products[10], qty: 150 }, // Masala Chai
        { product: shop3Products[11], qty: 80 }, // Ratlami Sev
        { product: shop3Products[17], qty: 50 }, // Shining Powder
      ]
    },

    // Purchases by Shop 4 (Patel Provisions, UP)
    {
      id: 'pur_shp4_1',
      shop: shops[3],
      sup: suppliers[0], // Apex FMCG
      inv: 'APX/GZB/312',
      date: dateIso(16),
      supplyType: 'INTER_STATE',
      lines: [
        { product: shop4Products[14], qty: 50 }, // Tata Tea Gold
        { product: shop4Products[18], qty: 60 }, // Handwash
        { product: shop4Products[5], qty: 50 }, // Ghee
        { product: shop4Products[19], qty: 35 }, // Scrubber
      ]
    },
    {
      id: 'pur_shp4_2',
      shop: shops[3],
      sup: suppliers[1], // Heritage Agro
      inv: 'HAC/UP/772',
      date: dateIso(8),
      supplyType: 'INTER_STATE',
      lines: [
        { product: shop4Products[11], qty: 60 }, // Oats
        { product: shop4Products[12], qty: 40 }, // Sunflower Oil
        { product: shop4Products[13], qty: 30 }, // Atta
      ]
    },

    // Purchases by Shop 5 (Modern Daily Needs, Delhi)
    {
      id: 'pur_shp5_1',
      shop: shops[4],
      sup: suppliers[2], // Bharat Stationery (Delhi -> Delhi = INTRA_STATE)
      inv: 'BOS/DL/981',
      date: dateIso(21),
      supplyType: 'INTRA_STATE',
      lines: [
        { product: shop5Products[0], qty: 80 }, // Spiral Notebooks
        { product: shop5Products[1], qty: 120 }, // Reynolds Pens
        { product: shop5Products[3], qty: 25 }, // A4 Paper
        { product: shop5Products[8], qty: 20 }, // Staplers
      ]
    },
    {
      id: 'pur_shp5_2',
      shop: shops[4],
      sup: suppliers[0], // Apex FMCG
      inv: 'APX/DL/4005',
      date: dateIso(12),
      supplyType: 'INTER_STATE',
      lines: [
        { product: shop5Products[11], qty: 40 }, // Nescafe Coffee
        { product: shop5Products[12], qty: 60 }, // Red Bull
        { product: shop5Products[15], qty: 50 }, // Dark Chocolate
      ]
    }
  ];

  for (const pur of purchaseScenarios) {
    let subtotalPaise = 0;
    let cgstPaise = 0;
    let sgstPaise = 0;
    let igstPaise = 0;
    let totalTaxPaise = 0;
    let grandTotalPaise = 0;

    const calculatedLines = pur.lines.map((l, idx) => {
      const taxRes = calculateLineTax({
        quantity: l.qty,
        unitPricePaise: l.product.cost,
        taxRatePercent: l.product.tax,
        priceIncludesTax: false,
        supplyType: pur.supplyType as any,
      });

      subtotalPaise += taxRes.taxableAmountPaise;
      cgstPaise += taxRes.cgstPaise;
      sgstPaise += taxRes.sgstPaise;
      igstPaise += taxRes.igstPaise;
      totalTaxPaise += taxRes.totalTaxPaise;
      grandTotalPaise += taxRes.totalPaise;

      return {
        id: `pline_${pur.id}_${idx}`,
        productId: l.product.id,
        productName: l.product.name,
        qty: l.qty,
        unitCost: l.product.cost,
        taxRate: l.product.tax,
        taxRes
      };
    });

    await execute(
      `INSERT INTO purchases (
        id, shop_id, supplier_id, invoice_no, date, status, supply_type,
        taxable_subtotal_paise, cgst_paise, sgst_paise, igst_paise, total_tax_paise, total_paise,
        itc_status, itc_notes, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, 'RECEIVED', ?, ?, ?, ?, ?, ?, ?, 'Needs review', 'Requires 2B match against supplier filing (Sample)', 'Inward stock purchase', ?)`,
      [
        pur.id, pur.shop.id, pur.sup.id, pur.inv, pur.date, pur.supplyType,
        subtotalPaise, cgstPaise, sgstPaise, igstPaise, totalTaxPaise, grandTotalPaise, pur.date
      ]
    );

    for (const cl of calculatedLines) {
      await execute(
        `INSERT INTO purchase_lines (
          id, purchase_id, product_id, product_name, quantity, unit_price_paise,
          tax_rate_percent, taxable_amount_paise, cgst_paise, sgst_paise, igst_paise, total_paise
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cl.id, pur.id, cl.productId, cl.productName, cl.qty, cl.unitCost,
          cl.taxRate, cl.taxRes.taxableAmountPaise, cl.taxRes.cgstPaise, cl.taxRes.sgstPaise, cl.taxRes.igstPaise, cl.taxRes.totalPaise
        ]
      );

      // Ledger movement
      await execute(
        `INSERT INTO inventory_movements (
          id, shop_id, product_id, movement_type, quantity_delta, reference_type, reference_id, reason, actor_id, created_at
        ) VALUES (?, ?, ?, 'PURCHASE_RECEIPT', ?, 'PURCHASE_ORDER', ?, 'Inward stock received from supplier', ?, ?)`,
        [`mov_${cl.id}`, pur.shop.id, cl.productId, cl.qty, pur.inv, pur.shop.ownerUserId, pur.date]
      );
    }
  }

  // 7. Seed Operating Expenses across ALL 5 Shops
  const shopExpenses = [
    // Shop 1 (Sharma Kirana)
    { id: 'exp_1_1', shopId: 'shp_1', date: dateIso(24), cat: 'RENT', desc: 'Shop monthly lease Lajpat Nagar market', amount: 3500000, note: 'Commercial shop lease under exemption' },
    { id: 'exp_1_2', shopId: 'shp_1', date: dateIso(17), cat: 'UTILITIES', desc: 'BSES Electricity Bill for lighting & deep freezer', amount: 840000, note: 'Power utility tariff' },
    { id: 'exp_1_3', shopId: 'shp_1', date: dateIso(10), cat: 'STAFF', desc: 'Shop helper wages and delivery boy salary', amount: 1600000, note: 'Salaries outside GST scope' },
    { id: 'exp_1_4', shopId: 'shp_1', date: dateIso(4), cat: 'PACKAGING', desc: 'Biodegradable carry bags and brown grocery sacks', amount: 320000, note: '18% GST packaging purchase' },

    // Shop 2 (Krishna Supermart)
    { id: 'exp_2_1', shopId: 'shp_2', date: dateIso(25), cat: 'RENT', desc: 'Commercial complex showroom rent Sector 18 Noida', amount: 4800000, note: 'Commercial lease agreement' },
    { id: 'exp_2_2', shopId: 'shp_2', date: dateIso(18), cat: 'UTILITIES', desc: 'NPCL Power Bill for air conditioning & chiller display', amount: 1250000, note: 'Commercial electricity tariff' },
    { id: 'exp_2_3', shopId: 'shp_2', date: dateIso(9), cat: 'STAFF', desc: 'Store cashiers and shelf stockers salaries', amount: 2400000, note: 'Monthly payroll' },
    { id: 'exp_2_4', shopId: 'shp_2', date: dateIso(3), cat: 'MAINTENANCE', desc: 'Deep freezer servicing & compressor maintenance', amount: 450000, note: 'Equipment maintenance charges' },

    // Shop 3 (Lakshmi General Store)
    { id: 'exp_3_1', shopId: 'shp_3', date: dateIso(23), cat: 'RENT', desc: 'Chandni Chowk spice market shop rent', amount: 2800000, note: 'Traditional bazaar tenancy' },
    { id: 'exp_3_2', shopId: 'shp_3', date: dateIso(14), cat: 'UTILITIES', desc: 'Electricity and market maintenance levy', amount: 620000, note: 'Power supply bill' },
    { id: 'exp_3_3', shopId: 'shp_3', date: dateIso(6), cat: 'LOGISTICS', desc: 'Auto-rickshaw cartage from wholesale mandi', amount: 380000, note: 'Inward local cartage' },

    // Shop 4 (Patel Provisions)
    { id: 'exp_4_1', shopId: 'shp_4', date: dateIso(22), cat: 'RENT', desc: 'Indirapuram residential society market store rent', amount: 3200000, note: 'Society retail booth rental' },
    { id: 'exp_4_2', shopId: 'shp_4', date: dateIso(13), cat: 'UTILITIES', desc: 'UPPCL power bill for milk chillers and refrigeration', amount: 790000, note: 'Power utility tariff' },
    { id: 'exp_4_3', shopId: 'shp_4', date: dateIso(5), cat: 'PACKAGING', desc: 'Milk pouches crates and sealing tapes', amount: 210000, note: 'Dairy packing supplies' },

    // Shop 5 (Modern Daily Needs)
    { id: 'exp_5_1', shopId: 'shp_5', date: dateIso(21), cat: 'RENT', desc: 'Malviya Nagar shopping centre premises rent', amount: 4000000, note: 'Market complex lease' },
    { id: 'exp_5_2', shopId: 'shp_5', date: dateIso(12), cat: 'UTILITIES', desc: 'BSES Rajdhani commercial power bill', amount: 910000, note: 'Commercial power tariff' },
    { id: 'exp_5_3', shopId: 'shp_5', date: dateIso(4), cat: 'STAFF', desc: 'Stationery shop assistant wages', amount: 1400000, note: 'Payroll expenses' },
  ];

  for (const exp of shopExpenses) {
    await execute(
      `INSERT INTO expenses (id, shop_id, date, category, description, amount_paise, tax_treatment_note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [exp.id, exp.shopId, exp.date, exp.cat, exp.desc, exp.amount, exp.note, exp.date]
    );
  }

  // 8. Seed Consumer Orders across ALL 5 Shops
  const orderScenarios = [
    // --- Shop 1: Sharma Kirana Orders ---
    {
      id: 'ord_s1_1',
      ordNum: 'SRI-2026-101101',
      cust: users[8], // Aarav Mehta
      phone: '+91 98200 44551',
      addr: 'Flat 402, Lotus Greens, Lajpat Nagar III, New Delhi',
      shop: shops[0],
      status: 'COMPLETED',
      payment: 'SIMULATED_PAID',
      supplyType: 'INTRA_STATE',
      fulfillment: 'DELIVERY',
      date: dateIso(8),
      items: [
        { product: shop1Products[0], qty: 1 }, // Atta
        { product: shop1Products[1], qty: 1 }, // Rice
        { product: shop1Products[10], qty: 4 }, // Biscuits
      ]
    },
    {
      id: 'ord_s1_2',
      ordNum: 'SRI-2026-101102',
      cust: users[9], // Priya Iyer
      phone: '+91 98200 55662',
      addr: 'House 12, Defence Colony, New Delhi',
      shop: shops[0],
      status: 'COMPLETED',
      payment: 'SIMULATED_PAID',
      supplyType: 'INTRA_STATE',
      fulfillment: 'DELIVERY',
      date: dateIso(6),
      items: [
        { product: shop1Products[12], qty: 1 }, // Ghee
        { product: shop1Products[13], qty: 2 }, // Dettol Soap
        { product: shop1Products[15], qty: 1 }, // Surf Excel
      ]
    },
    {
      id: 'ord_s1_3',
      ordNum: 'SRI-2026-101103',
      cust: users[10], // Rohit Verma
      phone: '+91 98200 66773',
      addr: 'Store Pickup Counter',
      shop: shops[0],
      status: 'ACCEPTED',
      payment: 'PAY_ON_PICKUP',
      supplyType: 'INTRA_STATE',
      fulfillment: 'PICKUP',
      date: dateIso(3),
      items: [
        { product: shop1Products[20], qty: 2 }, // Notebooks
        { product: shop1Products[21], qty: 1 }, // Pens
      ]
    },
    {
      id: 'ord_s1_4',
      ordNum: 'SRI-2026-101104',
      cust: users[11], // Ananya Gupta
      phone: '+91 98200 77884',
      addr: 'B-88, South Extension Part 1, New Delhi',
      shop: shops[0],
      status: 'PLACED',
      payment: 'PENDING',
      supplyType: 'INTRA_STATE',
      fulfillment: 'DELIVERY',
      date: dateIso(1),
      items: [
        { product: shop1Products[9], qty: 1 }, // Coffee
        { product: shop1Products[19], qty: 2 }, // Silk
      ]
    },
    {
      id: 'ord_s1_5',
      ordNum: 'SRI-2026-101105',
      cust: users[12], // Vikram Singh
      phone: '+91 98200 88995',
      addr: 'Store Pickup Counter',
      shop: shops[0],
      status: 'CANCELLED',
      payment: 'PENDING',
      supplyType: 'INTRA_STATE',
      fulfillment: 'PICKUP',
      date: dateIso(4),
      items: [
        { product: shop1Products[4], qty: 2 }, // Salt
      ]
    },

    // --- Shop 2: Krishna Supermart Orders ---
    {
      id: 'ord_s2_1',
      ordNum: 'SRI-2026-202201',
      cust: users[13], // Sneha Patel
      phone: '+91 98200 99006',
      addr: 'Tower 4, Express Greens, Sector 18, Noida',
      shop: shops[1],
      status: 'COMPLETED',
      payment: 'SIMULATED_PAID',
      supplyType: 'INTRA_STATE', // UP to UP
      fulfillment: 'DELIVERY',
      date: dateIso(7),
      items: [
        { product: shop2Products[0], qty: 2 }, // Atta
        { product: shop2Products[3], qty: 2 }, // Mustard Oil
        { product: shop2Products[12], qty: 1 }, // Ghee
      ]
    },
    {
      id: 'ord_s2_2',
      ordNum: 'SRI-2026-202202',
      cust: users[14], // Kavita Das
      phone: '+91 98200 11007',
      addr: 'House 82, Sector 15A, Noida',
      shop: shops[1],
      status: 'COMPLETED',
      payment: 'SIMULATED_PAID',
      supplyType: 'INTRA_STATE',
      fulfillment: 'DELIVERY',
      date: dateIso(5),
      items: [
        { product: shop2Products[1], qty: 1 }, // Rice
        { product: shop2Products[16], qty: 2 }, // Plant-Based Detergent
        { product: shop2Products[17], qty: 2 }, // Kitchen Cleaner
      ]
    },
    {
      id: 'ord_s2_3',
      ordNum: 'SRI-2026-202203',
      cust: users[15], // Amitabh Sen
      phone: '+91 98200 22008',
      addr: 'Store Pickup',
      shop: shops[1],
      status: 'READY',
      payment: 'PAY_ON_PICKUP',
      supplyType: 'INTRA_STATE',
      fulfillment: 'PICKUP',
      date: dateIso(2),
      items: [
        { product: shop2Products[8], qty: 2 }, // Tulsi Green Tea
        { product: shop2Products[11], qty: 3 }, // Makhana
      ]
    },

    // --- Shop 3: Lakshmi General Store Orders ---
    {
      id: 'ord_s3_1',
      ordNum: 'SRI-2026-303301',
      cust: users[10], // Rohit Verma
      phone: '+91 98200 66773',
      addr: '45, Daryaganj, Old Delhi',
      shop: shops[2],
      status: 'COMPLETED',
      payment: 'SIMULATED_PAID',
      supplyType: 'INTRA_STATE',
      fulfillment: 'DELIVERY',
      date: dateIso(9),
      items: [
        { product: shop3Products[7], qty: 2 }, // Moong Dal
        { product: shop3Products[2], qty: 3 }, // Jeera
        { product: shop3Products[1], qty: 2 }, // Garam Masala
      ]
    },
    {
      id: 'ord_s3_2',
      ordNum: 'SRI-2026-303302',
      cust: users[8], // Aarav Mehta
      phone: '+91 98200 44551',
      addr: 'Counter Store Pickup',
      shop: shops[2],
      status: 'COMPLETED',
      payment: 'PAY_ON_PICKUP',
      supplyType: 'INTRA_STATE',
      fulfillment: 'PICKUP',
      date: dateIso(4),
      items: [
        { product: shop3Products[11], qty: 4 }, // Ratlami Sev
        { product: shop3Products[12], qty: 2 }, // Bikaneri Bhujia
      ]
    },

    // --- Shop 4: Patel Provisions Orders ---
    {
      id: 'ord_s4_1',
      ordNum: 'SRI-2026-404401',
      cust: users[13], // Sneha Patel
      phone: '+91 98200 99006',
      addr: 'Flat 1102, Shipra Riviera, Indirapuram, Ghaziabad',
      shop: shops[3],
      status: 'COMPLETED',
      payment: 'SIMULATED_PAID',
      supplyType: 'INTRA_STATE',
      fulfillment: 'DELIVERY',
      date: dateIso(6),
      items: [
        { product: shop4Products[0], qty: 2 }, // Amul Taaza Milk
        { product: shop4Products[2], qty: 1 }, // Malai Paneer
        { product: shop4Products[3], qty: 1 }, // Table Butter
      ]
    },
    {
      id: 'ord_s4_2',
      ordNum: 'SRI-2026-404402',
      cust: users[14], // Kavita Das
      phone: '+91 98200 11007',
      addr: 'Store Pickup',
      shop: shops[3],
      status: 'ACCEPTED',
      payment: 'PAY_ON_PICKUP',
      supplyType: 'INTRA_STATE',
      fulfillment: 'PICKUP',
      date: dateIso(2),
      items: [
        { product: shop4Products[6], qty: 2 }, // Brown Bread
        { product: shop4Products[7], qty: 2 }, // Brown Eggs
      ]
    },

    // --- Shop 5: Modern Daily Needs Orders ---
    {
      id: 'ord_s5_1',
      ordNum: 'SRI-2026-505501',
      cust: users[11], // Ananya Gupta
      phone: '+91 98200 77884',
      addr: 'Pocket A, Malviya Nagar, New Delhi',
      shop: shops[4],
      status: 'COMPLETED',
      payment: 'SIMULATED_PAID',
      supplyType: 'INTRA_STATE',
      fulfillment: 'DELIVERY',
      date: dateIso(8),
      items: [
        { product: shop5Products[0], qty: 3 }, // Spiral Notebooks
        { product: shop5Products[1], qty: 2 }, // Reynolds Pens
        { product: shop5Products[3], qty: 1 }, // A4 Paper
      ]
    },
    {
      id: 'ord_s5_2',
      ordNum: 'SRI-2026-505502',
      cust: users[9], // Priya Iyer
      phone: '+91 98200 55662',
      addr: 'Store Pickup',
      shop: shops[4],
      status: 'COMPLETED',
      payment: 'SIMULATED_PAID',
      supplyType: 'INTRA_STATE',
      fulfillment: 'PICKUP',
      date: dateIso(3),
      items: [
        { product: shop5Products[11], qty: 1 }, // Nescafe Coffee
        { product: shop5Products[12], qty: 2 }, // Red Bull
        { product: shop5Products[7], qty: 1 }, // Whiteboard Markers
      ]
    }
  ];

  for (const ord of orderScenarios) {
    let subtotalPaise = 0;
    let cgstPaise = 0;
    let sgstPaise = 0;
    let igstPaise = 0;
    let totalTaxPaise = 0;
    let grandTotalPaise = 0;

    const calculatedLines = ord.items.map((it, idx) => {
      const taxRes = calculateLineTax({
        quantity: it.qty,
        unitPricePaise: it.product.price,
        taxRatePercent: it.product.tax,
        priceIncludesTax: Boolean(it.product.inc),
        supplyType: ord.supplyType as any,
      });

      subtotalPaise += taxRes.taxableAmountPaise;
      cgstPaise += taxRes.cgstPaise;
      sgstPaise += taxRes.sgstPaise;
      igstPaise += taxRes.igstPaise;
      totalTaxPaise += taxRes.totalTaxPaise;
      grandTotalPaise += taxRes.totalPaise;

      return {
        id: `oline_${ord.id}_${idx}`,
        productId: it.product.id,
        productName: it.product.name,
        sku: it.product.sku,
        unit: it.product.unit,
        quantity: it.qty,
        unitPrice: it.product.price,
        costPrice: it.product.cost,
        taxRate: it.product.tax,
        taxRes
      };
    });

    await execute(
      `INSERT INTO orders (
        id, order_number, customer_id, shop_id, status, date, payment_status, supply_type,
        fulfillment_type, customer_name, customer_phone, delivery_address,
        taxable_subtotal_paise, cgst_paise, sgst_paise, igst_paise, total_tax_paise, total_paise,
        notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ord.id, ord.ordNum, ord.cust.id, ord.shop.id, ord.status, ord.date,
        ord.payment, ord.supplyType, ord.fulfillment, ord.cust.name,
        ord.phone, ord.addr, subtotalPaise, cgstPaise, sgstPaise,
        igstPaise, totalTaxPaise, grandTotalPaise, 'Demonstration customer order', ord.date
      ]
    );

    for (const cl of calculatedLines) {
      await execute(
        `INSERT INTO order_lines (
          id, order_id, product_id, product_name, sku, unit, quantity,
          unit_price_paise, cost_price_paise, tax_rate_percent, price_includes_tax,
          taxable_amount_paise, cgst_paise, sgst_paise, igst_paise, total_paise
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        [
          cl.id, ord.id, cl.productId, cl.productName, cl.sku, cl.unit, cl.quantity,
          cl.unitPrice, cl.costPrice, cl.taxRate, cl.taxRes.taxableAmountPaise,
          cl.taxRes.cgstPaise, cl.taxRes.sgstPaise, cl.taxRes.igstPaise, cl.taxRes.totalPaise
        ]
      );
    }

    // Generate Invoice preview record for each order
    const sellerSnapshot = JSON.stringify({
      shopName: ord.shop.name,
      address: ord.shop.address,
      state: ord.shop.state,
      demoGstin: ord.shop.demoGstin,
      phone: ord.shop.contact
    });
    const buyerSnapshot = JSON.stringify({
      name: ord.cust.name,
      phone: ord.phone,
      address: ord.addr
    });
    const linesSnapshot = JSON.stringify(calculatedLines);

    await execute(
      `INSERT INTO invoices (
        id, invoice_number, order_id, shop_id, issue_date, seller_snapshot_json,
        buyer_snapshot_json, lines_snapshot_json, taxable_subtotal_paise,
        cgst_paise, sgst_paise, igst_paise, total_tax_paise, total_paise,
        supply_type, status, is_prototype, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ISSUED', 1, ?)`,
      [
        `inv_${ord.id}`, `INV-${ord.ordNum}`, ord.id, ord.shop.id, ord.date,
        sellerSnapshot, buyerSnapshot, linesSnapshot, subtotalPaise,
        cgstPaise, sgstPaise, igstPaise, totalTaxPaise, grandTotalPaise,
        ord.supplyType, ord.date
      ]
    );
  }

  // 9. Seed Rich Platform Audit Events for the Admin Portal
  const auditLogs = [
    { actor: 'usr_admin', role: 'admin', entity: 'SYSTEM', id: 'SRI_CORE', act: 'SYSTEM_BOOT', reason: 'Platform runtime started and SQLite database connected', days: 28 },
    { actor: 'usr_admin', role: 'admin', entity: 'TAX_CONFIG', id: 'GST_2026', act: 'TAX_RATES_CONFIGURED', reason: 'Initialized demo GST rate brackets: 0%, 5%, 12%, 18%, 28%', days: 28 },
    { actor: 'usr_sup_1', role: 'supplier', entity: 'CATALOGUE', id: 'sup_1', act: 'PRODUCTS_UPLOADED', reason: 'Apex FMCG Distributors published 10 FMCG product listings', days: 26 },
    { actor: 'usr_sup_2', role: 'supplier', entity: 'CATALOGUE', id: 'sup_2', act: 'PRODUCTS_UPLOADED', reason: 'Heritage Agro Commodities published 8 staple agri products', days: 26 },
    { actor: 'usr_sup_3', role: 'supplier', entity: 'CATALOGUE', id: 'sup_3', act: 'PRODUCTS_UPLOADED', reason: 'Bharat Office published 8 office stationery wholesale listings', days: 25 },
    { actor: 'usr_admin', role: 'admin', entity: 'SHOP', id: 'shp_1', act: 'KYC_VERIFIED', reason: 'Onboarded Sharma Kirana Store with demo GSTIN 07AAACS1122Q1ZA', days: 25 },
    { actor: 'usr_admin', role: 'admin', entity: 'SHOP', id: 'shp_2', act: 'KYC_VERIFIED', reason: 'Onboarded Krishna Supermart with demo GSTIN 09AAACK3344R1ZB', days: 24 },
    { actor: 'usr_admin', role: 'admin', entity: 'SHOP', id: 'shp_3', act: 'KYC_VERIFIED', reason: 'Onboarded Lakshmi General Store with demo GSTIN 07AAACL5566S1ZC', days: 24 },
    { actor: 'usr_admin', role: 'admin', entity: 'SHOP', id: 'shp_4', act: 'KYC_VERIFIED', reason: 'Onboarded Patel Provisions with demo GSTIN 09AAACP7788T1ZD', days: 23 },
    { actor: 'usr_admin', role: 'admin', entity: 'SHOP', id: 'shp_5', act: 'KYC_VERIFIED', reason: 'Onboarded Modern Daily Needs with demo GSTIN 07AAACM9900U1ZE', days: 23 },
    { actor: 'usr_ret_1', role: 'retailer', entity: 'PURCHASE', id: 'APX/2026/0891', act: 'STOCK_INTAKE', reason: 'Received wholesale delivery of Tea, Coffee & Soaps; stock updated', days: 22 },
    { actor: 'usr_ret_2', role: 'retailer', entity: 'PURCHASE', id: 'HAC/UP/5501', act: 'STOCK_INTAKE', reason: 'Received Atta, Rice & Mustard Oil bulk shipment; stock ledger credited', days: 20 },
    { actor: 'usr_admin', role: 'admin', entity: 'LEDGER', id: 'AUDIT_CHK', act: 'RECONCILIATION_RUN', reason: 'Automated periodic check for negative inventory and order atomicity passed', days: 15 },
    { actor: 'usr_ret_1', role: 'retailer', entity: 'EXPENSE', id: 'exp_1_1', act: 'EXPENSE_RECORDED', reason: 'Sharma Kirana recorded monthly shop rent of ₹35,000.00', days: 12 },
    { actor: 'usr_sup_1', role: 'supplier', entity: 'ORDER', id: 'APX/UP/1042', act: 'FULFILLMENT_COMPLETED', reason: 'Dispatched wholesale shipment to Krishna Supermart via regional logistics', days: 10 },
    { actor: 'usr_ret_1', role: 'retailer', entity: 'GST_SUMMARY', id: 'shp_1', act: 'ITC_REVIEW_FLAGGED', reason: 'Calculated potential input tax credit; flagged with Needs Review notice', days: 7 },
    { actor: 'usr_con_1', role: 'consumer', entity: 'ORDER', id: 'SRI-2026-101101', act: 'ORDER_PLACED', reason: 'Simulated customer checkout with atomic stock reservation', days: 5 },
    { actor: 'usr_admin', role: 'admin', entity: 'SECURITY', id: 'ACCESS_POLICY', act: 'PERMISSIONS_AUDIT', reason: 'Cross-shop isolation & role authorization rules verified', days: 2 },
    { actor: 'usr_admin', role: 'admin', entity: 'SYSTEM', id: 'HEALTH_CHECK', act: 'MONITORING_PULSE', reason: 'All 5 stores and 3 supplier nodes reporting healthy heartbeat', days: 0 },
  ];

  for (const log of auditLogs) {
    await execute(
      `INSERT INTO audit_events (
        id, actor_id, actor_role, entity_type, entity_id, action, reason, details_json, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, '{}', ?)`,
      [`audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, log.actor, log.role, log.entity, log.id, log.act, log.reason, dateIso(log.days)]
    );
  }

  saveDb();
  console.log('Database successfully re-seeded with comprehensive multi-shop, multi-supplier, and admin dummy data!');
}

if (require.main === module) {
  seedDatabase().catch(err => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });
}
