import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WeaveProvider } from '../context/WeaveContext';
import { MasterTileEditor } from '../components/MasterTileEditor';

const MockContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <WeaveProvider>{children}</WeaveProvider>;
};

describe('Issue #6: Master Tile Real-Time Float and Structural Validation', () => {
  it('modularly wraps weave pattern when repeat size is changed instead of appending empty 0s', () => {
    render(
      <MockContextWrapper>
        <MasterTileEditor />
      </MockContextWrapper>
    );

    // Initial state is 2x2 Plain weave:
    // Row 1: [1, 0]
    // Row 2: [0, 1]
    expect(screen.getByText(/Interactive Master Tile Editor \(2×2\)/i)).toBeInTheDocument();

    // Click 3x3 repeat button
    const threeByThreeBtn = screen.getByRole('button', { name: /^3×3$/i });
    fireEvent.click(threeByThreeBtn);

    expect(screen.getByText(/Interactive Master Tile Editor \(3×3\)/i)).toBeInTheDocument();

    // Should NOT have uniform row error / warning
    expect(screen.queryByText(/Pick \(Row\) 3 is entirely unraised/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/End \(Column\) 3 is entirely down/i)).not.toBeInTheDocument();

    // The wrapped 3x3 matrix from 2x2 plain weave should have Pick 3, End 1 as Warp Over (1)
    const pick3End1 = screen.getByTitle(/Pick 3, End 1: Warp Over/i);
    expect(pick3End1).toBeInTheDocument();
    expect(pick3End1).toHaveTextContent('1');
  });

  it('displays real-time structural warning when a row is modified to be entirely uniform (all 0s)', () => {
    render(
      <MockContextWrapper>
        <MasterTileEditor />
      </MockContextWrapper>
    );

    // Initial 2x2 plain weave is valid
    expect(screen.getByText(/Structure Valid/i)).toBeInTheDocument();

    // Pick 1, End 1 is currently 1 (Warp Over). Click it to toggle to 0.
    const pick1End1 = screen.getByTitle(/Pick 1, End 1/i);
    fireEvent.click(pick1End1);

    // Now Pick 1 is [0, 0] (all 0s, uniform row)
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Pick \(Row\) 1 is entirely unraised \(all 0s\)/i)).toBeInTheDocument();

    // Toggle Pick 1 End 1 back to 1
    fireEvent.click(pick1End1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/Structure Valid/i)).toBeInTheDocument();
  });

  it('displays real-time structural warning when a column is modified to be entirely uniform (all 1s)', () => {
    render(
      <MockContextWrapper>
        <MasterTileEditor />
      </MockContextWrapper>
    );

    // Pick 2, End 1 is currently 0 (Weft Over). Click it to toggle to 1.
    const pick2End1 = screen.getByTitle(/Pick 2, End 1/i);
    fireEvent.click(pick2End1);

    // Now Column 1 is [1, 1] (all 1s, uniform col)
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/End \(Column\) 1 is entirely up \(all 1s\)/i)).toBeInTheDocument();
  });
});
