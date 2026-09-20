// GET /api/availability -> { capacity, booked: { "2026-10-01": 12, ... } }
import { cfg, json, store, readDay, seatsTaken, todayInCuracao } from './lib/shared.mjs';

export default async () => {
  const s = store();
  const { ymd: today } = todayInCuracao();
  const booked = {};
  const { blobs } = await s.list({ prefix: 'day/' });
  await Promise.all(blobs.map(async ({ key }) => {
    const ymd = key.slice(4);
    if (ymd < today) return;
    const taken = seatsTaken(await readDay(s, ymd));
    if (taken) booked[ymd] = taken;
  }));
  return json(200, { capacity: cfg.capacity, booked });
};

export const config = { path: '/api/availability' };
