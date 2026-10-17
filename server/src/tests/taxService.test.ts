import { describe, it, expect } from 'vitest';
import { calculateLineTax, summarizeInvoiceTaxes, formatPaiseToInr, evaluateItcEligibility } from '../services/taxService';

describe('GST & Decimal-Safe Tax Arithmetic Service', () => {
  it('correctly calculates tax-exclusive pricing for intra-state supply (CGST 50% + SGST 50%)', () => {
    // 2 units of ₹100.00 exclusive of 18% GST
    // Taxable = 2 * 10000 = 20000 paise (₹200.00)
    // Total Tax = 20000 * 18% = 3600 paise (₹36.00)
    // CGST = 1800 paise (₹18.00), SGST = 1800 paise (₹18.00)
    // Grand Total = 23600 paise (₹236.00)
    const result = calculateLineTax({
      quantity: 2,
      unitPricePaise: 10000,
      taxRatePercent: 18.0,
      priceIncludesTax: false,
      supplyType: 'INTRA_STATE',
    });

    expect(result.taxableAmountPaise).toBe(20000);
    expect(result.totalTaxPaise).toBe(3600);
    expect(result.cgstPaise).toBe(1800);
    expect(result.sgstPaise).toBe(1800);
    expect(result.igstPaise).toBe(0);
    expect(result.totalPaise).toBe(23600);
  });

  it('correctly calculates tax-exclusive pricing for inter-state supply (100% IGST)', () => {
    const result = calculateLineTax({
      quantity: 2,
      unitPricePaise: 10000,
      taxRatePercent: 18.0,
      priceIncludesTax: false,
      supplyType: 'INTER_STATE',
    });

    expect(result.taxableAmountPaise).toBe(20000);
    expect(result.totalTaxPaise).toBe(3600);
    expect(result.cgstPaise).toBe(0);
    expect(result.sgstPaise).toBe(0);
    expect(result.igstPaise).toBe(3600);
    expect(result.totalPaise).toBe(23600);
  });

  it('correctly calculates tax-inclusive retail pricing without rounding errors', () => {
    // MRP ₹235.00 inclusive of 5% GST (23500 paise)
    // Taxable = round(23500 / 1.05) = 22381 paise (₹223.81)
    // Tax = 23500 - 22381 = 1119 paise (₹11.19)
    // Intra-state: CGST = 559 paise, SGST = 560 paise (sums exactly to 1119)
    const result = calculateLineTax({
      quantity: 1,
      unitPricePaise: 23500,
      taxRatePercent: 5.0,
      priceIncludesTax: true,
      supplyType: 'INTRA_STATE',
    });

    expect(result.totalPaise).toBe(23500);
    expect(result.taxableAmountPaise).toBe(22381);
    expect(result.totalTaxPaise).toBe(1119);
    expect(result.cgstPaise + result.sgstPaise).toBe(1119);
    expect(result.cgstPaise).toBe(559);
    expect(result.sgstPaise).toBe(560);
    expect(result.taxableAmountPaise + result.totalTaxPaise).toBe(result.totalPaise);
  });

  it('handles 0% exempt tax correctly', () => {
    const result = calculateLineTax({
      quantity: 5,
      unitPricePaise: 2800, // ₹28.00 Salt
      taxRatePercent: 0.0,
      priceIncludesTax: true,
      supplyType: 'INTRA_STATE',
    });

    expect(result.taxableAmountPaise).toBe(14000);
    expect(result.totalTaxPaise).toBe(0);
    expect(result.cgstPaise).toBe(0);
    expect(result.sgstPaise).toBe(0);
    expect(result.igstPaise).toBe(0);
    expect(result.totalPaise).toBe(14000);
  });

  it('summarizes multiple invoice lines consistently', () => {
    const summary = summarizeInvoiceTaxes([
      {
        quantity: 2,
        unitPricePaise: 10000,
        taxRatePercent: 18.0,
        priceIncludesTax: false,
        supplyType: 'INTRA_STATE',
      },
      {
        quantity: 1,
        unitPricePaise: 23500,
        taxRatePercent: 5.0,
        priceIncludesTax: true,
        supplyType: 'INTRA_STATE',
      },
    ]);

    expect(summary.lines.length).toBe(2);
    expect(summary.taxableSubtotalPaise).toBe(20000 + 22381);
    expect(summary.totalTaxPaise).toBe(3600 + 1119);
    expect(summary.totalPaise).toBe(23600 + 23500);
    expect(summary.cgstPaise + summary.sgstPaise).toBe(summary.totalTaxPaise);
  });

  it('formats currency with Indian numbering system format (₹)', () => {
    expect(formatPaiseToInr(125050)).toBe('₹1,250.50');
    expect(formatPaiseToInr(10000000)).toBe('₹1,00,000.00'); // 1 Lakh
  });

  it('flags ITC eligibility with appropriate review caution for prototype mode', () => {
    const reviewResult = evaluateItcEligibility({
      hasGstin: true,
      status: 'RECEIVED',
      isCancelled: false,
    });
    expect(reviewResult.status).toBe('Needs review');

    const ineligibleResult = evaluateItcEligibility({
      hasGstin: false,
      status: 'RECEIVED',
      isCancelled: false,
    });
    expect(ineligibleResult.status).toBe('Ineligible');
  });
});
