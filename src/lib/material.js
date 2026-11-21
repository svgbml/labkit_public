import {expose} from './global.js';

/* Materiaallijst per tool (voor het afdrukprotocol): een tool meldt zich aan met een functie die
   [[item, hoeveelheid], …] geeft, al vertaald; gebruikerstekst gaat door esc() bij het afdrukken. */
const REG = {};
const matRegister = (id, fn) => { REG[id] = fn; };
const matList = id => { try { return REG[id] ? REG[id]() || [] : []; } catch (e) { return []; } };

expose({matRegister, matList});
