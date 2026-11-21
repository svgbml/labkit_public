<!-- ================= GELFOTO-EDITOR, PANEEL 1 EN 2 =================
     De foto kiezen en bijstellen. De velden houden hun id's (gf-inv, gf-gray, gf-bri, gf-con,
     gf-rot), want gfUpdate() in web/index.html leest ze daar uit; het beeldwerk zelf blijft
     daar staan. De knoppen roepen de motorfuncties in index.html aan, via een methode: een
     gecompileerd template zoekt een naam op de component, niet in de globale omgeving.

     De waarden naast de schuifregelaars stonden eerst als textContent in gfUpdate(); nu
     rendert de component ze, met lkNumIn() zodat een Engelse gebruiker 1.00 ziet in plaats
     van 1,00 (de vertaallaag komt niet in een Vue-boom). -->
<template>
  <div class="stack" style="gap:12px">
    <div class="panel">
      <h3>{{ t('1 · Afbeelding') }}</h3>
      <input type="file" id="gf-file" accept="image/*" :aria-label="t('Gelfoto kiezen')"
             @change="pick">
      <div class="row" style="margin-top:8px">
        <button type="button" id="gf-demo" @click="demo">{{ t('Demo-gel laden') }}</button>
      </div>
      <p style="font-size:12.5px;color:var(--muted);margin:8px 0 0">
        {{ t('PNG of JPG; je kunt ook een bestand op de afbeelding slepen. TIFF opent niet in de browser.') }}
      </p>
    </div>
    <div class="panel">
      <h3>{{ t('2 · Bewerken') }}</h3>
      <div class="row" style="gap:14px">
        <label class="chk"><input type="checkbox" id="gf-inv" v-model="f.inv"> {{ t('Inverteren') }}</label>
        <label class="chk"><input type="checkbox" id="gf-gray" v-model="f.gray"> {{ t('Grijswaarden') }}</label>
      </div>
      <div class="rng" style="margin-top:10px">
        <label for="gf-bri">{{ t('Helderheid') }}</label>
        <input type="range" id="gf-bri" min="-60" max="60" v-model="f.bri" @change="sync">
        <span id="gf-briv">{{ briTxt }}</span>
      </div>
      <div class="rng">
        <label for="gf-con">{{ t('Contrast') }}</label>
        <input type="range" id="gf-con" min="0.5" max="3" step="0.05" v-model="f.con" @change="sync">
        <span id="gf-conv">{{ conTxt }}</span>
      </div>
      <div class="rng">
        <label for="gf-rot">{{ t('Rechtzetten') }}</label>
        <input type="range" id="gf-rot" min="-15" max="15" step="0.25" v-model="f.rot" @change="sync">
        <span id="gf-rotv">{{ rotTxt }}</span>
      </div>
      <div class="row" style="margin-top:8px">
        <button type="button" id="gf-auto" @click="straighten">{{ t('Automatisch rechtzetten') }}</button>
        <button type="button" id="gf-r90" @click="r90">⟳ 90°</button>
        <button type="button" id="gf-flip" @click="flip">{{ t('Spiegelen') }}</button>
        <button type="button" id="gf-crop" @click="crop">{{ t('Bijsnijden') }}</button>
        <button type="button" id="gf-uncrop" @click="uncrop">{{ t('Herstel') }}</button>
      </div>
      <!-- setMode() laat de balk hieronder zien en verbergen en zet de klasse 'on' op de
           knoppen hierboven, net als eerst; Vue bindt die twee dus niet -->
      <div class="row" id="gf-cropbar" style="margin-top:8px;display:none">
        <span style="font-size:13px;flex-basis:100%">{{ t('Sleep een kader over de foto, of versleep de randen en hoeken van het kader om het bij te stellen.') }}</span>
        <button type="button" id="gf-cropfind" :title="t('Zoekt het lichte gelvlak in de foto en zet het kader eromheen')"
                @click="cropFind">{{ t('Gel zoeken') }}</button>
        <button type="button" class="primary" id="gf-cropok" @click="cropOk">{{ t('Toepassen') }}</button>
        <button type="button" id="gf-cropno" @click="cropCancel">{{ t('Annuleren') }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../../lib/bridge.js';
import {gfMix} from './tick.js';

export default {
  name: 'GfImage',
  mixins: [gfMix],
  data() {
    return {f: {inv: false, gray: true, bri: '0', con: '1', rot: '0'}};
  },
  computed: {
    briTxt() { return lkNumIn(String(Math.round(+this.f.bri) || 0)); },
    conTxt() { return lkNumIn(fmt(+this.f.con, 2)); },
    rotTxt() { return lkNumIn(fmt(+this.f.rot, 2)) + '°'; }
  },
  methods: {
    /* De motor zet gf-rot zelf ook (bij een nieuwe foto en bij automatisch rechtzetten) en
       stuurt er een input-event achteraan; daar reageert v-model op. Een change-event alleen
       (delen via een link, ongedaan maken) ziet v-model bij een schuifregelaar niet, dus dat
       vangen we hier op. */
    sync(e) { const k = e.target.id.slice(3); if (k in this.f) this.f[k] = e.target.value; },
    pick(e) { gfFile(e.target.files[0]); },
    demo() { gfDemo(); },
    straighten() { gfAutoStraighten(); },
    r90() { gfR90(); },
    flip() { gfFlip(); },
    crop() { if (gf.src) setMode('crop'); },
    uncrop() { gfUncrop(); },
    cropFind() { gfCropFind(); },
    cropOk() { gfCropOk(); },
    cropCancel() { setMode('crop'); }
  }
};
</script>
