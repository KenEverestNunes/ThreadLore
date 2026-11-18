import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Issue #45 - Dominant Yarn Color Extraction via K-Means', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should auto-populate warp and weft colors from swatch analysis and allow 1-click restore', async () => {
    const mockWarpColor = '#516579';
    const mockWeftColor = '#8FA2AF';

    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/swatch')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            status: 'success',
            is_woven_textile: true,
            weave_family: 'twill_3_1_s',
            twill_direction: 's',
            repeat_size: 4,
            confidence: 0.88,
            default_matrix: [
              [0, 1, 1, 1],
              [1, 0, 1, 1],
              [1, 1, 0, 1],
              [1, 1, 1, 0],
            ],
            technical_description: '3/1 S-Twill denim structure.',
            float_risk_notes: null,
            dx_px: 6.5,
            dy_px: 6.5,
            spacing_detected: true,
            rotation_degrees: -11.2,
            dominant_warp_hex: mockWarpColor,
            dominant_weft_hex: mockWeftColor,
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

    // 1. Choose synthetic swatch to enter crop step
    const sampleBtn = screen.getByRole('button', { name: /Synthetic Plain Linen/i });
    fireEvent.click(sampleBtn);

    // 2. Wait for crop step
    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    // 3. Confirm crop to trigger analysis
    const confirmBtn = screen.getByRole('button', { name: /confirm & analyze/i });
    fireEvent.click(confirmBtn);

    // 4. Wait for verify step
    await waitFor(() => {
      expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
    });

    // 5. Verify warp and weft colors auto-populated with extracted swatch colors
    expect(screen.getByText(mockWarpColor.toUpperCase())).toBeInTheDocument();
    expect(screen.getByText(mockWeftColor.toUpperCase())).toBeInTheDocument();

    // 6. Verify "Extracted from Swatch" button is rendered
    const extractedBtn = screen.getByRole('button', { name: /Extracted from Swatch/i });
    expect(extractedBtn).toBeInTheDocument();

    // 7. Change colors using a preset (Highland Tweed)
    const tweedPresetBtn = screen.getByRole('button', { name: /Highland Tweed/i });
    fireEvent.click(tweedPresetBtn);

    expect(screen.getByText('#78350F')).toBeInTheDocument();
    expect(screen.getByText('#FEF3C7')).toBeInTheDocument();

    // 8. Click "Extracted from Swatch" button and verify colors restored
    fireEvent.click(extractedBtn);

    expect(screen.getByText(mockWarpColor.toUpperCase())).toBeInTheDocument();
    expect(screen.getByText(mockWeftColor.toUpperCase())).toBeInTheDocument();
  });
});
