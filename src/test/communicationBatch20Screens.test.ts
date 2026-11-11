import {describe,expect,it} from 'vitest';
import {COMMUNICATION_BATCH_20,getCommunicationState} from '@/lib/communicationBatch20Screens';
describe('20 Figma communication states',()=>{
 it('contains exactly twenty distinct nodes and IDs',()=>{
  expect(COMMUNICATION_BATCH_20).toHaveLength(20);
  expect(new Set(COMMUNICATION_BATCH_20.map(s=>s.id)).size).toBe(20);
  expect(new Set(COMMUNICATION_BATCH_20.map(s=>s.figmaNode)).size).toBe(20);
  COMMUNICATION_BATCH_20.forEach(s=>expect(getCommunicationState(s.id)).toEqual(s));
 });
 it('is correctly partitioned without wallets',()=>{
  expect(COMMUNICATION_BATCH_20.filter(s=>s.role==='rider')).toHaveLength(6);
  expect(COMMUNICATION_BATCH_20.filter(s=>s.role==='sender')).toHaveLength(6);
  expect(COMMUNICATION_BATCH_20.filter(s=>s.role==='recipient')).toHaveLength(6);
  expect(COMMUNICATION_BATCH_20.filter(s=>s.role==='student')).toHaveLength(2);
  expect(COMMUNICATION_BATCH_20.every(s=>!/wallet/i.test(s.title))).toBe(true);
 });
});
