// Unexpected service traffic is forbidden. Individual tests may replace these
// with explicit in-memory mocks; this is not authenticated integration evidence.
import { vi } from 'vitest';
vi.stubGlobal('fetch', vi.fn(async () => {
  throw new Error('ISOLATED TEST: unexpected network request blocked');
}));
vi.stubGlobal('WebSocket', class {
  constructor() { throw new Error('ISOLATED TEST: live WebSocket blocked'); }
});
