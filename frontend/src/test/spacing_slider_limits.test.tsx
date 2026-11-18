import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #18 - Optical Spacing Slider Limits Regression Test', () => {
  it('should accommodate fine threads (<8 px) and coarse threads (>50 px) in slider min/max bounds', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/swatch')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              status: 'success',
              weave_family: 'plain_1_1',
              twill_direction: null,
              repeat_size: 2,
              confidence: 0.95,
              default_matrix: [
                [1, 0],
                [0, 1],
              ],
              technical_description: 'Fine silk micro-weave sample',
              float_risk_notes: null,
              rotation_degrees: 0.0,
              dx_px: 6.0,
              dy_px: 6.0,
              spacing_detected: true,
            }),
        } as Response);
      }
      return originalFetch(url);
    }) as any;

    try {
      render(<App />);

      // Ingest swatch
      fireEvent.click(screen.getByRole('button', { name: /Plain Linen/i }));
      await waitFor(() => {
        expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
      });

      // Confirm crop -> triggers /api/swatch with dx_px: 6.0
      fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));

      // Wait for Verify & Align step
      await waitFor(() => {
        expect(screen.getByText(/Interactive Photo & Weave Overlay/i)).toBeInTheDocument();
      });

      // Find the Δx and Δy range sliders via their accessible labels
      const sliderX = screen.getByLabelText(/Warp Spacing/i);
      const sliderY = screen.getByLabelText(/Weft Spacing/i);

      const minX = parseFloat(sliderX.getAttribute('min') || '0');
      const maxX = parseFloat(sliderX.getAttribute('max') || '0');
      const minY = parseFloat(sliderY.getAttribute('min') || '0');
      const maxY = parseFloat(sliderY.getAttribute('max') || '0');

      // EXPECTATION: Sliders must accommodate fine threads down to at least 6.0 px (e.g. min <= 4 px)
      expect(minX).toBeLessThanOrEqual(6.0);
      expect(minY).toBeLessThanOrEqual(6.0);

      // EXPECTATION: Sliders must accommodate coarse threads up to at least 65.0 px (e.g. max >= 100 px)
      expect(maxX).toBeGreaterThanOrEqual(65.0);
      expect(maxY).toBeGreaterThanOrEqual(65.0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
