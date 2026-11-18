/* ================= SIGNIFICANTE CIJFERS =================
   Op Vue 3 en declaratief opgebouwd met de gedeelde componenten uit 00b_ui.js.

   Het rekenwerk hieronder is onveranderd: het telt met BigInt op de getypte cijfers, niet met
   een afgeronde computerwaarde, dus 0,004565 rondt af op wat er staat en niet op wat een
   double ervan maakt.

   De id's sf-x, sf-n, sf-m, sf-u, sf-ud en sf-out blijven zoals ze waren, zodat delen via een
   link, ongedaan maken, de invoeropslag en tests/validate.py blijven werken. */
function sfParse(s){ s=String(s).trim().replace(/\s/g,'').replace(/×10\^?/,'e').replace(',','.'); const m=s.match(/^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/); if(!m||(!m[2]&&!m[3])) return null;
  const ip=m[2]||'', fp=m[3]||'', all=(ip+fp).replace(/^0+/,''); let e=-(fp.length)+(m[4]?+m[4]:0); if(!all) return {neg:false,D:0n,e,sf:fp?Math.max(1,fp.length):1,amb:false,zero:true};
  const D=BigInt(all), lead=all.length, trailInt=!m[3]&&!m[4]?(ip.match(/0+$/)||[''])[0].length:0; return {neg:m[1]==='-',D,e,sf:lead,amb:trailInt>0,min:lead-trailInt,zero:false}; }
const sfLen=D=>D.toString().length;
function sfRoundAt(D,e,p,mode){ if(p<=e) return {D:D*10n**BigInt(e-p),e:p}; const div=10n**BigInt(p-e); let q=D/div; const r=D%div, two=2n*r; if(two>div||(two===div&&(mode==='up'||q%2n===1n))) q+=1n; return {D:q,e:p}; }
function sfRoundSig(x,n,mode){ if(x.zero) return {D:0n,e:0}; const msd=x.e+sfLen(x.D)-1; let r=sfRoundAt(x.D,x.e,msd-n+1,mode); if(sfLen(r.D)>n) r=sfRoundAt(r.D,r.e,r.e+1,mode); return r; }
function sfStr(D,e,neg){ let s=D.toString(); if(e>=0) s=s+'0'.repeat(e); else { s=s.padStart(-e+1,'0'); s=s.slice(0,s.length+e)+','+s.slice(s.length+e); } return (neg&&D!==0n?'−':'')+s; }
function sfSci(D,e,neg){ const s=D.toString(), ex=e+s.length-1; return `${neg?'−':''}${s[0]}${s.length>1?','+s.slice(1):''} × 10<sup>${ex}</sup>`; }

const SF_TPL = `<div class="grid2">
  <div class="panel">
    <div class="fields">
      <lk-field v-model="x" :label="t('Getal of meetwaarde')" for-id="sf-x" cls="txt mono" inputmode="text"/>
      <lk-field v-model="n" :label="t('Afronden op')" for-id="sf-n" :unit="t('sign. cijfers')" inputmode="numeric"/>
      <div class="f"><label for="sf-m">{{ t('Regel bij precies de helft') }}</label><select id="sf-m" v-model="mode"><option value="up">{{ t('half naar boven (weg van nul)') }}</option><option value="even">{{ t('half naar even (bankiers)') }}</option></select></div>
      <lk-field v-model="u" :label="t('Onzekerheid (optioneel)')" for-id="sf-u" cls="txt mono" inputmode="text"/>
      <div class="f"><label for="sf-ud">{{ t('Cijfers in de onzekerheid') }}</label><select id="sf-ud" v-model="ud"><option value="2">{{ t('2 (aanbevolen)') }}</option><option value="1">1</option></select></div>
    </div>
    <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="hint"></p>
  </div>
  <div class="result"><div id="sf-out">
    <lk-note v-if="err" kind="info">{{ err }}</lk-note>
    <template v-else>
      <lk-big :label="roundLabel" :value="rounded" cls="mono"/>
      <lk-kv :rows="rows"/>
      <template v-if="unc">
        <lk-big :label="t('Meetwaarde met onzekerheid')" :value="unc.big" cls="mono" top="14px"/>
        <lk-kv :rows="unc.rows"/>
      </template>
      <lk-formula :html="formula"/>
    </template>
  </div></div>
</div>`;

const sfVue = lkVueMount('#sf-app', {
  template: SF_TPL,
  data() { return {x: lkNumIn('0,0045650'), n: '3', mode: 'up', u: lkNumIn('0,0000234'), ud: '2'}; },
  computed: {
    /* één sleutel voor de hele alinea, met de opmaak erin: zie tHtml() in 00a_vue.js */
    hint() {
      return this.tHtml('Komma of punt als decimaalteken; wetenschappelijke notatie mag (bijv. <span class="mono">4,565e-3</span>). Er wordt met de getypte cijfers gerekend, niet met een afgeronde computerwaarde.');
    },
    parsed() { return sfParse(this.x); },
    digits() { return Math.round(num(this.n)); },
    err() {
      if (!this.parsed) return this.t('Vul een getal in, bijvoorbeeld 0,004565 of 4,565e-3.');
      if (!(this.digits >= 1 && this.digits <= 20)) return this.t('Kies 1 tot 20 significante cijfers.');
      return '';
    },
    roundLabel() { return this.t('Afgerond op ' + this.digits + ' significante cijfers'); },
    rounded() {
      const r = sfRoundSig(this.parsed, this.digits, this.mode);
      return lkNumIn(sfStr(r.D, r.e, this.parsed.neg));
    },
    rows() {
      const t = this.t, x = this.parsed, n = this.digits, mode = this.mode;
      const r = sfRoundSig(x, n, mode), alt = sfRoundSig(x, n, mode === 'up' ? 'even' : 'up');
      const rs = sfStr(r.D, r.e, x.neg), as = sfStr(alt.D, alt.e, x.neg);
      return [[t('Wetenschappelijk'), x.zero ? '0' : lkNumIn(sfSci(r.D, r.e, x.neg))],
        [t('Significante cijfers in de invoer'), x.zero ? '–'
          : x.amb ? t(x.min + ' tot ' + x.sf + ' (nullen aan het eind van een geheel getal zijn dubbelzinnig)')
            : lkNumIn(String(x.sf))],
        [t('Met de andere halveringsregel'),
          lkNumIn(as) + (as === rs ? ' ' + t('(zelfde)') : ' ' + t('(anders)'))]];
    },
    unc() {
      const x = this.parsed, u = sfParse(this.u), nd = +this.ud, t = this.t;
      if (!u || u.zero || u.neg) return null;
      const ru = sfRoundSig(u, nd, 'up'), up = ru.e + sfLen(ru.D) - nd;
      const ux = sfRoundAt(ru.D, ru.e, up, 'up');
      const xv = x.zero ? {D: 0n, e: up} : sfRoundAt(x.D, x.e, up, this.mode);
      return {
        big: `${lkNumIn(sfStr(xv.D, xv.e, x.neg))} ± ${lkNumIn(sfStr(ux.D, ux.e, false))}`,
        rows: [[t('Beknopte notatie'), lkNumIn(`${sfStr(xv.D, xv.e, x.neg)}(${ux.D.toString()})`)],
          [t('Decimalen'), lkNumIn(String(Math.max(0, -up)))]]
      };
    },
    formula() {
      const nd = +this.ud;
      return this.t(nd > 1 ? 'onzekerheid op ' + nd + ' cijfers · waarde op dezelfde decimaal'
        : 'onzekerheid op ' + nd + ' cijfer · waarde op dezelfde decimaal');
    }
  }
});
/* de rest van de app roept calc[tool]() aan na het delen van een link, ongedaan maken en bij
   het openen; een Vue-component rekent zelf opnieuw, dus hier hoeft niets te gebeuren */
calc.sigfig = () => {};
