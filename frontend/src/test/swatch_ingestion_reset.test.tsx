import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #15 - Swatch Ingestion State Reset Regression Test', () => {
  it('should clear prior analysis results, cropped image, and compiled draft when a new swatch is selected', async () => {
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
              weave_family: 'twill_2_2',
              twill_direction: 'Z',
              repeat_size: 4,
              confidence: 0.95,
              default_matrix: [
                [1, 1, 0, 0],
                [0, 1, 1, 0],
                [0, 0, 1, 1],
                [1, 0, 0, 1],
              ],
              technical_description: '2/2 Twill sample',
              float_risk_notes: null,
              rotation_degrees: 0.0,
              dx_px: 20.0,
              dy_px: 20.0,
              spacing_detected: true,
            }),
        } as Response);
      }
      if (urlStr.includes('/api/compile')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              draft: {
                shafts: 4,
                treadles: 4,
                warp_threads: 4,
                weft_picks: 4,
                threading: [0, 1, 2, 3],
                treadling: [0, 1, 2, 3],
                tieup: [
                  [1, 1, 0, 0],
                  [0, 1, 1, 0],
                  [0, 0, 1, 1],
                  [1, 0, 0, 1],
                ],
                drawdown: [
                  [1, 1, 0, 0],
                  [0, 1, 1, 0],
                  [0, 0, 1, 1],
                  [1, 0, 0, 1],
                ],
              },
              is_valid: true,
              validation_errors: [],
              validation_warnings: [],
              wif_text: 'WIF TEXT FOR IMAGE A',
            }),
        } as Response);
      }
      return originalFetch(url);
    }) as any;

    try {
      render(<App />);

      // STEP 1: Process Image A through to Draft
      fireEvent.click(screen.getByRole('button', { name: /Plain Linen/i }));
      await waitFor(() => {
        expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
      });

      // Confirm crop for Image A
      fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));

      // Wait for Verify step
      await waitFor(() => {
        expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
      });

      // Compile draft for Image A
      fireEvent.click(screen.getByRole('button', { name: /compile.*loom draft/i }));

      // Wait for Draft step
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back to Editor/i })).toBeInTheDocument();
      });

      // STEP 2: Return to Upload step
      const uploadStepBtn = screen.getByRole('button', { name: /Upload Swatch/i });
      fireEvent.click(uploadStepBtn);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Preserve the weave, not just the photograph/i })).toBeInTheDocument();
      });

      // STEP 3: Select new Image B via drag-and-drop or file upload
      const dropZone = screen.getByText(/Upload Textile Swatch Photo/i).closest('div[class*="border-dashed"]');
      expect(dropZone).not.toBeNull();

      const imageBFile = new File(['image-b-content'], 'sample_b.jpg', { type: 'image/jpeg' });
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [imageBFile],
        },
      });

      // User is now on the Crop step for Image B
      await waitFor(() => {
        expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
      });

      // STEP 4: Verify that prior Image A state was completely cleared!
      // In the broken implementation, prior croppedImageUrl and compiledResult persist:
      // Thus "Verify & Align" and "Loom Draft & WIF" are erroneously enabled before crop confirmation.
      const verifyStepBtn = screen.getByRole('button', { name: /Verify & Align/i });
      const draftStepBtn = screen.getByRole('button', { name: /Loom Draft & WIF/i });

      // EXPECTATION: Prior state must be cleared, so Verify & Draft buttons are disabled for Image B
      expect(verifyStepBtn).toBeDisabled();
      expect(draftStepBtn).toBeDisabled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
