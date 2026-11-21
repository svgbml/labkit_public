<!-- ================= INSTELLINGEN & UPDATES (S263, de app-schil) =================
     De opmaak van de app zelf blijft in web/index.html: applyUI() leest de velden op id en zet
     het thema, de dichtheid, de tekstgrootte, de accentkleur en de paletten. Deze component
     beheert de velden en roept applyUI() aan bij elke wijziging; checkUpdate(), de
     "Wat is er nieuw"-knop (data-news) en de rondleiding (data-tour-start) blijven ook waar
     ze waren.

     De id's ui-lang, ui-theme, ui-dens, ui-fs, ui-accent, ui-accon, ui-pal, ui-schema,
     ui-swatches, ui-reset, upd-cur, upd-check, ui-autoupd en upd-status blijven zoals ze
     waren: de invoeropslag, delen via een link en tests/validate.py gebruiken ze.
     #ui-swatches en #upd-status worden door applyUI() en checkUpdate() gevuld; Vue heeft daar
     zelf geen kinderen, dus het laat die inhoud staan. -->
<template>
  <div class="grid2">
    <div class="stack">
      <div class="panel">
        <h3>{{ t('Uiterlijk') }}</h3>
        <div class="fields">
          <div class="f"><label for="ui-lang">Taal / Language</label>
            <select id="ui-lang" v-model="lang" style="width:100%" @change="setLang">
              <option value="nl">Nederlands</option><option value="en">English</option>
            </select></div>
          <div class="f"><label for="ui-theme">{{ t('Thema') }}</label>
            <select id="ui-theme" v-model="theme" style="width:100%" @change="apply">
              <option v-for="o in themes" :key="o[0]" :value="o[0]">{{ t(o[1]) }}</option>
            </select></div>
          <div class="f"><label for="ui-dens">{{ t('Dichtheid') }}</label>
            <select id="ui-dens" v-model="dens" style="width:100%" @change="apply">
              <option value="ruim">{{ t('Ruim') }}</option><option value="compact">{{ t('Compact (meer op één scherm)') }}</option>
            </select></div>
          <div class="f"><label for="ui-fs">{{ t('Tekstgrootte') }}</label>
            <select id="ui-fs" v-model="fs" style="width:100%" @change="apply">
              <option v-for="o in sizes" :key="o[0]" :value="o[0]">{{ t(o[1]) }}</option>
            </select></div>
          <div class="f"><label for="ui-accent">{{ t('Accentkleur') }}</label>
            <div class="row">
              <input type="color" id="ui-accent" v-model="accent" style="width:52px;height:32px;padding:2px" @input="apply">
              <label class="chk" for="ui-accon"><input type="checkbox" id="ui-accon" v-model="accon" @change="apply"> {{ t('eigen kleur gebruiken') }}</label>
            </div></div>
        </div>
      </div>
      <div class="panel">
        <h3>{{ t("Grafieken en schema's") }}</h3>
        <div class="fields">
          <div class="f"><label for="ui-pal">{{ t('Kleurenpalet grafieken') }}</label>
            <select id="ui-pal" v-model="pal" style="width:100%" @change="apply">
              <option v-for="o in pals" :key="o[0]" :value="o[0]">{{ t(o[1]) }}</option>
            </select></div>
          <div class="f"><label for="ui-schema">{{ t("Kleur protocolschema's") }}</label>
            <input type="color" id="ui-schema" v-model="schema" style="width:52px;height:32px;padding:2px" @input="apply"></div>
        </div>
        <div class="row" id="ui-swatches" style="margin-top:10px;gap:6px"></div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t("Het palet geldt voor grafieken met meerdere reeksen (groeicurves, smeltcurves, staafdiagrammen). De schemakleur geldt voor verdunnings-, pipetteer-, PCR- en gel-laadschema's.") }}</p>
      </div>
    </div>
    <div class="stack">
      <div class="panel">
        <h3>{{ t('Updates') }}</h3>
        <div class="big" style="margin-bottom:6px">{{ t('Versie') }} <span id="upd-cur">{{ ver }}</span></div>
        <div class="row">
          <button type="button" class="primary" id="upd-check" @click="check">{{ t('Zoek naar updates') }}</button>
          <label class="chk" for="ui-autoupd"><input type="checkbox" id="ui-autoupd" v-model="autoupd"> {{ t('automatisch controleren bij het starten') }}</label>
        </div>
        <div id="upd-status" style="margin-top:10px"></div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('De controle vraagt alleen het versienummer van de laatste release op bij GitHub; er worden geen gegevens van jou verstuurd. De web-app haalt een nieuwe versie zelf op zodra je vernieuwt; het Windows-programma downloadt de nieuwe installer, die je daarna uitvoert.') }}</p>
      </div>
      <div class="panel"><h3>{{ t('Wat is er nieuw') }}</h3>
        <p style="margin:0 0 10px;color:var(--muted);font-size:13px">{{ t('De wijzigingen per versie, zoals ze ook na een update worden getoond.') }}</p>
        <div class="row"><button type="button" data-news="">{{ t('Alle wijzigingen bekijken') }}</button></div></div>
      <div class="panel"><h3>{{ t('Rondleiding') }}</h3>
        <p style="margin:0 0 10px;color:var(--muted);font-size:13px">{{ t('Vier korte stappen door het zoeken, de fasen, de werkstromen en deze instellingen.') }}</p>
        <div class="row"><button type="button" data-tour-start="">{{ t('Rondleiding opnieuw starten') }}</button></div></div>
      <div class="panel"><h3>{{ t('Herstellen') }}</h3>
        <div class="row"><button type="button" id="ui-reset" @click="reset">{{ t('Uiterlijk terug naar standaard') }}</button></div></div>
    </div>
  </div>
</template>

<script>
/* standaardwaarden: dezelfde als UIDEF in web/index.html */
const DEF = {theme: 'auto', dens: 'ruim', fs: '14', accent: '#1558b0', accon: false, pal: 'std', schema: '#1558b0'};

export default {
  name: 'Settings',
  data() {
    return {
      ...DEF,
      lang: typeof LANG !== 'undefined' ? LANG : 'nl',
      autoupd: true,
      ver: typeof APPVER !== 'undefined' ? APPVER : '',
      themes: [['auto', 'Automatisch (volgt systeem)'], ['licht', 'Licht'], ['donker', 'Donker'], ['papier', 'Papier (labjournaal)'], ['contrast', 'Hoog contrast'], ['leisteen', 'Leisteen (koel grijs)']],
      sizes: [['13', 'Klein'], ['14', 'Normaal'], ['15.5', 'Groot'], ['17', 'Extra groot']],
      pals: [['std', 'Standaard'], ['okabe', 'Kleurenblind-veilig (Okabe-Ito)'], ['pastel', 'Pastel'], ['fel', 'Fel'], ['grijs', 'Grijstinten (zwart-witprint)']],
    };
  },
  methods: {
    /* applyUI() leest de DOM; na een wijziging via v-model staat de waarde daar al, maar bij een
       reset pas na de volgende render */
    apply() { this.$nextTick(() => { if (typeof applyUI === 'function') applyUI(); }); },
    setLang() { try { localStorage.setItem(LKEY, this.lang); } catch (e) {} location.reload(); },
    check() { if (typeof checkUpdate === 'function') checkUpdate(true); },
    reset() {
      Object.assign(this, DEF);
      /* de invoeropslag luistert naar input/change op de velden zelf, dus die krijgen ze na de render */
      this.$nextTick(() => {
        ['ui-theme', 'ui-dens', 'ui-fs', 'ui-accent', 'ui-accon', 'ui-pal', 'ui-schema'].forEach(id => {
          const el = document.getElementById(id); if (el) el.dispatchEvent(new Event('change', {bubbles: true}));
        });
        if (typeof applyUI === 'function') applyUI();
      });
    },
  },
};
</script>
