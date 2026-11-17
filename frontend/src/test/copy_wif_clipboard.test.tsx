import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #10 - WIF Plaintext Code Drawer Copy to Clipboard', () => {
  it('should render a "Copy WIF" button in the WIF drawer and copy wif text on click', async () => {
    render(<App />);

    // 1. Advance through swatch selection
    fireEvent.click(screen.getByRole('button', { name: /Plain Linen/i }));
    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    // 2. Confirm crop
    fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));
    await waitFor(() => {
      expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
    });

    // 3. Compile draft to reach Loom Draft view
    fireEvent.click(screen.getByRole('button', { name: /Compile 4-Shaft Loom Draft/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Back to Editor/i })).toBeInTheDocument();
    });

    // 4. Open WIF code drawer
    const viewWifBtn = screen.getByRole('button', { name: /View WIF Spec/i });
    fireEvent.click(viewWifBtn);

    // 5. Drawer is visible
    expect(screen.getByText(/Standard WIF 1.1 Plaintext File/i)).toBeInTheDocument();

    // 6. EXPECTATION: "Copy WIF" button must exist
    const copyBtn = screen.getByRole('button', { name: /Copy WIF/i });
    expect(copyBtn).toBeInTheDocument();

    // 7. Click copy button and assert clipboard interaction and visual confirmation
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('[WIF]')
    );

    await waitFor(() => {
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
    });
  });
});
