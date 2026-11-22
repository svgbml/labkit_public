// De modules in src/lib/ zetten hun namen op window en lezen LANG als globale naam; in Node is dat globalThis.
globalThis.window = globalThis;
globalThis.LANG = 'nl';
// seq.js hangt bij het laden een click-luisteraar aan document; verder raakt geen geteste module de DOM.
globalThis.document = {addEventListener() {}};
