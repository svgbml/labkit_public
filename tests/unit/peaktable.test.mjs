import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePeakTable, sketchPeaks} from '../../src/lib/peaktable.js';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

test('Agilent-achtig, puntkomma en decimale komma, met titelregel en totaalrij', () => {
  const t = 'Signal 1: DAD1A\nPeak;RetTime [min];Type;Width [min];Area;Height;Area %\n1;2,851;BB;0,075;12,5;1,2;20\n2;4,95;BB;0,110;50,0;3,9;80\nTotal;;;;62,5;;100';
  const r = parsePeakTable(t).peaks;
  assert.equal(r.length, 2);
  assert.equal(r[0].name, '1'); near(r[0].rt, 2.851); near(r[0].width, 0.075); assert.equal(r[0].wkind, 'b'); near(r[1].area, 50);
});

test('Shimadzu-achtig, tabs, naamkolom en breedte op halve hoogte', () => {
  const t = 'Peak#\tName\tR.Time\tArea\tHeight\tW.50\n1\tCaffeine\t4.95\t1200\t300\t0.11\n2\tTheobromine\t2.85\t800\t250\t0.075';
  const r = parsePeakTable(t).peaks;
  assert.equal(r[0].name, 'Caffeine'); assert.equal(r[0].wkind, 'h'); near(r[1].rt, 2.85);
});

test('Waters-achtig, komma-gescheiden, zonder breedte: breedte uit oppervlakte en hoogte', () => {
  const t = 'Name,Retention Time,Area,Height\n"Aspirin",3.20,1000,200';
  const p = parsePeakTable(t).peaks[0];
  assert.equal(p.name, 'Aspirin'); assert.equal(p.wkind, 'h');
  near(p.width, 2.3548 * 1000 / (200 * Math.sqrt(2 * Math.PI)), 1e-9);   // sigma = A/(H√2π) = 1,9947
  const s = sketchPeaks([p]); near(s[0].amp, 1); near(s[0].sigma, 1000 / (200 * Math.sqrt(2 * Math.PI)), 1e-9);
});

test('geen retentietijd-kolom geeft null', () => {
  assert.equal(parsePeakTable('a;b\n1;2'), null);
});
