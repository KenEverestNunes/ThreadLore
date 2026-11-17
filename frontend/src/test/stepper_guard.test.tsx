import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #3 - Stepper Crop Guard Regression Test', () => {
  it('should keep "Verify & Align" stepper button disabled when raw image is present but not yet cropped', async () => {
    render(<App />);

    // Initially on Upload step
    expect(screen.getByText(/Upload Textile Swatch Photo/i)).toBeInTheDocument();

    // Click sample swatch button to transition to "crop" step
    const sampleBtn = screen.getByRole('button', { name: /Plain Linen/i });
    fireEvent.click(sampleBtn);

    // Wait until we reach the 1:1 Macro Crop step
    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    // The user has NOT confirmed the crop yet; croppedImageUrl is null
    const verifyStepButton = screen.getByRole('button', { name: /verify & align/i });

    // EXPECTATION: The "Verify & Align" step MUST be disabled until crop is confirmed
    expect(verifyStepButton).toBeDisabled();

    // Clicking it must not navigate to the verification panel
    fireEvent.click(verifyStepButton);
    expect(screen.queryByText(/Human-in-the-Loop Weave Verification/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
  });

  it('should enable "Verify & Align" step after crop is confirmed', async () => {
    render(<App />);

    // Select sample swatch
    fireEvent.click(screen.getByRole('button', { name: /Plain Linen/i }));

    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    const verifyStepButton = screen.getByRole('button', { name: /verify & align/i });
    expect(verifyStepButton).toBeDisabled();

    // Confirm crop
    const confirmCropBtn = screen.getByRole('button', { name: /confirm & analyze/i });
    fireEvent.click(confirmCropBtn);

    // After confirming, we transition to verify step
    await waitFor(() => {
      expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
    });

    // Verify step button in stepper should now be enabled and active
    expect(verifyStepButton).toBeEnabled();

    // Can navigate back to crop
    const cropStepButton = screen.getByRole('button', { name: /1:1 macro crop/i });
    expect(cropStepButton).toBeEnabled();
    fireEvent.click(cropStepButton);

    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    // And navigate back to verify since crop was already established
    fireEvent.click(verifyStepButton);
    await waitFor(() => {
      expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
    });
  });
});
