/* ================= RECEPTENBIBLIOTHEEK (S37) =================
   De recepten voor *Oplossing & buffer*. Per recept: de componenten, een stap over de pH of
   het steriliseren, en de bron waar de samenstelling uit komt.

   Een component is [naam, molmassa, concentratie, eenheid]. Bij de eenheden 'g/L' en '% w/v'
   doet de molmassa niet mee (die mag NaN zijn): dat is bedoeld voor media-ingrediënten als
   trypton en agar, en voor detergentia. Vloeistoffen die je afmeet in plaats van afweegt
   (ijsazijn, methanol) staan in de stap, niet in de tabel, want je weegt ze niet af.

   Molmassa's: Tris 121,14 · NaCl 58,44 · KCl 74,55 · Na₂HPO₄ 141,96 · KH₂PO₄ 136,09 ·
   NaH₂PO₄ 119,98 · boorzuur 61,83 · EDTA-Na₂·2H₂O 372,24 · azijnzuur 60,05 ·
   trinatriumcitraat·2H₂O 294,10 · glycine 75,07 · SDS 288,38 · Na₂CO₃ 105,99 ·
   NaHCO₃ 84,01 · MgCl₂·6H₂O 203,30 · MgSO₄·7H₂O 246,47 · glucose 180,16. */
/* hydraatvormen die de bibliotheek nodig heeft en die nog niet in HYD stonden (S39);
   HYD zelf staat in web/index.html, omdat de chemicaliënlijst daar wordt opgebouwd. */
const RECHYD=[['Na₂CO₃',[['watervrij','Na₂CO₃',105.99],['monohydraat (·H₂O)','Na₂CO₃·H₂O',124.00],['decahydraat (·10H₂O, soda)','Na₂CO₃·10H₂O',286.14]]]
];
const RECIPES={
  trisnacl:[['Tris (base)',121.14,50,'mM'],['NaCl',58.44,150,'mM']],
  pbs:[['NaCl',58.44,137,'mM'],['KCl',74.55,2.7,'mM'],['Na₂HPO₄',141.96,10,'mM'],['KH₂PO₄',136.09,1.8,'mM']],
  tbs:[['Tris (base)',121.14,20,'mM'],['NaCl',58.44,150,'mM']],
  tbst:[['Tris (base)',121.14,20,'mM'],['NaCl',58.44,150,'mM'],['Tween 20',NaN,0.1,'% w/v']],
  te:[['Tris (base)',121.14,10,'mM'],['EDTA-Na₂·2H₂O',372.24,1,'mM']],
  tbe10:[['Tris (base)',121.14,0.89,'M'],['Boorzuur',61.83,0.89,'M'],['EDTA-Na₂·2H₂O',372.24,20,'mM']],
  tae50:[['Tris (base)',121.14,2,'M'],['EDTA-Na₂·2H₂O',372.24,50,'mM']],
  ssc20:[['NaCl',58.44,3,'M'],['Trinatriumcitraat·2H₂O',294.10,0.3,'M']],
  laemmli10:[['Tris (base)',121.14,250,'mM'],['Glycine',75.07,1.92,'M'],['SDS',288.38,1,'% w/v']],
  towbin:[['Tris (base)',121.14,25,'mM'],['Glycine',75.07,192,'mM']],
  carbonaat:[['Na₂CO₃',105.99,15,'mM'],['NaHCO₃',84.01,35,'mM']],
  citraat:[['Trinatriumcitraat·2H₂O',294.10,10,'mM']],
  fosfaat:[['Na₂HPO₄',141.96,61,'mM'],['NaH₂PO₄',119.98,39,'mM']],
  lb:[['Trypton',NaN,10,'g/L'],['Gistextract',NaN,5,'g/L'],['NaCl',58.44,10,'g/L']],
  lbagar:[['Trypton',NaN,10,'g/L'],['Gistextract',NaN,5,'g/L'],['NaCl',58.44,10,'g/L'],['Agar',NaN,15,'g/L']],
  soc:[['Trypton',NaN,20,'g/L'],['Gistextract',NaN,5,'g/L'],['NaCl',58.44,10,'mM'],['KCl',74.55,2.5,'mM'],
    ['MgCl₂·6H₂O',203.30,10,'mM'],['MgSO₄·7H₂O',246.47,10,'mM'],['Glucose',180.16,20,'mM']],
  leeg:[['',NaN,NaN,'mM']]
};
/* naam in de keuzelijst */
const RECNAME={
  trisnacl:'50 mM Tris + 150 mM NaCl', pbs:'PBS 1× (pH 7,4)', tbs:'TBS 1× (pH 7,6)',
  tbst:'TBS-T 1× (0,1% Tween 20)', te:'TE-buffer (pH 8,0)', tbe10:'TBE 10×', tae50:'TAE 50×',
  ssc20:'SSC 20× (pH 7,0)', laemmli10:'Tris-glycine-SDS loopbuffer 10×',
  towbin:'Towbin-blotbuffer 1×', carbonaat:'Carbonaatbuffer 50 mM (pH 9,6, ELISA)',
  citraat:'Citraatbuffer 10 mM (pH 6,0)', fosfaat:'Fosfaatbuffer 0,1 M (pH 7,0)',
  lb:'LB-medium (Miller)', lbagar:'LB-agar (Miller)', soc:'SOC-medium', leeg:'Leeg recept'
};
/* extra stap: pH bijstellen, een vloeistof toevoegen of steriliseren */
const PH={
  trisnacl:'Stel de pH in (bijv. 7,6) met HCl vóór het aanvullen.',
  pbs:'Stel de pH in op 7,4 met HCl vóór het aanvullen.',
  tbs:'Stel de pH in op 7,6 met HCl vóór het aanvullen.',
  tbst:'Stel de pH in op 7,6 met HCl en voeg de Tween 20 daarna toe; roer langzaam, want Tween schuimt.',
  te:'Stel de pH in op 8,0 met HCl vóór het aanvullen.',
  tbe10:'pH niet bijstellen; verdun 1:10 voor gebruik.',
  tae50:'Voeg per liter 57,1 mL ijsazijn toe en stel daarna de pH in op 8,0 (of gebruik 100 mL 0,5 M EDTA pH 8,0 in plaats van het vaste EDTA). Verdun 1:50 voor gebruik.',
  ssc20:'Stel de pH in op 7,0 met een paar druppels 1 M HCl; verdun voor gebruik.',
  laemmli10:'pH niet bijstellen (die komt op ongeveer 8,3 uit); verdun 1:10 voor gebruik en voeg de SDS pas na het oplossen van de rest toe.',
  towbin:'Voeg per liter 200 mL methanol toe en vul aan met water; pH niet bijstellen (ongeveer 8,3). Koel de buffer voor het blotten.',
  carbonaat:'Controleer de pH (ongeveer 9,6) en stel bij met 1 M NaOH of 1 M HCl; maak de buffer vers, want hij neemt CO₂ op.',
  citraat:'Stel de pH in op 6,0 met 1 M HCl. Voor antigeenontmaskering kun je 0,05% Tween 20 toevoegen.',
  fosfaat:'Controleer de pH met een pH-meter en stel bij met de twee zouten; de verhouding hangt af van de schijnbare pKₐ bij jouw ionsterkte. Reken de verhouding zelf na met de pH-buffer-tool.',
  lb:'Autoclaveer 15 minuten op 121 °C. Voeg antibiotica pas toe als het medium onder de 50 °C is.',
  lbagar:'Autoclaveer 15 minuten op 121 °C, laat afkoelen tot ongeveer 50 °C, voeg dan antibiotica toe en giet de platen uit.',
  soc:'Autoclaveer zonder de glucose, laat afkoelen en voeg de glucose steriel gefiltreerd toe (20 mL 1 M per liter). Niet autoclaveren met glucose erin: die karameliseert.'
};
/* waar de samenstelling uit komt */
const RECSRC={
  trisnacl:'Standaard Tris-zoutbuffer; molmassa Tris 121,14 g/mol (Sigma-Aldrich productblad).',
  pbs:'Cold Spring Harbor Protocols, "Phosphate-buffered saline (PBS)": 8 g NaCl, 0,2 g KCl, 1,44 g Na₂HPO₄ en 0,24 g KH₂PO₄ per liter.',
  tbs:'Cold Spring Harbor Protocols, "Tris-buffered saline (TBS)": 20 mM Tris, 150 mM NaCl, pH 7,6.',
  tbst:'Zoals TBS, met 0,1% (v/v) Tween 20 als waskbuffer voor western blots (Towbin e.a., PNAS 76:4350–4354, 1979, en latere blotprotocollen).',
  te:'Sambrook & Russell, Molecular Cloning (3e druk), Appendix 1: 10 mM Tris-HCl pH 8,0 met 1 mM EDTA.',
  tbe10:'Bio-Rad Bulletin 6205: 108 g Tris en 55 g boorzuur per liter 10× TBE, met 20 mM EDTA.',
  tae50:'Sambrook & Russell, Molecular Cloning (3e druk), Appendix 1: 242 g Tris-base, 57,1 mL ijsazijn en 100 mL 0,5 M EDTA pH 8,0 per liter 50× TAE.',
  ssc20:'Sambrook & Russell, Molecular Cloning (3e druk), Appendix 1: 175,3 g NaCl en 88,2 g natriumcitraat per liter 20× SSC, pH 7,0.',
  laemmli10:'Laemmli, Nature 227:680–685 (1970), als 10× voorraad: 30,3 g Tris, 144 g glycine en 10 g SDS per liter; 1× is 25 mM Tris, 192 mM glycine en 0,1% SDS.',
  towbin:'Towbin, Staehelin & Gordon, PNAS 76:4350–4354 (1979): 25 mM Tris, 192 mM glycine en 20% methanol.',
  carbonaat:'Crowther, The ELISA Guidebook: coatingbuffer 50 mM carbonaat-bicarbonaat pH 9,6, oftewel 1,59 g Na₂CO₃ en 2,93 g NaHCO₃ per liter.',
  citraat:'Gangbare citraatbuffer voor antigeenontmaskering: 10 mM natriumcitraat pH 6,0 (Shi, Key & Kalra, J Histochem Cytochem 39:741–748, 1991).',
  fosfaat:'Sörensen-fosfaatbuffer, zoals getabelleerd in Dawson e.a., Data for Biochemical Research: 0,1 M fosfaat pH 7,0 ligt rond 61 mM Na₂HPO₄ en 39 mM NaH₂PO₄.',
  lb:'Miller, Experiments in Molecular Genetics (1972): 10 g trypton, 5 g gistextract en 10 g NaCl per liter. De variant van Lennox (Virology 1:190–206, 1955) heeft 5 g NaCl.',
  lbagar:'LB volgens Miller met 15 g agar per liter (Sambrook & Russell, Molecular Cloning, 3e druk).',
  soc:'Hanahan, J Mol Biol 166:557–580 (1983): 2% trypton, 0,5% gistextract, 10 mM NaCl, 2,5 mM KCl, 10 mM MgCl₂, 10 mM MgSO₄ en 20 mM glucose.'
};
/* hoe je het steriel krijgt, of waarom je dat juist niet zo doet (S39) */
const RECSTER={
  trisnacl:'Autoclaveerbaar: 15 minuten op 121 °C.',
  pbs:'Autoclaveerbaar: 15 minuten op 121 °C. Fosfaatzouten kunnen bij het autoclaveren uitzakken; schud de fles na het afkoelen.',
  tbs:'Autoclaveerbaar: 15 minuten op 121 °C.',
  tbst:'Niet autoclaveren: Tween 20 breekt af bij hitte. Maak de buffer vers, of autoclaveer de TBS en voeg de Tween daarna toe.',
  te:'Autoclaveerbaar: 15 minuten op 121 °C.',
  tbe10:'Autoclaveerbaar, maar niet nodig: bewaar de 10× voorraad bij kamertemperatuur en gooi hem weg als er kristallen of troebeling in zitten.',
  tae50:'Autoclaveren is niet nodig. Voeg de ijsazijn toe in een zuurkast en autoclaveer die niet mee.',
  ssc20:'Autoclaveerbaar: 15 minuten op 121 °C.',
  laemmli10:'Niet autoclaveren: SDS schuimt over en is hier niet nodig. Bewaar bij kamertemperatuur, want SDS slaat in de kou uit.',
  towbin:'Nooit autoclaveren: methanol is brandbaar. Maak de buffer vers en bewaar hem gekoeld en gesloten.',
  carbonaat:'Niet autoclaveren: de buffer verliest CO₂ en de pH loopt op. Filtreer steriel over 0,22 µm als het steriel moet, en maak hem anders vers.',
  citraat:'Autoclaveerbaar: 15 minuten op 121 °C. Voeg Tween 20 pas daarna toe.',
  fosfaat:'Autoclaveerbaar: 15 minuten op 121 °C; controleer de pH daarna nog een keer.',
  lb:'Autoclaveer 15 minuten op 121 °C. Antibiotica zijn hittelabiel: die gaan er pas in onder de 50 °C, steriel gefiltreerd over 0,22 µm.',
  lbagar:'Autoclaveer 15 minuten op 121 °C. Laat afkoelen tot ongeveer 50 °C voordat je antibiotica toevoegt en de platen uitgiet; warmer breekt het antibioticum af, kouder begint de agar al te stijven.',
  soc:'Autoclaveer het medium zonder de glucose. Voeg de glucose daarna toe als steriel gefiltreerde 1 M oplossing: bij autoclaveren karameliseert hij en reageert hij met de aminozuren.'
};
const RECKEYS=['trisnacl','pbs','tbs','tbst','te','tbe10','tae50','ssc20','laemmli10','towbin',
  'carbonaat','citraat','fosfaat','lb','lbagar','soc','leeg'];
