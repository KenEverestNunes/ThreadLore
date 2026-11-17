import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #7 - Swatch Analysis Error Details Preservation', () => {
  it('should display specific server error details when swatch analysis fails with HTTP 400', async () => {
    // Mock /api/swatch to return HTTP 400 with specific detail
    const originalFetch = globalThis.fetch;
    const serverErrorMessage = 'Cropped image resolution 64x64 px is below minimum 100x100 px required for optical FFT profiling.';

    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/swatch')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ detail: serverErrorMessage }),
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

      // Confirm crop -> triggers /api/swatch
      fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));

      // Wait until we reach verify step and error banner appears
      await waitFor(() => {
        expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
      });

      // EXPECTATION: The specific server error message MUST be visible to the user
      await waitFor(() => {
        expect(screen.getByText(new RegExp(serverErrorMessage, 'i'))).toBeInTheDocument();
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
