<!-- ================= CHROMATOGRAM (S149) =================
     Opent een ABIF-bestand (.ab1) van een Sanger-sequencer: een kaart met de gegevens van de run
     en de sequentie in blokken van 10. Een FASTA of geplakte tekst werkt als terugval (zonder trace).
     Het inlezen staat in src/lib/abif.js, het tekenen van de trace in src/lib/tracedraw.js (S150).
     De read is markRaw: 4 × 16 000 scanpunten hoeven niet reactief te zijn, het venster (view)
     wordt buiten Vue bijgehouden en elke wijziging tekent het canvas één keer per frame.
     De id's sg-file, sg-paste, sg-clear, sg-out, sg-cv en sg-seq blijven zoals ze zijn. -->
<template>
  <div class="picwrap">
    <div class="pic-prev">
      <div class="result">
        <div id="sg-out">
          <lk-note v-if="err" kind="bad">{{ err }}</lk-note>
          <lk-note v-if="!m.ok" kind="info">{{ t('Kies een .ab1-bestand, sleep het hierheen of plak een sequentie.') }}</lk-note>
          <template v-else>
            <lk-kv :rows="rows"/>
            <lk-note v-if="hasQ && !trim" kind="warn">{{ t('Geen enkel venster haalt de drempel; er is geen trimvoorstel.') }}</lk-note>
            <lk-note v-if="m.mismatch" kind="warn">{{ t('Het aantal basen en het aantal piekposities in dit bestand verschilt; de overtollige basen zijn weggelaten.') }}</lk-note>
          </template>
        </div>
        <div v-if="m.r.traces" class="sg-trace" style="margin-top:12px">
          <div class="row" style="gap:6px;margin-bottom:6px">
            <button type="button" id="sg-zin" @click="zoom(1 / 1.5)" :aria-label="t('Inzoomen')">+</button>
            <button type="button" id="sg-zout" @click="zoom(1.5)" :aria-label="t('Uitzoomen')">−</button>
            <button type="button" id="sg-zall" @click="whole">{{ t('Hele read') }}</button>
            <span style="margin-left:auto;font-weight:600;letter-spacing:6px"><span v-for="b in 'ACGT'" :key="b" :style="{color: dye[b]}">{{ b }}</span></span>
          </div>
          <canvas id="sg-cv" ref="cv" tabindex="0" style="width:100%;display:block;cursor:grab;touch-action:none" :style="{height: HT + 'px'}"
                  :aria-label="t('Trace van de vier kanalen; slepen schuift, scrollen zoomt, de strook onderaan toont de hele read')"
                  @wheel.prevent="wheel" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @keydown="key"></canvas>
          <p style="font-size:13px;color:var(--muted);margin:6px 0 0">{{ t('Slepen schuift, scrollen zoomt (Shift + scrollen schuift); klik in de strook onderaan om naar die plek te gaan.') }}</p>
          <p style="font-size:13px;color:var(--muted);margin:4px 0 0">{{ t('Klik op een base om hem te selecteren en typ een letter om hem te wijzigen; de oorspronkelijke call blijft bewaard.') }}</p>
          <div v-if="sel != null || nEd" class="row" style="gap:10px;margin-top:8px;align-items:center;flex-wrap:wrap">
            <template v-if="sel != null">
              <b>{{ t('Base ' + (sel + 1)) }}</b>
              <span>{{ t('Origineel') }}: {{ read.bases[sel] }}</span>
              <span v-if="het && het[sel]">{{ t('Automatisch') }}: {{ auto[sel] }} ({{ t('verhouding') }} {{ fmtR(het[sel].ratio) }})</span>
              <input id="sg-base" class="mono" maxlength="1" :value="seq[sel]" :aria-label="t('Base')" style="width:3em;text-align:center;text-transform:uppercase" @input="onBase">
              <button type="button" id="sg-undo-base" :disabled="edits[sel] == null" @click="setBase(sel, auto[sel])">{{ t('Origineel terugzetten') }}</button>
            </template>
            <template v-if="nEd">
              <span>{{ t(nEd + ' bewerkt') }}</span>
              <button type="button" id="sg-undo-all" @click="undoAll">{{ t('Alle bewerkingen terugzetten') }}</button>
            </template>
          </div>
        </div>
        <div v-if="m.ok" class="row" style="gap:10px;margin-top:12px;align-items:center;flex-wrap:wrap">
          <label class="chk" for="sg-rc"><input type="checkbox" id="sg-rc" v-model="rc"> {{ t('Reverse complement') }}</label>
          <button type="button" id="sg-copy" @click="copy">{{ t('Kopieer als FASTA') }}</button>
          <button type="button" id="sg-fasta" @click="saveFasta">{{ t('FASTA van de getrimde read') }}</button>
          <template v-if="m.r.traces">
            <button type="button" id="sg-png" @click="savePng">{{ t('PNG van het venster') }}</button>
            <button type="button" id="sg-svg" @click="saveSvg">{{ t('SVG van het venster') }}</button>
            <button type="button" id="sg-print" @click="print">{{ t('Afdrukken in rijen van 60') }}</button>
          </template>
          <span v-if="rng">{{ t('Bereik') }}: {{ rng.a + 1 }}–{{ rng.b + 1 }} ({{ rng.b - rng.a + 1 }} {{ t('basen') }})</span>
          <span v-if="copied" role="status">{{ copied }}</span>
        </div>
        <p v-if="m.ok" style="font-size:13px;color:var(--muted);margin:4px 0 0">{{ t('Klik op een base in het paneel om naar die plek in de trace te gaan; Shift + klik selecteert een bereik, dat Kopieer als FASTA kopieert.') }}</p>
        <pre id="sg-seq" ref="pre" class="mono" v-if="m.ok" style="white-space:pre-wrap;overflow:auto;max-height:18em;margin-top:8px" @click="panelClick"><template v-for="r in seqRows" :key="r.pos"><span>{{ r.pos }}</span>{{ '  ' }}<template v-for="(g, gi) in r.groups" :key="gi"><template v-if="gi">{{ ' ' }}</template><span v-for="b in g" :key="b.i" :data-i="b.i" :class="{'sg-sel': b.i === sel, 'sg-rng': inRng(b.i)}" :title="b.o ? t('Origineel') + ': ' + b.o : null" :style="{background: b.i === sel ? '#90caf9' : inRng(b.i) ? '#bbdefb' : b.o ? '#ffe0b2' : b.hz ? HETBG : null, color: b.g ? 'var(--muted)' : null, cursor: 'pointer'}">{{ b.c }}</span></template>{{ '\n' }}</template></pre>
        <div v-if="m.ok && het" id="sg-snp" style="margin-top:12px">
          <h3>{{ t('SNP-tabel') }}</h3>
          <p v-if="snpCounts" style="font-size:13px;margin:4px 0">{{ snpCounts }}</p>
          <p v-if="snp.rows.length" style="font-size:13px;color:var(--muted);margin:4px 0">{{ t('Waarschuwingen zijn vuistregels om een call na te kijken, geen vaste grenzen.') }}</p>
          <lk-note v-else kind="info">{{ t('Geen heterozygote, gemarkeerde of bewerkte posities.') }}</lk-note>
          <div v-if="snp.rows.length" style="max-height:24em;overflow:auto"><lk-table table-id="sg-snp-tbl" :cols="snpCols" :rows="snp.rows"/></div>
          <button v-if="snp.rows.length" type="button" id="sg-snp-csv" style="margin-top:8px" @click="saveSnp">{{ t('SNP-tabel als CSV') }}</button>
        </div>
        <!-- S158–S161: uitlijning tegen de referentie, variantenlijst, genotypes van de assay en forward/reverse -->
        <div v-if="m.ok && refSeq" id="sg-aln" style="margin-top:12px">
          <h3>{{ t('Uitlijning tegen de referentie') }}</h3>
          <lk-note v-if="refBig" kind="warn">{{ t('De referentie is langer dan 200 000 basen; neem alleen het stuk rond je amplicon.') }}</lk-note>
          <lk-note v-else-if="!aln1" kind="warn">{{ t('De eerste read lijkt niet op de referentie (te weinig gedeelde stukjes van 11 basen op beide strengen).') }}</lk-note>
          <template v-else>
            <lk-kv :rows="alnKv"/>
            <lk-note v-if="read2Ok && !aln2" kind="warn">{{ t('De tweede read lijkt niet op de referentie.') }}</lk-note>
            <p style="font-size:13px;color:var(--muted);margin:6px 0 4px">{{ t('Ref = referentie, R1 = eerste read, R2 = tweede read (beide op de referentiestreng). Rood: anders dan de referentie, paars: heterozygoot, onderstreept: er volgt een insertie. Op de regel eronder: ! = de reads zijn het oneens, · = maar één read dekt de positie. Klik op een base van R1 om hem in de trace te zien.') }}</p>
            <pre id="sg-aln-view" class="mono" style="white-space:pre;overflow:auto;max-height:22em;margin:0;font-size:12px" @click="alnClick"><template v-for="(bl, bi) in alnView" :key="bi"><template v-for="ln in bl" :key="ln.k">{{ ln.lab }}<span v-for="(c, ci) in ln.cells" :key="ci" :data-q="c.q" :title="c.tip" :style="c.st">{{ c.c }}</span>{{ '\n' }}</template>{{ '\n' }}</template></pre>
          </template>
        </div>
        <div v-if="aln1" id="sg-var" style="margin-top:12px">
          <h3>{{ t('Variantenlijst') }}</h3>
          <p style="font-size:13px;color:var(--muted);margin:4px 0">{{ t('Een overzicht om te leren, geen klinisch rapport. Posities in de nummering van de referentie (g.), volgens de HGVS-regels; een gat in een herhaling staat op de meest 3′-positie.') }}</p>
          <lk-note v-if="!vars.length" kind="info">{{ t('Geen verschillen met de referentie in het uitgelijnde stuk.') }}</lk-note>
          <div v-else style="max-height:20em;overflow:auto"><lk-table table-id="sg-var-tbl" :cols="varCols" :rows="varRows"/></div>
        </div>
        <div v-if="aln1 && snpc.length" id="sg-gt" style="margin-top:12px">
          <h3>{{ t('Genotypes van de assay') }}</h3>
          <p style="font-size:13px;color:var(--muted);margin:4px 0">{{ t('Allelen op de streng van de assay; een SNP op de andere streng wordt automatisch omgedraaid.') }}</p>
          <lk-table table-id="sg-gt-tbl" :cols="gtCols" :rows="gtRows"/>
          <div v-if="hasDb" id="sg-gt-confirm"><lk-note kind="info">{{ t('De kolom Volgens dbSNP is een voorstel: je eigen pieken plus de allelen en de streng van dbSNP. Controleer dit tegen de trace (en de tweede read als je die hebt) voordat je het genotype gebruikt; de bevestiging is aan jou.') }}</lk-note></div>
          <!-- S199: allelen en streng uit dbSNP, zodat een SNP op de andere streng vanzelf goed staat -->
          <details id="sg-gt-dbp" style="margin-top:8px">
            <summary style="cursor:pointer;font-size:13px">{{ t('Allelen en streng uit dbSNP') }}</summary>
            <ncbi-switch/>
            <p style="font-size:13px;color:var(--muted);margin:6px 0">{{ t('LabKit zoekt elk rs-nummer van de assay op in dbSNP, bepaalt zelf op welke streng het amplicon ligt (uit de allelen, en anders uit 20 basen flank) en meldt het genotype in de richting van dbSNP, met het referentie-allel.') }}</p>
            <button type="button" id="sg-gt-db" :disabled="dbBusy || !dbRs.length" @click="dbLookup">{{ t('Opzoeken in dbSNP') }}</button>
            <lk-note v-if="dbBusy" kind="info">{{ t('Bezig met opzoeken bij NCBI…') }}</lk-note>
            <lk-note v-for="(m, i) in dbMsg" :key="i" kind="warn">{{ m }}</lk-note>
          </details>
        </div>
        <!-- S167: de uitkomsten van de webtool, samengevat en als figuur (staat in .result, dus ook in het rapport) -->
        <div v-if="rsRows.length" id="sg-rs-out" style="margin-top:12px">
          <h3>{{ t('Uitkomsten van de webtool') }}</h3>
          <lk-kv :rows="rsRows"/>
          <lk-note v-for="(m, i) in rsWarn" :key="i" kind="warn">{{ m }}</lk-note>
          <p style="font-size:13px;color:var(--muted);margin:6px 0 0">{{ t('Voorspeld door de HIrisPlex-S-webtool van het Erasmus MC, niet door LabKit. Een kans is geen zekerheid.') }}</p>
          <template v-if="rsFig"><canvas v-for="g in RESULT_GROUPS" :key="g[0]" :id="'sg-rs-cv-' + g[0]" ref="rscv" :aria-label="t('Kansen per categorie van de webtool') + ': ' + t(g[1])"></canvas></template>
        </div>
        <!-- S162: veel reads tegelijk, een rij per monster, en dezelfde SNP van alle monsters onder elkaar -->
        <div v-if="batch.length" id="sg-batch" style="margin-top:12px">
          <h3>{{ t('Batch: genotypes per monster') }}</h3>
          <lk-note v-if="bbusy" kind="info">{{ t('Bezig met uitlijnen…') }}</lk-note>
          <lk-note v-if="!refSeq" kind="warn">{{ t('Geef bij Referentie en assay een referentie of een assay; dan worden de bestanden uitgelijnd.') }}</lk-note>
          <template v-else>
            <p style="font-size:13px;color:var(--muted);margin:4px 0">{{ t('Allelen op de streng van de assay; een streepje betekent dat de read de SNP niet dekt, een uitroepteken dat de allelen niet bij de assay horen.') }}</p>
            <div style="overflow:auto"><lk-table table-id="sg-bt-tbl" :cols="btCols" :rows="btRows"/></div>
            <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button type="button" id="sg-bt-csv" @click="saveBatch">{{ t('Tabel als CSV') }}</button></div>
            <template v-if="assayOn && assayEff.snps.length">
              <h3 style="margin-top:12px">{{ t('Overlay per SNP') }}</h3>
              <div class="f"><label for="sg-ov-snp">{{ t('SNP') }}</label>
                <select id="sg-ov-snp" v-model="ovSnp"><option v-for="(s, i) in assayEff.snps" :key="i" :value="String(i)">{{ s.rs }}</option></select></div>
              <canvas id="sg-ovcv" ref="ovcv" style="width:100%;display:block;margin-top:6px" :style="{height: ovH + 'px'}"
                      :aria-label="t('De trace rond één SNP van alle monsters onder elkaar')"></canvas>
              <p style="font-size:13px;color:var(--muted);margin:4px 0 0">{{ t('Elke strook toont 17 basen rond de SNP, gecentreerd op de piek van de SNP; bij een reverse read loopt de trace in de richting van de read.') }}</p>
            </template>
          </template>
        </div>
        <div v-if="aln1 && aln2" id="sg-fr" style="margin-top:12px">
          <h3>{{ t('Forward/reverse-bevestiging') }}</h3>
          <p style="font-size:13px;margin:4px 0">{{ frCounts }}</p>
          <lk-note v-if="frDiff.length" kind="bad">{{ t('De reads zijn het oneens op ' + frDiff.length + ' posities. Kijk beide traces na voordat je een genotype noemt.') }}</lk-note>
          <lk-note v-else kind="ok">{{ t('Waar beide reads de referentie dekken, zijn ze het eens.') }}</lk-note>
          <lk-table v-if="frDiff.length" table-id="sg-fr-tbl" :cols="frCols" :rows="frDiff"/>
        </div>
      </div>
      <!-- S164: het genotypeblad van HIrisPlex-S; LabKit bereidt voor en controleert, de voorspelling doet de webtool -->
      <details class="panel" id="sg-hsp" :open="hs.samples.length > 0">
        <summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('HIrisPlex-S genotypeblad') }}</summary>
        <lk-note kind="info">{{ t('LabKit vult dit blad in, controleert het en exporteert het; de voorspelling van oog-, haar- en huidskleur doet LabKit niet zelf. Die berekent de webtool van het Erasmus MC.') }}</lk-note>
        <div class="f" style="margin-top:10px"><label for="sg-hs-panel">{{ t('Paneel') }}</label>
          <select id="sg-hs-panel" v-model="hs.panel"><option v-for="(n, k) in PANEL_NAME" :key="k" :value="k">{{ t(n) }}</option></select></div>
        <p style="font-size:13px;color:var(--muted);margin:6px 0">{{ t('Per SNP het aantal kopieën (0, 1 of 2) van het allel in de kolom Telt, of NA als het genotype ontbreekt. Volgorde en allelen zoals in de webtool.') }}</p>
        <div style="overflow:auto;max-height:28em">
          <table id="sg-hs-tbl" class="tbl">
            <thead><tr><th>#</th><th>SNP</th><th>{{ t('Telt') }}</th>
              <th v-for="(sm, si) in hs.samples" :key="si" style="min-width:7em"><input class="mono" style="width:6em" :value="sm.id" :aria-label="t('Monsternaam')" @input="sm.id = $event.target.value">
                <button type="button" :aria-label="t('Monster verwijderen')" @click="delSample(si)">×</button></th></tr></thead>
            <tbody><tr v-for="s in hsSnps" :key="s.rs">
              <td>{{ s.order }}</td><td class="mono">{{ s.rs }}</td><td class="mono"><b>{{ s.allele }}</b></td>
              <td v-for="(sm, si) in hs.samples" :key="si" :style="{background: hsBad(sm, s) ? '#ffcdd2' : null}">
                <select class="mono" :aria-label="s.rs + ' ' + sm.id" v-model="sm.vals[s.rs]"><option v-for="v in HS_VALUES" :key="v" :value="v">{{ v || '–' }}</option></select>
                <span v-if="sm.notes && sm.notes[s.rs]" :title="noteText(sm.notes[s.rs])" style="cursor:help"> ⚠</span></td>
            </tr></tbody>
          </table>
        </div>
        <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">
          <button type="button" id="sg-hs-add" @click="addSample('')">{{ t('+ Monster') }}</button>
          <button type="button" id="sg-hs-fill" :disabled="!snpc.length" @click="fillRead">{{ t('Vul in uit de calls van de read') }}</button>
          <button type="button" id="sg-hs-fillb" :disabled="!batch.length || !assayEff.snps.length" @click="fillBatch">{{ t('Vul in uit de batch') }}</button>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:6px 0 0">{{ t('Het genotype van de assay wordt omgezet naar het aantal kopieën van het allel dat de webtool telt; staat een SNP op de andere streng, dan wordt hij omgedraaid. Een ⚠ bij een cel zegt waarom je hem moet nakijken.') }}</p>
        <lk-note v-for="(m, i) in hsMsgs" :key="i" :kind="m[0]">{{ m[1] }}</lk-note>
        <!-- S200: alle SNP's van het paneel tegen dbSNP -->
        <details id="sg-hs-vp" style="margin-top:10px">
          <summary style="cursor:pointer;font-size:13px">{{ t('Controleer het paneel in dbSNP') }}</summary>
          <ncbi-switch/>
          <p style="font-size:13px;color:var(--muted);margin:6px 0">{{ t('Per SNP van het gekozen paneel: gen, positie en allelen volgens dbSNP, en of het allel dat de webtool telt daarbij hoort. Andere streng betekent: de webtool telt het complement van een allel van dbSNP (dbSNP geeft de plusstreng).') }}</p>
          <button type="button" id="sg-hs-verify" :disabled="hvBusy" @click="verifyPanel">{{ t('Controleer in dbSNP') }}</button>
          <lk-note v-if="hvBusy" kind="info">{{ t('Bezig met opzoeken bij NCBI…') + ' ' + hvRows.length + '/' + hsSnps.length }}</lk-note>
          <lk-note v-if="hvSum" :kind="hvSum[0]">{{ hvSum[1] }}</lk-note>
          <div v-if="hvRows.length" style="overflow:auto;max-height:24em"><lk-table table-id="sg-hs-vtbl" :cols="hvCols" :rows="hvView"/></div>
        </details>
        <h3 style="margin-top:14px">{{ t('Naar de webtool') }}</h3>
        <div class="row" style="gap:6px;flex-wrap:wrap">
          <button type="button" id="sg-hs-csv" :disabled="!hs.samples.length" @click="saveSheet">{{ t('Exporteer als .csv') }}</button>
          <button type="button" id="sg-hs-copy" :disabled="!hs.samples.length" @click="copySheet">{{ t('Kopieer het .csv') }}</button>
          <span v-if="hsCopied" role="status">{{ hsCopied }}</span>
        </div>
        <p style="font-size:13px;margin:8px 0 0">{{ t('Upload het .csv-bestand op de webtool van het Erasmus MC:') }}
          <a id="sg-hs-link" href="https://hirisplex.erasmusmc.nl/" target="_blank" rel="noopener">hirisplex.erasmusmc.nl</a>.
          {{ t('Je krijgt per monster de kans op elke categorie van oog-, haar- en huidskleur terug; die kun je hieronder bij Uitkomsten van de webtool invullen. Een lege cel wordt NA in het bestand.') }}</p>
        <lk-note kind="info">{{ t('LabKit voorspelt zelf geen kleuren en vervangt de webtool niet: de regressiecoëfficiënten van het model zijn niet openbaar, en geraden getallen zouden officieel lijken maar fout zijn.') }}</lk-note>
      </details>
      <details class="panel" id="sg-rsp" :open="rsOpen">
        <summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Uitkomsten van de webtool invullen') }}</summary>
        <p style="font-size:13px;color:var(--muted);margin:8px 0">{{ t('Vul de kansen in die de webtool teruggaf (een getal van 0 tot 1, of een percentage), of plak ze in de volgorde van de tabel.') }}</p>
        <div v-if="!hs.samples.length"><lk-note kind="info">{{ t('Voeg eerst in het genotypeblad een monster toe.') }}</lk-note></div>
        <template v-else>
          <div class="f"><label for="sg-rs-smp">{{ t('Monster') }}</label>
            <select id="sg-rs-smp" v-model="rsIdx"><option v-for="(sm, i) in hs.samples" :key="i" :value="i">{{ sm.id }}</option></select></div>
          <div class="f" style="margin-top:8px"><label for="sg-rs-paste">{{ t('Plak de kansen') }}</label>
            <textarea id="sg-rs-paste" class="mono" rows="2" v-model="rsPaste" spellcheck="false"></textarea></div>
          <div class="row" style="gap:6px;margin-top:6px"><button type="button" id="sg-rs-go" @click="rsApply">{{ t('Verwerk') }}</button></div>
          <lk-note v-if="rsMsg" kind="warn">{{ rsMsg }}</lk-note>
          <table id="sg-rs-tbl" class="tbl" style="margin-top:8px">
            <thead><tr><th>{{ t('Eigenschap') }}</th><th>{{ t('Categorie') }}</th><th>{{ t('Kans') }}</th></tr></thead>
            <tbody><template v-for="g in RESULT_GROUPS" :key="g[0]"><tr v-for="(c, ci) in g[2]" :key="g[0] + ci">
              <td>{{ ci ? '' : t(g[1]) }}</td><td>{{ t(c) }}</td>
              <td><input class="mono" style="width:5em" inputmode="decimal" :aria-label="t(g[1]) + ' ' + t(c)" v-model="rsCur[g[0] + '.' + ci]"></td>
            </tr></template></tbody>
          </table>
          <div class="f" style="margin-top:8px"><label for="sg-rs-thr">{{ t('Drempel voor een stellige uitspraak') }}</label>
            <input id="sg-rs-thr" class="mono" style="width:5em" inputmode="decimal" v-model="rsThr"></div>
          <p style="font-size:13px;color:var(--muted);margin:6px 0 0">{{ t('De drempel is jouw keuze (standaard 0,7); onder die kans meldt LabKit dat de uitkomst niet stellig is.') }}</p>
        </template>
      </details>
    </div>
    <div>
      <div class="panel">
        <h3>{{ t('Bestand') }}</h3>
        <div class="dropzone" :style="over ? 'outline:2px dashed var(--accent)' : ''" style="padding:10px"
             @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="drop">
          <input type="file" id="sg-file" accept=".ab1,.abi,.fsa,.fasta,.fa,.fas,.seq,.txt"
                 :aria-label="t('Chromatogram kiezen')" @change="pick">
          <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Een .ab1-bestand, of een FASTA- of tekstbestand met een sequentie. Je kunt het ook hierheen slepen.') }}</p>
        </div>
        <div class="f" style="margin-top:12px"><label for="sg-paste">{{ t('Of plak een FASTA of kale basen') }}</label>
          <textarea id="sg-paste" class="mono" rows="5" v-model="paste" spellcheck="false"></textarea></div>
        <div class="row" style="margin-top:10px">
          <button type="button" id="sg-clear" @click="clear">{{ t('Wissen') }}</button>
        </div>
      </div>
      <div class="panel">
        <h3>{{ t('Kwaliteit en trimmen') }}</h3>
        <div class="grid2">
          <lk-field v-model="win" :label="t('Venster')" for-id="sg-win" :unit="t('basen')"/>
          <lk-field v-model="qthr" :label="t('Drempel')" for-id="sg-q" unit="Q"/>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('De read begint bij het eerste venster en eindigt bij het laatste venster waarvan de gemiddelde Phred-kwaliteit de drempel haalt; de rest staat grijs.') }}</p>
      </div>
      <div class="panel">
        <h3>{{ t('Heterozygoten') }}</h3>
        <lk-field v-model="hthr" :label="t('Drempel tweede piek')" for-id="sg-het" inputmode="decimal"/>
        <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Per base de hoogte van de tweede piek gedeeld door die van de hoogste. Vanaf de drempel wordt de base een IUPAC-code (R, Y, S, W, K, M) en krijgt hij een paarse markering.') }}</p>
      </div>
      <div v-if="read" class="panel" id="sg-ovr">
        <h3>{{ t('Handmatige calls') }}</h3>
        <div class="row" style="gap:10px;align-items:flex-end;flex-wrap:wrap">
          <lk-field v-model="opos" :label="t('Positie')" for-id="sg-ovr-pos" inputmode="numeric"/>
          <lk-field v-model="obase" :label="t('Base')" for-id="sg-ovr-base"/>
          <button type="button" id="sg-ovr-set" @click="setOvr">{{ t('Wijzig call') }}</button>
        </div>
        <lk-note v-if="!nEd" kind="info">{{ t('Geen handmatige calls.') }}</lk-note>
        <table v-else id="sg-ovr-tbl" class="tbl" style="margin-top:8px">
          <thead><tr><th>{{ t('Positie') }}</th><th>{{ t('Sequencer') }}</th><th>{{ t('Automatisch') }}</th><th>{{ t('Jouw call') }}</th><th></th></tr></thead>
          <tbody><tr v-for="i in edited" :key="i">
            <td><button type="button" class="mono" :aria-label="t('Ga naar positie ' + (i + 1))" @click="goTo(i)">{{ i + 1 }}</button></td>
            <td class="mono">{{ read.bases[i] }}</td><td class="mono">{{ auto[i] }}</td><td class="mono">{{ edits[i] }}</td>
            <td><button type="button" :aria-label="t('Positie ' + (i + 1) + ' terugzetten')" @click="setBase(i, auto[i])">{{ t('Terugzetten') }}</button></td>
          </tr></tbody>
        </table>
        <button v-if="nEd" type="button" style="margin-top:8px" @click="undoAll">{{ t('Alle bewerkingen terugzetten') }}</button>
      </div>
      <details class="panel" id="sg-refp" :open="refOpen">
        <summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Referentie en assay') }}</summary>
        <div class="f" style="margin-top:10px"><label for="sg-assay">{{ t('Assay') }}</label>
          <select id="sg-assay" v-model="assayKey">
            <option value="">{{ t('Geen (alleen een referentie)') }}</option>
            <option value="oefen">{{ t(TEACH.name) }}</option>
            <option v-for="a in own" :key="a.name" :value="'eigen:' + a.name">{{ a.name }}</option>
          </select></div>
        <lk-note v-if="assayKey === 'oefen'" kind="info">{{ t('Dit oefenpanel is verzonnen: de sequentie en de SNP-namen bestaan niet echt.') }}</lk-note>
        <button v-if="assayKey === 'oefen'" type="button" id="sg-teach" style="margin-top:6px" @click="teach">{{ t('Oefenreads laden') }}</button>
        <lk-note v-if="assay && !assayOn" kind="warn">{{ t('De referentie wijkt af van die van de assay; de SNP-posities van de assay doen niet mee.') }}</lk-note>
        <div class="f" style="margin-top:10px"><label for="sg-ref">{{ t('Referentiesequentie (FASTA of kale basen)') }}</label>
          <textarea id="sg-ref" class="mono" rows="4" v-model="refText" spellcheck="false"></textarea></div>
        <input type="file" id="sg-ref-file" accept=".fasta,.fa,.fas,.txt,.seq,.json" :aria-label="t('Referentie of assay kiezen')" style="margin-top:6px" @change="pickRef">
        <p style="font-size:13px;color:var(--muted);margin:6px 0 0">{{ t('Een FASTA-bestand, of een assay als JSON. Een sequentie uit Sequentie (ook een die je bij NCBI ophaalt) kan hierheen met Stuur door naar.') }}</p>
        <h3 style="margin-top:14px">{{ t('Eigen panel') }}</h3>
        <p style="font-size:13px;color:var(--muted);margin:4px 0 8px">{{ t('Het amplicon is de referentie hierboven. Positie telt vanaf base 1 van het amplicon; streng − betekent dat de allelen op de andere streng staan (zoals vaak in dbSNP).') }}</p>
        <div class="grid2">
          <lk-field v-model="edName" :label="t('Naam')" for-id="sg-ed-name"/>
          <lk-field v-model="edStart" :label="t('Coördinaat van base 1')" for-id="sg-ed-start" inputmode="numeric"/>
        </div>
        <lk-etable table-id="sg-ed-tbl" :cols="edCols" v-model:rows="edRows" add-id="sg-ed-add"/>
        <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">
          <button type="button" id="sg-ed-add" @click="edRows = edRows.concat([['', '', '', '+']])">{{ t('+ SNP') }}</button>
          <button type="button" id="sg-ed-save" @click="saveAssay">{{ t('Panel bewaren') }}</button>
          <button type="button" id="sg-ed-export" @click="exportAssay">{{ t('Exporteren als JSON') }}</button>
          <button v-if="assayKey.startsWith('eigen:')" type="button" id="sg-ed-del" @click="delAssay">{{ t('Panel verwijderen') }}</button>
        </div>
        <lk-note v-for="(e, i) in edErr" :key="i" :kind="edOk ? 'ok' : 'bad'">{{ e }}</lk-note>
        <!-- S200: het panel vullen uit een lijst rs-nummers -->
        <details id="sg-ed-rsp" style="margin-top:10px">
          <summary style="cursor:pointer;font-size:13px">{{ t('Panel vullen uit rs-nummers (dbSNP)') }}</summary>
          <ncbi-switch/>
          <div class="f" style="margin-top:8px"><label for="sg-ed-rslist">{{ t('rs-nummers, per regel of met komma\'s') }}</label>
            <textarea id="sg-ed-rslist" class="mono" rows="3" v-model="rsListText" spellcheck="false" placeholder="rs1805007, rs12913832"></textarea></div>
          <p style="font-size:13px;color:var(--muted);margin:6px 0">{{ t('Per rs-nummer haalt LabKit de allelen en 20 basen flank bij dbSNP en zoekt de SNP in de referentie hierboven op; positie, allelen en streng komen zo in de tabel. Bewaar het panel daarna zelf.') }}</p>
          <button type="button" id="sg-ed-rsgo" :disabled="rsBusy" @click="fillFromRs">{{ t('Vul het panel uit dbSNP') }}</button>
          <lk-note v-if="rsBusy" kind="info">{{ t('Bezig met opzoeken bij NCBI…') }}</lk-note>
          <lk-note v-for="(m, i) in rsMsgs" :key="i" :kind="m[0]">{{ m[1] }}</lk-note>
        </details>
      </details>
      <details class="panel" id="sg-casep">
        <summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Voorbeeld en case bewaren') }}</summary>
        <p style="font-size:13px;color:var(--muted);margin:8px 0">{{ t('Het voorbeeld is volledig verzonnen: oefenreads, een genotypeblad en uitkomsten die bij geen echt persoon horen. Zo kun je het hele pad volgen zonder sequencer.') }}</p>
        <div class="row" style="gap:6px;flex-wrap:wrap">
          <button type="button" id="sg-example" @click="loadExample">{{ t('Voorbeeldcase laden (verzonnen)') }}</button>
          <button type="button" id="sg-case-save" @click="saveCase">{{ t('Case bewaren als bestand') }}</button>
        </div>
        <div class="f" style="margin-top:10px"><label for="sg-case-file">{{ t('Case openen') }}</label>
          <input type="file" id="sg-case-file" accept=".json" @change="pickCase"></div>
        <p style="font-size:13px;color:var(--muted);margin:6px 0 0">{{ t('Eén bestand met de reads (met trace en bewerkingen), de tweede read en de batch, de instellingen, de referentie en assay, het genotypeblad en de uitkomsten.') }}</p>
        <lk-note v-if="caseMsg" :kind="caseOk ? 'ok' : 'bad'">{{ caseMsg }}</lk-note>
      </details>
      <details class="panel" id="sg-bp" :open="batch.length > 0">
        <summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Batch (veel bestanden)') }}</summary>
        <p style="font-size:13px;color:var(--muted);margin:8px 0">{{ t('Kies of sleep meerdere .ab1- of FASTA-bestanden: elk is een monster. Ze worden tegen de referentie uitgelijnd met dezelfde drempels als hierboven.') }}</p>
        <div class="dropzone" :style="bover ? 'outline:2px dashed var(--accent)' : ''" style="padding:10px"
             @dragover.prevent="bover = true" @dragleave="bover = false" @drop.prevent="bdrop">
          <input type="file" id="sg-bfiles" multiple accept=".ab1,.abi,.fasta,.fa,.fas,.seq,.txt" :aria-label="t('Meerdere bestanden kiezen')" @change="bpick">
        </div>
        <p v-if="batch.length" style="font-size:13px;margin:6px 0 0">{{ t(batch.length + ' monsters geladen') }}</p>
        <div class="row" style="gap:6px;margin-top:8px"><button type="button" id="sg-bclear" @click="bclear">{{ t('Wissen') }}</button></div>
      </details>
      <!-- S169: SNaPshot / SBE, pieken per kleur en lengte in plaats van een sequentie -->
      <details class="panel" id="sg-sbep" :open="!!sbe">
        <summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('SNaPshot / SBE (.fsa)') }}</summary>
        <p style="font-size:13px;color:var(--muted);margin:8px 0">{{ t('Een single-base-extension-run geeft per SNP één piek per allel: de kleur is de base, de lengte de SNP. LabKit leest de vier kleurkanalen en de lengtestandaard (GeneScan-120 LIZ) uit een .fsa-bestand.') }}</p>
        <input type="file" id="sg-sbe-file" accept=".fsa,.ab1,.abi" :aria-label="t('SBE-run kiezen')" @change="pickSbe">
        <div class="f" style="margin-top:10px"><label for="sg-sbe-panel">{{ t('SBE-panel: per regel naam, van en tot (nt) en kleur=allel') }}</label>
          <textarea id="sg-sbe-panel" class="mono" rows="4" v-model="sbeText" spellcheck="false" placeholder="rs12913832 28 32 blauw=G groen=A"></textarea></div>
        <p style="font-size:13px;color:var(--muted);margin:6px 0 0">{{ t('Kleuren: blauw (dR110), groen (dR6G), zwart (dTAMRA, op het scherm vaak geel) en rood (dROX). Vul het allel in zoals de primer het inbouwt; bij een reverse primer is dat het complement.') }}</p>
        <div class="row" style="gap:6px;margin-top:8px"><button type="button" id="sg-sbe-demo" @click="sbeDemoLoad">{{ t('Verzonnen voorbeeld laden') }}</button></div>
        <lk-note v-for="(e, i) in sbeErr" :key="i" kind="bad">{{ e }}</lk-note>
        <template v-if="sbe">
          <p style="font-size:13px;margin:8px 0 4px">{{ t('Geladen') }}: {{ sbe.name }}</p>
          <lk-note v-if="!sbeRes.ladder.length" kind="bad">{{ t('De lengtestandaard heeft te weinig pieken voor GeneScan-120 LIZ (9 fragmenten van 15 tot 120 nt).') }}</lk-note>
          <template v-else>
            <p style="font-size:13px;color:var(--muted);margin:4px 0">{{ t('Lengtes met lokale Southern tussen de 9 pieken van de standaard (buiten de standaard lineair). Een allel telt vanaf 10% van de hoogste piek van zijn SNP.') }}</p>
            <div style="overflow:auto"><lk-table table-id="sg-sbe-tbl" :cols="sbeCols" :rows="sbeRows"/></div>
          </template>
        </template>
      </details>
      <details class="panel" id="sg-r2p" :open="read2Ok">
        <summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Tweede read (forward/reverse)') }}</summary>
        <p style="font-size:13px;color:var(--muted);margin:8px 0">{{ t('De andere read van hetzelfde monster. Beide worden tegen de referentie uitgelijnd en per positie vergeleken.') }}</p>
        <input type="file" id="sg-file2" accept=".ab1,.abi,.fasta,.fa,.fas,.seq,.txt" :aria-label="t('Tweede read kiezen')" @change="pick2">
        <div class="f" style="margin-top:10px"><label for="sg-paste2">{{ t('Of plak de tweede read') }}</label>
          <textarea id="sg-paste2" class="mono" rows="3" v-model="paste2" spellcheck="false"></textarea></div>
        <p v-if="read2" style="font-size:13px;margin:6px 0 0">{{ t('Geladen') }}: {{ read2.name }}</p>
        <div class="row" style="gap:6px;margin-top:8px">
          <button type="button" id="sg-clear2" @click="clear2">{{ t('Wissen') }}</button>
          <button v-if="read2" type="button" id="sg-swap" @click="swap">{{ t('Wissel de reads (trace van de tweede)') }}</button>
        </div>
      </details>
    </div>
  </div>
</template>

<script>
import {markRaw} from 'vue';
import {lkNumIn} from '../lib/bridge.js';
import {readFile, parseSeq} from '../lib/sangerfile.js';
import {inWorker} from '../lib/inworker.js';
import SangerWorker from '../workers/sanger.worker.js?worker&inline';
import {trimWindow, comp, fasta} from '../lib/sangertrim.js';
import {hetCalls, flags} from '../lib/sangerhet.js';
import {traceSvg} from '../lib/tracesvg.js';
import {DYE, drawTraces, drawOverview, clampView} from '../lib/tracedraw.js';
import {parseRef, alignRead, variants, parseAssay, assayJson, snpCalls, confirm, TEACH, teachReads, DEC} from '../lib/sangeralign.js';
import {callSample, genotypeRows, overlayStrips} from '../lib/sangerbatch.js';
import {makeCase, parseCase, exampleSample, EXAMPLE_ID} from '../lib/sangercase.js';
import {RESULT_GROUPS, parseProb, parseResultPaste, summarize, toCsv, PANEL_NAME, panelSnps, VALUES as HS_VALUES, validate as hsValidate, autofill, mergeCalls, naReport, verifySnp} from '../lib/hiris.js';
import {SEQ_TO} from '../lib/seq.js';
import NcbiSwitch from './ncbi/NcbiSwitch.vue';
import {ncbiGet} from '../lib/ncbi.js';
import {parseSnp, rsId} from '../lib/dbsnp.js';
import {orientByAlleles, orientByFlank, flankRegion, dbLabel, dbAssay, rsList, locateSnp} from '../lib/dblabel.js';
import {readAbif} from '../lib/abif.js';
import {parsePanel, sbeChannels, sbeGenotypes, sbeDemo, DEMO_PANEL, DYES} from '../lib/snapshot.js';

/* de referentie kan uit Sequentie komen (ook een sequentie die daar bij NCBI is opgehaald) */
SEQ_TO.push({label: 'Chromatogram (referentie)', tool: 'sanger', id: 'sg-ref'});
const AKEY = 'labkit:v1:sg-assays', HKEY = 'labkit:v1:sg-sheet', REFMAX = 200000;
const NOTES = {absent: 'Deze SNP staat niet in de assay.', nocall: 'De read dekt deze SNP niet.', badcall: 'De call hoort niet bij de assay of is geen genotype.', mismatch: 'De allelen van de assay passen niet bij deze SNP.', flip: 'Streng omgedraaid: het allel van de webtool is het complement van het allel van de assay.', ambig: 'A/T- of C/G-SNP: de streng is niet af te leiden; controleer deze SNP met de hand.', conflict: 'Forward en reverse read zijn het oneens.'};
/* S163: bestanden lezen en de batch uitlijnen in een worker (pas bij het eerste gebruik gestart) */
let W = null;
const sw = () => W || (W = inWorker(() => new SangerWorker(), {readFile, callSample}));
/* een bestand via de worker; de buffer verhuist naar de worker */
const readIn = async f => { const buf = await f.arrayBuffer(); return sw().call('readFile', [buf, f.name], [buf]); };
const VTYPE = {sub: 'Substitutie', del: 'Deletie', dup: 'Duplicatie', ins: 'Insertie'};
const LB = 18, TH = 190, QB = 28, OV = 40, GAP = 20;   // hoogte trace, kwaliteitsstrook, overzichtsstrook en de strook met posities (CSS-pixels); LB = strook met de baseletters bovenaan
const Y1 = LB + TH + QB;   // onderkant van trace + kwaliteitsstrook
const HT = Y1 + GAP + OV + 8;
const SHADE = 'rgba(95,107,122,.18)';
const qcol = q => q < 20 ? '#d7301f' : q < 30 ? '#f0a020' : '#1a9641';
const IUPAC = /^[ACGTRYSWKMBDHVN]$/;
const GREY = '#8a94a3';
const MIX = 'RYSWKM', HETBG = '#e1bee7', HETC = '#8e24aa';   // gemengde calls van twee basen; paars = heterozygoot

const intIn = (v, lo, hi, d) => { const n = Number(String(v).replace(',', '.')); return Number.isInteger(n) && n >= lo && n <= hi ? n : d; };
const FLN = {weak: 'Zwak signaal', sat: 'Verzadigd', broad: 'Brede piek', blob: 'Kleurstofblob', N: 'N-call', slip: 'Mogelijke slippage'};
const NL = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Sanger',
  components: {NcbiSwitch},
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const saved = jget('sg-read', null);
    return {win: st['sg-win'] != null ? String(st['sg-win']) : '10', qthr: st['sg-q'] != null ? String(st['sg-q']) : '20',
      read: saved ? markRaw(saved) : null, paste: st['sg-paste'] != null ? String(st['sg-paste']) : '', err: '', over: false,
      edits: saved && saved.edits ? saved.edits : {}, opos: '', obase: '', sel: null, rng: null, rc: !!st['sg-rc'], copied: '', hthr: st['sg-het'] != null ? String(st['sg-het']) : NL(0.2, 1),
      refText: st['sg-ref'] != null ? String(st['sg-ref']) : '', assayKey: st['sg-assay'] != null ? String(st['sg-assay']) : '', own: jget(AKEY, []),
      read2: jget('sg-read2', null) ? markRaw(jget('sg-read2', null)) : null, paste2: st['sg-paste2'] != null ? String(st['sg-paste2']) : '',
      caseMsg: '', caseOk: false, hsCopied: '', rsIdx: 0, rsPaste: '', rsMsg: '', rsThr: st['sg-rs-thr'] != null ? String(st['sg-rs-thr']) : NL(0.7, 1), dbl: {}, dbMsg: [], dbBusy: false, rsListText: '', rsBusy: false, rsMsgs: [], hvRows: [], hvBusy: false, sbe: null, sbeText: st['sg-sbe-panel'] != null ? String(st['sg-sbe-panel']) : '', sbeFileErr: '', batch: [], bsamples: [], bbusy: false, hs: (h => { h.samples = h.samples.map(x => Object.assign({res: {}, notes: {}}, x)); return h; })(Object.assign({panel: 'hirisplexs', samples: []}, jget(HKEY, {}))), bover: false, ovSnp: '0', edName: '', edStart: '1', edRows: [['', '', '', '+']], edErr: [], edOk: false};
  },
  computed: {
    HT() { return HT; },
    winN() { return intIn(this.win, 1, 100, 10); },
    qN() { return intIn(this.qthr, 0, 60, 20); },
    hasQ() { return this.m.r.qual.length > 0; },
    /* {start, end} (1-gebaseerd, inclusief) of null; bewerkingen veranderen de kwaliteit niet */
    trim() { return this.hasQ ? trimWindow(this.m.r.qual, this.winN, this.qN) : null; },
    edited() { return Object.keys(this.edits).map(Number).sort((a, b) => a - b); },
    nEd() { return Object.keys(this.edits).length; },
    hN() { const n = Number(String(this.hthr).replace(',', '.')); return n > 0 && n <= 1 ? n : 0.2; },
    /* per base de piekhoogtes, de verhouding en de IUPAC-code boven de drempel (S155); null zonder trace */
    het() { const r = this.m.r; return r.traces ? hetCalls(r.traces, r.peaks, Math.min(r.peaks.length, r.bases.length), this.hN) : null; },
    /* de automatische call: boven de drempel de IUPAC-code; eronder de call van de sequencer, maar een gemengde call van twee basen
       (R, Y, …) wordt dan de hoogste piek, zodat de drempel in beide richtingen werkt */
    auto() {
      const b = this.m.r.bases, h = this.het;
      if (!h) return b;
      return b.split('').map((c, i) => !h[i] ? c : h[i].code || (MIX.includes(c) ? h[i].top : c)).join('');
    },
    /* waarschuwingen per base (S156) */
    flg() { const r = this.m.r; return this.het ? flags(r.traces, r.peaks, this.seq, this.het) : null; },
    /* de SNP-tabel: elke heterozygote, gemarkeerde of bewerkte positie; counts = aantal basen per waarschuwing */
    snp() {
      const h = this.het, f = this.flg, q = this.m.r.qual, t = this.t, rows = [], counts = {};
      if (!h) return {rows, counts};
      for (let i = 0; i < f.length; i++) {
        for (const c of f[i]) counts[c] = (counts[c] || 0) + 1;
        const ed = this.edits[i] != null;
        if (!h[i].code && !f[i].length && !ed) continue;
        const g = this.seq[i] + (h[i].code && !ed ? ' (' + [h[i].top, h[i].sec].sort().join('/') + ')' : '');
        rows.push([i + 1, g, h[i].h.A, h[i].h.C, h[i].h.G, h[i].h.T, this.fmtR(h[i].ratio), q[i] != null ? q[i] : '–', f[i].map(c => t(FLN[c])).join(', ') || '–']);
      }
      return {rows, counts};
    },
    snpCols() { const t = this.t; return [{h: t('Positie'), num: true}, {h: t('Genotype')}, {h: 'A', num: true}, {h: 'C', num: true}, {h: 'G', num: true}, {h: 'T', num: true}, {h: t('Verhouding'), num: true}, {h: 'Q', num: true}, {h: t('Waarschuwingen')}]; },
    snpCounts() { const c = this.snp.counts; return Object.keys(FLN).filter(k => c[k]).map(k => this.t(FLN[k]) + ': ' + NL(c[k], 0)).join(' · '); },
    nHet() { return this.het ? this.het.filter(x => x.code).length : 0; },
    /* de sequentie met de bewerkingen erin; read.bases houdt de oorspronkelijke calls, auto de calls na de piekverhouding */
    seq() {
      const b = this.auto;
      if (!this.nEd || !this.read) return b;
      const a = b.split('');
      for (const i in this.edits) if (i < a.length) a[i] = this.edits[i];
      return a.join('');
    },
    /* de read die alles toont: het geladen bestand, anders de geplakte tekst */
    m() {
      let r = this.read;
      if (!r) {
        const p = parseSeq(this.paste);
        r = {name: p.name, meta: null, order: '', traces: null, bases: p.bases, peaks: [], qual: []};
      }
      return {ok: r.bases.length > 0, r, mismatch: !!r.mismatch};
    },
    rows() {
      const r = this.m.r, me = r.meta || {}, t = this.t, out = [];
      const add = (l, v) => { if (v) out.push([t(l), esc(String(v))]); };
      add('Bestand', r.name); add('Monster', me.sample); add('Well', me.well); add('Instrument', me.instrument);
      add('Model', me.model); add('Dye set', me.dyeSet); add('Start run', me.start); add('Einde run', me.end);
      out.push([t('Leeslengte'), NL(this.seq.length, 0) + ' ' + t('basen')]);
      add('Kanaalvolgorde', r.order);
      if (r.qual.length) {
        const q20 = r.qual.filter(q => q >= 20).length;
        out.push([t('Gemiddelde kwaliteit'), NL(r.qual.reduce((a, b) => a + b, 0) / r.qual.length, 1) + ' (Phred)']);
        if (this.het) out.push([t('Heterozygote posities'), NL(this.nHet, 0) + ' (' + t('drempel') + ' ' + this.fmtR(this.hN) + ')']);
        out.push([t('Q20 of hoger'), NL(q20, 0) + ' (' + NL(q20 / r.qual.length * 100, 1) + '%)']);
        const tr = this.trim;
        if (tr) {
          const kept = r.qual.slice(tr.start - 1, tr.end), k = kept.filter(q => q >= this.qN).length;
          out.push([t('Trimvoorstel'), NL(tr.start, 0) + '–' + NL(tr.end, 0)]);
          out.push([t('Na trimmen'), NL(kept.length, 0) + ' ' + t('basen') + ' (' + t('Q' + this.qN + ' of hoger') + ': ' + NL(k / kept.length * 100, 1) + '%)']);
        }
      }
      return out;
    },
    /* GenBank-ORIGIN: rijen van 60, groepen van 10, positie van de eerste base ervoor; per base {i = index in de originele read, c, g = getrimd, o = origineel als bewerkt}.
       Reverse complement: de rij loopt van het 3'-einde terug en is genummerd 1..n in de getoonde (rc-)volgorde; i wijst naar de originele base. */
    seqRows() {
      const q = this.seq, n = q.length, w = String(n).length, ed = this.edits, tr = this.trim, rc = this.rc, rows = [];
      for (let j = 0; j < n; j++) {
        const i = rc ? n - 1 - j : j, o = ed[i] != null ? this.auto[i] : null, hz = !!this.het && !!this.het[i] && !!this.het[i].code;
        if (j % 60 === 0) rows.push({pos: String(j + 1).padStart(w), groups: []});
        const gs = rows[rows.length - 1].groups;
        if (j % 10 === 0) gs.push([]);
        gs[gs.length - 1].push({i, c: rc ? comp(q[i]) : q[i], o: o && (rc ? comp(o) : o), g: !!tr && (i + 1 < tr.start || i + 1 > tr.end), hz});
      }
      return rows;
    },
    /* ---------- referentie, assay en uitlijning (S158–S161) ---------- */
    TEACH() { return TEACH; },
    refSeq() { return parseRef(this.refText).seq; },
    refBig() { return this.refSeq.length > REFMAX; },
    refOpen() { return !!this.refText.trim() || !!this.assayKey; },
    assay() { return this.assayKey === 'oefen' ? TEACH : this.own.find(a => 'eigen:' + a.name === this.assayKey) || null; },
    /* de SNP's van een assay tellen alleen als zijn amplicon de referentie is */
    assayOn() { return !!this.assay && this.assay.ref === this.refSeq; },
    assayEff() { return this.assayOn ? this.assay : {start: 1, snps: []}; },
    G() { return +this.assayEff.start || 1; },
    /* de eerste read (met heterozygoten en bewerkingen), alleen het getrimde stuk */
    aln1() {
      if (!this.m.ok || !this.refSeq || this.refBig) return null;
      const t = this.trim;
      return alignRead(this.seq, this.refSeq, t ? {from: t.start - 1, to: t.end} : {});
    },
    /* de tweede read: bestand of geplakte tekst, met dezelfde drempel voor heterozygoten en hetzelfde trimvenster */
    m2() {
      let r = this.read2;
      if (!r) { const p = parseSeq(this.paste2); r = {name: p.name, traces: null, bases: p.bases, peaks: [], qual: []}; }
      let a = r.bases.split('');
      if (r.traces) {
        const h = hetCalls(r.traces, r.peaks, Math.min(r.peaks.length, r.bases.length), this.hN);
        a = a.map((c, i) => !h[i] ? c : h[i].code || (MIX.includes(c) ? h[i].top : c));
      }
      if (r.edits) for (const i in r.edits) if (i < a.length) a[i] = r.edits[i];
      return {r, seq: a.join(''), trim: r.qual && r.qual.length ? trimWindow(r.qual, this.winN, this.qN) : null};
    },
    read2Ok() { return this.m2.seq.length > 0; },
    aln2() {
      if (!this.aln1 || !this.read2Ok) return null;
      const t = this.m2.trim;
      return alignRead(this.m2.seq, this.refSeq, t ? {from: t.start - 1, to: t.end} : {});
    },
    vars() { return this.aln1 ? variants(this.aln1, this.refSeq, this.assayEff) : []; },
    conf() { return this.aln1 ? confirm(this.aln1, this.aln2, this.refSeq.length) : {rows: [], counts: {}}; },
    alnKv() {
      const t = this.t, one = a => (a.strand === '+' ? t('forward') : t('reverse, omgekeerd en gecomplementeerd')) + ' · offset ' + NL(a.offset, 0)
        + ' · ' + t('referentie') + ' ' + NL(this.G + a.rFrom, 0) + '–' + NL(this.G + a.rTo, 0) + ' · ' + NL(a.ident * 100, 1) + '% ' + t('identiek')
        + ' · ' + t('mismatches') + ': ' + NL(a.mism, 0) + ' · ' + t('gaten') + ': ' + NL(a.ins + a.del, 0);
      const out = [[t('Eerste read'), one(this.aln1)]];
      if (this.aln2) out.push([t('Tweede read'), one(this.aln2)]);
      return out;
    },
    /* de uitlijning in blokken van 60 referentieposities: Ref, R1, (R2 en een regel met ! en ·) */
    alnView() {
      const rows = this.conf.rows, ref = this.refSeq, two = !!this.aln2, out = [], W = 60;
      if (!rows.length) return out;
      const w = String(this.G + rows[rows.length - 1].r).length, pad = ' '.repeat(w + 3);
      const cell = (b, rb, q) => {
        if (!b) return {c: ' ', q: null};
        const c = b[0], ins = b.includes('+'), het = (DEC[c] || '').length === 2;
        return {c, q: q >= 0 ? q : null, tip: ins ? '+' + b.split('+')[1] : null,
          st: {background: c !== rb && !het ? '#ffcdd2' : het ? HETBG : null, textDecoration: ins ? 'underline' : null, cursor: q >= 0 ? 'pointer' : null}};
      };
      for (let k = 0; k < rows.length; k += W) {
        const bl = rows.slice(k, k + W);
        const lines = [{k: 'ref', lab: 'Ref ' + String(this.G + bl[0].r).padStart(w) + ' ', cells: bl.map(x => ({c: ref[x.r], q: null}))},
          {k: 'a', lab: 'R1' + pad, cells: bl.map(x => cell(x.a, ref[x.r], x.qa))}];
        if (two) {
          lines.push({k: 'b', lab: 'R2' + pad, cells: bl.map(x => cell(x.b, ref[x.r], -1))});
          lines.push({k: 'm', lab: '  ' + pad, cells: bl.map(x => ({c: x.st === 'diff' ? '!' : x.st === 'same' ? ' ' : '·', q: null,
            st: x.st === 'diff' ? {background: '#ffe0b2', fontWeight: 700} : null}))});
        }
        out.push(lines);
      }
      return out;
    },
    varCols() {
      const t = this.t, c = [{h: 'HGVS'}, {h: t('Type')}, {h: t('Zygotie')}, {h: t('Readpositie'), num: true}, {h: t('rs-nummer')}];
      if (this.aln2) c.push({h: t('Tweede read')});
      return c;
    },
    varRows() {
      const t = this.t, byR = new Map(this.conf.rows.map(x => [x.r, x]));
      return this.vars.map(v => {
        const row = [esc(v.hgvs), t(VTYPE[v.type]), t(v.zyg === 'het' ? 'heterozygoot' : 'homozygoot'), v.q >= 0 ? v.q + 1 : '–', v.rs ? esc(v.rs) : '–'];
        if (this.aln2) { const x = byR.get(v.p); row.push(t(!x || x.st === 'one1' ? 'niet gedekt' : x.st === 'diff' ? 'oneens' : 'bevestigd')); }
        return row;
      });
    },
    snpc() { return this.aln1 ? snpCalls(this.aln1, this.assayEff) : []; },
    snpc2() { return this.aln2 ? snpCalls(this.aln2, this.assayEff) : null; },
    gtCols() {
      const t = this.t, c = [{h: 'SNP'}, {h: t('Positie') + ' (g.)', num: true}, {h: t('Allelen')}, {h: t('Streng')}, {h: t('Eerste read')}];
      if (this.snpc2) c.push({h: t('Tweede read')}, {h: t('Status')});
      if (this.hasDb) c.push({h: t('Volgens dbSNP') + ' (' + t('voorstel') + ')'});
      return c;
    },
    /* ---------- dbSNP (S199) ---------- */
    dbRs() { return this.assayEff.snps.filter(s => rsId(s.rs)); },
    hasDb() { return Object.keys(this.dbl).length > 0; },
    /* de genotypes met streng en allelen uit dbSNP: op de plusstreng van het genoom */
    /* ---------- het paneel tegen dbSNP (S200) ---------- */
    hvCols() { const t = this.t; return [{h: '#', num: true}, {h: 'SNP'}, {h: t('Telt')}, {h: t('Gen')}, {h: t('Positie')}, {h: t('Allelen (dbSNP)')}, {h: t('Uitslag')}]; },
    hvView() {
      const t = this.t, ST = {ok: 'klopt', complement: 'andere streng', mismatch: 'past niet', notfound: 'niet gevonden', err: 'fout'};
      return this.hvRows.map((v, i) => ({cls: v.status === 'mismatch' || v.status === 'notfound' || v.status === 'err' ? 'bad' : '',
        cells: [i + 1, esc(v.rs), v.allele, esc((v.genes || []).join(', ') || '–'), v.pos ? esc(v.acc) + ':' + v.pos + ' (chr ' + esc(v.chr) + ')' : '–',
          v.ref ? esc(v.ref) + ' > ' + esc(v.alts.join(', ')) : '–', t(ST[v.status]) + (v.why ? ': ' + v.why : '')]}));
    },
    hvSum() {
      if (this.hvBusy || !this.hvRows.length) return null;
      const n = this.hvRows.filter(v => v.pos && v.ref).length, N = this.hsSnps.length, bad = this.hvRows.filter(v => v.status === 'mismatch').length;
      return [n === N && !bad ? 'ok' : 'warn', this.t(n + ' van de ' + N + ' SNP\'s gevonden met positie en allelen') + (bad ? '; ' + this.t(bad + ' passen niet bij het allel dat de webtool telt') : '') + '.'];
    },
    snpcDb() { return this.hasDb && this.aln1 ? snpCalls(this.aln1, dbAssay(this.assayEff, this.dbl)) : []; },
    gtRows() {
      const t = this.t, g = c => !c.cov ? t('niet gedekt') : esc(c.gt) + (c.ok ? '' : ' (' + t('hoort niet bij de assay') + ')');
      return this.snpc.map((c, i) => {
        const row = [esc(c.rs), this.G + c.pos - 1, c.alleles, c.strand === '-' ? '−' : '+', g(c)];
        if (this.snpc2) { const d = this.snpc2[i]; row.push(g(d), t(!c.cov || !d.cov ? 'één read' : c.gt === d.gt ? 'bevestigd' : 'oneens')); }
        if (this.hasDb) {
          const L = this.dbl[c.rs], d = this.snpcDb[i];
          row.push(!L ? '–' : g(d) + ' · ' + t('ref') + ' ' + L.ref + (L.strand !== c.strand ? ' · ' + t('streng omgedraaid') : ''));
        }
        return row;
      });
    },
    frCounts() {
      const c = this.conf.counts, t = this.t;
      return [['Gelijk', c.same], ['Oneens', c.diff], ['Alleen eerste read', c.one1], ['Alleen tweede read', c.one2]].map(x => t(x[0]) + ': ' + NL(x[1] || 0, 0)).join(' · ');
    },
    frCols() { const t = this.t; return [{h: t('Positie') + ' (g.)', num: true}, {h: t('Referentie')}, {h: t('Eerste read')}, {h: t('Tweede read')}]; },
    frDiff() { return this.conf.rows.filter(x => x.st === 'diff').map(x => [this.G + x.r, this.refSeq[x.r], esc(x.a || '–'), esc(x.b || '–')]); },
    /* ---------- batch (S162) ---------- */
    /* wat de uitlijning van de batch bepaalt; bij een wijziging lijnt de worker opnieuw uit (bsamples) */
    bkey() {
      const ref = this.refSeq && !this.refBig ? this.refSeq : '';
      return {batch: this.batch, ref, assay: JSON.parse(JSON.stringify(this.assayEff)), o: {het: this.hN, win: this.winN, q: this.qN}};
    },
    btCols() { const t = this.t; return [{h: t('Monster')}, {h: t('Identiek') + ' %', num: true}].concat(this.assayEff.snps.map(s => ({h: s.rs}))); },
    btRows() { return genotypeRows(this.bsamples, this.assayEff).map(r => r.map((v, i) => i === 1 ? (v == null ? '–' : NL(v, 1)) : esc(String(v)))); },
    ovH() { return Math.max(60, this.batch.length * 52 + 8); },
    /* ---------- HIrisPlex-S genotypeblad (S164) ---------- */
    PANEL_NAME() { return PANEL_NAME; },
    HS_VALUES() { return HS_VALUES; },
    hsSnps() { return panelSnps(this.hs.panel); },
    hsMsgs() {
      const t = this.t, out = [];
      for (const sm of this.hs.samples) {
        const v = hsValidate(sm.vals, this.hs.panel), bad = v.filter(x => x.why === 'bad').length, blank = v.length - bad;
        const nm = sm.id || t('(zonder naam)');
        if (bad) out.push(['bad', nm + ': ' + t(bad + ' cellen hebben een waarde die niet kan (alleen 0, 1, 2 of NA).')]);
        if (blank) out.push(['info', nm + ': ' + t(blank + ' cellen zijn nog leeg; bij het exporteren worden ze NA.')]);
        if (!v.length) out.push(['ok', nm + ': ' + t('alle cellen van dit paneel zijn ingevuld.')]);
        for (const r of naReport(sm.vals, this.hs.panel)) {
          if (r.na) out.push([r.warn ? 'warn' : 'info', nm + ', ' + t(r.name) + ': ' + t(r.na + ' van de ' + r.n + ' SNP\'s ontbreken (NA)') + (r.warn ? '. ' + t('Een voorspelling op zo weinig gegevens is onbetrouwbaar.') : '.')]);
        }
      }
      return out;
    },
    /* ---------- uitkomsten van de webtool (S167) ---------- */
    RESULT_GROUPS() { return RESULT_GROUPS; },
    rsCur() { return (this.hs.samples[this.rsIdx] || {res: {}}).res; },
    thrN() { const n = Number(String(this.rsThr).replace(',', '.')); return n > 0 && n <= 1 ? n : 0.7; },
    rsOpen() { return this.hs.samples.some(x => Object.keys(x.res).length > 0); },
    /* per monster en eigenschap de hoogste categorie met zijn kans */
    rsSum() { return this.hs.samples.map(sm => ({id: sm.id, rows: summarize(sm.res, this.thrN)})).filter(x => x.rows.length); },
    rsRows() {
      const t = this.t, out = [];
      for (const m of this.rsSum) for (const r of m.rows) out.push([esc(m.id) + ' · ' + t(r.name), '<b>' + esc(t(r.top)) + '</b> (' + NL(r.p, 2) + ')' + (r.thr ? '' : ' · ' + t('onder de drempel'))]);
      return out;
    },
    rsWarn() {
      const t = this.t, out = [];
      for (const m of this.rsSum) for (const r of m.rows) {
        if (!r.ok) out.push(m.id + ', ' + t(r.name) + ': ' + t('niet alle categorieën zijn ingevuld.'));
        else if (!r.full) out.push(m.id + ', ' + t(r.name) + ': ' + t('de kansen tellen op tot ' + NL(r.sum, 2) + ' in plaats van 1; klopt de invoer?'));
      }
      return out;
    },
    /* de figuur: alle kansen van het gekozen monster, in de volgorde van de tabel */
    rsFig() { const x = this.hs.samples[this.rsIdx]; return !!x && summarize(x.res, this.thrN).length > 0; },
    /* ---------- SNaPshot / SBE (S169) ---------- */
    sbePanel() { return parsePanel(this.sbeText); },
    sbeErr() { return (this.sbeFileErr ? [this.sbeFileErr] : []).concat(this.sbePanel.err.map(e => this.t('Regel ' + e[1]) + ': ' + this.t(e[0]))); },
    sbeRes() { return this.sbe ? sbeGenotypes(this.sbe.ch, this.sbe.std, this.sbePanel.snps) : {ladder: [], calls: []}; },
    sbeCols() { const t = this.t; return [{h: 'SNP'}, {h: t('Venster') + ' (nt)'}, {h: t('Pieken (kleur, allel, lengte, hoogte)')}, {h: t('Genotype')}]; },
    sbeRows() {
      const t = this.t;
      return this.sbeRes.calls.map(c => [esc(c.id), NL(c.min, 1) + '–' + NL(c.max, 1),
        c.peaks.map(p => t(DYES[p.dye]) + ' ' + p.allele + ' ' + NL(p.size, 1) + ' nt (' + NL(p.h, 0) + ')').join('; ') || '–',
        c.gt ? '<b>' + c.gt + '</b>' : t('geen call')]);
    },
    edCols() { const t = this.t; return [{h: t('SNP (rs)'), t: 'txt', w: 110}, {h: t('Positie'), t: 'num', w: 60}, {h: t('Allelen'), t: 'txt', w: 60}, {h: t('Streng'), t: 'sel', o: ['+', '-']}]; }
  },
  watch: {
    /* een andere read: begin links, ingezoomd tot ongeveer 1 scanpunt per pixel (±70 basen) */
    'm.r'() { this.view = {x0: 0, spp: 1}; this.$nextTick(this.draw); },
    sel() { this.draw(); this.reveal(); },
    rng() { this.draw(); },
    rc() { this.$nextTick(this.reveal); },
    assayKey() { this.pickAssay(); this.dbl = {}; this.dbMsg = []; },
    edits() { this.draw(); },
    het() { this.draw(); },
    trim() { this.draw(); },
    bkey(k) { this.alignBatch(k); },
    bsamples() { this.$nextTick(this.paintOv); },
    rsFig() { this.$nextTick(this.paintRs); },
    rsIdx() { this.$nextTick(this.paintRs); },
    rsThr() { this.$nextTick(this.paintRs); },
    hs: {deep: true, handler(v) { jset(HKEY, v); this.$nextTick(this.paintRs); }},
    ovSnp() { this.$nextTick(this.paintOv); },
    qN() { this.draw(); }
  },
  created() { this.bid = 0; this.dye = DYE; this.view = {x0: 0, spp: 1}; this.drag = null; },
  mounted() {
    window.__sgVm = this;
    this.ro = new ResizeObserver(() => { this.draw(); this.paintOv(); });
    this.$nextTick(this.paintRs);
    this.ro.observe(this.$el);
    this.$nextTick(this.draw);
  },
  beforeUnmount() { this.ro && this.ro.disconnect(); },
  methods: {
    pick(e) { this.load(e.target.files[0]); },
    drop(e) { this.over = false; this.load(e.dataTransfer.files[0]); },
    async load(file) {
      if (!file) return;
      this.err = '';
      const x = await readIn(file);
      if (x.err) { this.err = this.t(x.err); return; }
      const r = x.r;
      this.edits = {}; this.sel = null; this.rng = null;
      this.read = markRaw(r);
      jset('sg-read', r);
    },
    /* tekenen gebundeld per frame; W = breedte in CSS-pixels */
    draw() {
      if (this.raf) return;
      this.raf = requestAnimationFrame(() => { this.raf = 0; this.paint(); });
    },
    paint() {
      const cv = this.$refs.cv, r = this.m.r, q = this.seq;
      if (!cv || !r.traces || !cv.clientWidth) return;
      const W = cv.clientWidth, H = HT, s = window.devicePixelRatio || 1;
      if (cv.width !== Math.round(W * s) || cv.height !== Math.round(H * s)) { cv.width = Math.round(W * s); cv.height = Math.round(H * s); }
      const x = cv.getContext('2d');
      x.setTransform(s, 0, 0, s, 0, 0);
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      const scans = this.scans();
      const v = this.view = clampView(this.view, scans, W);
      drawTraces(x, r.traces, v, {x: 0, y: LB + 4, w: W, h: TH});
      this.labels(x, q, v, W);
      if (r.qual.length) this.qbars(x, r, v, W);
      /* basenummers onder de trace, elke 10e base op zijn piek */
      x.fillStyle = '#5f6b7a'; x.font = '11px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const step = v.spp > 4 ? (v.spp > 10 ? 100 : 50) : 10;
      for (let i = step - 1; i < r.peaks.length; i += step) {
        const px = (r.peaks[i] - v.x0) / v.spp;
        if (px >= -20 && px <= W + 20) x.fillText(String(i + 1), px, Y1 + 4 + GAP / 2);
      }
      drawOverview(x, r.traces, scans, v, W, {x: 0, y: Y1 + GAP + 4, w: W, h: OV});
      if (this.trim) this.shade(x, r, v, W, scans);
      this.drawn = (this.drawn || 0) + 1;   // telt de getekende frames (voor de test)
    },
    /* de baseletters in de strook bovenaan, zodra de basen minstens 7 px uit elkaar staan */
    sp() { const p = this.m.r.peaks, n = p.length; return n > 1 ? (p[n - 1] - p[0]) / (n - 1) : 0; },
    labels(x, q, v, W) {
      const p = this.m.r.peaks, n = Math.min(p.length, q.length), bw = this.sp() / v.spp;
      if (this.sel != null && this.sel < n) {
        x.fillStyle = 'rgba(21,101,192,.15)';
        x.fillRect((p[this.sel] - v.x0) / v.spp - bw / 2, 0, bw, LB + 4 + TH);
      }
      if (this.rng && this.rng.b < n) {
        x.fillStyle = 'rgba(21,101,192,.15)';
        x.fillRect((p[this.rng.a] - v.x0) / v.spp - bw / 2, 0, (p[this.rng.b] - p[this.rng.a]) / v.spp + bw, LB + 4 + TH);
      }
      const h = this.het;
      if (bw < 7) {   // te krap voor letters: een paars streepje per heterozygote positie
        if (h) { x.fillStyle = HETC; for (let i = 0; i < n; i++) if (h[i] && h[i].code) { const px = (p[i] - v.x0) / v.spp; if (px >= 0 && px <= W) x.fillRect(px - 1, 2, 2, LB - 4); } }
        return;
      }
      x.font = 'bold 12px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (let i = 0; i < n; i++) {
        const px = (p[i] - v.x0) / v.spp;
        if (px < -10) continue;
        if (px > W + 10) break;
        if (this.edits[i] == null && h && h[i] && h[i].code) { x.fillStyle = HETBG; x.beginPath(); (x.roundRect || x.rect).call(x, px - 6.5, 1, 13, LB - 2, 3); x.fill(); }
        if (this.edits[i] != null) { x.fillStyle = '#ffe0b2'; x.beginPath(); (x.roundRect || x.rect).call(x, px - 6.5, 1, 13, LB - 2, 3); x.fill(); }
        x.fillStyle = DYE[q[i]] || GREY;
        x.fillText(q[i], px, LB / 2 + 1);
      }
    },
    /* kwaliteitsbalkjes onder de trace: hoogte ∝ Q (max 60), een gestippelde lijn op de drempel */
    qbars(x, r, v, W) {
      const p = r.peaks, n = Math.min(p.length, r.qual.length), bw = Math.max(1, this.sp() / v.spp - 1), h = QB - 2, y0 = Y1;
      for (let i = 0; i < n; i++) {
        const px = (p[i] - v.x0) / v.spp;
        if (px < -bw) continue;
        if (px > W + bw) break;
        const q = r.qual[i], bh = Math.min(q, 60) / 60 * h;
        x.fillStyle = qcol(q); x.fillRect(px - bw / 2, y0 - bh, bw, bh);
      }
      const ty = y0 - this.qN / 60 * h;
      x.save(); x.strokeStyle = '#5f6b7a'; x.lineWidth = 1; x.setLineDash([4, 3]);
      x.beginPath(); x.moveTo(0, ty); x.lineTo(W, ty); x.stroke(); x.restore();
    },
    /* de weggetrimde einden grijs over label-, trace- en kwaliteitsstrook, een streep op elke trimgrens, en dezelfde einden in het overzicht */
    shade(x, r, v, W, scans) {
      const p = r.peaks, t = this.trim, n = Math.min(p.length, r.bases.length);
      const L = t.start > 1 && t.start - 1 < n ? (p[t.start - 2] + p[t.start - 1]) / 2 : null;
      const R = t.end < n ? (p[t.end - 1] + p[t.end]) / 2 : null;
      const oy = Y1 + GAP + 4;
      x.save(); x.fillStyle = SHADE; x.strokeStyle = '#5f6b7a'; x.lineWidth = 1.5;
      if (L != null) {
        const a = (L - v.x0) / v.spp;
        x.fillRect(0, 0, Math.max(0, Math.min(a, W)), Y1); x.fillRect(0, oy, L / scans * W, OV);
        if (a >= 0 && a <= W) { x.beginPath(); x.moveTo(a, 0); x.lineTo(a, Y1); x.stroke(); }
      }
      if (R != null) {
        const a = (R - v.x0) / v.spp, c = Math.max(0, Math.min(a, W));
        x.fillRect(c, 0, W - c, Y1); x.fillRect(R / scans * W, oy, W - R / scans * W, OV);
        if (a >= 0 && a <= W) { x.beginPath(); x.moveTo(a, 0); x.lineTo(a, Y1); x.stroke(); }
      }
      x.restore();
    },
    scans() { return Math.max(1, ...Object.values(this.m.r.traces).map(t => t.length)); },
    set(v) { this.view = v; this.draw(); },
    /* zoom met factor f (>1 = uit) rond pixel px (standaard het midden) */
    zoom(f, px) {
      const W = this.$refs.cv ? this.$refs.cv.clientWidth : 800, c = px == null ? W / 2 : px;
      const at = this.view.x0 + c * this.view.spp, spp = clampView({x0: 0, spp: this.view.spp * f}, this.scans(), W).spp;
      this.set({x0: at - c * spp, spp});
    },
    whole() { this.set({x0: 0, spp: 1e9}); },
    pan(dpx) { this.set({x0: this.view.x0 + dpx * this.view.spp, spp: this.view.spp}); },
    /* naar scanpunt s in het midden */
    center(s) { const W = this.$refs.cv.clientWidth; this.set({x0: s - W / 2 * this.view.spp, spp: this.view.spp}); },
    wheel(e) {
      const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(d)) this.pan(e.shiftKey ? d : e.deltaX);
      else this.zoom(Math.exp(d / 400), e.offsetX);
    },
    onOverview(e) { return e.offsetY > Y1 + GAP; },
    down(e) {
      this.$refs.cv.setPointerCapture(e.pointerId);
      if (this.onOverview(e)) { this.drag = {ov: true}; this.center(e.offsetX / this.$refs.cv.clientWidth * this.scans()); }
      else { this.drag = {x: e.offsetX, sx: e.offsetX}; this.$refs.cv.style.cursor = 'grabbing'; }
    },
    move(e) {
      if (!this.drag) return;
      if (this.drag.ov) this.center(e.offsetX / this.$refs.cv.clientWidth * this.scans());
      else { this.pan(this.drag.x - e.offsetX); this.drag.x = e.offsetX; }
    },
    /* base waarvan de piek het dichtst bij pixel px ligt */
    nearest(px) {
      const p = this.m.r.peaks, n = Math.min(p.length, this.m.r.bases.length), s = this.view.x0 + px * this.view.spp;
      let lo = 0, hi = n - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (p[mid] < s) lo = mid + 1; else hi = mid; }
      return n ? (lo > 0 && s - p[lo - 1] < p[lo] - s ? lo - 1 : lo) : null;
    },
    select(i) { this.rng = null; this.sel = i == null || !this.read || !this.read.peaks.length ? null : Math.max(0, Math.min(i, this.read.peaks.length - 1, this.read.bases.length - 1)); },
    /* base i (0-based) een nieuwe letter geven; gelijk aan het origineel haalt de bewerking weg */
    setBase(i, b) {
      b = String(b).toUpperCase();
      if (!this.read || !IUPAC.test(b) || !(i >= 0 && i < this.read.bases.length)) return;
      const e = Object.assign({}, this.edits);
      if (b === this.auto[i]) delete e[i]; else e[i] = b;
      this.edits = e; this.save();
    },
    setOvr() {
      const i = intIn(this.opos, 1, this.m.r.bases.length, 0) - 1;
      if (i >= 0 && IUPAC.test(String(this.obase).toUpperCase())) { this.setBase(i, this.obase); this.opos = this.obase = ''; }
    },
    goTo(i) { this.select(i); if (this.read.peaks.length) this.center(this.read.peaks[i]); },
    undoAll() { this.edits = {}; this.save(); },
    save() { jset('sg-read', Object.assign({}, this.read, {edits: this.edits})); },
    onBase(e) { this.setBase(this.sel, e.target.value); e.target.value = this.seq[this.sel]; },
    fmtR(r) { return NL(r, 2); },
    inRng(i) { return !!this.rng && i >= this.rng.a && i <= this.rng.b; },
    /* shift: bereik van sel tot base i (zonder sel wordt i de selectie) */
    pick1(i, shift) {
      if (shift && this.sel != null && i !== this.sel) this.rng = {a: Math.min(this.sel, i), b: Math.max(this.sel, i)};
      else this.select(i);
    },
    panelClick(e) {
      const el = e.target.closest('[data-i]');
      if (!el) return;
      const i = +el.dataset.i;
      this.pick1(i, e.shiftKey);
      if (this.read && this.read.peaks.length && !e.shiftKey) this.center(this.read.peaks[i]);
    },
    /* de geselecteerde base in het paneel in beeld, alleen door het paneel zelf te scrollen */
    reveal() {
      const pr = this.$refs.pre, el = pr && this.sel != null && pr.querySelector('[data-i="' + this.sel + '"]');
      if (!el) return;
      const a = el.getBoundingClientRect(), b = pr.getBoundingClientRect();
      if (a.top < b.top) pr.scrollTop -= b.top - a.top; else if (a.bottom > b.bottom) pr.scrollTop += a.bottom - b.bottom;
    },
    async copy() {
      const t = fasta(this.m.r.name, this.seq, this.rng, this.rc);
      try { await navigator.clipboard.writeText(t); this.copied = this.t('Gekopieerd.'); } catch (e) { this.copied = this.t('Kopiëren geblokkeerd.'); }
    },
    base() { return safeName(String(this.m.r.name || 'chromatogram').replace(/\.[A-Za-z0-9]{1,4}$/, '')); },
    /* PNG: het canvas zoals het nu is, overzichtsstrook en trimschaduw inbegrepen */
    saveSnp() {
      const tsv = [this.snpCols.map(c => c.h)].concat(this.snp.rows).map(r => r.join('\t')).join('\n');
      saveBlob(this.base() + '-snp.csv', csvBlob(tsv)).catch(() => {});
    },
    savePng() { this.$refs.cv.toBlob(b => { if (b) saveBlob(this.base() + '.png', b).catch(() => {}); }, 'image/png'); },
    /* de vier kanalen, baseletters en nummers van het zichtbare venster; zonder overzicht of kwaliteit */
    saveSvg() {
      const r = this.m.r, W = Math.round(this.$refs.cv.clientWidth);
      saveBlob(this.base() + '.svg', new Blob([traceSvg({traces: r.traces, peaks: r.peaks, seq: this.seq, view: this.view, w: W, th: TH, keep: this.trim})], {type: 'image/svg+xml'})).catch(() => {});
    },
    /* de getrimde read (hele read zonder trimvoorstel), met bewerkingen en rc-schakelaar */
    saveFasta() {
      const t = this.trim, txt = fasta(this.m.r.name, this.seq, t ? {a: t.start - 1, b: t.end - 1} : null, this.rc);
      saveBlob(this.base() + '.fasta', new Blob([txt], {type: 'text/plain'})).catch(() => {});
    },
    /* afdruk: de hele read in rijen van 60 basen, elke rij op zijn eigen hoogteschaal; getrimde einden grijs */
    printHtml() {
      const r = this.m.r, me = r.meta || {}, t = this.t, sp = this.sp(), n = Math.min(r.peaks.length, this.seq.length), w = 720, rows = [];
      for (let a = 0; a < n; a += 60) {
        const b = Math.min(n, a + 60), view = {x0: r.peaks[a] - sp / 2, spp: sp * 60 / w};
        rows.push('<div class="r">' + traceSvg({traces: r.traces, peaks: r.peaks, seq: this.seq, view, w, th: 60, keep: this.trim}) + '</div>');
      }
      const tr = this.trim, info = [[t('Bestand'), r.name], [t('Monster'), me.sample], [t('Well'), me.well], [t('Instrument'), me.instrument],
        [t('Start run'), me.start], [t('Leeslengte'), n + ' ' + t('basen')], [t('Trimvoorstel'), tr ? tr.start + '–' + tr.end : '']].filter(x => x[1]);
      return '<!doctype html><meta charset="utf-8"><title>' + esc(r.name) + '</title><style>@page{size:A4;margin:12mm}body{font:12px system-ui,Arial,sans-serif;margin:0}'
        + 'h1{font-size:16px;margin:0 0 4px}.i{margin:0 0 8px;color:#333}.r{break-inside:avoid;page-break-inside:avoid;margin:0 0 6px}svg{width:100%;height:auto;display:block}</style>'
        + '<h1>' + esc(t('Chromatogram')) + '</h1><p class="i">' + info.map(x => '<b>' + esc(x[0]) + ':</b> ' + esc(String(x[1]))).join(' &nbsp; ') + '</p>' + rows.join('');
    },
    print() { rpPrint(this.printHtml()); },
    up(e) {
      const d = this.drag;
      if (d && !d.ov && e && e.type === 'pointerup' && Math.abs(e.offsetX - d.sx) <= 3 && this.read && this.read.peaks.length) this.pick1(this.nearest(e.offsetX), e.shiftKey);
      this.drag = null; if (this.$refs.cv) this.$refs.cv.style.cursor = 'grab'; },
    key(e) {
      if (this.sel != null && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const W = this.$refs.cv.clientWidth, i = this.sel, go = d => {
          this.select(i + d);
          const px = (this.read.peaks[this.sel] - this.view.x0) / this.view.spp;
          if (px < 10 || px > W - 10) this.center(this.read.peaks[this.sel]);
        };
        if (/^[a-z]$/i.test(e.key)) { e.preventDefault(); this.setBase(i, e.key); return; }
        const a = {Backspace: () => this.setBase(i, this.auto[i]), Delete: () => this.setBase(i, this.auto[i]),
          Escape: () => this.select(null), ArrowLeft: () => go(-1), ArrowRight: () => go(1)}[e.key];
        if (a) { e.preventDefault(); a(); return; }
      }
      const W = this.$refs.cv.clientWidth, k = {ArrowLeft: () => this.pan(-W / 4), ArrowRight: () => this.pan(W / 4),
        '+': () => this.zoom(1 / 1.5), '=': () => this.zoom(1 / 1.5), '-': () => this.zoom(1.5), Home: () => this.set({x0: 0, spp: this.view.spp}),
        End: () => this.set({x0: 1e9, spp: this.view.spp})}[e.key];
      if (k) { e.preventDefault(); k(); }
    },
    /* ---------- referentie, assay en tweede read ---------- */
    /* een veld dat de code zette ook in de invoeropslag (die luistert naar input-events) */
    poke(...ids) { this.$nextTick(() => ids.forEach(id => { const el = document.getElementById(id); if (el) el.dispatchEvent(new Event('input', {bubbles: true})); })); },
    /* een assay kiezen zet zijn amplicon als referentie en laadt hem in de editor */
    pickAssay() {
      const a = this.assay;
      if (a) {
        this.refText = '>' + a.name + '\n' + a.ref;
        this.edName = a === TEACH ? '' : a.name; this.edStart = String(a.start);
        this.edRows = a.snps.map(s => [s.rs, String(s.pos), s.alleles, s.strand]);
        this.poke('sg-ref');
      }
    },
    teach() {
      const r = teachReads();
      this.clear(); this.paste = r.f; this.paste2 = r.r; this.read2 = null; jset('sg-read2', null);
      this.poke('sg-paste', 'sg-paste2');
    },
    async pickRef(e) {
      const f = e.target.files[0]; if (!f) return;
      const txt = await f.text(); e.target.value = '';
      if (/^\s*\{/.test(txt)) { this.importAssay(txt); return; }
      this.refText = txt; this.poke('sg-ref');
    },
    errText(err) { return err.map(e => (e[1] ? e[1] + ': ' : '') + this.t(e[0])); },
    importAssay(txt) {
      const {assay, err} = parseAssay(txt);
      if (err.length) { this.edOk = false; this.edErr = this.errText(err); return; }
      this.storeAssay(assay); this.edOk = true; this.edErr = [this.t('Panel ingelezen en bewaard.')];
    },
    storeAssay(a) {
      this.own = this.own.filter(x => x.name !== a.name).concat([a]); jset(AKEY, this.own);
      this.assayKey = 'eigen:' + a.name; this.poke('sg-assay');
    },
    /* het panel in de editor, met de referentie hierboven als amplicon */
    draft() {
      const snps = this.edRows.filter(r => r.slice(0, 3).some(v => String(v).trim()))
        .map(r => ({rs: r[0], pos: Number(String(r[1]).replace(/\s/g, '').replace(',', '.')), alleles: r[2], strand: r[3]}));
      const st = String(this.edStart).replace(/[\s.]/g, '');
      return parseAssay({name: this.edName, start: st === '' ? 1 : Number(st), ref: this.refSeq, snps});
    },
    saveAssay() {
      if (this.edName.trim() === TEACH.name) { this.edOk = false; this.edErr = [this.t('Kies een eigen naam voor je panel.')]; return; }
      const {assay, err} = this.draft();
      if (err.length) { this.edOk = false; this.edErr = this.errText(err); return; }
      this.storeAssay(assay); this.edOk = true; this.edErr = [this.t('Panel bewaard.')];
    },
    exportAssay() {
      const {assay, err} = this.draft();
      if (err.length) { this.edOk = false; this.edErr = this.errText(err); return; }
      saveBlob(safeName(assay.name) + '.json', new Blob([assayJson(assay)], {type: 'application/json'})).catch(() => {});
    },
    delAssay() {
      this.own = this.own.filter(x => 'eigen:' + x.name !== this.assayKey); jset(AKEY, this.own);
      this.assayKey = ''; this.edErr = []; this.poke('sg-assay');
    },
    async pick2(e) {
      const f = e.target.files[0]; if (!f) return;
      const x = await readIn(f);
      if (x.err) { this.err = this.t(x.err); return; }
      this.err = ''; this.read2 = markRaw(x.r); jset('sg-read2', x.r);
    },
    clear2() {
      this.read2 = null; this.paste2 = ''; jset('sg-read2', null); this.poke('sg-paste2');
      const f = document.getElementById('sg-file2'); if (f) f.value = '';
    },
    /* de tweede read in de trace: de reads wisselen van plaats, elk met zijn eigen bewerkingen */
    swap() {
      const a = this.read ? Object.assign({}, this.read, {edits: this.edits}) : null, b = this.read2;
      this.edits = b.edits || {}; this.sel = null; this.rng = null;
      this.read = markRaw(b); this.read2 = a ? markRaw(a) : null;
      jset('sg-read', Object.assign({}, b, {edits: this.edits})); jset('sg-read2', a);
    },
    alnClick(e) {
      const el = e.target.closest('[data-q]');
      if (el && this.read && this.read.peaks.length) this.goTo(+el.dataset.q);
    },
    /* ---------- batch (S162) ---------- */
    bpick(e) { this.addBatch([...e.target.files]); e.target.value = ''; },
    bdrop(e) { this.bover = false; this.addBatch([...e.dataTransfer.files]); },
    async addBatch(files) {
      const xs = await Promise.all(files.map(f => readIn(f).catch(e => ({err: String(e.message)}))));
      const out = [];
      xs.forEach((x, k) => {
        if (x.err) { this.err = this.t(x.err) + ' (' + files[k].name + ')'; return; }
        out.push({id: ++this.bid, r: markRaw(x.r)});
      });
      this.batch = this.batch.concat(out);
    },
    /* de batch in de worker uitlijnen; een antwoord op een oudere vraag telt niet meer */
    async alignBatch(k) {
      const gen = this.bgen = (this.bgen || 0) + 1;
      this.bbusy = k.batch.length > 0;
      const out = await Promise.all(k.batch.map(b => sw().call('callSample', [b.r, k.ref, k.assay, k.o])
        .then(x => Object.assign(x, {read: b.r, id: b.id}))));
      if (gen !== this.bgen) return;
      this.bsamples = out.map(x => markRaw(x)); this.bbusy = false;
    },
    async pickSbe(e) {
      const f = e.target.files[0]; if (!f) return;
      this.sbeFileErr = '';
      try { const c = sbeChannels(readAbif(await f.arrayBuffer())); this.sbe = markRaw(Object.assign({name: f.name}, c)); }
      catch (x) { this.sbe = null; this.sbeFileErr = this.t(String(x.message)); }
    },
    sbeDemoLoad() { this.sbe = markRaw(sbeDemo()); this.sbeFileErr = ''; this.sbeText = DEMO_PANEL; this.poke('sg-sbe-panel'); },
    /* per rs-nummer van de assay: dbSNP (uit de cache, of via de wachtrij als de schakelaar aan staat),
       de streng uit de allelen of anders uit de flank, en het label */
    async dbLookup() {
      const t = this.t, ref = this.refSeq, out = {}, msg = [];
      this.dbBusy = true;
      for (const s of this.dbRs) {
        const id = rsId(s.rs);
        try {
          const r = parseSnp(await ncbiGet('esummary', {db: 'snp', id, retmode: 'json'}), id);
          if (!r.ok) { msg.push(s.rs + ': ' + t('niet gevonden in dbSNP.')); continue; }
          const base = ref[s.pos - 1];
          let st = orientByAlleles(r, base);
          if (!st && r.acc && r.pos) {
            const f = flankRegion(r);
            const txt = await ncbiGet('efetch', {db: 'nuccore', id: f.acc, rettype: 'fasta', retmode: 'text', seq_start: f.from, seq_stop: f.to});
            st = orientByFlank(String(txt).split(/\r?\n/).filter(l => !l.startsWith('>')).join(''), ref, s.pos);
          }
          const L = dbLabel(r, st, base, s);
          if (L) out[s.rs] = L; else msg.push(s.rs + ': ' + t('de streng is niet te bepalen; controleer deze SNP met de hand.'));
        } catch (e) {
          msg.push(s.rs + ': ' + t(e && e.kind ? e.message : 'NCBI gaf een onverwacht antwoord. Probeer het later opnieuw.'));
          if (e && e.kind === 'off') break;
        }
      }
      this.dbl = out; this.dbMsg = msg; this.dbBusy = false;
    },
    /* het panel vullen: per rs-nummer de allelen en de flank bij dbSNP, en de plek in de referentie */
    async fillFromRs() {
      const t = this.t, ref = this.refSeq, {ids, bad} = rsList(this.rsListText), msgs = bad.map(w => ['bad', uv(w) + ': ' + t('geen rs-nummer.')]);
      if (!ref) { this.rsMsgs = [['bad', t('Zet eerst het amplicon bij Referentiesequentie.')]]; return; }
      if (!ids.length) { this.rsMsgs = msgs.length ? msgs : [['bad', t('Typ een of meer rs-nummers.')]]; return; }
      this.rsBusy = true;
      const rows = this.edRows.filter(r => r.slice(0, 3).some(v => String(v).trim()));
      for (const rs of ids) {
        try {
          const id = rsId(rs), r = parseSnp(await ncbiGet('esummary', {db: 'snp', id, retmode: 'json'}), id);
          if (!r.ok) { msgs.push(['bad', rs + ': ' + t('niet gevonden in dbSNP.')]); continue; }
          const f = flankRegion(r);
          const txt = await ncbiGet('efetch', {db: 'nuccore', id: f.acc, rettype: 'fasta', retmode: 'text', seq_start: f.from, seq_stop: f.to});
          const loc = locateSnp(String(txt).split(/\r?\n/).filter(l => !l.startsWith('>')).join(''), ref);
          if (!loc) { msgs.push(['bad', rs + ': ' + t('niet gevonden in de referentie; staat de SNP in dit amplicon?')]); continue; }
          const L = dbLabel(r, loc.strand, ref[loc.pos - 1]);
          if (!L) { msgs.push(['bad', rs + ': ' + t('dbSNP geeft geen enkel-base-allelen voor deze SNP.')]); continue; }
          if (L.multi) msgs.push(['warn', rs + ': ' + t('dbSNP kent meer dan één alternatief allel; ingevuld is') + ' ' + L.alleles + '.']);
          const row = [rs, String(loc.pos), L.alleles, L.strand], k = rows.findIndex(x => String(x[0]).toLowerCase() === rs);
          if (k >= 0) rows.splice(k, 1, row); else rows.push(row);
        } catch (e) {
          msgs.push(['bad', rs + ': ' + t(e && e.kind ? e.message : 'NCBI gaf een onverwacht antwoord. Probeer het later opnieuw.')]);
          if (e && e.kind === 'off') break;
        }
      }
      this.edRows = rows.length ? rows : [['', '', '', '+']];
      this.rsMsgs = msgs.concat(msgs.some(m => m[0] === 'bad') ? [] : [['ok', t('Panel ingevuld; bewaar het met Panel bewaren.')]]);
      this.rsBusy = false;
    },
    /* alle SNP's van het gekozen paneel tegen dbSNP, één voor één door de wachtrij */
    async verifyPanel() {
      this.hvBusy = true; this.hvRows = [];
      for (const s of this.hsSnps) {
        const id = rsId(s.rs);
        try { this.hvRows.push(verifySnp(s, parseSnp(await ncbiGet('esummary', {db: 'snp', id, retmode: 'json'}), id))); }
        catch (e) {
          this.hvRows.push({rs: s.rs, allele: s.allele, status: 'err', why: this.t(e && e.kind ? e.message : 'NCBI gaf een onverwacht antwoord. Probeer het later opnieuw.')});
          if (e && e.kind === 'off') break;
        }
      }
      this.hvBusy = false;
    },
    workerMode() { return W ? W.mode : 'none'; },
    bclear() { this.batch = []; const f = document.getElementById('sg-bfiles'); if (f) f.value = ''; },
    saveBatch() {
      const rows = [this.btCols.map(c => c.h)].concat(this.btRows.map(r => r.map(v => String(v).replace(/&amp;/g, '&'))));
      saveBlob('chromatogram-batch.csv', csvBlob(rows.map(r => r.join('\t')).join('\n'))).catch(() => {});
    },
    /* de overlay: per monster de trace rond de gekozen SNP, op de piek van de SNP gecentreerd */
    paintOv() {
      const cv = this.$refs.ovcv;
      if (!cv || !cv.clientWidth) return;
      const W = cv.clientWidth, H = this.ovH, s = window.devicePixelRatio || 1, i = Number(this.ovSnp) || 0, SH = 52;
      cv.width = Math.round(W * s); cv.height = Math.round(H * s);
      const x = cv.getContext('2d');
      x.setTransform(s, 0, 0, s, 0, 0); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      x.font = '11px system-ui,sans-serif'; x.textBaseline = 'top';
      overlayStrips(this.bsamples, i, 8, W).forEach((st, k) => {
        const y = k * SH + 4;
        x.fillStyle = '#5f6b7a'; x.textAlign = 'left';
        x.fillText(st.name + (st.q < 0 ? ' – ' + this.t('niet gedekt') : ' · ' + st.gt + (st.strand === '-' ? ' (−)' : '')), 4, y);
        if (st.q < 0) return;
        if (st.traces) {
          drawTraces(x, st.traces, {x0: st.x0, spp: st.spp}, {x: 0, y: y + 14, w: W, h: SH - 20});
          x.strokeStyle = 'rgba(21,101,192,.5)'; x.setLineDash([3, 3]); x.beginPath(); x.moveTo(st.cx, y + 14); x.lineTo(st.cx, y + SH - 6); x.stroke(); x.setLineDash([]);
        } else { x.fillStyle = DYE[st.base] || GREY; x.font = 'bold 14px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText(st.base, W / 2, y + 18); x.font = '11px system-ui,sans-serif'; }
        x.strokeStyle = '#e1e4ea'; x.beginPath(); x.moveTo(0, y + SH - 3.5); x.lineTo(W, y + SH - 3.5); x.stroke();
      });
    },
    /* ---------- HIrisPlex-S genotypeblad (S164) ---------- */
    hsBad(sm, s) { return !!sm.vals[s.rs] && !HS_VALUES.includes(String(sm.vals[s.rs])); },
    noteText(c) { return this.t(NOTES[c] || c); },
    addSample(id, vals, notes) {
      this.hs.samples.push({id: id || this.t('Monster') + ' ' + (this.hs.samples.length + 1), vals: vals || {}, notes: notes || {}, res: {}});
    },
    delSample(i) { this.hs.samples.splice(i, 1); },
    /* het blad van één monster uit de calls van de assay; een monster met dezelfde naam wordt vervangen */
    putSample(id, calls) {
      const {vals, notes} = autofill(calls), i = this.hs.samples.findIndex(x => x.id === id);
      if (i >= 0) this.hs.samples.splice(i, 1, {id, vals, notes, res: this.hs.samples[i].res || {}}); else this.hs.samples.push({id, vals, notes, res: {}});
    },
    /* het .csv zoals de webtool het wil: komma's, SampleID en een kolom per SNP; zonder BOM, anders is de eerste kolomnaam niet SampleID */
    sheetCsv() { return toCsv(this.hs.panel, this.hs.samples); },
    saveSheet() { saveBlob('hirisplex-' + this.hs.panel + '.csv', new Blob([this.sheetCsv()], {type: 'text/csv'})).catch(() => {}); },
    async copySheet() {
      try { await navigator.clipboard.writeText(this.sheetCsv()); this.hsCopied = this.t('Gekopieerd.'); } catch (e) { this.hsCopied = this.t('Kopiëren geblokkeerd.'); }
    },
    /* ---------- uitkomsten van de webtool (S167) ---------- */
    rsApply() {
      const r = parseResultPaste(this.rsPaste);
      if (!Object.keys(r.res).length) { this.rsMsg = this.t('Er zijn ' + r.n + ' getallen gevonden; er horen er 14 te zijn, in de volgorde van de tabel.'); return; }
      this.rsMsg = ''; this.rsPaste = '';
      this.hs.samples[this.rsIdx].res = r.res;
    },
    /* een staafgrafiek per eigenschap voor het gekozen monster, in het rapport als losse figuren */
    paintRs() {
      const x = this.hs.samples[this.rsIdx], cvs = this.$refs.rscv;
      if (!cvs || !x || typeof barChart !== 'function') return;
      const t = this.t;
      for (const cv of [].concat(cvs)) {
        const g = RESULT_GROUPS.find(r => cv.id === 'sg-rs-cv-' + r[0]);
        if (!g) continue;
        const vals = g[2].map((c, i) => { const p = parseProb(x.res[g[0] + '.' + i]); return p == null ? NaN : p; }), nan = vals.map(() => NaN);
        barChart(cv, g[2].map(c => t(c)), vals, nan, nan, {ylabel: t('Kans') + ' · ' + t(g[1]) + ' (' + x.id + ')', ref: false, ymax: 1});
      }
    },
    fillRead() { this.putSample(this.m.r.name || this.t('Monster'), mergeCalls(this.snpc, this.snpc2)); },
    fillBatch() { for (const x of this.bsamples) this.putSample(x.name, x.calls); },
    /* ---------- voorbeeld en case (S168) ---------- */
    /* het verzonnen voorbeeld: oefenpanel met oefenreads, daarbij een verzonnen blad en verzonnen uitkomsten */
    loadExample() {
      this.assayKey = 'oefen'; this.teach();
      const x = exampleSample(), i = this.hs.samples.findIndex(y => y.id === x.id);
      this.hs.panel = 'hirisplexs';
      if (i >= 0) this.hs.samples.splice(i, 1, x); else this.hs.samples.push(x);
      this.rsIdx = this.hs.samples.findIndex(y => y.id === EXAMPLE_ID);
      this.caseMsg = this.t('Voorbeeld geladen: de oefenreads, een verzonnen genotypeblad en verzonnen uitkomsten.'); this.caseOk = true;
    },
    saveCase() {
      const c = makeCase({read: this.read ? Object.assign({}, this.read, {edits: this.edits}) : null, read2: this.read2, batch: this.batch.map(b => b.r),
        win: this.win, qthr: this.qthr, hthr: this.hthr, refText: this.refText, assay: this.assay, assayKey: this.assayKey, sheet: JSON.parse(JSON.stringify(this.hs))}, typeof APPVER === 'string' ? APPVER : '');
      c.paste = this.paste; c.paste2 = this.paste2;
      const d = new Date(), stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      saveBlob('sanger-case-' + stamp + '.json', new Blob([JSON.stringify(c)], {type: 'application/json'})).catch(() => {});
    },
    async pickCase(e) {
      const f = e.target.files[0]; if (!f) return;
      const r = parseCase(await f.text()); e.target.value = '';
      if (!r.ok) { this.caseOk = false; this.caseMsg = this.t(r.err); return; }
      const c = r.c;
      this.win = String(c.win || '10'); this.qthr = String(c.qthr || '20'); this.hthr = String(c.hthr || NL(0.2, 1));
      this.edits = c.read && c.read.edits ? c.read.edits : {}; this.sel = null; this.rng = null;
      this.read = c.read ? markRaw(c.read) : null; jset('sg-read', c.read);
      this.read2 = c.read2 ? markRaw(c.read2) : null; jset('sg-read2', c.read2);
      this.batch = c.batch.map(x => ({id: ++this.bid, r: markRaw(x)}));
      if (c.assay && String(c.assayKey).startsWith('eigen:')) this.storeAssay(c.assay); else this.assayKey = c.assayKey === 'oefen' ? 'oefen' : '';
      this.refText = c.refText || ''; this.paste = c.paste || ''; this.paste2 = c.paste2 || '';
      this.hs.panel = c.sheet.panel; this.hs.samples = c.sheet.samples; this.rsIdx = 0;
      this.poke('sg-win', 'sg-q', 'sg-het', 'sg-ref', 'sg-paste', 'sg-paste2', 'sg-assay');
      this.caseOk = true; this.caseMsg = this.t('Case geopend.');
    },
    clear() {
      this.read = null; this.edits = {}; this.sel = null; this.rng = null; this.paste = ''; this.err = '';
      jset('sg-read', null);
      const f = document.getElementById('sg-file'); if (f) f.value = '';
    }
  }
};
</script>
