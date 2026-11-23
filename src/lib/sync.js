/* Eén bench-run delen tussen twee apparaten over WebRTC (S61), zonder server.
   Signalering met de hand: het aanbod (LK1:) en het antwoord (LK2:) gaan als QR-code of geplakte tekst
   van het ene naar het andere apparaat. Geen STUN/TURN, dus er gaat niets naar een host buiten het
   eigen netwerk; daardoor werkt het alleen als beide apparaten op hetzelfde netwerk zitten.
   Code = 'LK1:' of 'LK2:' + 'z' (deflate-raw) of 'p' (ongecomprimeerd) + base64url van de SDP. */

export const SYNC_IMG_MAX = 200000;   /* foto's in notities boven ~200 kB gaan niet mee */

const b64u = u8 => { let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const pipe = async (u8, T) => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new T('deflate-raw'))).arrayBuffer());

/* regels die een datakanaal niet nodig heeft, weg voor een kleinere QR-code */
export const slimSdp = sdp => sdp.replace(/^a=(extmap-allow-mixed|msid-semantic:.*|ice-options:.*)\r?\n/gm, '').replace(/ generation \d+( network-id \d+)?( network-cost \d+)?/g, '');

export async function encodeDesc({type, sdp}) {
  const raw = new TextEncoder().encode(slimSdp(sdp)), z = typeof CompressionStream === 'function';
  return (type === 'offer' ? 'LK1:' : 'LK2:') + (z ? 'z' : 'p') + b64u(z ? await pipe(raw, CompressionStream) : raw);
}

export async function decodeDesc(code) {
  const m = /^LK([12]):([zp])([A-Za-z0-9_-]+)$/.exec(String(code).replace(/\s+/g, ''));
  if (!m) throw new Error('geen koppelcode');
  const u8 = unb64u(m[3]);
  return {type: m[1] === '1' ? 'offer' : 'answer', sdp: new TextDecoder().decode(m[2] === 'z' ? await pipe(u8, DecompressionStream) : u8)};
}

/* laatste schrijver wint: een hogere versie, bij gelijke versie het hoogste peer-id */
export const newer = (a, b) => a.v > b.v || (a.v === b.v && a.id > b.id);

/* foto's die te groot zijn om mee te sturen weglaten (de notitie gaat wel mee, met big: 1) */
export const slimNotes = notes => notes.map(n => n.img && n.img.length > SYNC_IMG_MAX ? {...n, img: '', big: 1} : n);

/* een binnengekomen notitie zonder foto die hier wel een foto heeft (zelfde tijdstempel), houdt de eigen versie */
export const keepImgs = (incoming, local) => incoming.map(n => { const m = !n.img && local.find(l => l.t === n.t); return m && m.img ? m : n; });

/* De verbinding: één geordend datakanaal. Berichten zijn JSON, in stukken van 16 000 tekens
   ('+' = er komt nog meer, '.' = laatste stuk), want een kanaal neemt geen berichten van honderden kB. */
export function peer(onMsg, onState) {
  const pc = new RTCPeerConnection({iceServers: []});
  let dc = null, buf = '';
  const bind = ch => {
    dc = ch;
    ch.onopen = () => onState('open');
    ch.onclose = () => onState('lost');
    ch.onmessage = e => { buf += e.data.slice(1); if (e.data[0] === '.') { const s = buf; buf = ''; try { onMsg(JSON.parse(s)); } catch (err) {} } };
  };
  pc.ondatachannel = e => bind(e.channel);
  pc.onconnectionstatechange = () => {
    if (/failed|disconnected|closed/.test(pc.connectionState)) onState('lost');
    else if (pc.connectionState === 'connected' && dc && dc.readyState === 'open') onState('open');
  };
  /* geen trickle ICE: wachten tot alle kandidaten in de beschrijving staan (hooguit 4 s) */
  const local = async () => {
    await new Promise(r => {
      if (pc.iceGatheringState === 'complete') return r();
      const to = setTimeout(r, 4000);
      pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(to); r(); } });
    });
    return encodeDesc(pc.localDescription);
  };
  return {
    async offer() { bind(pc.createDataChannel('lk')); await pc.setLocalDescription(await pc.createOffer()); return local(); },
    async answer(code) {
      const d = await decodeDesc(code); if (d.type !== 'offer') throw new Error('geen aanbod');
      await pc.setRemoteDescription(d); await pc.setLocalDescription(await pc.createAnswer()); return local();
    },
    async finish(code) { const d = await decodeDesc(code); if (d.type !== 'answer') throw new Error('geen antwoord'); await pc.setRemoteDescription(d); },
    send(obj) {
      if (!dc || dc.readyState !== 'open') return;
      const s = JSON.stringify(obj);
      for (let k = 0; k < s.length; k += 16000) dc.send((k + 16000 >= s.length ? '.' : '+') + s.slice(k, k + 16000));
    },
    close() { try { pc.close(); } catch (e) {} },
  };
}
