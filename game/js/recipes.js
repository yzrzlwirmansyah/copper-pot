// recipes.js — the pantry: what an ingredient is, where it is cooked,
// and the five dishes the night-market kitchen serves.
'use strict';

const CopperRecipes = (function () {
  // Every ingredient has exactly ONE correct station. That is the game's
  // core memory rule; the ticket strips and the bin hints both teach it.
  const INGREDIENTS = [
    { id: 'onion', name: 'Onion', station: 'chop', key: '1', color: '#b678d8', blurb: 'Chop it fine' },
    { id: 'mushroom', name: 'Mushroom', station: 'grill', key: '2', color: '#e2574c', blurb: 'Grill it golden' },
    { id: 'fish', name: 'Fish', station: 'grill', key: '3', color: '#7cc0e8', blurb: 'Grill it, flip in time' },
    { id: 'pepper', name: 'Pepper', station: 'chop', key: '4', color: '#d8402e', blurb: 'Chop it hot' },
    { id: 'tomato', name: 'Tomato', station: 'pot', key: '5', color: '#e04536', blurb: 'Simmer it down' },
  ];

  const STATIONS = [
    { id: 'chop', name: 'Chop Board', verb: 'Chop', hint: 'Click 3 times to finish', action: 'chop' },
    { id: 'grill', name: 'Grill', verb: 'Flip', hint: 'Flip in the green zone', action: 'flip' },
    { id: 'pot', name: 'Pot', verb: 'Stir', hint: 'Simmers itself — stir to hurry', action: 'stir' },
  ];

  // A recipe's components are cooked ingredients, matched as a set:
  // the plate must hold exactly these, nothing more, nothing less.
  const RECIPES = [
    { id: 'ember-stew', name: 'Ember Stew', coins: 18, components: ['onion', 'tomato'] },
    { id: 'moonfish-skewer', name: 'Moonfish Skewer', coins: 22, components: ['fish', 'pepper'] },
    { id: 'garden-stack', name: 'Garden Stack', coins: 28, components: ['mushroom', 'tomato', 'onion'] },
    { id: 'copper-curry', name: 'Copper Curry', coins: 26, components: ['pepper', 'mushroom', 'tomato'] },
    { id: 'sunrise-broth', name: 'Sunrise Broth', coins: 30, components: ['fish', 'onion', 'tomato'] },
  ];

  function ingredient(id) {
    return INGREDIENTS.find(function (g) { return g.id === id; }) || null;
  }

  function station(id) {
    return STATIONS.find(function (s) { return s.id === id; }) || null;
  }

  function recipe(id) {
    return RECIPES.find(function (r) { return r.id === id; }) || null;
  }

  // Does the plate hold exactly this recipe's components (order-free)?
  function plateMatchesRecipe(plate, recipeId) {
    const r = recipe(recipeId);
    if (!r) return false;
    if (plate.length !== r.components.length) return false;
    const rest = r.components.slice();
    for (const item of plate) {
      const i = rest.indexOf(item);
      if (i < 0) return false;
      rest.splice(i, 1);
    }
    return rest.length === 0;
  }

  // Which components of this recipe are already on the plate?
  function plateProgress(plate, recipeId) {
    const r = recipe(recipeId);
    if (!r) return { done: [], todo: [] };
    const rest = plate.slice();
    const done = [];
    const todo = [];
    for (const c of r.components) {
      const i = rest.indexOf(c);
      if (i >= 0) { done.push(c); rest.splice(i, 1); } else { todo.push(c); }
    }
    return { done: done, todo: todo, extra: rest };
  }

  return {
    INGREDIENTS: INGREDIENTS,
    STATIONS: STATIONS,
    RECIPES: RECIPES,
    ingredient: ingredient,
    station: station,
    recipe: recipe,
    plateMatchesRecipe: plateMatchesRecipe,
    plateProgress: plateProgress,
  };
})();
