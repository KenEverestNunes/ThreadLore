import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #5 - Canvas Mouse Drag Buffer Coordinate Scaling Regression Test', () => {
  it('should scale mouse drag deltas by buffer-to-display ratio (canvas.width / rect.width)', async () => {
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
              technical_description: 'Plain weave sample',
              float_risk_notes: null,
              rotation_degrees: 0.0,
              dx_px: 20.0,
              dy_px: 20.0,
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

      // Confirm crop -> triggers /api/swatch
      fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));

      // Wait for Verify & Align step
      await waitFor(() => {
        expect(screen.getByText(/Interactive Photo & Weave Overlay/i)).toBeInTheDocument();
      });

      // Find canvas element
      const canvas = document.querySelector('canvas');
      expect(canvas).not.toBeNull();

      // Buffer size is 450x450; mock display CSS rect as 400x400 (h-[400px] w-[400px])
      vi.spyOn(canvas!, 'getBoundingClientRect').mockReturnValue({
        width: 400,
        height: 400,
        top: 0,
        left: 0,
        bottom: 400,
        right: 400,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Initial Phase Offset readout
      expect(screen.getByText(/Phase Offset:\s*\(0px,\s*0px\)/i)).toBeInTheDocument();

      // Drag mouse: clientX moves from 100 to 180 (+80px screen delta)
      // clientY moves from 100 to 140 (+40px screen delta)
      fireEvent.mouseDown(canvas!, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas!, { clientX: 180, clientY: 140 });
      fireEvent.mouseUp(canvas!);

      // EXPECTATION:
      // Buffer resolution ratio is 450 / 400 = 1.125
      // Scaled X offset must be 80 * 1.125 = 90 px
      // Scaled Y offset must be 40 * 1.125 = 45 px
      // In the broken implementation without buffer scaling, it displays unscaled: (80px, 40px)
      expect(screen.getByText(/Phase Offset:\s*\(90px,\s*45px\)/i)).toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
