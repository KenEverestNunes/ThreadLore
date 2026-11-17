import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Canvas 2D context in jsdom
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}) as any;

HTMLCanvasElement.prototype.toBlob = vi.fn(function (
  this: HTMLCanvasElement,
  callback: (blob: Blob | null) => void,
  type?: string
) {
  const blob = new Blob(['mock-binary-data'], { type: type || 'image/jpeg' });
  callback(blob);
});

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mock');

// Mock FileReader
class MockFileReader {
  onload: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  readAsDataURL(_blob: Blob) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: 'data:image/jpeg;base64,sample-data-url' } });
      }
    }, 10);
  }
}
(window as any).FileReader = MockFileReader;

// Mock Clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

// Mock global fetch to return safe responses in unit tests
globalThis.fetch = vi.fn((url: string | URL | Request) => {
  const urlStr = url.toString();
  if (urlStr.includes('/api/swatch')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          status: 'success',
          weave_family: 'plain_1_1',
          twill_direction: null,
          repeat_size: 2,
          confidence: 0.95,
          default_matrix: [
            [1, 0],
            [0, 1],
          ],
          technical_description: 'Plain weave 1/1 over-one under-one interlacing.',
          float_risk_notes: null,
          rotation_degrees: 0.0,
          dx_px: 20.0,
          dy_px: 20.0,
          spacing_detected: true,
        }),
    } as Response);
  }

  if (urlStr.includes('/api/compile')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          is_valid: true,
          validation_errors: [],
          draft: {
            shaft_count: 4,
            treadle_count: 4,
            threading: [1, 2, 1, 2],
            tieup: [
              [1, 0, 1, 0],
              [0, 1, 0, 1],
              [1, 0, 1, 0],
              [0, 1, 0, 1],
            ],
            treadling: [1, 2, 1, 2],
            drawdown: [
              [1, 0, 1, 0],
              [0, 1, 0, 1],
              [1, 0, 1, 0],
              [0, 1, 0, 1],
            ],
            color_table: ['#1E293B', '#E2E8F0'],
            warp_colors: [1, 1, 1, 1],
            weft_colors: [2, 2, 2, 2],
          },
          wif_text: '[WIF]\nVersion=1.1\n[TEXT]\nTitle=Preserved Textile Sample\n',
        }),
    } as Response);
  }

  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob(['mock'])),
  } as Response);
}) as any;
