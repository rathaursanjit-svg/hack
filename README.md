# Smart Retail India (Prototype MVP)

> **PROTOTYPE DEMONSTRATION NOTICE**:  
> Smart Retail India is a working prototype and conceptual demonstration designed for stakeholder review, testing, and startup pitch presentations.  
> - **No Official GST Filing**: This system does not connect to GSTN (Goods and Services Tax Network) servers, does not file statutory GSTR-1/3B returns, and does not generate official e-invoices or e-way bills.  
> - **Simulated Payments**: No real banking, UPI, or payment gateway transactions are processed. Payments are simulated or marked "Pay on Pickup".  
> - **Fictional Data**: All business names, GSTINs, addresses, products, and prices are fictional seed records.

---

## 1. Quick Start & Execution via Git / Terminal

### Clone Repository via Git
```bash
git clone https://github.com/rathaursanjit-svg/hack.git
cd hack
```

---

### Option A: 1-Click Launchers (Easiest)

- **On Windows (Command Prompt or PowerShell or double-click)**:
  ```cmd
  start.bat
  ```
  *(Or in PowerShell: `.\start.bat`)*

- **On Git Bash / Linux / macOS**:
  ```bash
  chmod +x start.sh
  ./start.sh
  ```

---

### Option B: Standard Terminal Commands (Cross-Platform)

```bash
# 1. Install all dependencies (root, server, and client) and seed database
npm run setup

# 2. Launch both Server (port 5000) and Client (port 5173) together
npm run dev
```

> **Windows PowerShell Note**: If your PowerShell restricts `.ps1` execution scripts, use `npm.cmd` instead:
> ```powershell
> npm.cmd run setup
> npm.cmd run dev
> ```
> Or run `.\start.bat`.

---

### Option C: Run Server and Client in Separate Terminals

**Terminal 1 (Backend Server & SQLite Database):**
```bash
cd server
npm install
npm run seed
npm run dev
```
*Backend runs on `http://localhost:5000`.*

**Terminal 2 (Frontend React + Vite App):**
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 2. Accessing Demo Roles & Personas

The application includes an interactive **Demo Role Switcher** located in the top-right corner of the navigation bar. You can switch between roles with a single click to experience the platform from different perspectives:

| Role | Persona Name | Default Context / Capabilities |
| :--- | :--- | :--- |
| **Consumer** | **Aarav Mehta** (`usr_con_1`) | Browse local Kirana stores, filter catalog, add to cart, choose intra/inter-state supply, place simulated order, view order tracking, and inspect printable demo tax invoice preview. |
| **Shopkeeper / Retailer** | **Sharma Kirana Store** (`usr_ret_1`) | Manage store inventory, inspect live movement ledger, record wholesale purchases (auto-updating stock once), manage orders queue, record operating expenses, review P&L, inspect estimated GST liabilities, and export CSVs. |
| **Supplier / Distributor** | **Apex FMCG Distributors** (`usr_sup_1`) | Maintain own wholesale product listings (CRUD, tax rates, prices, stock levels), toggle availability, and track incoming retail shop purchase orders. |
| **Administrator** | **Rajesh Sharma** (`usr_admin`) | View platform-wide health metrics, inspect immutable system audit log, and perform a confirmed reset of the demo database. |

---

## 3. Core Architectural Highlights

1. **Decimal-Safe Financial Arithmetic**:
   - All financial amounts (unit prices, taxable amounts, CGST, SGST, IGST, totals, expenses, valuations) are calculated and stored internally as **integer paise** (₹1.00 = 100 paise).
   - Eliminates IEEE 754 binary floating-point rounding discrepancies.

2. **GST Calculation Engine**:
   - **Tax-Exclusive Formula**: `Taxable = Quantity × Unit Price`; `Tax = round(Taxable × Rate / 100)`; `Total = Taxable + Tax`.
   - **Tax-Inclusive Formula**: `Total = Quantity × Unit Price`; `Taxable = round(Total / (1 + Rate / 100))`; `Tax = Total − Taxable`.
   - **Intra-State vs Inter-State**: Explicitly configured per transaction. Intra-state splits GST into 50% CGST and 50% SGST without penny drops; Inter-state applies 100% IGST.
   - **Input Tax Credit (ITC)**: Explicitly flagged as **"Needs review"**; purchase tax is not blindly treated as automatic credit without statutory 2B matching.
   - **GST is Not Revenue**: Tax collected is kept strictly separate from sales revenue and business profits.

3. **Central Inventory Movement Ledger**:
   - Stock cannot silently turn negative.
   - Ordering decrements inventory atomically with ledger reference.
   - Order cancellation restores reserved stock exactly once (idempotent).
   - Inward supplier purchase receipts increment stock exactly once upon saving.

4. **Printable Demo Tax Invoice**:
   - Realistic Indian tax invoice preview displaying seller & buyer snapshots, itemized lines, HSN/SKU, tax splits, and clear prototype disclaimers. Supports clean print/PDF generation via browser.

---

## 4. Test Suite & Verification Results

Run the automated test suite from the root or server directory:
```bash
npm test
```

### Tests Performed:
- **`taxService.test.ts`** (7 tests):
  - Tax-exclusive intra-state pricing (CGST + SGST split)
  - Tax-exclusive inter-state pricing (100% IGST)
  - Tax-inclusive retail pricing without rounding errors
  - 0% tax exempt grain/salt calculations
  - Multi-line invoice summary consistency
  - Currency formatting in Indian numbering format (`₹1,250.50`, `₹1,00,000.00`)
  - ITC status review flagging
- **`inventoryOrder.test.ts`** (3 tests):
  - Atomic stock reservation upon order creation
  - Idempotent stock restoration upon order cancellation
  - Overselling prevention when requested quantity exceeds available stock
- **TypeScript Compilation**:
  - `server`: `tsc --noEmit` passed with 0 errors.
  - `client`: `tsc -b && vite build` passed with 0 errors.

---

## 5. Incomplete Features / Pilot Phase Roadmap

The following items are deliberately out of scope for this MVP prototype and will be addressed during subsequent pilot phases:
1. **Live GSTN Integration**: Direct API connections for live GSTR filing, e-Way bills, and e-Invoice generation (requires GST Suvidha Provider / ASP integration).
2. **Production Payment Gateways**: Integration with Razorpay, Cashfree, or Pine Labs after merchant onboarding, escrow accounts, and PCI-DSS compliance.
3. **Official Merchant KYC & Legal Verification**: Verification of real GSTINs against the government master directory.
4. **Native Mobile Applications**: React Native or Flutter apps for iOS/Android (can leverage the existing Node.js REST API).
