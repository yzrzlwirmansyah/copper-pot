// render.js — turns game state into DOM. It builds HTML strings and lets
// game.js own the single delegated click listener, so re-renders never
// drop a handler. Every screen is a real render of the game's own code.
'use strict';

const CopperRender = (function () {
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtClock(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // One component chip on a ticket: ingredient icon, a small station mark,
  // checked off when the plate already holds it. The next component the
  // cook still needs is marked, so the eye knows where to go next.
  function chipHtml(ingId, status, stationId) {
    const ing = CopperRecipes.ingredient(ingId);
    const cls = status === 'done' ? 'chip done' : status === 'next' ? 'chip next' : 'chip';
    const mark = status === 'done' ? '<span class="chip-check">✓</span>' : '';
    return '<span class="' + cls + '" title="' + esc(ing.name) + ' → ' + esc(CopperRecipes.station(stationId).name) + '">' +
      '<span class="chip-icon">' + CopperIcons.ingredient(ingId, 30) + '</span>' +
      '<span class="chip-station">' + CopperIcons.station(stationId, 16) + '</span>' + mark + '</span>';
  }

  function ticketHtml(ticket, state) {
    const recipe = CopperRecipes.recipe(ticket.recipeId);
    const progress = CopperRecipes.plateProgress(state.plate, ticket.recipeId);
    const selected = state.selectedTicketId === ticket.id;
    const frac = Math.max(0, ticket.remainingMs / ticket.totalMs);
    const urgent = ticket.remainingMs < 12000;
    const chips = recipe.components.map(function (c) {
      const ing = CopperRecipes.ingredient(c);
      const status = progress.done.indexOf(c) >= 0 ? 'done'
        : (selected && progress.todo[0] === c) ? 'next' : 'todo';
      return chipHtml(c, status, ing.station);
    }).join('<span class="chip-arrow">›</span>');
    return '<div class="ticket' + (urgent ? ' urgent' : '') + (selected ? ' selected' : '') + '" data-action="ticket" data-id="' + ticket.id + '">' +
      '<div class="ticket-ring" style="--frac:' + frac.toFixed(3) + '"><span>' + Math.ceil(ticket.remainingMs / 1000) + '</span></div>' +
      '<div class="ticket-body"><div class="ticket-name">' + esc(recipe.name) + '</div>' +
      '<div class="ticket-chips">' + chips + '</div></div>' +
      '<div class="ticket-coins">' + CopperIcons.misc('coin', 20) + '<b>' + recipe.coins + '</b></div></div>';
  }

  function binsHtml(state) {
    return CopperRecipes.INGREDIENTS.map(function (g) {
      const selectedTicket = state.selectedTicketId != null
        ? CopperOrders.ticketById(state.orders, state.selectedTicketId) : null;
      let needed = false;
      if (selectedTicket) {
        const p = CopperRecipes.plateProgress(state.plate, selectedTicket.recipeId);
        needed = p.todo.indexOf(g.id) >= 0;
      }
      const held = state.hand === g.id;
      return '<button class="bin' + (held ? ' held' : '') + (needed ? ' needed' : '') + '" data-action="bin" data-id="' + g.id + '" title="' + esc(g.name) + ' — ' + esc(g.blurb) + ' (key ' + g.key + ')">' +
        '<span class="bin-icon">' + CopperIcons.ingredient(g.id, 46) + '</span>' +
        '<span class="bin-name">' + esc(g.name) + '</span>' +
        '<span class="bin-station">' + CopperIcons.station(g.station, 18) + ' ' + esc(CopperRecipes.station(g.station).name) + '</span>' +
        '<span class="bin-key">' + g.key + '</span></button>';
    }).join('');
  }

  function stationsHtml(state) {
    return CopperRecipes.STATIONS.map(function (s) {
      const job = state.stations[s.id];
      const selectedTicket = state.selectedTicketId != null
        ? CopperOrders.ticketById(state.orders, state.selectedTicketId) : null;
      let highlight = false;
      if (selectedTicket) {
        const p = CopperRecipes.plateProgress(state.plate, selectedTicket.recipeId);
        if (p.todo.length > 0) {
          const nextIng = CopperRecipes.ingredient(p.todo[0]);
          highlight = nextIng && nextIng.station === s.id && !job;
        }
      }
      let body = '';
      if (!job) {
        body = '<div class="station-empty">Empty — click a bin,<br>then click here</div>';
      } else {
        const pct = Math.round(CopperStations.progress(job) * 100);
        const ing = CopperRecipes.ingredient(job.ingredient);
        let action = '';
        if (job.station === 'chop') {
          action = '<div class="station-action">Chop! ' + job.clicks + ' / ' + CopperStations.CHOP_CLICKS + '</div>';
        } else if (job.station === 'grill') {
          const inZone = CopperStations.grillInZone(job);
          action = '<div class="station-action' + (inZone ? ' in-zone' : '') + '">' + (inZone ? 'FLIP NOW!' : 'Flip in the green zone') + '</div>';
        } else {
          action = '<div class="station-action">Simmering… stir to hurry</div>';
        }
        const zone = job.station === 'grill'
          ? '<div class="grill-zone" style="left:' + CopperStations.GRILL_MIN + '%;width:' + (CopperStations.GRILL_MAX - CopperStations.GRILL_MIN) + '%"></div>' : '';
        body = '<div class="station-job"><span class="job-icon">' + CopperIcons.ingredient(job.ingredient, 44) + '</span>' +
          '<span class="job-name">' + esc(ing.name) + '</span>' +
          '<div class="job-bar">' + zone + '<div class="job-fill" style="width:' + pct + '%"></div></div>' +
          action + '</div>';
      }
      return '<button class="station' + (highlight ? ' highlight' : '') + '" data-action="station" data-id="' + s.id + '">' +
        '<span class="station-icon">' + CopperIcons.station(s.id, 34) + '</span>' +
        '<span class="station-name">' + esc(s.name) + '</span>' +
        '<span class="station-hint">' + esc(s.hint) + '</span>' + body + '</button>';
    }).join('');
  }

  function plateHtml(state) {
    const slots = [0, 1, 2].map(function (i) {
      const item = state.plate[i];
      if (!item) return '<div class="plate-slot empty"></div>';
      return '<div class="plate-slot filled">' + CopperIcons.ingredient(item, 36) + '<span>' + esc(CopperRecipes.ingredient(item).name) + '</span></div>';
    }).join('');
    const match = CopperOrders.matchingTicket(state.orders, state.plate);
    const serveLabel = match
      ? 'Serve ' + CopperRecipes.recipe(match.recipeId).name + ' — +' + CopperOrders.serveCoins(match.recipeId, state.orders.streak) + ' coins'
      : 'Serve';
    return '<div class="plate-area"><div class="plate-slots">' + slots + '</div>' +
      '<div class="plate-buttons">' +
      '<button class="serve-btn' + (match ? ' lit' : '') + '" data-action="serve" ' + (match ? '' : 'disabled') + '>' + esc(serveLabel) + '</button>' +
      '<button class="bin-btn" data-action="plate-bin" title="Bin the last plate item (B)">Bin last</button>' +
      '</div></div>';
  }

  function cookedHtml(state) {
    if (state.cooked.length === 0) {
      return '<div class="cooked-empty">Cooked food lands here — click it to plate it.</div>';
    }
    return state.cooked.map(function (ingId, i) {
      const ing = CopperRecipes.ingredient(ingId);
      return '<button class="cooked-item" data-action="cooked" data-id="' + i + '" title="Plate the ' + esc(ing.name) + '">' +
        CopperIcons.ingredient(ingId, 48) + '<span>' + esc(ing.name) + '</span></button>';
    }).join('');
  }

  function hudHtml(state) {
    const o = state.orders;
    const remaining = CopperOrders.DAY_MS - state.elapsedMs;
    const strikes = [0, 1, 2].map(function (i) {
      return '<span class="strike' + (i < o.strikes ? ' hit' : '') + '">✕</span>';
    }).join('');
    const mult = Math.min(2, 1 + 0.1 * o.streak);
    return '<div class="hud">' +
      '<div class="hud-coins">' + CopperIcons.misc('coin', 26) + '<b>' + o.coins + '</b><span class="hud-goal">/ ' + CopperOrders.GOAL_COINS + ' to win</span></div>' +
      '<div class="hud-clock' + (remaining < 30000 ? ' low' : '') + '">' + CopperIcons.misc('clock', 24) + '<b>' + fmtClock(remaining) + '</b>' +
      (o.rush ? '<span class="rush-badge">' + CopperIcons.misc('flame', 18) + ' RUSH HOUR</span>' : '') + '</div>' +
      '<div class="hud-strikes">Strikes ' + strikes + '</div>' +
      '<div class="hud-streak">Streak ×' + mult.toFixed(1) + ' <span>(' + o.streak + ' in a row)</span></div>' +
      '<button class="mute-btn" data-action="mute" title="Sound on/off">Sound: ' + (state.muted ? 'off' : 'on') + '</button>' +
      '</div>';
  }

  function kitchenHtml(state) {
    const tickets = state.orders.tickets.length > 0
      ? state.orders.tickets.map(function (t) { return ticketHtml(t, state); }).join('')
      : '<div class="no-tickets">No orders yet — the night crowd is coming…</div>';
    const hand = state.hand
      ? '<div class="hand">Holding: ' + CopperIcons.ingredient(state.hand, 30) + ' <b>' + esc(CopperRecipes.ingredient(state.hand).name) + '</b> → click its station</div>'
      : '<div class="hand">Click an ingredient bin to pick it up.</div>';
    return hudHtml(state) +
      '<div class="board"><div class="board-label">ORDER BOARD — click a ticket to follow it</div><div class="tickets">' + tickets + '</div></div>' +
      '<div class="message' + (state.message ? ' show' : '') + '">' + esc(state.message || '') + '</div>' +
      '<div class="counter"><div class="counter-label">COUNTER — pick an ingredient</div><div class="bins">' + binsHtml(state) + '</div>' + hand + '</div>' +
      '<div class="midrow"><div class="cooked-tray"><div class="tray-label">READY TO PLATE</div><div class="cooked-items">' + cookedHtml(state) + '</div></div>' +
      plateHtml(state) + '</div>' +
      '<div class="stations-row"><div class="stations-label">STATIONS — click a station to cook what you hold</div><div class="stations">' + stationsHtml(state) + '</div></div>' +
      '<div class="keys-hint">Keys: 1–5 pick bins · Space serves the lit plate · B bins the last plate item</div>';
  }

  function titleHtml(state) {
    const rows = CopperRecipes.RECIPES.map(function (r) {
      const parts = r.components.map(function (c) {
        const ing = CopperRecipes.ingredient(c);
        return CopperIcons.ingredient(c, 26) + ' ' + esc(ing.name) + ' (' + esc(CopperRecipes.station(ing.station).name) + ')';
      }).join(' + ');
      return '<li><b>' + esc(r.name) + '</b> — ' + parts + ' · <b>' + r.coins + ' coins</b></li>';
    }).join('');
    return '<div class="title-wrap">' +
      '<div class="title-pot">' + CopperIcons.station('pot', 96) + '</div>' +
      '<h1>The Copper Pot</h1><h2>Hearthside Cooking Rush</h2>' +
      '<p class="title-tag">Sole cook at a fireside night-market kitchen. Orders fly in, the fire never waits — chop, grill, simmer, plate, serve.</p>' +
      '<div class="title-buttons"><button class="play-btn" data-action="play">▶ Play — 3-minute day</button>' +
      '<button class="how-btn" data-action="howto">How to play</button></div>' +
      '<div class="howto' + (state.showHowTo ? ' open' : '') + '"><h3>How to play</h3>' +
      '<p><b>1.</b> Click an ingredient bin (or keys 1–5) to pick it up, then click the station it belongs to. Every ingredient has one correct station: Onion &amp; Pepper → Chop Board, Mushroom &amp; Fish → Grill, Tomato → Pot.</p>' +
      '<p><b>2.</b> Chop takes 3 clicks. On the grill, click Flip inside the green zone — too early and it keeps cooking, too late and it burns. The pot simmers itself in 4 seconds; stir to hurry it.</p>' +
      '<p><b>3.</b> Click cooked food to put it on the plate. When the plate matches a ticket exactly, Serve lights up — serve before the ticket timer runs out (Space works too).</p>' +
      '<p><b>4.</b> A missed ticket is a strike; 3 strikes end the day. Serving in a row builds a tip multiplier up to ×2. Rush hour starts at 90 seconds — tickets come faster. Reach <b>' + CopperOrders.GOAL_COINS + ' coins in 3 minutes</b> to win the day.</p>' +
      '<h3>Menu</h3><ul class="menu">' + rows + '</ul></div>' +
      '<p class="title-foot">Goal: ' + CopperOrders.GOAL_COINS + ' coins · 3 strikes end the day · Best with sound on</p></div>';
  }

  function endHtml(state, won) {
    const o = state.orders;
    const title = won ? 'Day Won!' : 'Day Over';
    const line = won
      ? 'The night crowd goes home happy — the copper pot is empty and your purse is full.'
      : (o.strikes >= CopperOrders.MAX_STRIKES
        ? 'Three missed orders and the crowd drifted away. The fire is banked for tonight.'
        : 'Time ran out with the pot still short of its goal.');
    return '<div class="title-wrap ' + (won ? 'end-win' : 'end-loss') + '"><div class="title-pot">' + CopperIcons.station(won ? 'pot' : 'grill', 96) + '</div>' +
      (won ? '<div class="end-stars">★ ★ ★</div>' : '') +
      '<h1>' + title + '</h1>' +
      '<p class="title-tag">' + line + '</p>' +
      '<div class="end-stats">' +
      '<div><b>' + o.coins + '</b><span>coins</span></div>' +
      '<div><b>' + o.served + '</b><span>dishes served</span></div>' +
      '<div><b>' + o.strikes + '</b><span>strikes</span></div>' +
      '<div><b>' + (won ? 'Won' : '—') + '</b><span>goal ' + CopperOrders.GOAL_COINS + '</span></div></div>' +
      '<div class="title-buttons"><button class="play-btn" data-action="play">↻ Cook another day</button></div>' +
      '<p class="title-foot">The Copper Pot — Hearthside Cooking Rush</p></div>';
  }

  function render(state) {
    const app = document.getElementById('app');
    if (!app) return;
    let html = '';
    if (state.screen === 'title') html = titleHtml(state);
    else if (state.screen === 'kitchen') html = kitchenHtml(state);
    else if (state.screen === 'win') html = endHtml(state, true);
    else if (state.screen === 'loss') html = endHtml(state, false);
    app.innerHTML = html;
    document.body.className = 'screen-' + state.screen;
  }

  return { render: render, fmtClock: fmtClock };
})();
