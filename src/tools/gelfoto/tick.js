/* ================= GELFOTO: DE TIK DIE DE COMPONENTEN BIJWERKT =================
   De gelfoto-editor is te groot om in één keer om te zetten, en zijn beeldwerk hoort ook niet
   in een component: het rekent met canvassen, pixelprofielen en sleephandelingen en staat in
   src/engines/gelfoto.js achter de 7 validatiegevallen van tests/validate.py.

   De componenten hieronder (de velden en de uitkomsten) lezen daarom uit diezelfde `gf`: het
   statusobject van de editor. Dat is een gewoon object in src/engines/gelfoto.js, geen reactieve van Vue,
   dus Vue ziet een verandering er niet zelf in. De motor roept na elke verandering al
   `gfMarksTable()` of `gfRender()` aan; die tikken nu `gfTick` op en elke computed die
   `this.tick` leest, rekent opnieuw.

   Eén teller voor alle gelfoto-componenten: ze kijken naar dezelfde toestand, en een extra
   render van een paar velden kost niets naast het beeldwerk zelf. */
import {reactive} from 'vue';

export const gfTick = reactive({n: 0});

/* De motor in src/engines/gelfoto.js roept dit aan (via window). */
export function gfRefresh() { gfTick.n++; }

/* De mixin die elke gelfoto-component gebruikt: `tick` in een computed lezen maakt die
   computed afhankelijk van de teller. */
export const gfMix = {
  computed: {
    tick() { return gfTick.n; }
  }
};
