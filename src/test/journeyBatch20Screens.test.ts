import { describe, expect, it } from 'vitest';
import { getJourneyScreen, JOURNEY_BATCH_20 } from '@/lib/journeyBatch20Screens';
describe('20 Figma journey-state foundations',()=>{
  it('contains exactly 20 uniquely identified and sourced screens',()=>{
    expect(JOURNEY_BATCH_20).toHaveLength(20);
    expect(new Set(JOURNEY_BATCH_20.map(s=>s.id)).size).toBe(20);
    expect(new Set(JOURNEY_BATCH_20.map(s=>s.figmaNode)).size).toBe(20);
    for(const screen of JOURNEY_BATCH_20){
      expect(screen.title).toBeTruthy();
      expect(screen.primary).toBeTruthy();
      expect(screen.secondary).toBeTruthy();
      expect(getJourneyScreen(screen.id)).toBe(screen);
    }
  });
  it('never includes a wallet screen',()=>{
    expect(JOURNEY_BATCH_20.every(screen => !/wallet/i.test(screen.id+' '+screen.title))).toBe(true);
  });
});
