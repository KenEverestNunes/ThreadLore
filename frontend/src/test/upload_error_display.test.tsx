import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #8 - PhotoUploader Error Display Regression Test', () => {
  it('should render an error banner when a non-image file is uploaded', async () => {
    render(<App />);

    // Initially on Upload step
    expect(screen.getByText(/Upload Textile Swatch Photo/i)).toBeInTheDocument();

    // Select a non-image file (e.g. PDF)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const invalidFile = new File(['%PDF-1.4 dummy content'], 'sample.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    // EXPECTATION: An error banner must appear in PhotoUploader
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Invalid file format/i)).toBeInTheDocument();
    });

    // The user should remain on the Upload screen, NOT transitioning to crop
    expect(screen.getByText(/Upload Textile Swatch Photo/i)).toBeInTheDocument();
    expect(screen.queryByText(/Square Macro Swatch Crop/i)).not.toBeInTheDocument();
  });

  it('should render an error banner when FileReader encounters a reading error', async () => {
    // Temporarily simulate FileReader error
    const originalFileReader = (window as any).FileReader;
    class FailingFileReader {
      onload: ((e: any) => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new ProgressEvent('error') as any);
          }
        }, 10);
      }
    }
    (window as any).FileReader = FailingFileReader;

    try {
      render(<App />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validImageFile = new File(['valid'], 'sample.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [validImageFile] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Failed to read image file/i)).toBeInTheDocument();
      });
    } finally {
      (window as any).FileReader = originalFileReader;
    }
  });
});
