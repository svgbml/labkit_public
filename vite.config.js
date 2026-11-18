import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {fileURLToPath} from 'node:url';

/* Labkit wordt als één bestand uitgeleverd: web/index.html moet vanaf file:// werken, en de
   testsuite opent de app ook zo (alle vijf de tests gebruiken een file-URL). ES-modules zijn
   vanaf file:// geblokkeerd (origin 'null'), dus hier komt geen dist/ met losse chunks uit,
   maar één IIFE-bundel zonder hash. tools/insert_tools.py zet de inhoud daarvan in
   web/index.html, op dezelfde plek waar de Vue-modules eerst stonden.

   Daarom ook geen code-splitting en geen dynamische import(): die werken niet vanaf file://.
   Zie docs/ROADMAP.md en CLAUDE.md. */
export default defineConfig({
  plugins: [vue()],
  define: {
    /* In lib-modus vervangt Vite process.env.NODE_ENV niet zelf; de esm-bundler-build van Vue
       verwacht dat de bundelaar dat doet, en zonder deze regel valt de app om met
       "process is not defined". */
    'process.env.NODE_ENV': '"production"',
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
  },
  resolve: {
    /* Elke template staat nu in een .vue-bestand en wordt door @vitejs/plugin-vue vooraf
       gecompileerd, dus de template-compiler hoeft niet mee: de runtime-build is kleiner. */
    alias: {vue: 'vue/dist/vue.runtime.esm-bundler.js'}
  },
  build: {
    outDir: 'build',
    emptyOutDir: false,          /* build/ bevat ook het app-pictogram */
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, /* alles in de bundel: er mag geen los bestand bij komen */
    target: 'es2020',
    lib: {
      entry: fileURLToPath(new URL('src/main.js', import.meta.url)),
      name: 'LabkitVue',
      formats: ['iife'],
      fileName: () => 'app.bundle.js'
    },
    rollupOptions: {output: {
      inlineDynamicImports: true,
      /* Vue zit in deze bundel en de bundel gaat in web/index.html, dat als één bestand wordt
         doorgegeven. De MIT-melding moet daarom mee in de code zelf; de volledige tekst staat
         in licenses/vue-LICENSE.txt. */
      banner: '/*! Vue 3 (https://vuejs.org) - MIT License - Copyright (c) 2018-present, Yuxi (Evan) You.\n'
        + '    Hieronder meegebundeld; volledige licentietekst: licenses/vue-LICENSE.txt */'
    }}
  }
});
