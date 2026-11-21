<!-- ================= PCR-PROGRAMMA =================
     Het temperatuurprofiel op #pg-cv, met de cyclus aangegeven. De stappen staan in een eigen
     tabel (naam, temperatuur, tijd, in cyclus); de id's pg-tbl, pg-add en pg-from en de
     data-k-attributen blijven zoals ze waren. De tekening is ongewijzigd uit calc.pprog
     overgenomen (draw()); de hulpfuncties PGDEF, pgSecs en pgFmt blijven in web/index.html.
     De staat van de tabel gaat naar pstore 'pg' (localStorage labkit:v1:proto), net als eerder.
     "Neem over uit PCR-cyclus" leest de globale yTa van het PCR-cyclus-gereedschap. -->
<template>
  <div class="picwrap">
    <div class="pic-prev">
      <div class="result">
        <canvas id="pg-cv"></canvas>
        <div class="pic-bar" data-picbar="pg">
          <button type="button" data-png="pg">{{ t('PNG') }}</button>
          <button type="button" data-svg="pg">{{ t('SVG') }}</button>
          <button type="button" data-copy="pg">{{ t('Kopieer afbeelding') }}</button>
          <button type="button" data-picprint="pg">{{ t('Afdrukken') }}</button>
        </div>
        <div id="pg-out">
          <lk-note v-if="m.empty" kind="info">{{ t('Vul minstens één stap met temperatuur in.') }}</lk-note>
          <template v-else>
            <lk-note v-if="!m.contig" kind="bad">{{ t('De aangevinkte stappen zijn niet aaneengesloten; de cyclus wordt niet getekend.') }}</lk-note>
            <lk-kv :rows="rows"/>
            <lk-formula>{{ t('Looptijd = som van de staptijden; de echte tijd is langer door de opwarm- en afkoelsnelheid van het apparaat.') }}</lk-formula>
          </template>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:1/-1">
          <label for="pg-title">{{ t('Titel') }}</label>
          <input id="pg-title" class="txt" v-model="title">
        </div>
        <lk-field v-model="cyc" :label="t('Aantal cycli')" for-id="pg-cyc" inputmode="numeric"/>
        <div class="f">
          <label for="pg-scale">{{ t('Breedte van een stap') }}</label>
          <select id="pg-scale" style="width:100%" v-model="scale">
            <option value="time">{{ t('Op tijd (tijdas)') }}</option>
            <option value="eq">{{ t('Even breed') }}</option>
          </select>
        </div>
        <div class="f">
          <label for="pg-time">{{ t('Tijden tonen als') }}</label>
          <select id="pg-time" style="width:100%" v-model="time">
            <option value="mmss">2:00, 0:30</option>
            <option value="txt">2 min, 30 s</option>
          </select>
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="pg-note">{{ t('Eigen tekst onder het schema') }}</label>
          <textarea id="pg-note" rows="2" v-model="note"
                    :placeholder="t('Bijv. incubatie, opmerkingen of verwijzing naar het protocol')"></textarea>
        </div>
        <label class="chk" for="pg-auto" style="grid-column:1/-1">
          <input type="checkbox" id="pg-auto" v-model="auto"> {{ t('Standaardtoelichting tonen') }}
        </label>
      </div>
      <div class="tbl-wrap" style="margin-top:14px">
        <table id="pg-tbl" class="mini">
          <thead>
            <tr>
              <th>{{ t('Stap') }}</th><th class="num">{{ t('Temp. (°C)') }}</th>
              <th class="num">{{ t('Tijd (m:ss of ∞)') }}</th><th>{{ t('In cyclus') }}</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in S" :key="i">
              <td><input class="txt" data-k="n" v-model="r.n" style="width:150px"></td>
              <td><input data-k="t" inputmode="decimal" v-model="r.t" style="text-align:right;width:70px"></td>
              <td><input data-k="d" v-model="r.d" style="text-align:right;width:80px"></td>
              <td style="text-align:center"><input type="checkbox" data-k="c" v-model="r.c" :aria-label="t('In cyclus')"></td>
              <td><button type="button" class="ghost" data-del :aria-label="t('Verwijder')" @click="S.splice(i, 1)">✕</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="row" style="margin-top:10px">
        <button type="button" id="pg-add" @click="add">{{ t('+ Stap') }}</button>
        <button type="button" id="pg-from" @click="from">{{ t('Neem over uit PCR-cyclus') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('De aangevinkte stappen vormen samen de cyclus en moeten aaneengesloten zijn.') }}</p>
    </div>
  </div>
</template>

<script>
/* tekst uit een sjabloon in de taal van de gebruiker; de oude versie deed dit met i18nValue()
   op de invoervelden, wat binnen een Vue-boom niet meer gebeurt */
const loc = v => (LANG === 'en' ? trPlain(v, true) : v);

/* de invoer die storeGet() eerder bewaarde onder de id's van deze velden */
const stored = (id, d) => { try { const v = storeGet()[id]; return v == null ? d : v; } catch (e) { return d; } };

const toRow = r => ({n: loc(r[0]), t: String(r[1]), d: String(r[2]), c: !!r[3]});

export default {
  name: 'PcrProgramma',
  data() {
    const src = pstore.get().pg || PGDEF;
    return {
      S: src.map(toRow),
      title: stored('pg-title', loc('PCR-programma')), cyc: stored('pg-cyc', '35'),
      scale: stored('pg-scale', 'time'), time: stored('pg-time', 'mmss'),
      note: stored('pg-note', ''), auto: stored('pg-auto', true)
    };
  },
  computed: {
    /* dit is het rekenwerk van calc.pprog, letterlijk overgenomen */
    m() {
      const steps = this.S.map(r => ({n: String(r.n).trim(), t: num(r.t), d: r.d, s: pgSecs(r.d), c: r.c}));
      const cyc = Math.max(1, Math.round(num(this.cyc) || 1));
      const ok = steps.filter(s => isFinite(s.t));
      const ci = steps.map((s, i) => s.c ? i : -1).filter(i => i >= 0);
      const contig = ci.length === 0 || ci[ci.length - 1] - ci[0] === ci.length - 1;
      const tCyc = ci.reduce((a, i) => a + (isFinite(steps[i].s) ? steps[i].s : 0), 0);
      const tOther = steps.filter((s, i) => !s.c && isFinite(s.s)).reduce((a, s) => a + s.s, 0);
      return {steps, cyc, ok, ci, contig, tCyc, tOther, empty: ok.length < 1};
    },
    rows() {
      const m = this.m, t = this.t;
      return [[t('Stappen in cyclus'), m.ci.length], [t('Looptijd zonder op- en afkoelen'), mmss2(m.tCyc * m.cyc + m.tOther)]];
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    add() { this.S.push({n: loc('Stap'), t: '72', d: '1:00', c: false}); },
    /* de annealingtemperatuur uit het PCR-cyclus-gereedschap (globale yTa) */
    from() {
      const a = this.S.find(r => /anneal/i.test(r.n));
      /* window.__pcrcVm is PCR-cyclus; window.__pcrVm is PCR-mastermix, niet verwarren */
      const ta = window.__pcrcVm ? window.__pcrcVm.taAuto : NaN;
      if (a && isFinite(ta)) a.t = String(Math.round(ta * 10) / 10).replace('.', ',');
    },
    /* de tekening op #pg-cv en de opslag; elke render en elke invoer-event roept dit aan */
    draw() {
      const cv = document.getElementById('pg-cv'); if (!cv) return;
      const {steps, cyc, ok, ci, contig} = this.m, mode = this.time, title = this.title.trim();
      pstore.set('pg', steps.map(s => [s.n, String(s.t).replace('.', ','), s.d, s.c]));
      if (ok.length < 1) return;
  /* Op een tijdas is de breedte van een stap evenredig met zijn duur, met een ondergrens
     zodat een stap van een paar seconden zichtbaar blijft; de as is daardoor niet strikt
     lineair voor de kortste stappen. Een stap zonder tijd (∞) krijgt de ondergrens. */
  const L=56, SWMIN=70, budget=steps.length*104;
  const secs=steps.map(st=>isFinite(st.s)&&st.s>0?st.s:0), totS=secs.reduce((a,b)=>a+b,0);
  const byTime=this.scale!=='eq'&&totS>0;
  const wid=byTime?secs.map(v=>Math.max(SWMIN,v>0?budget*v/totS:SWMIN)):steps.map(()=>104);
  const X=[]; wid.reduce((a,w,i)=>{ X[i]=L+a; return a+w; },0);
  const totW=wid.reduce((a,b)=>a+b,0);
  const W=Math.max(520,L+totW+34), NL_=pNotes('pg',W), NH=NL_.length?NL_.length*17+10:0, H=(title?40:0)+320+NH;
  const tmin=Math.min(0,...ok.map(s=>s.t)), tmax=Math.max(100,...ok.map(s=>s.t));
  pShow(cv,W,H,(x)=>{ const t0=pTitle(x,title,W), top=t0+64, bot=H-62-NH; if(NL_.length) pDrawNotes(x,NL_,H-NH+4); const Y=t=>bot-(t-tmin)/(tmax-tmin)*(bot-top);
    x.font='11px '+PFONT(); x.textAlign='right'; x.fillStyle=PCOL.muted; x.strokeStyle=PCOL.soft; x.lineWidth=1; [0,25,50,75,100].forEach(v=>{ if(v<tmin||v>tmax) return; x.beginPath(); x.moveTo(L,Y(v)); x.lineTo(W-16,Y(v)); x.stroke(); x.fillText(v+' °C',L-6,Y(v)); });
    if(contig&&ci.length){ const le=ci[ci.length-1], x0=X[ci[0]]+4, x1=X[le]+wid[le]-4; x.fillStyle=PCOL.accSoft; x.fillRect(x0,top-44,x1-x0,bot-top+44); x.fillStyle=PCOL.acc; x.font='600 13px '+PFONT(); x.textAlign='center'; x.fillText(`${cyc}×`,(x0+x1)/2,top-50); x.strokeStyle=PCOL.acc; x.lineWidth=1.4; x.beginPath(); x.moveTo(x0+2,top-34); x.lineTo(x0+2,top-40); x.lineTo(x1-2,top-40); x.lineTo(x1-2,top-34); x.stroke(); }
    x.strokeStyle=PCOL.ink; x.lineWidth=2.4; x.beginPath(); let prev=null;
    steps.forEach((s,i)=>{ if(!isFinite(s.t)) return; const ramp=Math.min(28,wid[i]*0.4), xa=X[i]+(prev==null?0:ramp), xb=X[i]+wid[i], y=Y(s.t); if(prev==null) x.moveTo(xa,y); else x.lineTo(xa,y); x.lineTo(xb,y); prev=y; });
    x.stroke();
    /* op een tijdas zijn korte stappen smal: tekst die niet past wordt kleiner gezet,
       afgebroken over regels of weggelaten, zodat labels elkaar niet overlappen */
    const fitTxt=(t,w)=>{ if(x.measureText(uv(t)).width<=w) return t; let r=t;
      while(r.length>1&&x.measureText(uv(r+'…')).width>w) r=r.slice(0,-1);
      return r.length>1?r+'…':''; };
    steps.forEach((s,i)=>{ if(!isFinite(s.t)) return;
      /* temperatuur en tijd boven het vlakke deel, dus naast de helling; de naam onder de hele stap */
      const rmp=i===0?0:Math.min(28,wid[i]*0.4), xm=X[i]+rmp+(wid[i]-rmp)/2, xn=X[i]+wid[i]/2,
        y=Y(s.t), room=wid[i]-rmp-6;
      x.textAlign='center'; x.fillStyle=PCOL.ink;
      x.font='600 12.5px '+PFONT(); let tt=`${NL(s.t,1)} °C`;
      if(x.measureText(tt).width>room){ x.font='600 11px '+PFONT(); }
      if(x.measureText(tt).width<=room) x.fillText(tt,xm,y-11);
      x.font='12px '+PFONT(); const dt=pgFmt(s.s,mode);
      if(x.measureText(dt).width<=room) x.fillText(dt,xm,y+13);
      x.fillStyle=PCOL.muted; x.font='11.5px '+PFONT();
      /* eerst vertalen, dan pas afbreken: een afgekapt woord hoort geen eigen vertaalsleutel
         te worden, dus de stukken gaan als gebruikerstekst (uv) naar het canvas */
      const room2=wid[i]-6, words=trCanvas(String(s.n||'')).split(' '); let line='', ly=bot+20, lines=0;
      words.forEach(w=>{ const t2=(line+' '+w).trim();
        if(x.measureText(uv(t2)).width>room2&&line){ if(lines<1){ x.fillText(uv(line),xn,ly); ly+=14; lines++; line=w; } else line=t2; }
        else line=t2; });
      if(line) x.fillText(uv(fitTxt(line,room2)),xn,ly); });
  });
    }
  }
};
</script>
