/**
 * E2E Test: Payment Collection Journey
 * Based on Help Page Scenario 2: Aylık Aidat Toplama
 *
 * User Story:
 * As a dance school admin,
 * I want to collect monthly payments from students,
 * So that I can track their payment status and revenue.
 */

import { test, expect } from '@playwright/test';

test.describe('Payment Collection Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // TODO: Add login logic
  });

  test('Collect single month payment', async ({ page }) => {
    // Step 1: Go to member detail page (assuming member exists)
    await page.goto('/members/1'); // Test member ID

    // Step 2: Find enrollment card and click "Ödeme Ekle"
    await page.click('button:has-text("Ödeme Ekle")');

    // Step 3: Select payment type
    await page.click('text=Aylık Aidat');

    // Step 4: Select payment period
    // Should show list of unpaid periods
    await expect(page.locator('text=Dönemler')).toBeVisible();

    // Select first unpaid period
    await page.locator('[type="checkbox"]').first().click();

    // Step 5: Select payment method
    await page.click('text=Nakit');

    // Step 6: Add optional note
    await page.fill('textarea[name="description"]', 'Ocak ayı ödemesi');

    // Step 7: Submit payment
    await page.click('button:has-text("Ödeme Al")');

    // Step 8: Verify success notification
    await expect(page.locator('text=Ödeme başarıyla alındı')).toBeVisible();

    // Step 9: Verify payment appears in history
    await page.click('text=Ödeme Geçmişi');
    await expect(page.locator('text=Ocak ayı ödemesi')).toBeVisible();
  });

  test('Collect 3-month advance payment (peşin ödeme)', async ({ page }) => {
    await page.goto('/members/1');

    // Click "Ödeme Ekle"
    await page.click('button:has-text("Ödeme Ekle")');

    // Select payment type
    await page.click('text=Aylık Aidat');

    // Select 3 periods
    const checkboxes = await page.locator('[type="checkbox"]');
    for (let i = 0; i < 3; i++) {
      await checkboxes.nth(i).check();
    }

    // Verify total amount shows 3x monthly fee
    await expect(page.locator('text=4.500 ₺')).toBeVisible(); // 3 x 1500

    // Select payment method
    await page.click('text=Havale/EFT');

    // Submit
    await page.click('button:has-text("Ödeme Al")');

    // Verify success
    await expect(page.locator('text=Ödeme başarıyla alındı')).toBeVisible();
  });

  test('View overdue payments indicator', async ({ page }) => {
    await page.goto('/members');

    // Overdue members should have red exclamation mark
    await expect(page.locator('[data-overdue="true"]')).toBeVisible();

    // Click on overdue member
    await page.locator('[data-overdue="true"]').first().click();

    // Should show overdue warning
    await expect(page.locator('text=Gecikmiş Ödeme')).toBeVisible();
    await expect(page.locator('[color="red"]')).toBeVisible();
  });

  test('Delete incorrect payment', async ({ page }) => {
    // Scenario: Yanlışlıkla ödeme alındı, silinmeli
    await page.goto('/finance');

    // Go to Gelirler tab
    await page.click('text=Gelirler');

    // Find payment to delete
    await page.locator('[aria-label="Delete payment"]').first().click();

    // Confirm deletion
    await page.click('button:has-text("Evet")');

    // Verify success
    await expect(page.locator('text=Ödeme silindi')).toBeVisible();
  });

  test('Filter payments by date range', async ({ page }) => {
    await page.goto('/finance');
    await page.click('text=Gelirler');

    // Select date range
    await page.fill('input[name="start_date"]', '2024-01-01');
    await page.fill('input[name="end_date"]', '2024-01-31');

    // Apply filter
    await page.click('button:has-text("Filtrele")');

    // Verify filtered results
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
  });
});
