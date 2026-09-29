// Synthesises the UI sound sprite (spec 40) — original, procedurally generated audio (CC0).
// Output: public/sounds/ui.wav + src/lib/sound-sprite.json. Run: pnpm sounds
import { writeFileSync } from 'node:fs';

const RATE = 22050;
const GAP = 0.05;

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

const sounds = {
  // soft film-advance click
  tick: [0.06, (t) => (rnd() * 0.5 + Math.sin(2 * Math.PI * 2400 * t) * 0.5) * env(t, 0.001, 0.008) * 0.7],
  press: [0.09, (t) => Math.sin(2 * Math.PI * (320 - 900 * t) * t) * env(t, 0.002, 0.03) * 0.8],
  whoosh: [0.3, (() => { let lp = 0; return (t) => { lp += (rnd() - lp) * (0.04 + 0.25 * Math.sin(Math.PI * t / 0.3)); return lp * Math.sin(Math.PI * t / 0.3) * 1.6; }; })()],
  pop: [0.14, (t) => Math.sin(2 * Math.PI * (500 + 700 * Math.min(1, t * 20)) * t) * env(t, 0.003, 0.04) * 0.8],
  // projector hum (loops) — 50Hz motor + shutter flutter + mechanism noise
  projector: [2.0, (t) => (Math.sin(2 * Math.PI * 50 * t) * 0.25 + Math.sin(2 * Math.PI * 100 * t) * 0.12 + rnd() * 0.05) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 24 * t)) * 0.6],
  error: [0.22, (t) => (Math.sin(2 * Math.PI * 180 * t) + Math.sin(2 * Math.PI * 187 * t)) * 0.35 * env(t, 0.005, 0.07) * (t % 0.1 < 0.07 ? 1 : 0.2)],
  toggle: [0.07, (t) => Math.sin(2 * Math.PI * (t < 0.03 ? 1200 : 1600) * t) * env(t % 0.035, 0.001, 0.01) * 0.6],
};

const sprite = {};
const chunks = [];
let offset = 0;
for (const [name, [dur, fn]] of Object.entries(sounds)) {
  const n = Math.floor(dur * RATE);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const fade = Math.min(1, i / 40, (n - i) / 40); // de-click
    buf[i] = Math.max(-1, Math.min(1, fn(t) * fade));
  }
  sprite[name] = [Math.round(offset * 1000), Math.round(dur * 1000)];
  chunks.push(buf, new Float32Array(Math.floor(GAP * RATE)));
  offset += dur + Math.floor(GAP * RATE) / RATE;
}

const total = chunks.reduce((a, c) => a + c.length, 0);
const data = Buffer.alloc(total * 2);
let p = 0;
for (const c of chunks) for (const s of c) { data.writeInt16LE(Math.round(s * 32767), p); p += 2; }
const header = Buffer.alloc(44);
header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8);
header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
header.writeUInt32LE(RATE, 24); header.writeUInt32LE(RATE * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
header.write('data', 36); header.writeUInt32LE(data.length, 40);
writeFileSync('public/sounds/ui.wav', Buffer.concat([header, data]));
writeFileSync('src/lib/sound-sprite.json', JSON.stringify(sprite, null, 2) + '\n');
console.log('wrote public/sounds/ui.wav', sprite);
