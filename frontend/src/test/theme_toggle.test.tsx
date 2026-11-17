import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('Issue #12: Theme Mode Toggle (Dark / Light / System)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = 'dark';
    vi.restoreAllMocks();
  });

  it('renders theme switcher in header with Light, Dark, and System options', () => {
    render(<App />);

    const lightBtn = screen.getByRole('button', { name: /light theme/i });
    const darkBtn = screen.getByRole('button', { name: /dark theme/i });
    const systemBtn = screen.getByRole('button', { name: /system theme/i });

    expect(lightBtn).toBeInTheDocument();
    expect(darkBtn).toBeInTheDocument();
    expect(systemBtn).toBeInTheDocument();
  });

  it('switches to light theme and removes dark class from documentElement', () => {
    render(<App />);

    const lightBtn = screen.getByRole('button', { name: /light theme/i });
    fireEvent.click(lightBtn);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('threadlore-theme')).toBe('light');
  });

  it('switches to dark theme and adds dark class to documentElement', () => {
    render(<App />);

    const lightBtn = screen.getByRole('button', { name: /light theme/i });
    const darkBtn = screen.getByRole('button', { name: /dark theme/i });

    // Switch to light first
    fireEvent.click(lightBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Switch to dark
    fireEvent.click(darkBtn);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('threadlore-theme')).toBe('dark');
  });
});
