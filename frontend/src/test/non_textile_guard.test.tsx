import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Issue #46 - Non-Textile Image Ingestion Guard', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should render a prominent warning banner when uploaded image is not a woven textile', async () => {
    // Mock backend swatch endpoint returning is_woven_textile: false
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/swatch')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            status: 'unavailable',
            is_woven_textile: false,
            weave_family: 'custom',
            twill_direction: null,
            repeat_size: 2,
            confidence: 0.0,
            default_matrix: null,
            technical_description:
              'Not a Woven Textile: The uploaded photograph does not appear to be a woven fabric. Please upload a macro fabric swatch.',
            float_risk_notes: null,
            dx_px: null,
            dy_px: null,
            spacing_detected: false,
            rotation_degrees: 0.0,
          }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        blob: async () => new Blob(['mock'], { type: 'image/jpeg' }),
        json: async () => ({}),
      } as Response);
    });

    render(<App />);

    // 1. Choose synthetic plain swatch to navigate to crop step
    const sampleBtn = screen.getByRole('button', { name: /Synthetic Plain Linen/i });
    fireEvent.click(sampleBtn);

    // 2. Wait for crop step
    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    // 3. Confirm crop to trigger analysis
    const confirmBtn = screen.getByRole('button', { name: /confirm & analyze/i });
    fireEvent.click(confirmBtn);

    // 4. Verify that the non-textile warning banner is displayed in VerificationPanel
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/Not a Woven Textile/i);
      expect(alert).toHaveTextContent(/does not appear to be a woven fabric/i);
    });
  });
});
