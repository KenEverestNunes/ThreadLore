import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #22 - Logo Navigation to Home Page Regression Test', () => {
  it('should redirect back to the home (upload) page when clicking the brand logo from crop step', async () => {
    render(<App />);

    // Initially on Upload step
    expect(screen.getByText(/Upload Textile Swatch Photo/i)).toBeInTheDocument();

    // Select sample swatch to advance to crop step
    const sampleBtn = screen.getByRole('button', { name: /Plain Linen/i });
    fireEvent.click(sampleBtn);

    // Verify we arrived at the crop step
    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    // The brand logo/header title must be an accessible interactive button
    const brandLogoButton = screen.getByRole('button', { name: /ThreadLore/i });
    expect(brandLogoButton).toBeInTheDocument();

    // Click the logo
    fireEvent.click(brandLogoButton);

    // Expect to be redirected back to the home/first page (Upload Swatch)
    await waitFor(() => {
      expect(screen.getByText(/Upload Textile Swatch Photo/i)).toBeInTheDocument();
    });

    // Verify stepper buttons for subsequent steps are disabled/locked
    expect(screen.getByRole('button', { name: /1:1 Macro Crop/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Verify & Align/i })).toBeDisabled();
  });

  it('should redirect back to the home page when clicking brand logo from verify step', async () => {
    render(<App />);

    // Advance to crop step
    fireEvent.click(screen.getByRole('button', { name: /Plain Linen/i }));
    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    // Advance to verify step
    fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));
    await waitFor(() => {
      expect(screen.getByText(/Human-in-the-Loop Weave Verification/i)).toBeInTheDocument();
    });

    // Click the brand logo in the header
    const brandLogoButton = screen.getByRole('button', { name: /ThreadLore/i });
    fireEvent.click(brandLogoButton);

    // Expect to be back on the initial upload page
    await waitFor(() => {
      expect(screen.getByText(/Upload Textile Swatch Photo/i)).toBeInTheDocument();
    });
  });
});
