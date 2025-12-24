/**
 * E2E Test: Instructor Payment Journey
 * Based on Help Page Scenario 4: Eğitmen Hakediş Yönetimi
 *
 * User Story:
 * As a dance school admin,
 * I want to track and pay instructor commissions,
 * So that I can manage payroll accurately.
 */

import { test, expect } from '@playwright/test';

test.describe('Instructor Payment Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // TODO: Add login logic
  });

  test('View pending instructor payments', async ({ page }) => {
    // Step 1: Navigate to instructor payments page
    await page.goto('/payments/instructors');

    // Step 2: Should see "Ödenecekler" tab
    await expect(page.locator('text=Ödenecekler')).toBeVisible();

    // Step 3: Should display instructors with pending balance
    await expect(page.locator('[data-instructor-balance]')).toBeVisible();

    // Step 4: Verify balance amount and transaction count
    const balance = await page.locator('[data-instructor-balance]').first().textContent();
    expect(balance).toContain('₺'); // Should show Turkish Lira symbol

    const transactionCount = await page.locator('[data-transaction-count]').first().textContent();
    expect(parseInt(transactionCount || '0')).toBeGreaterThan(0);
  });

  test('Process instructor payment', async ({ page }) => {
    await page.goto('/payments/instructors');

    // Click "Ödeme Yap" button for first instructor
    await page.click('button:has-text("Ödeme Yap")').first();

    // Modal should open
    await expect(page.locator('text=Eğitmen Ödemesi')).toBeVisible();

    // Select payment method
    await page.click('text=Havale/EFT');

    // Add optional note
    await page.fill('textarea[name="note"]', 'Aralık ayı hakedişi');

    // Confirm payment
    await page.click('button:has-text("Ödemeyi Onayla")');

    // Verify success
    await expect(page.locator('text=Ödeme başarıyla yapıldı')).toBeVisible();

    // Balance should be zero now
    await page.reload();
    const newBalance = await page.locator('[data-instructor-balance]').first().textContent();
    expect(newBalance).toContain('0');
  });

  test('View commission details', async ({ page }) => {
    await page.goto('/payments/instructors');

    // Click "Komisyon Detayları" tab
    await page.click('text=Komisyon Detayları');

    // Should show list of all commissions
    await expect(page.locator('table')).toBeVisible();

    // Filter by instructor
    await page.selectOption('select[name="instructor"]', { index: 1 });

    // Filter by status
    await page.selectOption('select[name="status"]', 'pending');

    // Should show filtered results
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);

    // Each row should show:
    // - Student name
    // - Class name
    // - Commission amount
    // - Payment date
    // - Status
    await expect(page.locator('td:has-text("₺")')).toBeVisible();
  });

  test('View payment history', async ({ page }) => {
    await page.goto('/payments/instructors');

    // Click "Ödeme Geçmişi" tab
    await page.click('text=Ödeme Geçmişi');

    // Should show past payments
    await expect(page.locator('table')).toBeVisible();

    // Each row should show:
    // - Date
    // - Instructor name
    // - Amount
    // - Payment method
    // - Note
    const rows = await page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('Verify automatic commission calculation', async ({ page }) => {
    // Scenario: When student payment is collected, commission is automatically calculated

    // Step 1: Collect student payment
    await page.goto('/members/1');
    await page.click('button:has-text("Ödeme Ekle")');
    await page.click('text=Aylık Aidat');
    await page.click('[type="checkbox"]').first();
    await page.click('text=Nakit');
    await page.click('button:has-text("Ödeme Al")');

    // Step 2: Go to instructor payments
    await page.goto('/payments/instructors');

    // Step 3: Click "Komisyon Detayları"
    await page.click('text=Komisyon Detayları');

    // Step 4: Should see new commission entry
    // Filter to show only latest entries
    await page.selectOption('select[name="status"]', 'pending');

    // Verify commission amount (e.g., 40% of 1500 = 600)
    await expect(page.locator('text=600 ₺')).toBeVisible();
  });

  test('Commission reversal when payment deleted', async ({ page }) => {
    // Scenario: When student payment is deleted, commission should be removed

    // Step 1: Note current instructor balance
    await page.goto('/payments/instructors');
    const balanceBefore = await page.locator('[data-instructor-balance]').first().textContent();

    // Step 2: Go to payments and delete a payment
    await page.goto('/finance');
    await page.click('text=Gelirler');
    await page.click('[aria-label="Delete payment"]').first();
    await page.click('button:has-text("Evet")');

    // Step 3: Go back to instructor payments
    await page.goto('/payments/instructors');

    // Step 4: Balance should be reduced
    const balanceAfter = await page.locator('[data-instructor-balance]').first().textContent();

    // Balance should be different
    expect(balanceBefore).not.toBe(balanceAfter);
  });
});
