import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeDesc, decodeDesc, newer, slimNotes, keepImgs, SYNC_IMG_MAX} from '../../src/lib/sync.js';

const SDP = 'v=0\r\no=- 4611731400430051336 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=candidate:1 1 udp 2113937151 192.168.1.20 54400 typ host\r\na=ice-ufrag:abcd\r\na=ice-pwd:0123456789abcdefghijklmn\r\na=fingerprint:sha-256 AB:CD:EF\r\na=setup:actpass\r\na=mid:0\r\na=sctp-port:5000\r\n';

test('koppelcode: heen en terug geeft dezelfde beschrijving', async () => {
  for (const type of ['offer', 'answer']) {
    const code = await encodeDesc({type, sdp: SDP});
    assert.match(code, type === 'offer' ? /^LK1:z[A-Za-z0-9_-]+$/ : /^LK2:z[A-Za-z0-9_-]+$/);
    assert.deepEqual(await decodeDesc(code), {type, sdp: SDP});
    assert.deepEqual(await decodeDesc(' ' + code.slice(0, 20) + '\n' + code.slice(20) + ' '), {type, sdp: SDP});   // geplakt met witruimte
  }
  const plain = 'LK1:p' + Buffer.from(SDP).toString('base64url');   // zonder CompressionStream
  assert.deepEqual(await decodeDesc(plain), {type: 'offer', sdp: SDP});
  const extra = SDP.replace('a=group:BUNDLE 0\r\n', 'a=group:BUNDLE 0\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS\r\n').replace('typ host', 'typ host generation 0 network-cost 999') + 'a=ice-options:trickle\r\n';
  assert.equal((await decodeDesc(await encodeDesc({type: 'offer', sdp: extra}))).sdp, SDP);   // overbodige regels gaan eruit
  await assert.rejects(decodeDesc('hallo'));
  await assert.rejects(decodeDesc('LK3:zabc'));
});

test('samenvoegen: laatste schrijver wint, gelijke versie naar het hoogste id', () => {
  assert.equal(newer({v: 3, id: 0.1}, {v: 2, id: 0.9}), true);
  assert.equal(newer({v: 2, id: 0.9}, {v: 3, id: 0.1}), false);
  assert.equal(newer({v: 3, id: 0.7}, {v: 3, id: 0.2}), true);
  assert.equal(newer({v: 3, id: 0.2}, {v: 3, id: 0.7}), false);
  assert.equal(newer({v: 3, id: 0.2}, {v: 3, id: 0.2}), false);   // eigen bericht niet opnieuw
  // beide kanten passen dezelfde regel toe en komen op dezelfde winnaar uit
  const a = {v: 4, id: 0.3}, b = {v: 4, id: 0.6};
  assert.equal(newer(b, a) && !newer(a, b), true);
});

test('notities: te grote foto gaat niet mee en komt bij terugsturen niet kwijt', () => {
  const big = 'data:image/jpeg;base64,' + 'A'.repeat(SYNC_IMG_MAX), small = 'data:image/jpeg;base64,AAAA';
  const local = [{t: 1, text: 'a', img: big}, {t: 2, text: 'b', img: small}];
  const sent = slimNotes(local);
  assert.deepEqual(sent[0], {t: 1, text: 'a', img: '', big: 1});
  assert.equal(sent[1], local[1]);
  // de andere kant stuurt de lijst terug, met een nieuwe notitie erbij
  const back = keepImgs([...sent, {t: 3, text: 'c', img: ''}], local);
  assert.equal(back[0], local[0]);
  assert.equal(back[1].img, small);
  assert.deepEqual(back[2], {t: 3, text: 'c', img: ''});
});
