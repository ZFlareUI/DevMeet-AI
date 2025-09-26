import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should redirect to auth page when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/auth/)
  })

  test('should show sign in form', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check for sign in elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in with github/i })).toBeVisible()
  })

  test('should show register form', async ({ page }) => {
    await page.goto('/auth/register')
    
    // Check for register elements
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
  })

  test('should validate registration form', async ({ page }) => {
    await page.goto('/auth/register')
    
    // Try to submit empty form
    await page.getByRole('button', { name: /create account/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should show password strength indicator', async ({ page }) => {
    await page.goto('/auth/register')
    
    const passwordInput = page.getByLabel(/password/i)
    
    // Test weak password
    await passwordInput.fill('123')
    await expect(page.getByText(/weak/i)).toBeVisible()
    
    // Test strong password
    await passwordInput.fill('MyStrongPassword123!')
    await expect(page.getByText(/strong/i)).toBeVisible()
  })
})

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for dashboard tests
    await page.addInitScript(() => {
      window.localStorage.setItem('next-auth.session-token', 'mock-session')
    })
  })

  test('should display dashboard with navigation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check main navigation
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /candidates/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /interviews/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /analytics/i })).toBeVisible()
  })

  test('should navigate between sections', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Navigate to candidates
    await page.getByRole('link', { name: /candidates/i }).click()
    await expect(page).toHaveURL(/candidates/)
    
    // Navigate to interviews
    await page.getByRole('link', { name: /interviews/i }).click()
    await expect(page).toHaveURL(/interviews/)
    
    // Navigate to analytics
    await page.getByRole('link', { name: /analytics/i }).click()
    await expect(page).toHaveURL(/analytics/)
  })

  test('should show user profile menu', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Click on user avatar/menu
    await page.getByRole('button', { name: /user menu/i }).click()
    
    // Check for profile options
    await expect(page.getByRole('menuitem', { name: /profile/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /sign out/i })).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('/')
    
    // Check if mobile navigation works
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await expect(page.getByRole('navigation')).toBeVisible()
    }
  })

  test('should work on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad
    await page.goto('/')
    
    // Check layout adapts correctly
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should work on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    
    // Check full navigation is visible
    await expect(page.getByRole('navigation')).toBeVisible()
  })
})

test.describe('Performance', () => {
  test('should load pages quickly', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Check for absence of layout shift indicators
    const layoutShiftWarnings = await page.evaluate(() => {
      return window.performance.getEntriesByType('layout-shift').length
    })
    
    // Should have minimal layout shifts
    expect(layoutShiftWarnings).toBeLessThan(5)
  })
})

test.describe('Accessibility', () => {
  test('should have proper headings hierarchy', async ({ page }) => {
    await page.goto('/')
    
    // Check for h1
    await expect(page.locator('h1')).toBeVisible()
    
    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(0)
  })

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/')
    
    // Check all images have alt text
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab through focusable elements
    await page.keyboard.press('Tab')
    
    // Check if focus is visible
    const focusedElement = await page.locator(':focus').first()
    await expect(focusedElement).toBeVisible()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/')
    
    // Check for buttons with aria-labels or accessible text
    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label')
      const text = await button.textContent()
      
      // Should have either aria-label or text content
      expect(ariaLabel || text).toBeTruthy()
    }
  })
})
