import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadWifFile } from '../services/api';

describe('Issue #13 - Offline Client-Side WIF Download', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    } else {
      vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    }

    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    }
  });

  it('should download WIF file offline without triggering a network fetch request to /api/download-wif', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;

    const sampleWifText = '[WIF]\nVersion=1.1\n[TEXT]\nTitle=Offline Textile\n';
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    // EXPECTATION: downloadWifFile must download client-side without calling fetch('/api/download-wif')
    await downloadWifFile(sampleWifText, 'offline_sample.wif');

    // Assert that NO network request was made
    expect(fetchSpy).not.toHaveBeenCalled();

    // Assert that client-side download anchor click was triggered
    expect(clickSpy).toHaveBeenCalled();
  });
});
