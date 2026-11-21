/* De oude code (inline scripts in src/shell/index.html, tools/nt/, en de componenten) leest de
   gedeelde helpers als globale namen. Een module die zo'n helper levert, zet hem daarom ook op
   window. Dat blijft zo tot fase 16 de aanroepers zelf laat importeren. */
export function expose(o) {
  for (const k in o) window[k] = o[k];
}

/* Voor code met toestand (de motoren in src/engines/): een getter (en voor let/function een
   setter) op window in plaats van een kopie. `timers = timers.filter(…)` in de module, of
   `gfIntensity = function(…)` in een ander blok, is dan overal te zien. Een const krijgt alleen
   een getter. */
export function live(o) {
  for (const k in o) {
    const d = o[k];
    Object.defineProperty(window, k, Array.isArray(d)
      ? {get: d[0], set: d[1], configurable: true, enumerable: true}
      : {get: d, configurable: true, enumerable: true});
  }
}
