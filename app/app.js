// =========================================================
//  Båtføreprøven — quizmotor (prototype, statisk)
//  Data-drevet: bytt ut SAMPLE med /data/questions.json senere.
// =========================================================

// ---- Maritime SVG-illustrasjoner (felles stil) ----------
// Konsekvent: marineblå linjer, messing-aksent, sjøgrønne høylys.

const compassWatermark = `
  <g opacity="0.10" stroke="#0c2a40" stroke-width="1.2" fill="none">
    <circle cx="50" cy="30" r="13"/>
    <path d="M50 15 L52 30 L50 45 L48 30 Z" fill="#0c2a40" stroke="none"/>
    <path d="M35 30 L50 28 L65 30 L50 32 Z" fill="#0c2a40" stroke="none"/>
  </g>`;

function sceneBoat() {
  return `
  <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" role="img">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cfe7ef"/><stop offset="1" stop-color="#9ccadb"/>
      </linearGradient>
    </defs>
    <rect width="100" height="42" fill="url(#sky)"/>
    <circle cx="78" cy="14" r="7" fill="#e9d39b" opacity="0.85"/>
    ${compassWatermark}
    <!-- sjø -->
    <rect y="42" width="100" height="58" fill="#15526e"/>
    <!-- båt -->
    <g stroke="#0c2a40" stroke-width="1.4" stroke-linejoin="round">
      <path d="M52 26 L52 41 L40 41 Q46 30 52 26 Z" fill="#f6f1e7"/>
      <path d="M54 26 L66 40 L54 40 Z" fill="#c79a4b"/>
      <line x1="53" y1="22" x2="53" y2="41"/>
      <path d="M37 41 L67 41 L63 48 L41 48 Z" fill="#103a57"/>
    </g>
    <!-- bølger + speiling -->
    <g stroke="#4a97b3" stroke-width="1.2" fill="none" opacity="0.8">
      <path d="M0 54 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0"/>
      <path d="M0 64 q10 4 20 0 t20 0 t20 0 t20 0 t20 0"/>
      <path d="M0 76 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0"/>
    </g>
    <g stroke="#0c2a40" stroke-width="1" opacity="0.25">
      <line x1="46" y1="50" x2="46" y2="60"/><line x1="58" y1="50" x2="58" y2="58"/>
    </g>
  </svg>`;
}

function sceneLantern() {
  return `
  <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" role="img">
    <rect width="100" height="100" fill="#06192a"/>
    <circle cx="20" cy="16" r="0.8" fill="#cdd9e0"/><circle cx="74" cy="12" r="0.7" fill="#cdd9e0"/>
    <circle cx="88" cy="24" r="0.6" fill="#cdd9e0"/><circle cx="40" cy="9" r="0.6" fill="#cdd9e0"/>
    <!-- båt forfra i mørke -->
    <g stroke="#16334a" stroke-width="1.4" fill="#0c2334">
      <path d="M34 60 L66 60 L61 70 L39 70 Z"/>
      <line x1="50" y1="40" x2="50" y2="60" stroke="#16334a"/>
    </g>
    <!-- lanterner: babord rød, styrbord grønn, topp hvit -->
    <g>
      <circle cx="38" cy="58" r="3.2" fill="#e0533f"/><circle cx="38" cy="58" r="6" fill="#e0533f" opacity="0.18"/>
      <circle cx="62" cy="58" r="3.2" fill="#2fae6b"/><circle cx="62" cy="58" r="6" fill="#2fae6b" opacity="0.18"/>
      <circle cx="50" cy="40" r="2.6" fill="#f4ead0"/><circle cx="50" cy="40" r="6" fill="#f4ead0" opacity="0.15"/>
    </g>
    <g stroke="#0e2b40" stroke-width="1" fill="none" opacity="0.7">
      <path d="M0 78 q12 -3 24 0 t24 0 t24 0 t24 0"/>
      <path d="M0 88 q12 3 24 0 t24 0 t24 0 t24 0"/>
    </g>
  </svg>`;
}

function sceneBuoy(kind = "lateral-red") {
  const red = kind === "lateral-red";
  const body = red ? "#c0392b" : "#1f7a3d";
  return `
  <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" role="img">
    <rect width="100" height="42" fill="#cfe7ef"/>
    ${compassWatermark}
    <rect y="42" width="100" height="58" fill="#15526e"/>
    <!-- merke -->
    <g stroke="#0c2a40" stroke-width="1.3" stroke-linejoin="round">
      <rect x="45" y="30" width="10" height="16" fill="${body}"/>
      <path d="M45 30 L55 30 L50 20 Z" fill="${body}"/>
      <rect x="46" y="46" width="8" height="6" fill="#1a1a1a"/>
    </g>
    <g stroke="#4a97b3" stroke-width="1.2" fill="none" opacity="0.85">
      <path d="M0 56 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0"/>
      <path d="M0 68 q10 4 20 0 t20 0 t20 0 t20 0 t20 0"/>
    </g>
  </svg>`;
}

const SCENES = {
  boat: sceneBoat,
  lantern: sceneLantern,
  buoyRed: () => sceneBuoy("lateral-red"),
  buoyGreen: () => sceneBuoy("lateral-green"),
};

// ---- Moduler / ressurser (sidemeny) ---------------------
const MODULES = [
  { id: "sjomannskap", label: "Sjømannskap" },
  { id: "lover", label: "Lover og regler" },
  { id: "navigasjon", label: "Navigasjon og kart" },
  { id: "spesielt", label: "Spesielt viktige emner" },
];

const RESOURCES = [
  { label: "Sjøfartsdirektoratet — pensum", url: "https://www.sdir.no/fritidsbat/sertifikater/batforerbevis/pensum-til-batforerproven/" },
  { label: "Kystverket — sjømerker", url: "https://www.kystverket.no/sjovegen/fyr-lykter-og-sjomerker/" },
  { label: "Redningsselskapet — sjøvett", url: "https://rs.no/sikker-til-sjos/sjovettreglene/" },
];

// ---- Eksempelspørsmål (egne formuleringer) --------------
const SAMPLE = [
  {
    id: "q_lanterner_001",
    module: "spesielt",
    scene: "lantern",
    question: "Du ser en grønn lanterne alene i mørket. Hva betyr det mest sannsynlig?",
    choices: [
      "Du ser styrbord side av et fartøy",
      "Du ser babord side av et fartøy",
      "Fartøyet ligger for anker",
      "Fartøyet har motorstopp",
    ],
    correct: 0,
    explanation: "Grønn lanterne markerer styrbord side. Ser du den alene, viser fartøyet deg sin styrbordside.",
    source: { label: "Kystverket — lanterner", url: "https://www.kystverket.no/sjovegen/fyr-lykter-og-sjomerker/#lanterner" },
  },
  {
    id: "q_sjomerker_001",
    module: "navigasjon",
    scene: "buoyRed",
    question: "Du seiler inn mot havn og ser et rødt lateralmerke. På hvilken side skal du holde det?",
    choices: [
      "På babord side (venstre)",
      "På styrbord side (høyre)",
      "Rett forut",
      "Det kan passeres på begge sider",
    ],
    correct: 0,
    explanation: "Ved innseiling holdes røde lateralmerker på babord side. Husk: «rødt om babord inn».",
    source: { label: "Kystverket — lateralmerker", url: "https://www.kystverket.no/sjovegen/fyr-lykter-og-sjomerker/#lateralmerker" },
  },
  {
    id: "q_fart_001",
    module: "navigasjon",
    scene: "boat",
    question: "En båt holder 18 knop. Hvor langt kommer den på 40 minutter?",
    choices: ["6 nautiske mil", "9 nautiske mil", "12 nautiske mil", "18 nautiske mil"],
    correct: 2,
    explanation: "18 knop = 18 nm/time. 40 min = 2/3 time → 18 × 2/3 = 12 nautiske mil.",
    source: { label: "Sjøfartsdirektoratet — pensum", url: "https://www.sdir.no/fritidsbat/sertifikater/batforerbevis/pensum-til-batforerproven/" },
  },
  {
    id: "q_vikeplikt_001",
    module: "spesielt",
    scene: "boat",
    question: "Du møter en seilbåt for seil som kommer inn fra din styrbord side. Hva gjør du?",
    choices: [
      "Holder kursen — jeg har vikeplikt-fri sone",
      "Viker, fordi seilbåten kommer fra styrbord",
      "Øker farten og krysser foran",
      "Tvinger seilbåten til å vike",
    ],
    correct: 1,
    explanation: "Fartøy som har det andre på sin styrbord side har normalt vikeplikt. En seilbåt for seil har dessuten ofte fortrinn framfor motorbåt.",
    source: { label: "Sjøfartsdirektoratet — pensum", url: "https://www.sdir.no/fritidsbat/sertifikater/batforerbevis/pensum-til-batforerproven/" },
  },
];

// ---- Tilstand -------------------------------------------
let idx = 0;
const answers = new Array(SAMPLE.length).fill(null); // valgt indeks per spørsmål

// ---- Render ---------------------------------------------
const $ = (sel) => document.querySelector(sel);
const KEYS = ["A", "B", "C", "D", "E"];

function renderSidebar() {
  $("#moduleList").innerHTML = MODULES.map((m, i) =>
    `<li data-module="${m.id}"${i === 0 ? ' class="active"' : ""}>${m.label}
       <span class="count">${SAMPLE.filter(q => q.module === m.id).length}</span></li>`
  ).join("");
  $("#resourceList").innerHTML = RESOURCES.map(r =>
    `<li onclick="window.open('${r.url}','_blank')">${r.label}</li>`
  ).join("");
}

function renderClarity() {
  const done = answers.filter(a => a !== null);
  if (!done.length) { $("#clarityValue").textContent = "—"; return; }
  const correct = answers.filter((a, i) => a === SAMPLE[i].correct).length;
  $("#clarityValue").textContent = Math.round((correct / done.length) * 100) + " %";
}

function renderTask() {
  const q = SAMPLE[idx];
  $("#sceneFigure").innerHTML = (SCENES[q.scene] || SCENES.boat)();
  $("#taskModule").textContent = MODULES.find(m => m.id === q.module)?.label || "Oppgave";
  $("#taskCounter").textContent = `${idx + 1} / ${SAMPLE.length}`;
  $("#progressFill").style.width = ((idx + 1) / SAMPLE.length * 100) + "%";
  $("#questionText").textContent = q.question;

  const chosen = answers[idx];
  $("#choices").innerHTML = q.choices.map((c, i) => {
    let cls = "choice";
    if (chosen !== null) {
      if (i === q.correct) cls += " correct";
      else if (i === chosen) cls += " wrong";
    }
    return `<li><button class="${cls}" data-i="${i}" ${chosen !== null ? "disabled" : ""}>
      <span class="key">${KEYS[i]}</span><span>${c}</span></button></li>`;
  }).join("");

  const fb = $("#feedback");
  if (chosen !== null) {
    fb.hidden = false;
    $("#feedbackText").textContent = q.explanation;
    const link = $("#sourceLink");
    link.textContent = q.source.label + " →";
    link.href = q.source.url;
  } else {
    fb.hidden = true;
  }

  $("#prevBtn").disabled = idx === 0;
  $("#nextBtn").disabled = idx === SAMPLE.length - 1;

  // marker aktiv modul
  document.querySelectorAll("#moduleList li").forEach(li =>
    li.classList.toggle("active", li.dataset.module === q.module));

  renderStreak();
  renderClarity();
}

function renderStreak() {
  const correct = answers.filter((a, i) => a !== null && a === SAMPLE[i].correct).length;
  const total = answers.filter(a => a !== null).length;
  $("#streak").textContent = total ? `${correct}/${total} riktige` : "";
}

// ---- Hendelser ------------------------------------------
$("#choices").addEventListener("click", (e) => {
  const btn = e.target.closest(".choice");
  if (!btn || answers[idx] !== null) return;
  answers[idx] = Number(btn.dataset.i);
  renderTask();
});

$("#prevBtn").addEventListener("click", () => { if (idx > 0) { idx--; renderTask(); } });
$("#nextBtn").addEventListener("click", () => { if (idx < SAMPLE.length - 1) { idx++; renderTask(); } });

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") $("#prevBtn").click();
  if (e.key === "ArrowRight") $("#nextBtn").click();
  const k = KEYS.indexOf(e.key.toUpperCase());
  if (k >= 0 && answers[idx] === null) {
    const b = document.querySelector(`.choice[data-i="${k}"]`);
    if (b) b.click();
  }
});

$("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

// ---- Start ----------------------------------------------
renderSidebar();
renderTask();
