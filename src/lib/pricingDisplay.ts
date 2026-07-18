/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BillingInterval = 'monthly' | 'annual';

export const ANNUAL_DISCOUNT_RATE = 0.2;

/** Per-month price when billed annually (20% off monthly list). */
export function annualMonthlyPrice(monthlyList: number): number {
  return Math.round(monthlyList * (1 - ANNUAL_DISCOUNT_RATE));
}

/** Total charged once per year. */
export function annualTotalPrice(monthlyList: number): number {
  return annualMonthlyPrice(monthlyList) * 12;
}

export function displayPlanPrice(
  monthlyList: number,
  interval: BillingInterval,
): { amount: number; suffix: string; subline?: string } {
  if (interval === 'annual' && monthlyList > 0) {
    const perMonth = annualMonthlyPrice(monthlyList);
    const total = annualTotalPrice(monthlyList);
    return {
      amount: perMonth,
      suffix: '/mo',
      subline: `Billed $${total}/yr`,
    };
  }
  return { amount: monthlyList, suffix: '/mo' };
}
