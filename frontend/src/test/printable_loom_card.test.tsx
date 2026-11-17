import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoomDraftCard } from '../components/LoomDraftCard';
import { WeaveProvider } from '../context/WeaveContext';
import { CompileDraftResponse } from '../types/weave';

const mockCompiledResult: CompileDraftResponse = {
  is_valid: true,
  validation_errors: [],
  validation_warnings: [],
  draft: {
    shafts: 4,
    treadles: 4,
    warp_threads: 16,
    weft_picks: 16,
    threading: [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4],
    tieup: [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 1],
      [1, 0, 0, 1],
    ],
    treadling: [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4],
    drawdown: Array(16).fill(Array(16).fill(1)),
  },
  wif_text: '[WIF]\nVersion=1.1',
};

describe('Issue #9 - Printable Physical Loom Bench Card', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.print = vi.fn();
  });

  it('renders a "Print Loom Card" action button and triggers window.print on click', () => {
    render(
      <WeaveProvider initialCompiledResult={mockCompiledResult}>
        <LoomDraftCard />
      </WeaveProvider>
    );

    // Look for the Print Loom Card button
    const printButton = screen.getByRole('button', { name: /Print Loom Card/i });
    expect(printButton).toBeInTheDocument();

    // Clicking it triggers window.print()
    fireEvent.click(printButton);
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('contains printable bench draft sheet header and specs for handweavers', () => {
    render(
      <WeaveProvider initialCompiledResult={mockCompiledResult}>
        <LoomDraftCard />
      </WeaveProvider>
    );

    const benchSheetHeader = screen.getByTestId('printable-bench-sheet');
    expect(benchSheetHeader).toBeInTheDocument();
    expect(benchSheetHeader).toHaveClass('print:block');
    expect(screen.getByText(/Bench Sheet/i)).toBeInTheDocument();
  });
});
