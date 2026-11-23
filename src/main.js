/* ================= INGANG VAN DE VUE-BUNDEL =================
   Vite bundelt dit tot build/app.bundle.js (één IIFE, geen losse bestanden), en
   tools/insert_tools.py zet die bundel in web/index.html, sinds S267 vóór de oude inline
   scripts (zie de import van ./lib/ hieronder). Daardoor blijft index.html één bestand dat
   vanaf file:// werkt.

   De bundel loopt in dezelfde globale omgeving als de rest van de app en gebruikt de
   bestaande helpers (trPlain, num, fmt, vol, sig, note, kv, chart, calc en zo verder) gewoon
   als globale namen. Dat is geen toeval maar de afspraak: de tools die nog niet op Vue staan
   gebruiken die helpers ook, en ze hoeven niet twee keer te bestaan.

   Elke tool heeft een eigen host in de pagina, bij de kop en de bronregel die gewone HTML
   blijven. calc[tool] blijft bestaan omdat de rest van de app dat aanroept na het delen van
   een link, ongedaan maken en bij het openen; een component rekent zelf opnieuw. */
/* De gedeelde helpers (S267). Ze staan eerst, want ze zetten hun namen op window en de rest van
   de app (de inline scripts in src/shell/index.html, tools/nt/ en de componenten) leest ze als
   globale namen. De bundel staat daarom vóór die scripts in de pagina; het mounten zelf gebeurt
   pas in start(), zie hieronder. */
/* de vertaling eerst (S271): trPlain/trCanvas moeten er zijn voordat er iets getekend wordt */
import './lib/i18n.js';
import './lib/helpers.js';
import './lib/fit.js';
import './lib/chart.js';
import './lib/parse.js';
import './lib/platereader.js';
import './lib/storage.js';
import './lib/material.js';
/* de motoren (S268): toestand die buiten Vue blijft en door meerdere tools gebruikt wordt */
import './engines/timers.js';
import './engines/gelfoto.js';
import './engines/plate.js';

/* De oude code (S269), in de volgorde waarin ze vroeger als inline scripts en tools/nt/-modules
   in de pagina stond. Volgorde telt: een module mag bij het laden alleen gebruiken wat erboven
   staat. */
import './legacy/core.js';
import './legacy/app.js';
import './legacy/nt/00_lib.js';
import './legacy/nt/01_pic.js';
import './legacy/nt/03_recipe.js';
import './legacy/nt/05_oplos.js';
import './legacy/nt/20_strchk.js';
import './legacy/nt/21_bpa.js';
import './legacy/nt/22_pmi.js';
import './legacy/nt/23_ystr.js';
import './legacy/nt/24_kin.js';
import './legacy/nt/30_pipcal.js';
import './legacy/nt/31_westgard.js';
import './legacy/nt/32_munc.js';
import './legacy/nt/33_mval.js';
import './legacy/nt/40_mpn.js';
import './legacy/nt/41_ic50.js';
import './legacy/nt/42_steril.js';
import './legacy/nt/43_passage.js';
import './legacy/nt/44_stain.js';
import './legacy/nt/45_cdna.js';
import './legacy/nt/46_qplate.js';
import './legacy/nt/47_rnaq.js';
import './legacy/nt/48_gplan.js';
import './legacy/nt/50_osmo.js';
import './legacy/nt/51_titr.js';
import './legacy/nt/52_kjel.js';
import './legacy/nt/61_plan.js';
import './legacy/nt/62_report.js';
import './legacy/nt/70_widmark.js';
import './legacy/nt/71_stature.js';
import './legacy/nt/72_ento.js';
import './legacy/nt/73_glass.js';
import './legacy/nt/74_hwe.js';
import './legacy/nt/75_chrom.js';
import './legacy/nt/76_istd.js';
import './legacy/nt/77_edta.js';
import './legacy/nt/78_bufcap.js';
import './legacy/nt/79_ksp.js';
import './legacy/nt/81_transfect.js';
import './legacy/nt/82_viab.js';
import './legacy/nt/83_desinf.js';
import './legacy/nt/84_bland.js';
import './legacy/nt/85_roc.js';
import './legacy/nt/86_km.js';
import './legacy/nt/92_purif.js';
import './legacy/nt/93_gradient.js';
import './legacy/nt/94_elisa.js';
import './legacy/nt/95_facs.js';
import './legacy/nt/96_mix.js';
import './generated/news.js';
import './generated/valid.js';
import './legacy/nt/99_app.js';
import './legacy/nt/99y_stage.js';
import './generated/icons.js';
import './legacy/nt/99z_ux.js';

/* als laatste: de componenten mounten en de app opstarten */
import './legacy/init.js';
export {start} from './mount.js';
