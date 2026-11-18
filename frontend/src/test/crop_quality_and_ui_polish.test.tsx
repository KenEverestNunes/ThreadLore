import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Crop Quality Guard and UI Polish', () => {
  it('should remove the 4-Shaft Rising-Shed Engine pill from the header', () => {
    render(<App />);

    // Header brand and slogan must exist with enhanced contrast
    expect(screen.getByText(/ThreadLore/i)).toBeInTheDocument();
    const slogans = screen.getAllByText(/Preserve the weave, not just the photograph/i);
    expect(slogans.length).toBeGreaterThanOrEqual(1);

    // The "4-Shaft Rising-Shed Engine" pill must NOT be rendered
    expect(screen.queryByText(/4-Shaft Rising-Shed Engine/i)).not.toBeInTheDocument();
  });

  it('should render real-time crop resolution feedback and live pixel dimensions on SwatchCropper', async () => {
    render(<App />);

    // 1. Choose synthetic swatch to enter crop step
    const sampleBtn = screen.getByRole('button', { name: /Synthetic Plain Linen/i });
    fireEvent.click(sampleBtn);

    // 2. Wait for crop step
    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    // 3. Floating badge must show live pixel dimensions (e.g. "1:1 Macro • 200×200 px (50%)")
    expect(screen.getByText(/1:1 Macro • 200×200 px/i)).toBeInTheDocument();

    // 4. Quality status message should indicate optimal focus for 200px crop
    expect(screen.getByText(/Optimal macro focus \(200×200 px\)/i)).toBeInTheDocument();

    // 5. "Confirm & Analyze" button must be enabled
    const confirmBtn = screen.getByRole('button', { name: /confirm & analyze/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('should disable Confirm & Analyze when crop resolution is below 100px minimum', async () => {
    render(<App />);

    // Navigate to crop step
    fireEvent.click(screen.getByRole('button', { name: /Synthetic Plain Linen/i }));

    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    // Change crop scale slider to 0.05 (400px * 0.05 = 20px, far below 100px)
    const slider = screen.getByLabelText(/Crop area zoom scale/i);
    fireEvent.change(slider, { target: { value: '0.05' } });

    // Floating badge should update
    expect(screen.getByText(/1:1 Macro • 20×20 px/i)).toBeInTheDocument();

    // Status warning must be displayed
    expect(screen.getByText(/Resolution too low \(20×20 px\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Minimum 100×100 px required for weave analysis/i)).toBeInTheDocument();

    // "Confirm & Analyze" button must be disabled
    const confirmBtn = screen.getByRole('button', { name: /confirm & analyze/i });
    expect(confirmBtn).toBeDisabled();
  });
});
