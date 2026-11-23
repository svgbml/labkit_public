/* De worker van het chromatogram (S163): bestanden lezen en reads uitlijnen buiten de hoofddraad.
   Vite bouwt dit als eigen bundel en zet die als tekst in de hoofdbundel (?worker&inline in
   Sanger.vue); src/lib/inworker.js start hem uit een Blob-URL en valt anders terug op de hoofddraad. */
import {serve} from '../lib/inworker.js';
import {readFile} from '../lib/sangerfile.js';
import {callSample} from '../lib/sangerbatch.js';

serve({readFile, callSample});
