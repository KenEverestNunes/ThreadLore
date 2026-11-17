import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeaveProvider } from '../context/WeaveContext';
import { LoomDraftCard } from '../components/LoomDraftCard';
import { CompileDraftResponse } from '../types/weave';

const mockLargeDraftResponse: CompileDraftResponse = {
  is_valid: true,
  validation_errors: [],
  validation_warnings: [],
  draft: {
    shafts: 4,
    treadles: 4,
    warp_threads: 64,
    weft_picks: 48,
    threading: Array.from({ length: 64 }, (_, i) => (i % 4) + 1),
    tieup: [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 1],
      [1, 0, 0, 1],
    ],
    treadling: Array.from({ length: 48 }, (_, i) => (i % 4) + 1),
    drawdown: Array.from({ length: 48 }, () => Array.from({ length: 64 }, (_, j) => (j % 2))),
  },
  wif_text: 'mock wif plaintext',
};

describe('Issue #11: Drawdown and Treadling Previews Zoom & Scale Controls', () => {
  it('renders zoom controls (Small, Medium, Large)', () => {
    render(
      <WeaveProvider initialCompiledResult={mockLargeDraftResponse}>
        <LoomDraftCard />
      </WeaveProvider>
    );

    const zoomSmall = screen.getByRole('button', { name: /small zoom|small \(5px\)|zoom small/i });
    const zoomMedium = screen.getByRole('button', { name: /medium zoom|medium \(8px\)|zoom medium/i });
    const zoomLarge = screen.getByRole('button', { name: /large zoom|large \(14px\)|zoom large/i });

    expect(zoomSmall).toBeInTheDocument();
    expect(zoomMedium).toBeInTheDocument();
    expect(zoomLarge).toBeInTheDocument();

    // Clicking Large activates large scale
    fireEvent.click(zoomLarge);
    expect(zoomLarge).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders scale preview banner and full drawdown view toggle when draft exceeds 60 ends', () => {
    render(
      <WeaveProvider initialCompiledResult={mockLargeDraftResponse}>
        <LoomDraftCard />
      </WeaveProvider>
    );

    // Initial state shows preview banner
    expect(screen.getByText(/showing preview/i)).toBeInTheDocument();

    const fullToggle = screen.getByRole('button', { name: /show full project|view full project/i });
    expect(fullToggle).toBeInTheDocument();

    // Toggle to full project view
    fireEvent.click(fullToggle);

    expect(screen.getByText(/showing full project/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show preview/i })).toBeInTheDocument();
  });
});
