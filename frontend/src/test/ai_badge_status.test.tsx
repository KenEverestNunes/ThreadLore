import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #16 - AI Suggestion Badge Clarity on Unavailable Status', () => {
  it('should display "AI Suggestion Unavailable: Manual Selection Required" instead of misleading Custom Master Tile (0% heuristic)', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/swatch')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              status: 'unavailable',
              weave_family: 'custom',
              twill_direction: null,
              repeat_size: 4,
              confidence: 0.0,
              default_matrix: [],
              technical_description: 'Multimodal Gemini curation service unavailable.',
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

      // Advance to crop step
      fireEvent.click(screen.getByRole('button', { name: /Plain Linen/i }));
      await waitFor(() => {
        expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
      });

      // Confirm crop -> calls mock /api/swatch with status: "unavailable"
      fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));

      // Wait until verify step renders
      await waitFor(() => {
        expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
      });

      // EXPECTATION: Misleading "Custom Master Tile (0% heuristic)" must NOT be displayed as an AI suggestion
      expect(screen.queryByText(/AI Suggestion: Custom Master Tile/i)).not.toBeInTheDocument();

      // EXPECTATION: Clear unavailable indicator must be present
      expect(screen.getByText(/AI Suggestion Unavailable: Manual Selection Required/i)).toBeInTheDocument();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
