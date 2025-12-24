/**
 * E2E Test: Freeze/Unfreeze Journey
 * Based on Help Page Scenario 3: Üyelik Dondurma
 *
 * User Story:
 * As a dance school admin,
 * I want to freeze a student's membership temporarily,
 * So that they can take a break without losing their enrollment.
 */

import { test, expect } from '@playwright/test';

test.describe('Freeze/Unfreeze Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // TODO: Add login logic
  });

  test('Freeze membership for vacation', async ({ page }) => {
    // Step 1: Go to member detail page
    await page.goto('/members/1');

    // Step 2: Click freeze button (three dots menu)
    await page.click('[aria-label="More options"]');
    await page.click('text=Dondur');

    // Step 3: Select classes to freeze (if multiple enrollments)
    await page.click('[type="checkbox"]').first();

    // Step 4: Set freeze dates
    await page.fill('input[name="start_date"]', '2024-03-01');
    await page.fill('input[name="end_date"]', '2024-04-30');

    // Step 5: Add reason
    await page.fill('textarea[name="reason"]', 'Tatil');

    // Step 6: Submit freeze
    await page.click('button:has-text("Dondur")');

    // Step 7: Verify success
    await expect(page.locator('text=Üyelik donduruldu')).toBeVisible();

    // Step 8: Verify freeze status box appears
    await expect(page.locator('text=Ders Donduruldu')).toBeVisible();
    await expect(page.locator('text=Tatil')).toBeVisible();
  });

  test('Indefinite freeze (no end date)', async ({ page }) => {
    await page.goto('/members/1');

    // Open freeze modal
    await page.click('[aria-label="More options"]');
    await page.click('text=Dondur');

    // Select class
    await page.click('[type="checkbox"]').first();

    // Set start date only (no end date)
    await page.fill('input[name="start_date"]', '2024-03-01');
    // Leave end_date empty

    // Add reason
    await page.fill('textarea[name="reason"]', 'Sakatlık - Dönüş belirsiz');

    // Submit
    await page.click('button:has-text("Dondur")');

    // Verify indefinite freeze message
    await expect(page.locator('text=Süresiz dondurma')).toBeVisible();
  });

  test('Unfreeze membership', async ({ page }) => {
    // Assuming member is already frozen
    await page.goto('/members/1');

    // Should see frozen status box
    await expect(page.locator('text=Ders Donduruldu')).toBeVisible();

    // Click "Dersi Şimdi Aktifleştir" button
    await page.click('button:has-text("Dersi Şimdi Aktifleştir")');

    // Verify success
    await expect(page.locator('text=Ders aktifleştirildi')).toBeVisible();

    // Frozen status box should disappear
    await expect(page.locator('text=Ders Donduruldu')).not.toBeVisible();

    // Status should change to active
    await expect(page.locator('text=Aktif')).toBeVisible();
  });

  test('Verify payment schedule adjusts after freeze', async ({ page }) => {
    // Before freeze
    await page.goto('/members/1');

    // Check next payment date
    const nextPaymentBefore = await page.locator('[data-next-payment]').textContent();

    // Freeze for 30 days
    await page.click('[aria-label="More options"]');
    await page.click('text=Dondur');
    await page.click('[type="checkbox"]').first();
    await page.fill('input[name="start_date"]', '2024-03-01');
    await page.fill('input[name="end_date"]', '2024-03-30');
    await page.click('button:has-text("Dondur")');

    // After freeze - next payment should be pushed by 30 days
    await page.reload();
    const nextPaymentAfter = await page.locator('[data-next-payment]').textContent();

    // Verify dates are different (payment date pushed forward)
    expect(nextPaymentBefore).not.toBe(nextPaymentAfter);
  });

  test('Show frozen members in separate tab', async ({ page }) => {
    await page.goto('/members');

    // Click "Dondurulmuş" tab
    await page.click('text=Dondurulmuş');

    // Should show only frozen members
    await expect(page.locator('[data-status="frozen"]')).toBeVisible();

    // Click on frozen member
    await page.click('[data-status="frozen"]').first();

    // Should see freeze details
    await expect(page.locator('text=Ders Donduruldu')).toBeVisible();
  });

  test('Cancel future freeze plan', async ({ page }) => {
    await page.goto('/members/1');

    // Should see planned freeze warning (orange alert)
    await expect(page.locator('text=Planlanmış Dondurma')).toBeVisible();

    // Click "İptal Et" button
    await page.click('button:has-text("İptal Et")');

    // Verify success
    await expect(page.locator('text=Dondurma planı iptal edildi')).toBeVisible();

    // Planned freeze alert should disappear
    await expect(page.locator('text=Planlanmış Dondurma')).not.toBeVisible();
  });
});
