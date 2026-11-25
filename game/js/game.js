// game.js — The Copper Pot: owns the state, the clock, and every input.
// Wires the bins, stations, plate and tickets together and drives render.js.
'use strict';

const CopperGame = (function () {
  const TICK_MS = 100;

  let state = null;
  let timer = null;
  let messageTimer = null;

  function freshState() {
    return {
      screen: 'title',
      showHowTo: false,
      elapsedMs: 0,
      hand: null,
      stations: CopperStations.createStations(),
      cooked: [],
      plate: [],
      orders: CopperOrders.createOrders(),
      selectedTicketId: null,
      muted: false,
      message: '',
      demo: false,
    };
  }

  // A frozen kitchen for the ?screen=kitchen screenshot: a dish mid-assembly,
  // a plate ready to serve, the timer running, nothing ticking.
  function demoKitchenState() {
    const s = freshState();
    s.screen = 'kitchen';
    s.demo = true;
    s.elapsedMs = 57000; // 2:03 left on the clock
    s.orders.coins = 64;
    s.orders.streak = 2;
    s.orders.served = 3;
    s.orders.rush = false;
    s.orders.tickets = [
      { id: 1, recipeId: 'garden-stack', remainingMs: 31000, totalMs: 45000 },
      { id: 2, recipeId: 'moonfish-skewer', remainingMs: 18000, totalMs: 45000 },
    ];
    s.selectedTicketId = 1;
    s.plate = ['mushroom', 'tomato', 'onion']; // Garden Stack, ready to serve
    s.stations.grill = { ingredient: 'fish', station: 'grill', startedAt: 0, elapsedMs: 3900, clicks: 0, done: false, burnt: false };
    s.stations.pot = { ingredient: 'tomato', station: 'pot', startedAt: 0, elapsedMs: 2200, clicks: 0, done: false, burnt: false };
    s.cooked = ['pepper'];
    s.message = 'Garden Stack is ready — serve it before the ticket runs out!';
    return s;
  }

  function demoEndState(won) {
    const s = freshState();
    s.screen = won ? 'win' : 'loss';
    s.demo = true;
    s.orders.coins = won ? 132 : 48;
    s.orders.served = won ? 6 : 2;
    s.orders.strikes = won ? 1 : 3;
    s.orders.streak = won ? 4 : 0;
    s.elapsedMs = CopperOrders.DAY_MS;
    return s;
  }

  function showMessage(text, ms) {
    state.message = text;
    CopperRender.render(state);
    if (messageTimer) clearTimeout(messageTimer);
    messageTimer = setTimeout(function () {
      if (!state) return;
      state.message = '';
      CopperRender.render(state);
    }, ms || 2600);
  }

  function startDay() {
    stopTimer();
    state = freshState();
    state.screen = 'kitchen';
    CopperOrders.spawnTicket(state.orders);
    // The first ticket arrives at once; the next one waits a full spawn
    // interval — otherwise the very first tick spawns a second ticket too.
    state.orders.spawnInMs = CopperOrders.SPAWN_MS;
    state.selectedTicketId = state.orders.tickets[0] ? state.orders.tickets[0].id : null;
    CopperRender.render(state);
    timer = setInterval(tick, TICK_MS);
  }

  function stopTimer() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function endDay(won) {
    stopTimer();
    state.screen = won ? 'win' : 'loss';
    if (won) CopperAudio.win(); else CopperAudio.lose();
    CopperRender.render(state);
  }

  function tick() {
    if (!state || state.screen !== 'kitchen' || state.demo) return;
    state.elapsedMs += TICK_MS;

    // Stations first: a finished job lands in the cooked tray, a burnt one is lost.
    const st = CopperStations.tickStations(state.stations, TICK_MS);
    for (const job of st.finished) {
      CopperStations.clearJob(state.stations, job.station);
      state.cooked.push(job.ingredient);
      CopperAudio.ready();
    }
    for (const job of st.burnt) {
      CopperStations.clearJob(state.stations, job.station);
      CopperAudio.error();
      showMessage('Burnt! The ' + CopperRecipes.ingredient(job.ingredient).name.toLowerCase() + ' is ruined — start it again.');
    }

    // Then the order board: spawns, countdowns, strikes.
    const ord = CopperOrders.tickOrders(state.orders, TICK_MS, state.elapsedMs);
    if (ord.rushed) {
      CopperAudio.rush();
      showMessage('RUSH HOUR — orders are coming faster!', 3000);
    }
    if (ord.expired.length > 0) {
      CopperAudio.missed();
      const names = ord.expired.map(function (t) { return CopperRecipes.recipe(t.recipeId).name; }).join(', ');
      showMessage('Missed: ' + names + ' — that is a strike.');
      if (state.selectedTicketId != null && !CopperOrders.ticketById(state.orders, state.selectedTicketId)) {
        state.selectedTicketId = state.orders.tickets[0] ? state.orders.tickets[0].id : null;
      }
    }

    // End conditions.
    if (state.orders.strikes >= CopperOrders.MAX_STRIKES) { CopperRender.render(state); endDay(false); return; }
    if (state.elapsedMs >= CopperOrders.DAY_MS) {
      CopperRender.render(state);
      endDay(state.orders.coins >= CopperOrders.GOAL_COINS);
      return;
    }
    CopperRender.render(state);
  }

  function pickBin(ingId) {
    const ing = CopperRecipes.ingredient(ingId);
    if (!ing) return;
    CopperAudio.unlock();
    if (state.hand === ingId) { state.hand = null; }
    else { state.hand = ingId; CopperAudio.pop(); }
    CopperRender.render(state);
  }

  function clickStation(stationId) {
    CopperAudio.unlock();
    if (!state.hand) {
      showMessage('Pick up an ingredient first — click a bin on the counter.');
      return;
    }
    const ingId = state.hand;
    const ing = CopperRecipes.ingredient(ingId);
    const res = CopperStations.startJob(state.stations, stationId, ingId);
    if (res.error === 'busy') {
      showMessage(CopperRecipes.station(stationId).name + ' is busy — wait for it to finish.');
      CopperAudio.error();
      return;
    }
    if (res.error === 'wrong-station') {
      showMessage(ing.name + ' does not go on the ' + CopperRecipes.station(stationId).name + ' — it belongs on the ' + CopperRecipes.station(res.want).name + '.');
      CopperAudio.error();
      CopperRender.render(state);
      return;
    }
    if (res.error) { CopperAudio.error(); return; }
    state.hand = null;
    if (stationId === 'grill') CopperAudio.sizzle();
    else if (stationId === 'pot') CopperAudio.bubble();
    else CopperAudio.thock();
    CopperRender.render(state);
  }

  function actionStation(stationId) {
    // A click on a station that already holds a job works the job:
    // chop, flip, or stir. A click with food in hand starts a job instead.
    const job = state.stations[stationId];
    if (!job) { clickStation(stationId); return; }
    const res = CopperStations.stationClick(state.stations, stationId);
    if (res.error === 'too-early') {
      CopperAudio.error();
      showMessage('Too early — wait for the green zone on the grill.');
      CopperRender.render(state);
      return;
    }
    if (res.chopped) CopperAudio.thock();
    if (res.stirred) CopperAudio.bubble();
    if (res.done) {
      CopperStations.clearJob(state.stations, stationId);
      state.cooked.push(job.ingredient);
      CopperAudio.ready();
    }
    CopperRender.render(state);
  }

  function plateCooked(index) {
    const ingId = state.cooked[index];
    if (!ingId) return;
    if (state.plate.length >= 3) {
      showMessage('The plate is full — serve it or bin something first.');
      CopperAudio.error();
      return;
    }
    state.cooked.splice(index, 1);
    state.plate.push(ingId);
    CopperAudio.plink();
    CopperRender.render(state);
  }

  function binLastPlate() {
    if (state.plate.length === 0) return;
    const removed = state.plate.pop();
    showMessage('Binned the ' + CopperRecipes.ingredient(removed).name.toLowerCase() + '.');
    CopperAudio.pop();
    CopperRender.render(state);
  }

  function serve() {
    const match = CopperOrders.matchingTicket(state.orders, state.plate);
    if (!match) {
      showMessage('The plate does not match any ticket yet — check the recipe strips.');
      CopperAudio.error();
      return;
    }
    const recipe = CopperRecipes.recipe(match.recipeId);
    const coins = CopperOrders.serveTicket(state.orders, match.id);
    state.plate = [];
    CopperAudio.ding();
    showMessage('Served ' + recipe.name + '! +' + coins + ' coins' + (state.orders.streak > 1 ? ' — streak ×' + Math.min(2, 1 + 0.1 * state.orders.streak).toFixed(1) : ''));
    if (state.selectedTicketId === match.id) {
      state.selectedTicketId = state.orders.tickets[0] ? state.orders.tickets[0].id : null;
    }
    if (state.orders.coins >= CopperOrders.GOAL_COINS) {
      CopperRender.render(state);
      endDay(true);
      return;
    }
    CopperRender.render(state);
  }

  function onClick(event) {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const action = el.getAttribute('data-action');
    const id = el.getAttribute('data-id');
    if (action === 'play') { CopperAudio.unlock(); startDay(); return; }
    if (action === 'howto') { state.showHowTo = !state.showHowTo; CopperRender.render(state); return; }
    if (action === 'mute') {
      state.muted = !state.muted;
      CopperAudio.setMuted(state.muted);
      CopperRender.render(state);
      return;
    }
    if (!state || state.screen !== 'kitchen' || state.demo) {
      if (action === 'play') startDay();
      return;
    }
    if (action === 'bin') pickBin(id);
    else if (action === 'station') actionStation(id);
    else if (action === 'cooked') plateCooked(parseInt(id, 10));
    else if (action === 'plate-bin') binLastPlate();
    else if (action === 'serve') serve();
    else if (action === 'ticket') {
      state.selectedTicketId = parseInt(id, 10);
      CopperAudio.pop();
      CopperRender.render(state);
    }
  }

  function onKey(event) {
    if (!state) return;
    if (event.key === ' ' && state.screen === 'kitchen' && !state.demo) {
      event.preventDefault();
      serve();
      return;
    }
    if (state.screen !== 'kitchen' || state.demo) return;
    if (event.key === 'b' || event.key === 'B') { binLastPlate(); return; }
    const ing = CopperRecipes.INGREDIENTS.find(function (g) { return g.key === event.key; });
    if (ing) pickBin(ing.id);
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const screen = params.get('screen');
    if (screen === 'kitchen') state = demoKitchenState();
    else if (screen === 'win') state = demoEndState(true);
    else if (screen === 'loss') state = demoEndState(false);
    else state = freshState();
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    CopperRender.render(state);
  }

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', CopperGame.init);
