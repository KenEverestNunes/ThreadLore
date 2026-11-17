import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #19 - Unmeasured Thread Spacing Placeholder Label Regression Test', () => {
  it('should display "(Default Placeholder: Optical detection uncertain)" when spacing_detected is false', async () => {
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
              confidence: 0.85,
              default_matrix: [
                [1, 0],
                [0, 1],
              ],
              technical_description: 'Plain weave with low FFT contrast',
              float_risk_notes: null,
              rotation_degrees: 0.0,
              dx_px: null,
              dy_px: null,
              spacing_detected: false,
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

      // Confirm crop -> triggers /api/swatch with spacing_detected: false
      fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));

      // Wait for Verify & Align step
      await waitFor(() => {
        expect(screen.getByText(/Interactive Photo & Weave Overlay/i)).toBeInTheDocument();
      });

      // EXPECTATION: When spacing is not detected, unmeasured default spacing must be labeled as a placeholder
      expect(
        screen.getByText(/Default Placeholder: Optical detection uncertain/i)
      ).toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
