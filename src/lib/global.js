/* De oude code (inline scripts in src/shell/index.html, tools/nt/, en de componenten) leest de
   gedeelde helpers als globale namen. Een module die zo'n helper levert, zet hem daarom ook op
   window. Dat blijft zo tot fase 16 de aanroepers zelf laat importeren. */
export function expose(o) {
  for (const k in o) window[k] = o[k];
}
