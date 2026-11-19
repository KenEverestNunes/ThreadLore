import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import React from 'react';
import { WeaveProvider, useWeave } from '../context/WeaveContext';
import { CanvasOverlay } from '../components/CanvasOverlay';

const MockContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <WeaveProvider>{children}</WeaveProvider>;
};

describe('Twill Wale Mirroring & Canvas Coordinate Scaling Regression Tests', () => {
  it('mirrorMasterMatrix updates masterMatrix in WeaveContext by horizontally reversing each row', () => {
    const { result } = renderHook(() => useWeave(), {
      wrapper: MockContextWrapper,
    });

    // Default plain weave is [[1, 0], [0, 1]]
    expect(result.current.masterMatrix).toEqual([
      [1, 0],
      [0, 1],
    ]);

    // Mirroring reverses rows -> [[0, 1], [1, 0]]
    act(() => {
      result.current.mirrorMasterMatrix();
    });

    expect(result.current.masterMatrix).toEqual([
      [0, 1],
      [1, 0],
    ]);

    // Mirroring again restores original rows
    act(() => {
      result.current.mirrorMasterMatrix();
    });

    expect(result.current.masterMatrix).toEqual([
      [1, 0],
      [0, 1],
    ]);
  });

  it('clicking Mirror Twill Wale button in CanvasOverlay updates masterMatrix and toggles label', () => {
    let capturedMatrix: number[][] = [];
    const Inspector = () => {
      const { masterMatrix } = useWeave();
      capturedMatrix = masterMatrix;
      return <div data-testid="matrix-view">{JSON.stringify(masterMatrix)}</div>;
    };

    render(
      <MockContextWrapper>
        <Inspector />
        <CanvasOverlay />
      </MockContextWrapper>
    );

    // Initial matrix is [[1, 0], [0, 1]]
    expect(capturedMatrix).toEqual([
      [1, 0],
      [0, 1],
    ]);

    const mirrorBtn = screen.getByRole('button', { name: /mirror twill wale/i });
    expect(screen.getByText(/Normal \(Z-Wale\)/i)).toBeInTheDocument();

    // Click mirror button
    fireEvent.click(mirrorBtn);

    // State reflects mirrored wale
    expect(screen.getByText(/Mirrored \(S-Wale\)/i)).toBeInTheDocument();
    // masterMatrix in WeaveContext is updated for compiler & editor
    expect(capturedMatrix).toEqual([
      [0, 1],
      [1, 0],
    ]);

    // Click again to restore
    fireEvent.click(mirrorBtn);
    expect(screen.getByText(/Normal \(Z-Wale\)/i)).toBeInTheDocument();
    expect(capturedMatrix).toEqual([
      [1, 0],
      [0, 1],
    ]);
  });
});
