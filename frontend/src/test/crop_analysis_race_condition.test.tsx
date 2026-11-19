import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { WeaveProvider, useWeave } from '../context/WeaveContext';
import * as api from '../services/api';

const MockWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <WeaveProvider>{children}</WeaveProvider>;
};

describe('Crop Analysis Race Condition Guard Regression Test', () => {
  it('discards out-of-order analysis responses when a newer crop completes first', async () => {
    let resolveFirst!: (value: any) => void;
    let resolveSecond!: (value: any) => void;

    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    let callCount = 0;
    vi.spyOn(api, 'analyzeSwatch').mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return firstPromise as any;
      }
      return secondPromise as any;
    });

    const { result } = renderHook(() => useWeave(), { wrapper: MockWrapper });

    const blob1 = new Blob(['img1'], { type: 'image/jpeg' });
    const blob2 = new Blob(['img2'], { type: 'image/jpeg' });

    // 1. User starts crop analysis 1
    act(() => {
      result.current.handleCropComplete(blob1, 'data:image/jpeg;base64,img1');
    });

    expect(result.current.isAnalyzing).toBe(true);

    // 2. User quickly selects a new crop and starts analysis 2
    act(() => {
      result.current.handleCropComplete(blob2, 'data:image/jpeg;base64,img2');
    });

    // 3. Request 2 finishes FIRST with twill_2_2 and #00FF00
    await act(async () => {
      resolveSecond({
        status: 'success',
        weave_family: 'twill_2_2',
        twill_direction: 'Z',
        repeat_size: 4,
        confidence: 0.9,
        default_matrix: [
          [1, 1, 0, 0],
          [0, 1, 1, 0],
          [0, 0, 1, 1],
          [1, 0, 0, 1],
        ],
        dominant_warp_hex: '#00FF00',
        dominant_weft_hex: '#FFFFFF',
        technical_description: '2/2 Twill',
        float_risk_notes: null,
        rotation_degrees: 0.0,
        dx_px: 25.0,
        dy_px: 25.0,
        spacing_detected: true,
      });
    });

    expect(result.current.activePreset).toBe('twill_2_2');
    expect(result.current.warpColor).toBe('#00FF00');
    expect(result.current.isAnalyzing).toBe(false);

    // 4. Request 1 finishes LATER with plain_1_1 and #FF0000
    await act(async () => {
      resolveFirst({
        status: 'success',
        weave_family: 'plain_1_1',
        twill_direction: null,
        repeat_size: 2,
        confidence: 0.8,
        default_matrix: [
          [1, 0],
          [0, 1],
        ],
        dominant_warp_hex: '#FF0000',
        dominant_weft_hex: '#000000',
        technical_description: 'Plain weave',
        float_risk_notes: null,
        rotation_degrees: 0.0,
        dx_px: 15.0,
        dy_px: 15.0,
        spacing_detected: true,
      });
    });

    // EXPECTATION: Stale Request 1 response must NOT overwrite Request 2!
    expect(result.current.activePreset).toBe('twill_2_2');
    expect(result.current.warpColor).toBe('#00FF00');
    expect(result.current.isAnalyzing).toBe(false);
  });
});
