// Generates Kipstay's original listing artwork as deterministic SVG scenes.
// Usage: node scripts/generate-art.mjs  → public/images/listings/<scene>-<n>.svg
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "images", "listings");
const W = 800;
const H = 600;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SKIES = [
  ["#7dd3fc", "#e0f2fe"],
  ["#fdba74", "#fef3c7"],
  ["#a5b4fc", "#fce7f3"],
  ["#5eead4", "#ecfeff"],
  ["#fca5a5", "#fde68a"],
];

const svg = (body, sky) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>${body}</svg>`;

const sun = (r, x, y, c = "#fde047") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="0.9"/>`;

function hills(r, base, colors) {
  return colors
    .map((c, i) => {
      const y = base + i * 45;
      const a = 30 + r() * 60;
      const p = 200 + r() * 300;
      let d = `M0 ${H} L0 ${y}`;
      for (let x = 0; x <= W; x += 40) d += ` L${x} ${(y + Math.sin((x + r() * 20) / p * Math.PI * 2) * a).toFixed(1)}`;
      return `<path d="${d} L${W} ${H} Z" fill="${c}"/>`;
    })
    .join("");
}

function house(x, y, s, wall, roof) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
<rect x="0" y="40" width="120" height="80" fill="${wall}"/>
<polygon points="-10,44 60,-10 130,44" fill="${roof}"/>
<rect x="48" y="78" width="24" height="42" fill="#78350f"/>
<rect x="14" y="58" width="22" height="20" fill="#fef9c3"/><rect x="84" y="58" width="22" height="20" fill="#fef9c3"/></g>`;
}

function palm(x, y, s) {
  const leaves = [-70, -35, 0, 35, 70, 110, -110]
    .map((a) => `<ellipse cx="0" cy="-60" rx="12" ry="60" fill="#15803d" transform="rotate(${a})"/>`)
    .join("");
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 Q 10 -100 0 -190" stroke="#92400e" stroke-width="14" fill="none"/><g transform="translate(0 -190)">${leaves}</g></g>`;
}

function pine(x, y, s, c = "#166534") {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-5" y="0" width="10" height="20" fill="#713f12"/><polygon points="0,-90 -32,0 32,0" fill="${c}"/></g>`;
}

const SCENES = {
  beach(r, sky) {
    return svg(
      sun(50 + r() * 20, 150 + r() * 500, 120 + r() * 60) +
        `<rect y="330" width="${W}" height="140" fill="#0ea5e9"/><rect y="330" width="${W}" height="10" fill="#bae6fd" opacity=".7"/>` +
        `<path d="M0 450 Q 400 400 800 460 L800 600 L0 600 Z" fill="#fde68a"/>` +
        palm(120 + r() * 80, 520, 1) +
        palm(650 + r() * 60, 540, 0.8) +
        house(330 + r() * 80, 380, 0.9, "#fff7ed", "#0f766e"),
      sky,
    );
  },
  mountains(r, sky) {
    const peaks = [0, 1, 2]
      .map((i) => {
        const x = 120 + i * 260 + r() * 60;
        const h = 220 + r() * 120;
        return `<polygon points="${x - 220},460 ${x},${460 - h} ${x + 220},460" fill="${["#64748b", "#475569", "#334155"][i]}"/><polygon points="${x - 50},${460 - h + 60} ${x},${460 - h} ${x + 50},${460 - h + 60}" fill="#f8fafc"/>`;
      })
      .join("");
    const trees = Array.from({ length: 9 }, (_, i) => pine(40 + i * 90 + r() * 30, 520 + r() * 30, 0.8 + r() * 0.5)).join("");
    return svg(sun(40, 650, 110, "#fef08a") + peaks + hills(r, 470, ["#4d7c0f", "#3f6212"]) + house(300 + r() * 150, 430, 0.8, "#a16207", "#7c2d12") + trees, sky);
  },
  city(r, sky) {
    let b = "";
    for (let x = 0; x < W; x += 60 + Math.floor(r() * 30)) {
      const w = 50 + r() * 40;
      const h = 150 + r() * 280;
      const c = ["#1e293b", "#334155", "#0f172a", "#475569"][Math.floor(r() * 4)];
      b += `<rect x="${x}" y="${H - h}" width="${w}" height="${h}" fill="${c}"/>`;
      for (let wy = H - h + 15; wy < H - 20; wy += 28)
        for (let wx = x + 8; wx < x + w - 12; wx += 16) if (r() > 0.45) b += `<rect x="${wx}" y="${wy}" width="8" height="12" fill="#fde68a" opacity=".85"/>`;
    }
    return svg(sun(45, 120 + r() * 560, 110, "#fef3c7") + b, sky);
  },
  countryside(r, sky) {
    const trees = Array.from({ length: 5 }, () => `<circle cx="${r() * W}" cy="${400 + r() * 40}" r="${24 + r() * 18}" fill="#15803d"/>`).join("");
    return svg(sun(55, 620, 120) + hills(r, 360, ["#a3e635", "#65a30d", "#4d7c0f"]) + trees + house(250 + r() * 250, 330, 1, "#fef3c7", "#b91c1c"), sky);
  },
  lakefront(r, sky) {
    const trees = Array.from({ length: 12 }, (_, i) => pine(i * 72 + r() * 20, 340, 0.6 + r() * 0.6, "#14532d")).join("");
    return svg(
      sun(45, 200 + r() * 400, 120) +
        hills(r, 300, ["#3f6212"]) +
        trees +
        `<rect y="345" width="${W}" height="${H - 345}" fill="#0284c7"/><rect y="345" width="${W}" height="255" fill="url(#sky)" opacity=".25"/>` +
        `<rect x="${430 + r() * 80}" y="360" width="160" height="10" fill="#78350f"/>` +
        house(80 + r() * 120, 230, 0.9, "#e7e5e4", "#1e3a8a"),
      sky,
    );
  },
  desert(r, sky) {
    return svg(
      sun(70, 400 + r() * 200, 170, "#fb923c") +
        hills(r, 380, ["#fdba74", "#f59e0b", "#d97706"]) +
        `<g transform="translate(${150 + r() * 100} 470)"><rect x="-8" y="-90" width="16" height="90" rx="8" fill="#166534"/><rect x="-30" y="-60" width="12" height="40" rx="6" fill="#166534"/><rect x="18" y="-70" width="12" height="35" rx="6" fill="#166534"/></g>` +
        house(470 + r() * 120, 390, 0.85, "#fed7aa", "#9a3412"),
      sky,
    );
  },
  tropical(r, sky) {
    const palms = Array.from({ length: 4 }, (_, i) => palm(80 + i * 200 + r() * 50, 560, 0.7 + r() * 0.5)).join("");
    return svg(sun(50, 640, 110) + hills(r, 380, ["#22c55e", "#16a34a", "#15803d"]) + house(300 + r() * 120, 400, 1, "#ecfccb", "#0f766e") + palms, sky);
  },
  // Interior shots shared by every listing.
  bedroom(r) {
    const wall = ["#f5f5f4", "#fef3c7", "#e0f2fe", "#ecfccb"][Math.floor(r() * 4)];
    const bed = ["#0f766e", "#1d4ed8", "#be123c", "#7c3aed"][Math.floor(r() * 4)];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${wall}"/><rect y="430" width="${W}" height="170" fill="#d6d3d1"/>
<rect x="520" y="90" width="200" height="170" fill="#7dd3fc" stroke="#fff" stroke-width="12"/><line x1="620" y1="90" x2="620" y2="260" stroke="#fff" stroke-width="8"/>
<rect x="140" y="300" width="340" height="150" rx="14" fill="#fafaf9"/><rect x="140" y="360" width="340" height="90" rx="10" fill="${bed}"/>
<rect x="160" y="310" width="130" height="50" rx="16" fill="#fff"/><rect x="330" y="310" width="130" height="50" rx="16" fill="#fff"/>
<rect x="130" y="250" width="360" height="60" rx="10" fill="#a8a29e"/>
<rect x="520" y="370" width="70" height="80" fill="#a16207"/><polygon points="535,300 575,300 590,340 520,340" fill="#fde68a"/><rect x="552" y="340" width="6" height="30" fill="#57534e"/>
</svg>`;
  },
  living(r) {
    const wall = ["#fafaf9", "#f0fdfa", "#fff7ed", "#f5f3ff"][Math.floor(r() * 4)];
    const sofa = ["#0f766e", "#b45309", "#334155", "#9f1239"][Math.floor(r() * 4)];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${wall}"/><rect y="440" width="${W}" height="160" fill="#a8a29e"/>
<rect x="90" y="80" width="260" height="200" fill="#bae6fd" stroke="#fff" stroke-width="12"/>
<rect x="420" y="120" width="120" height="90" fill="#fca5a5"/><rect x="560" y="140" width="90" height="70" fill="#86efac"/>
<rect x="120" y="330" width="420" height="120" rx="24" fill="${sofa}"/><rect x="100" y="360" width="60" height="100" rx="20" fill="${sofa}"/><rect x="500" y="360" width="60" height="100" rx="20" fill="${sofa}"/>
<ellipse cx="400" cy="520" rx="220" ry="30" fill="#e7e5e4"/><rect x="300" y="470" width="200" height="20" rx="6" fill="#78350f"/>
<rect x="640" y="250" width="16" height="200" fill="#57534e"/><circle cx="648" cy="240" r="40" fill="#16a34a"/>
</svg>`;
  },
  kitchen(r) {
    const cab = ["#0f766e", "#e7e5e4", "#1e3a8a", "#fef3c7"][Math.floor(r() * 4)];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#fafaf9"/><rect y="470" width="${W}" height="130" fill="#d6d3d1"/>
<rect x="60" y="80" width="680" height="110" fill="${cab}"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${70 + i * 134}" y="90" width="124" height="90" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4"/>`).join("")}
<rect x="60" y="250" width="680" height="40" fill="#78716c"/><rect x="60" y="290" width="680" height="180" fill="${cab}"/>
<rect x="300" y="200" width="200" height="50" fill="#94a3b8"/><circle cx="560" cy="240" r="18" fill="#ef4444"/><rect x="140" y="215" width="60" height="35" rx="6" fill="#fde68a"/>
</svg>`;
  },
  bathroom(r) {
    const tile = ["#ccfbf1", "#e0e7ff", "#fef9c3", "#f5f5f4"][Math.floor(r() * 4)];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${tile}"/>${Array.from({ length: 10 }, (_, i) => `<line x1="${i * 80}" y1="0" x2="${i * 80}" y2="${H}" stroke="#fff" stroke-width="3"/>`).join("")}
<rect y="470" width="${W}" height="130" fill="#e7e5e4"/><rect x="90" y="330" width="380" height="150" rx="60" fill="#fff"/>
<rect x="560" y="300" width="140" height="180" fill="#a16207"/><ellipse cx="630" cy="300" rx="80" ry="18" fill="#fff"/>
<ellipse cx="630" cy="160" rx="70" ry="90" fill="#e0f2fe" stroke="#d6d3d1" stroke-width="8"/>
</svg>`;
  },
};

mkdirSync(OUT, { recursive: true });
const exteriors = ["beach", "mountains", "city", "countryside", "lakefront", "desert", "tropical"];
let n = 0;
for (const scene of exteriors) {
  for (let v = 1; v <= 4; v++) {
    const r = rng(scene.length * 1000 + v * 77);
    writeFileSync(join(OUT, `${scene}-${v}.svg`), SCENES[scene](r, SKIES[(v + scene.length) % SKIES.length]));
    n++;
  }
}
for (const scene of ["bedroom", "living", "kitchen", "bathroom"]) {
  for (let v = 1; v <= 4; v++) {
    writeFileSync(join(OUT, `${scene}-${v}.svg`), SCENES[scene](rng(scene.length * 31 + v * 13)));
    n++;
  }
}
console.log(`Wrote ${n} images to ${OUT}`);
