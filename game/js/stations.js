// stations.js — the three cooking stations: chop board, grill, pot.
// Each station holds one job at a time. A job is pure state; this file
// starts jobs, answers clicks on them, and advances them in time.
'use strict';

const CopperStations = (function () {
  const CHOP_CLICKS = 3;      // chops to finish one ingredient
  const GRILL_MS = 6000;      // grill bar fills in 6 seconds
  const GRILL_MIN = 55;       // flip zone starts here (percent)
  const GRILL_MAX = 100;      // past this the food burns
  const POT_MS = 4000;        // pot finishes on its own in 4 seconds
  const STIR_CUT_MS = 1500;   // each stir shaves 1.5 seconds off the pot

  function createStations() {
    const out = {};
    for (const s of CopperRecipes.STATIONS) out[s.id] = null;
    return out;
  }

  function isBusy(stations, stationId) {
    return !!stations[stationId];
  }

  // Start cooking `ingredientId` on `stationId`. Returns {ok} or {error}.
  function startJob(stations, stationId, ingredientId) {
    const ing = CopperRecipes.ingredient(ingredientId);
    const st = CopperRecipes.station(stationId);
    if (!ing || !st) return { error: 'unknown' };
    if (stations[stationId]) return { error: 'busy' };
    if (ing.station !== stationId) return { error: 'wrong-station', want: ing.station };
    const job = { ingredient: ingredientId, station: stationId, startedAt: 0, elapsedMs: 0, clicks: 0, done: false, burnt: false };
    stations[stationId] = job;
    return { ok: true, job: job };
  }

  // One click on a station's job. Returns what happened.
  // chop: each click chops; grill: a flip (only in the green zone);
  // pot: a stir that hurries the simmer.
  function stationClick(stations, stationId) {
    const job = stations[stationId];
    if (!job) return { error: 'empty' };
    if (job.station === 'chop') {
      job.clicks++;
      if (job.clicks >= CHOP_CLICKS) { job.done = true; return { done: true, job: job }; }
      return { chopped: true, clicks: job.clicks, need: CHOP_CLICKS };
    }
    if (job.station === 'grill') {
      const pct = (job.elapsedMs / GRILL_MS) * 100;
      if (pct < GRILL_MIN) return { error: 'too-early', pct: pct };
      job.done = true;
      return { done: true, job: job };
    }
    // pot
    job.elapsedMs += STIR_CUT_MS;
    if (job.elapsedMs >= POT_MS) { job.done = true; return { done: true, job: job }; }
    return { stirred: true, remainingMs: POT_MS - job.elapsedMs };
  }

  // Advance all jobs by dtMs. Returns finished and burnt jobs.
  // Finished jobs are lifted out of their station by the caller.
  function tickStations(stations, dtMs) {
    const finished = [];
    const burnt = [];
    for (const id of Object.keys(stations)) {
      const job = stations[id];
      if (!job || job.done) continue;
      job.elapsedMs += dtMs;
      if (job.station === 'grill') {
        if (job.elapsedMs > GRILL_MS) { job.burnt = true; burnt.push(job); }
      } else if (job.station === 'pot') {
        if (job.elapsedMs >= POT_MS) { job.done = true; finished.push(job); }
      }
      // chop only advances by clicks, never by time
    }
    return { finished: finished, burnt: burnt };
  }

  // Progress 0..1 for the station's bar (chop by clicks, grill/pot by time).
  function progress(job) {
    if (!job) return 0;
    if (job.station === 'chop') return Math.min(1, job.clicks / CHOP_CLICKS);
    if (job.station === 'grill') return Math.min(1, job.elapsedMs / GRILL_MS);
    return Math.min(1, job.elapsedMs / POT_MS);
  }

  // Is the grill inside its flip zone right now?
  function grillInZone(job) {
    if (!job || job.station !== 'grill') return false;
    const pct = (job.elapsedMs / GRILL_MS) * 100;
    return pct >= GRILL_MIN && pct <= GRILL_MAX;
  }

  function clearJob(stations, stationId) {
    const job = stations[stationId];
    stations[stationId] = null;
    return job;
  }

  return {
    CHOP_CLICKS: CHOP_CLICKS,
    GRILL_MS: GRILL_MS,
    GRILL_MIN: GRILL_MIN,
    GRILL_MAX: GRILL_MAX,
    POT_MS: POT_MS,
    createStations: createStations,
    isBusy: isBusy,
    startJob: startJob,
    stationClick: stationClick,
    tickStations: tickStations,
    progress: progress,
    grillInZone: grillInZone,
    clearJob: clearJob,
  };
})();
