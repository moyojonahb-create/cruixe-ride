import { describe, expect, it } from 'vitest';
import { PARCEL_BATCH_20, getParcelScreen } from '@/lib/parcelBatch20Screens';

describe('Second Figma batch of twenty parcel screen states',()=>{
  it('contains twenty distinct Figma nodes and identifiers',()=>{
    expect(PARCEL_BATCH_20).toHaveLength(20);
    expect(new Set(PARCEL_BATCH_20.map(x=>x.id)).size).toBe(20);
    expect(new Set(PARCEL_BATCH_20.map(x=>x.figmaNode)).size).toBe(20);
    for(const screen of PARCEL_BATCH_20){
      expect(screen.title).toBeTruthy();
      expect(screen.primary).toBeTruthy();
      expect(getParcelScreen(screen.id)).toEqual(screen);
    }
  });
  it('allocates eleven driver and nine rider/recipient states',()=>{
    expect(PARCEL_BATCH_20.filter(x=>x.role==='driver')).toHaveLength(11);
    expect(PARCEL_BATCH_20.filter(x=>x.role!=='driver')).toHaveLength(9);
  });
  it('contains no wallet screens or embedded private verification codes',()=>{
    expect(PARCEL_BATCH_20.every(x=> !/wallet/i.test(x.id+x.title))).toBe(true);
    expect(JSON.stringify(PARCEL_BATCH_20)).not.toContain('6284');
  });
});
