/**
 * E2E Test: Complete Member Registration Journey
 * Based on Help Page Scenario 1: Yeni Üye Kaydı
 *
 * User Story:
 * As a dance school admin,
 * I want to register a new student and enroll them in classes,
 * So that I can track their payments and attendance.
 */

import { test, expect } from '@playwright/test';

test.describe('Member Registration Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login to the application
    await page.goto('/login');
    // TODO: Add actual login credentials from env
    // await page.fill('input[name="email"]', process.env.TEST_EMAIL);
    // await page.fill('input[name="password"]', process.env.TEST_PASSWORD);
    // await page.click('button[type="submit"]');
  });

  test('Complete member registration and class enrollment', async ({ page }) => {
    // Step 1: Navigate to Members page
    await page.goto('/members');
    await expect(page).toHaveTitle(/Üyeler/);

    // Step 2: Click "Yeni Üye" button
    await page.click('button:has-text("Yeni Üye")');

    // Step 3: Fill out member registration form
    await page.fill('input[name="first_name"]', 'Test');
    await page.fill('input[name="last_name"]', 'Kullanıcı');
    await page.fill('input[name="phone"]', '5551234567');

    // Step 4: Submit form
    await page.click('button[type="submit"]:has-text("Kaydet")');

    // Step 5: Wait for success notification
    await expect(page.locator('text=Üye başarıyla eklendi')).toBeVisible();

    // Step 6: Verify member appears in list
    await expect(page.locator('text=Test Kullanıcı')).toBeVisible();

    // Step 7: Click on member to view details
    await page.click('text=Test Kullanıcı');

    // Step 8: Wait for member detail page
    await expect(page.locator('h2:has-text("Test Kullanıcı")')).toBeVisible();

    // Step 9: Click "Ders Ekle" button
    await page.click('button:has-text("Ders Ekle")');

    // Step 10: Select a class from the modal
    await page.click('text=Salsa Başlangıç'); // Example class

    // Step 11: Set price and duration
    // Price should be pre-filled with default
    await page.selectOption('select[name="duration"]', '12'); // 12 months

    // Step 12: Confirm enrollment
    await page.click('button:has-text("Derslere Kaydet")');

    // Step 13: Wait for success notification
    await expect(page.locator('text=Ders kayıtları eklendi')).toBeVisible();

    // Step 14: Verify enrollment appears in member detail
    await expect(page.locator('text=Salsa Başlangıç')).toBeVisible();
    await expect(page.locator('text=Aktif')).toBeVisible();
  });

  test('Should validate required fields', async ({ page }) => {
    await page.goto('/members');

    // Click "Yeni Üye" button
    await page.click('button:has-text("Yeni Üye")');

    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Kaydet")');

    // Should show validation errors
    await expect(page.locator('text=Ad gerekli')).toBeVisible();
    await expect(page.locator('text=Soyad gerekli')).toBeVisible();
    await expect(page.locator('text=Telefon gerekli')).toBeVisible();
  });

  test('Should format phone number correctly', async ({ page }) => {
    await page.goto('/members');
    await page.click('button:has-text("Yeni Üye")');

    // Enter phone without formatting
    await page.fill('input[name="phone"]', '5551234567');

    // Should display formatted
    const phoneValue = await page.inputValue('input[name="phone"]');
    expect(phoneValue).toContain('555 123 45 67');
  });
});
