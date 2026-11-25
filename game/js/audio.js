// audio.js — every sound in the game, synthesized live with WebAudio.
// No audio files, no copied music: short oscillator and noise bleeps.
'use strict';

const CopperAudio = (function () {
  let ctx = null;
  let muted = false;
  let sizzleTimer = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // A short pitched blip: freq slides from `from` to `to` over `dur` seconds.
  function blip(from, to, dur, type, gain) {
    const c = ensure();
    if (!c || muted) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const amp = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    amp.gain.setValueAtTime(gain || 0.12, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(amp);
    amp.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // A burst of filtered noise, for sizzles and the chop thock.
  function noise(dur, freq, gain) {
    const c = ensure();
    if (!c || muted) return;
    const t = c.currentTime;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq || 3000;
    filter.Q.value = 0.8;
    const amp = c.createGain();
    amp.gain.setValueAtTime(gain || 0.1, t);
    amp.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(c.destination);
    src.start(t);
  }

  return {
    unlock: function () { ensure(); },
    setMuted: function (m) { muted = !!m; },
    isMuted: function () { return muted; },

    // Chop board: a woody thock.
    thock: function () { noise(0.07, 900, 0.22); blip(180, 90, 0.07, 'triangle', 0.14); },
    // Picking up an ingredient: a soft pop.
    pop: function () { blip(420, 640, 0.08, 'sine', 0.1); },
    // Something landing on the plate: a light clink.
    plink: function () { blip(880, 1320, 0.09, 'triangle', 0.09); },
    // Grill sizzle while a job cooks (short, called on start and on flip).
    sizzle: function () { noise(0.35, 5200, 0.07); },
    // Pot bubbling: a low gurgle.
    bubble: function () { blip(140, 220, 0.16, 'sine', 0.08); noise(0.12, 700, 0.05); },
    // A job finished and ready: a bright two-note chime.
    ready: function () { blip(660, 660, 0.1, 'sine', 0.11); setTimeout(function () { blip(990, 990, 0.14, 'sine', 0.11); }, 90); },
    // Serving a dish: the till ding.
    ding: function () {
      blip(1046, 1046, 0.12, 'sine', 0.13);
      setTimeout(function () { blip(1318, 1318, 0.2, 'sine', 0.13); }, 110);
    },
    // A mistake: wrong station, too early, burnt.
    error: function () { blip(220, 140, 0.18, 'sawtooth', 0.08); },
    // A ticket expired: a low disappointed tone.
    missed: function () { blip(330, 180, 0.4, 'triangle', 0.1); },
    // Rush hour begins.
    rush: function () { blip(392, 392, 0.1, 'square', 0.07); setTimeout(function () { blip(523, 523, 0.1, 'square', 0.07); }, 100); setTimeout(function () { blip(659, 659, 0.16, 'square', 0.07); }, 200); },
    // Day won / day lost.
    win: function () {
      const notes = [523, 659, 784, 1046];
      notes.forEach(function (n, i) { setTimeout(function () { blip(n, n, 0.22, 'sine', 0.12); }, i * 130); });
    },
    lose: function () {
      const notes = [392, 330, 262, 196];
      notes.forEach(function (n, i) { setTimeout(function () { blip(n, n, 0.28, 'triangle', 0.1); }, i * 160); });
    },
  };
})();
