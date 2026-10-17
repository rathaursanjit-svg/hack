/**
 * Tax Service for Smart Retail India
 * All currency values are calculated and stored in integer paise (₹ 1.00 = 100 paise)
 * to prevent IEEE 754 binary floating-point rounding issues.
 * 
 * PROTOTYPE DISCLAIMER:
 * These calculations are for prototype demonstration only. Tax rates, classification,
 * and calculations must be verified by a tax professional before actual business use.
 */

export type SupplyType = 'INTRA_STATE' | 'INTER_STATE';

export interface TaxCalculationInput {
  quantity: number;
  unitPricePaise: number;
  taxRatePercent: number; // e.g., 0, 5, 12, 18, 28
  priceIncludesTax: boolean;
  supplyType: SupplyType;
}

export interface LineTaxResult {
  quantity: number;
  unitPricePaise: number;
  taxRatePercent: number;
  priceIncludesTax: boolean;
  supplyType: SupplyType;
  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  totalPaise: number;
}

export interface InvoiceTaxSummary {
  taxableSubtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  totalPaise: number;
  lines: LineTaxResult[];
}

export function calculateLineTax(input: TaxCalculationInput): LineTaxResult {
  const { quantity, unitPricePaise, taxRatePercent, priceIncludesTax, supplyType } = input;

  if (quantity < 0 || unitPricePaise < 0 || taxRatePercent < 0) {
    throw new Error('Quantity, unit price, and tax rate must be non-negative');
  }

  let taxableAmountPaise = 0;
  let totalTaxPaise = 0;
  let totalPaise = 0;

  if (taxRatePercent === 0) {
    taxableAmountPaise = Math.round(quantity * unitPricePaise);
    totalTaxPaise = 0;
    totalPaise = taxableAmountPaise;
  } else if (priceIncludesTax) {
    // Tax inclusive
    // Total gross = quantity * unitPricePaise
    // Taxable = gross / (1 + rate / 100)
    // Tax = gross - Taxable
    totalPaise = Math.round(quantity * unitPricePaise);
    const divisor = 1 + taxRatePercent / 100;
    taxableAmountPaise = Math.round(totalPaise / divisor);
    totalTaxPaise = totalPaise - taxableAmountPaise;
  } else {
    // Tax exclusive
    // Taxable = quantity * unitPricePaise
    // Tax = round(taxable * rate / 100)
    // Total = taxable + tax
    taxableAmountPaise = Math.round(quantity * unitPricePaise);
    totalTaxPaise = Math.round((taxableAmountPaise * taxRatePercent) / 100);
    totalPaise = taxableAmountPaise + totalTaxPaise;
  }

  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  if (supplyType === 'INTRA_STATE') {
    // Split GST equally between CGST and SGST
    cgstPaise = Math.floor(totalTaxPaise / 2);
    sgstPaise = totalTaxPaise - cgstPaise; // Guarantees exact sum without penny drop
    igstPaise = 0;
  } else {
    // Inter-state supply: 100% IGST
    cgstPaise = 0;
    sgstPaise = 0;
    igstPaise = totalTaxPaise;
  }

  return {
    quantity,
    unitPricePaise,
    taxRatePercent,
    priceIncludesTax,
    supplyType,
    taxableAmountPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalTaxPaise,
    totalPaise,
  };
}

export function summarizeInvoiceTaxes(lines: TaxCalculationInput[]): InvoiceTaxSummary {
  const calculatedLines = lines.map(line => calculateLineTax(line));

  let taxableSubtotalPaise = 0;
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;
  let totalTaxPaise = 0;
  let totalPaise = 0;

  for (const line of calculatedLines) {
    taxableSubtotalPaise += line.taxableAmountPaise;
    cgstPaise += line.cgstPaise;
    sgstPaise += line.sgstPaise;
    igstPaise += line.igstPaise;
    totalTaxPaise += line.totalTaxPaise;
    totalPaise += line.totalPaise;
  }

  return {
    taxableSubtotalPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalTaxPaise,
    totalPaise,
    lines: calculatedLines,
  };
}

/**
 * Format paise to Indian Rupee format (e.g., 125000 paise -> "₹1,250.00")
 */
export function formatPaiseToInr(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * ITC (Input Tax Credit) review state validator
 */
export function evaluateItcEligibility(purchase: {
  hasGstin: boolean;
  status: string;
  isCancelled: boolean;
}): { status: 'Needs review' | 'Potentially Eligible' | 'Ineligible'; note: string } {
  if (purchase.isCancelled || purchase.status === 'CANCELLED') {
    return {
      status: 'Ineligible',
      note: 'Transaction was cancelled or voided. No ITC can be claimed.',
    };
  }

  if (!purchase.hasGstin) {
    return {
      status: 'Ineligible',
      note: 'Supplier demo GSTIN is missing or unregistered.',
    };
  }

  // Under prototype rules: All eligible tax needs review and 2B/GSTR reconciliation
  return {
    status: 'Needs review',
    note: 'Sample calculation only. Official GSTR-2B reconciliation and actual tax payment by supplier required.',
  };
}
