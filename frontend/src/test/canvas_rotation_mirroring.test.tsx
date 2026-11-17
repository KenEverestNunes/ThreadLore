import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WeaveProvider } from '../context/WeaveContext';
import { CanvasOverlay } from '../components/CanvasOverlay';

const MockContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <WeaveProvider>{children}</WeaveProvider>;
};

describe('Issue #4: Canvas Overlay Fine Rotation Angle and Wale Mirroring', () => {
  beforeEach(() => {
    // Reset mocks
  });

  it('renders fine rotation angle slider with range from -15 to +15 and 0.1 step', () => {
    render(
      <MockContextWrapper>
        <CanvasOverlay />
      </MockContextWrapper>
    );

    const rotationSlider = screen.getByRole('slider', { name: /fine rotation angle/i });
    expect(rotationSlider).toBeInTheDocument();
    expect(rotationSlider).toHaveAttribute('min', '-15');
    expect(rotationSlider).toHaveAttribute('max', '15');
    expect(rotationSlider).toHaveAttribute('step', '0.1');
    expect(rotationSlider).toHaveValue('0');

    // Change angle to 4.5 degrees
    fireEvent.change(rotationSlider, { target: { value: '4.5' } });
    expect(screen.getByText(/\+4\.5°|4\.5°/)).toBeInTheDocument();
  });

  it('renders mirror twill wale toggle button and toggles state', () => {
    render(
      <MockContextWrapper>
        <CanvasOverlay />
      </MockContextWrapper>
    );

    const mirrorButton = screen.getByRole('button', { name: /mirror twill wale/i });
    expect(mirrorButton).toBeInTheDocument();

    // Default state: Z-Wale or not mirrored
    expect(screen.getByText(/Z-Wale|Normal/i)).toBeInTheDocument();

    // Toggle mirroring
    fireEvent.click(mirrorButton);

    // Mirrored state: S-Wale or Mirrored
    expect(screen.getByText(/S-Wale|Mirrored/i)).toBeInTheDocument();

    // Toggle back
    fireEvent.click(mirrorButton);
    expect(screen.getByText(/Z-Wale|Normal/i)).toBeInTheDocument();
  });

  it('resets fine rotation angle and wale mirroring when Reset Alignment is clicked', () => {
    render(
      <MockContextWrapper>
        <CanvasOverlay />
      </MockContextWrapper>
    );

    const rotationSlider = screen.getByRole('slider', { name: /fine rotation angle/i });
    const mirrorButton = screen.getByRole('button', { name: /mirror twill wale/i });
    const resetButton = screen.getByRole('button', { name: /reset alignment/i });

    // Set non-default values
    fireEvent.change(rotationSlider, { target: { value: '-6.2' } });
    fireEvent.click(mirrorButton);

    expect(screen.getByText(/-6\.2°/)).toBeInTheDocument();
    expect(screen.getByText(/S-Wale|Mirrored/i)).toBeInTheDocument();

    // Click reset
    fireEvent.click(resetButton);

    expect(screen.getByText(/0\.0°|0°/)).toBeInTheDocument();
    expect(screen.getByText(/Z-Wale|Normal/i)).toBeInTheDocument();
  });
});
