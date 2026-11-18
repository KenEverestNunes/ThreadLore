import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Real Macro Photo Sample Buttons in PhotoUploader', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should render 1-click buttons for Real Tartan Plaid and Real Denim', () => {
    render(<App />);

    const tartanBtn = screen.getByRole('button', { name: /Real Tartan Plaid/i });
    const denimBtn = screen.getByRole('button', { name: /Real Denim/i });

    expect(tartanBtn).toBeInTheDocument();
    expect(denimBtn).toBeInTheDocument();
  });

  it('should fetch and ingest real sample photo when clicked', async () => {
    const dummyBlob = new Blob(['fake-jpg-binary'], { type: 'image/jpeg' });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => dummyBlob,
    } as unknown as Response);

    render(<App />);

    const tartanBtn = screen.getByRole('button', { name: /Real Tartan Plaid/i });
    fireEvent.click(tartanBtn);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/samples/tartan_2_2_twill.jpg');
    });
  });
});
