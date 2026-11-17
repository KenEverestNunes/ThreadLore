import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

describe('Issue #17 - Touch and PointerEvent Support for SwatchCropper and CanvasOverlay', () => {
  beforeEach(() => {
    // Provide safe mocks for pointer capture APIs if missing in JSDOM
    if (!Element.prototype.setPointerCapture) {
      Element.prototype.setPointerCapture = vi.fn();
    }
    if (!Element.prototype.releasePointerCapture) {
      Element.prototype.releasePointerCapture = vi.fn();
    }
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = vi.fn(() => false);
    }
  });

  it('should support touch pointer interactions and touch-none styling on SwatchCropper', async () => {
    render(<App />);

    // Load sample swatch to open SwatchCropper
    fireEvent.click(screen.getByRole('button', { name: /Plain Linen/i }));

    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    const cropBoxBadge = screen.getByText(/1:1 Macro •/i);
    const cropBox = (cropBoxBadge.parentElement?.parentElement ||
      document.querySelector('.cursor-move')) as HTMLElement;
    expect(cropBox).not.toBeNull();

    // Crop box should have touch-none class to prevent touch scroll gestures
    expect(cropBox).toHaveClass('touch-none');

    // Resize handles should have touch-none class
    const handles = document.querySelectorAll('.cursor-nwse-resize, .cursor-nesw-resize');
    expect(handles.length).toBe(4);
    handles.forEach((handle) => {
      expect(handle).toHaveClass('touch-none');
    });

    // Fire pointerDown on the crop box with touch pointerType
    fireEvent.pointerDown(cropBox, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 200,
      clientY: 200,
    });

    // Simulate moving pointer on window
    fireEvent(
      window,
      new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        clientX: 250,
        clientY: 260,
        pointerId: 1,
        pointerType: 'touch',
      })
    );

    // Release pointer
    fireEvent(
      window,
      new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'touch',
      })
    );
  });

  it('should support touch pointer dragging and touch-none styling on CanvasOverlay canvas', async () => {
    render(<App />);

    // Load sample swatch
    fireEvent.click(screen.getByRole('button', { name: /Plain Linen/i }));

    await waitFor(() => {
      expect(screen.getByText(/Square Macro Swatch Crop/i)).toBeInTheDocument();
    });

    // Confirm crop to navigate to Verify & Align
    fireEvent.click(screen.getByRole('button', { name: /confirm & analyze/i }));

    await waitFor(() => {
      expect(screen.getByText(/Interactive Photo & Weave Overlay/i)).toBeInTheDocument();
    });

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Canvas must have touch-none class to prevent viewport panning on touch devices
    expect(canvas).toHaveClass('touch-none');

    // Fire pointerDown on canvas with touch pointerType
    fireEvent.pointerDown(canvas!, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 100,
      clientY: 100,
    });

    // Canvas cursor should switch to cursor-grabbing while dragging
    expect(canvas).toHaveClass('cursor-grabbing');

    // Fire pointerMove
    fireEvent.pointerMove(canvas!, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 130,
      clientY: 140,
    });

    // Fire pointerUp
    fireEvent.pointerUp(canvas!, {
      pointerId: 1,
      pointerType: 'touch',
    });

    // Canvas cursor should return to cursor-grab
    expect(canvas).toHaveClass('cursor-grab');
  });
});
