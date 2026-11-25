// icons.js — every picture in The Copper Pot, drawn as original inline SVG.
// No emoji, no copied art: each icon is a small hand-built vector shape.
'use strict';

const CopperIcons = (function () {
  // One icon per ingredient, drawn on a 64x64 grid.
  const INGREDIENT_SVG = {
    onion: [
      '<path d="M32 14 C20 14 14 26 14 36 C14 48 22 56 32 56 C42 56 50 48 50 36 C50 26 44 14 32 14 Z" fill="#b678d8"/>',
      '<path d="M32 14 C26 14 22 24 22 34 C22 45 26 52 32 52" fill="none" stroke="#8e4fb0" stroke-width="2.5" stroke-linecap="round"/>',
      '<path d="M42 34 C42 24 38 14 32 14" fill="none" stroke="#d9a7ee" stroke-width="2.5" stroke-linecap="round"/>',
      '<path d="M32 14 C30 8 30 5 32 2 C34 5 34 8 32 14 Z" fill="#7ec850"/>',
      '<path d="M32 56 L32 60" stroke="#8e4fb0" stroke-width="3" stroke-linecap="round"/>',
    ].join(''),
    mushroom: [
      '<path d="M8 34 C8 18 20 10 32 10 C44 10 56 18 56 34 C56 38 52 40 48 40 L16 40 C12 40 8 38 8 34 Z" fill="#e2574c"/>',
      '<circle cx="22" cy="24" r="4" fill="#ffd9d4"/>',
      '<circle cx="38" cy="20" r="3.4" fill="#ffd9d4"/>',
      '<circle cx="46" cy="30" r="2.8" fill="#ffd9d4"/>',
      '<path d="M26 40 L24 54 C24 58 28 60 32 60 C36 60 40 58 40 54 L38 40 Z" fill="#f6ead2"/>',
    ].join(''),
    fish: [
      '<path d="M6 32 L16 24 L20 32 L16 40 Z" fill="#5aa7d6"/>',
      '<path d="M16 32 C22 20 36 14 48 20 C54 23 56 28 56 32 C56 36 54 41 48 44 C36 50 22 44 16 32 Z" fill="#7cc0e8"/>',
      '<path d="M20 32 C26 24 36 20 46 24" fill="none" stroke="#3d7ea6" stroke-width="2" stroke-linecap="round"/>',
      '<circle cx="46" cy="29" r="2.4" fill="#17384e"/>',
      '<path d="M30 32 L36 32" stroke="#3d7ea6" stroke-width="2" stroke-linecap="round"/>',
    ].join(''),
    pepper: [
      '<path d="M18 14 C10 26 12 44 26 52 C34 56 46 54 50 46 C52 40 46 38 42 42 C36 48 28 46 24 38 C20 30 22 20 26 14 Z" fill="#d8402e"/>',
      '<path d="M26 14 C28 8 34 5 40 6 C36 10 32 12 30 16 Z" fill="#5da244"/>',
      '<path d="M20 22 C16 30 18 40 26 46" fill="none" stroke="#f0856f" stroke-width="2.5" stroke-linecap="round"/>',
    ].join(''),
    tomato: [
      '<circle cx="32" cy="36" r="22" fill="#e04536"/>',
      '<path d="M32 16 L28 8 L34 13 L38 6 L38 15 L46 12 L40 18 L48 20 L38 22 L40 30 L33 24 L28 30 L29 22 L20 20 L28 16 Z" fill="#4d9b3a"/>',
      '<path d="M18 30 C14 36 16 44 22 48" fill="none" stroke="#f0856f" stroke-width="2.5" stroke-linecap="round"/>',
    ].join(''),
  };

  // One icon per station, drawn on a 64x64 grid.
  const STATION_SVG = {
    chop: [
      '<rect x="8" y="44" width="48" height="10" rx="3" fill="#a9713f"/>',
      '<rect x="8" y="44" width="48" height="4" rx="2" fill="#c08a52"/>',
      '<path d="M14 40 L40 14 C44 10 50 12 50 16 L50 22 L24 42 Z" fill="#dfe6ea"/>',
      '<path d="M40 14 L50 16" stroke="#8a97a3" stroke-width="2"/>',
      '<rect x="44" y="20" width="12" height="6" rx="3" transform="rotate(35 50 23)" fill="#5a3a22"/>',
    ].join(''),
    grill: [
      '<rect x="10" y="30" width="44" height="6" rx="3" fill="#3c3c46"/>',
      '<rect x="14" y="40" width="36" height="6" rx="3" fill="#3c3c46"/>',
      '<path d="M32 8 C36 14 40 16 40 22 C40 27 36 30 32 30 C28 30 24 27 24 22 C24 16 28 14 32 8 Z" fill="#ff9a3c"/>',
      '<path d="M32 18 C34 21 35 22 35 25 C35 27 33 28 32 28 C31 28 29 27 29 25 C29 22 30 21 32 18 Z" fill="#ffd23c"/>',
      '<path d="M12 50 L52 50" stroke="#8a97a3" stroke-width="3" stroke-linecap="round"/>',
    ].join(''),
    pot: [
      '<path d="M14 26 L50 26 L46 54 C46 58 42 60 38 60 L26 60 C22 60 18 58 18 54 Z" fill="#4a4a58"/>',
      '<ellipse cx="32" cy="26" rx="18" ry="4" fill="#2e2e38"/>',
      '<path d="M12 30 L8 30 M52 30 L56 30" stroke="#8a97a3" stroke-width="4" stroke-linecap="round"/>',
      '<path d="M24 14 C22 18 26 20 24 24 M32 12 C30 16 34 18 32 22 M40 14 C38 18 42 20 40 24" fill="none" stroke="#b9c4cc" stroke-width="2.5" stroke-linecap="round"/>',
    ].join(''),
  };

  const MISC_SVG = {
    coin: '<circle cx="32" cy="32" r="24" fill="#f2b234"/><circle cx="32" cy="32" r="17" fill="none" stroke="#b97f14" stroke-width="3"/><text x="32" y="41" font-size="24" font-weight="bold" text-anchor="middle" fill="#7a5200">C</text>',
    clock: '<circle cx="32" cy="32" r="24" fill="#fff4dd" stroke="#8a5a22" stroke-width="3"/><path d="M32 18 L32 32 L42 38" fill="none" stroke="#8a5a22" stroke-width="3.5" stroke-linecap="round"/>',
    flame: '<path d="M32 6 C38 14 46 18 46 28 C46 38 40 44 32 44 C24 44 18 38 18 28 C18 18 26 14 32 6 Z" fill="#ff9a3c"/><path d="M32 22 C35 26 37 28 37 32 C37 36 35 38 32 38 C29 38 27 36 27 32 C27 28 29 26 32 22 Z" fill="#ffd23c"/>',
    strike: '<path d="M14 14 L50 50 M50 14 L14 50" stroke="#e04536" stroke-width="8" stroke-linecap="round"/>',
    bin: '<path d="M16 18 L48 18 L44 56 L20 56 Z" fill="#6b5a49"/><rect x="12" y="12" width="40" height="6" rx="3" fill="#8a7a66"/><path d="M26 24 L26 50 M38 24 L38 50" stroke="#3f342a" stroke-width="3" stroke-linecap="round"/>',
    check: '<path d="M12 34 L28 48 L52 16" fill="none" stroke="#3f9e4d" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  function svg(body, size) {
    const s = size || 64;
    return '<svg viewBox="0 0 64 64" width="' + s + '" height="' + s + '" aria-hidden="true">' + body + '</svg>';
  }

  return {
    ingredient: function (id, size) { return svg(INGREDIENT_SVG[id] || '', size); },
    station: function (id, size) { return svg(STATION_SVG[id] || '', size); },
    misc: function (id, size) { return svg(MISC_SVG[id] || '', size); },
    ingredientIds: function () { return Object.keys(INGREDIENT_SVG); },
    stationIds: function () { return Object.keys(STATION_SVG); },
  };
})();
