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

  it('renders synchronized descending shaft order (4 down to 1) with visible labels in both threading and tie-up for a 4-shaft twill', () => {
    render(
      <WeaveProvider initialCompiledResult={mockCompiledResult}>
        <LoomDraftCard />
      </WeaveProvider>
    );

    const thLabels = screen.getByLabelText('Threading shaft labels');
    const tuLabels = screen.getByLabelText('Tie-up shaft labels');

    expect(thLabels).toBeInTheDocument();
    expect(tuLabels).toBeInTheDocument();

    // Check shaft labels descending order: S4, S3, S2, S1
    const thText = thLabels.textContent || '';
    const tuText = tuLabels.textContent || '';

    expect(thText).toBe('S4S3S2S1');
    expect(tuText).toBe('S4S3S2S1');
  });

  it('renders synchronized 2-shaft order (2 down to 1) without orphaned rows for a 2-shaft plain weave', () => {
    const plainWeave2Shafts: CompileDraftResponse = {
      is_valid: true,
      validation_errors: [],
      validation_warnings: [],
      draft: {
        shafts: 2,
        treadles: 2,
        warp_threads: 8,
        weft_picks: 8,
        threading: [1, 2, 1, 2, 1, 2, 1, 2],
        tieup: [
          [1, 0],
          [0, 1],
        ],
        treadling: [1, 2, 1, 2, 1, 2, 1, 2],
        drawdown: [
          [1, 0, 1, 0, 1, 0, 1, 0],
          [0, 1, 0, 1, 0, 1, 0, 1],
        ],
      },
      wif_text: '[WIF]\nVersion=1.1',
    };

    render(
      <WeaveProvider initialCompiledResult={plainWeave2Shafts}>
        <LoomDraftCard />
      </WeaveProvider>
    );

    const thLabels = screen.getByLabelText('Threading shaft labels');
    const tuLabels = screen.getByLabelText('Tie-up shaft labels');

    // Only S2 and S1 must be rendered for a 2-shaft draft
    expect(thLabels.textContent).toBe('S2S1');
    expect(tuLabels.textContent).toBe('S2S1');
  });
});
