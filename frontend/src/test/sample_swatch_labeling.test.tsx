import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Issue #20 - Sample Swatch Synthetic/Simulated Labeling Regression Test', () => {
  it('should explicitly label procedurally generated sample buttons as Synthetic or Simulated', () => {
    render(<App />);

    // In the broken implementation, sample buttons were misleadingly labeled without "Synthetic" or "Simulated":
    // "Plain Linen (1/1)" and "Harris Tweed (2/2 Twill)"
    // EXPECTATION: Buttons must be transparently labeled as Synthetic and Simulated
    const syntheticPlainBtn = screen.getByRole('button', { name: /Synthetic Plain Linen/i });
    const simulatedTwillBtn = screen.getByRole('button', { name: /Simulated.*Twill/i });

    expect(syntheticPlainBtn).toBeInTheDocument();
    expect(simulatedTwillBtn).toBeInTheDocument();
  });
});
