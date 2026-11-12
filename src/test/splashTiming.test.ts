import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const html = readFileSync('index.html', 'utf8');
const script = html.match(/<script>\s*\/\/ Wait for app bootstrap[\s\S]*?<\/script>/)![0].replace(/^<script>|<\/script>$/g, '');
describe('launch screen timing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="instant-splash"></div><div id="instant-splash-2" aria-hidden="true"></div><div id="instant-splash-bg"></div>';
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    new Function(script)();
  });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); document.body.innerHTML = ''; });
  it('holds the first splash for five seconds and the second for three', () => {
    (window as any).__dismissSplash();
    vi.advanceTimersByTime(4999);
    expect(document.getElementById('instant-splash-2')?.getAttribute('aria-hidden')).toBe('true');
    vi.advanceTimersByTime(1);
    expect(document.getElementById('instant-splash-2')?.style.opacity).toBe('1');
    vi.advanceTimersByTime(2999);
    expect(document.getElementById('instant-splash-2')?.style.opacity).toBe('1');
    vi.advanceTimersByTime(1);
    expect(document.getElementById('instant-splash-2')?.style.opacity).toBe('0');
  });
  it('retains the bootstrap fallback and does not restart the second screen', () => {
    vi.advanceTimersByTime(8000);
    expect(document.getElementById('instant-splash-2')?.style.opacity).toBe('1');
    (window as any).__dismissSplash();
    vi.advanceTimersByTime(3000);
    expect(document.getElementById('instant-splash-2')?.style.opacity).toBe('0');
  });
});
