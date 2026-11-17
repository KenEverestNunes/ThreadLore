import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #14 - Invalidate Stale Compiled Draft on Verification Changes', () => {
  it('should disable direct navigation to Loom Draft & WIF after modifying matrix cells in editor', async () => {
    render(<App />);

    // 1. Start from upload and choose sample swatch
    fireEvent.click(screen.getByRole('button', { name: /Plain Linen/i }));
    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    // 2. Confirm crop to navigate to verify step
    fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));
    await waitFor(() => {
      expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
    });

    // 3. Compile draft
    const compileBtn = screen.getByRole('button', { name: /Compile 4-Shaft Loom Draft/i });
    fireEvent.click(compileBtn);

    // 4. Verify we arrived at draft step
    await waitFor(() => {
      expect(screen.getByText(/Back to Editor/i)).toBeInTheDocument();
    });

    // 5. Navigate back to editor
    fireEvent.click(screen.getByRole('button', { name: /Back to Editor/i }));
    await waitFor(() => {
      expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
    });

    const draftStepButton = screen.getByRole('button', { name: /Loom Draft & WIF/i });

    // 6. Modify the weave matrix by toggling a cell
    // Grid cells in MasterTileEditor have title starting with "Pick "
    const cellButtons = screen.getAllByRole('button').filter((btn) =>
      btn.getAttribute('title')?.startsWith('Pick ')
    );
    expect(cellButtons.length).toBeGreaterThan(0);
    fireEvent.click(cellButtons[0]);

    // EXPECTATION: The compiled draft is now stale.
    // The "Loom Draft & WIF" stepper button MUST be disabled to prevent viewing/exporting stale WIF.
    expect(draftStepButton).toBeDisabled();
  });

  it('should disable direct navigation to Loom Draft & WIF after selecting a new preset', async () => {
    render(<App />);

    // Advance to verify
    fireEvent.click(screen.getByRole('button', { name: /Plain Linen/i }));
    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));
    await waitFor(() => {
      expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
    });

    // Compile
    fireEvent.click(screen.getByRole('button', { name: /Compile 4-Shaft Loom Draft/i }));
    await waitFor(() => {
      expect(screen.getByText(/Back to Editor/i)).toBeInTheDocument();
    });

    // Back to editor
    fireEvent.click(screen.getByRole('button', { name: /Back to Editor/i }));
    await waitFor(() => {
      expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
    });

    const draftStepButton = screen.getByRole('button', { name: /Loom Draft & WIF/i });

    // Change canonical preset dropdown (first combobox on verify screen)
    const presetSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(presetSelect, { target: { value: 'twill_2_2_z' } });

    // EXPECTATION: Changing preset must invalidate compiled draft
    expect(draftStepButton).toBeDisabled();
  });

  it('should disable direct navigation to Loom Draft & WIF after changing yarn colors or repeats', async () => {
    render(<App />);

    // Advance to verify
    fireEvent.click(screen.getByRole('button', { name: /Plain Linen/i }));
    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));
    await waitFor(() => {
      expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
    });

    // Compile
    fireEvent.click(screen.getByRole('button', { name: /Compile 4-Shaft Loom Draft/i }));
    await waitFor(() => {
      expect(screen.getByText(/Back to Editor/i)).toBeInTheDocument();
    });

    // Back to editor
    fireEvent.click(screen.getByRole('button', { name: /Back to Editor/i }));
    await waitFor(() => {
      expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
    });

    const draftStepButton = screen.getByRole('button', { name: /Loom Draft & WIF/i });

    // Select a different yarn palette preset
    const highlandPaletteBtn = screen.getByRole('button', { name: /Highland Tweed/i });
    fireEvent.click(highlandPaletteBtn);

    // EXPECTATION: Changing yarn color palette must invalidate compiled draft
    expect(draftStepButton).toBeDisabled();
  });
});
