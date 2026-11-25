// orders.js — the order board: tickets arrive, count down, get served,
// or expire into strikes. Also the day clock, the rush hour, and the
// coins a served dish pays (serve streak builds the tip multiplier).
'use strict';

const CopperOrders = (function () {
  const DAY_MS = 180000;          // a day is 3 minutes
  const GOAL_COINS = 120;         // coins to win the day
  const TICKET_MS = 45000;        // each ticket lives 45 seconds
  const MAX_TICKETS = 3;          // the board holds at most 3
  const SPAWN_MS = 12000;         // a new ticket every ~12 seconds
  const RUSH_SPAWN_MS = 7000;     // rush hour: every ~7 seconds
  const RUSH_AT_MS = 90000;       // rush hour starts at 90 seconds
  const MAX_STRIKES = 3;          // 3 missed tickets ends the day
  const TIP_PER_STREAK = 0.1;     // +10% a serve, per serve in a row
  const TIP_CAP = 2.0;            // the multiplier never passes 2x

  let nextId = 1;

  function createOrders() {
    return {
      tickets: [],
      spawnInMs: 0,               // first ticket arrives at once
      strikes: 0,
      streak: 0,
      served: 0,
      coins: 0,
      rush: false,
    };
  }

  function pickRecipe(rng) {
    const list = CopperRecipes.RECIPES;
    return list[Math.floor((rng || Math.random)() * list.length)];
  }

  function spawnTicket(orders, rng) {
    if (orders.tickets.length >= MAX_TICKETS) return null;
    const recipe = pickRecipe(rng);
    const ticket = {
      id: nextId++,
      recipeId: recipe.id,
      remainingMs: TICKET_MS,
      totalMs: TICKET_MS,
    };
    orders.tickets.push(ticket);
    return ticket;
  }

  // Advance the board by dtMs. Returns {expired:[], rushed:boolean}.
  function tickOrders(orders, dtMs, elapsedMs) {
    const out = { expired: [], rushed: false };
    if (!orders.rush && elapsedMs >= RUSH_AT_MS) {
      orders.rush = true;
      out.rushed = true;
    }
    orders.spawnInMs -= dtMs;
    // Age the tickets already on the board first, so a ticket born in
    // this tick never loses time in the tick it was born in.
    for (const t of orders.tickets) t.remainingMs -= dtMs;
    const alive = [];
    for (const t of orders.tickets) {
      if (t.remainingMs <= 0) out.expired.push(t);
      else alive.push(t);
    }
    orders.tickets = alive;
    if (orders.spawnInMs <= 0) {
      spawnTicket(orders);
      orders.spawnInMs = orders.rush ? RUSH_SPAWN_MS : SPAWN_MS;
    }
    if (out.expired.length > 0) {
      orders.strikes += out.expired.length;
      orders.streak = 0; // a missed ticket breaks the serve streak
    }
    return out;
  }

  // The ticket whose recipe the plate matches, if any (first match wins).
  function matchingTicket(orders, plate) {
    for (const t of orders.tickets) {
      if (CopperRecipes.plateMatchesRecipe(plate, t.recipeId)) return t;
    }
    return null;
  }

  // Coins for serving this recipe at the current streak, before the streak grows.
  function serveCoins(recipeId, streak) {
    const recipe = CopperRecipes.recipe(recipeId);
    if (!recipe) return 0;
    const mult = Math.min(TIP_CAP, 1 + TIP_PER_STREAK * streak);
    return Math.round(recipe.coins * mult);
  }

  // Serve a ticket: pay coins, grow the streak, drop the ticket.
  // Returns the coins earned, or 0 when the ticket is not on the board.
  function serveTicket(orders, ticketId) {
    const i = orders.tickets.findIndex(function (t) { return t.id === ticketId; });
    if (i < 0) return 0;
    const ticket = orders.tickets[i];
    const coins = serveCoins(ticket.recipeId, orders.streak);
    orders.tickets.splice(i, 1);
    orders.coins += coins;
    orders.streak++;
    orders.served++;
    return coins;
  }

  function ticketById(orders, ticketId) {
    return orders.tickets.find(function (t) { return t.id === ticketId; }) || null;
  }

  return {
    DAY_MS: DAY_MS,
    GOAL_COINS: GOAL_COINS,
    TICKET_MS: TICKET_MS,
    MAX_TICKETS: MAX_TICKETS,
    SPAWN_MS: SPAWN_MS,
    RUSH_SPAWN_MS: RUSH_SPAWN_MS,
    RUSH_AT_MS: RUSH_AT_MS,
    MAX_STRIKES: MAX_STRIKES,
    createOrders: createOrders,
    spawnTicket: spawnTicket,
    tickOrders: tickOrders,
    matchingTicket: matchingTicket,
    serveCoins: serveCoins,
    serveTicket: serveTicket,
    ticketById: ticketById,
  };
})();
