// =========================================================
//  Båtføreprøven — treningsmotor (statisk, data-drevet)
//  Laster docs/data/*.json, adaptiv utvelgelse, mestring per emne,
//  feillogg og elevprofiler i localStorage. Må serveres over http
//  (GitHub Pages e.l.) — fetch fungerer ikke fra file://.
// =========================================================

const $ = (s) => document.querySelector(s);
const KEYS = ["A", "B", "C", "D", "E", "F"];
const STORE_KEY = "bfp.v2";          // { currentId, students: { id: profile } }
const LEGACY_KEY = "bfp.profile.v1"; // gammel enkeltprofil (migreres)

// ---- Maritime bakgrunnsscener (kun dekor; ingen faglige påstander) ----
// NB: Disse vises som nøytral bakgrunn på spørsmål UTEN eget kildebilde. De
// skal aldri hevde noe fagstoff (lanternefarger, merkefarger osv.), siden samme
// scene vises på mange ulike spørsmål. Faglig korrekte illustrasjoner kommer
// fra de offisielle kildebildene (q.image) på bilde-/symbolspørsmål.
function sceneFor(area) {
  return area === "lover" ? sceneNightNeutral() : sceneDayNeutral();
}
function compassRose() {
  return `<g opacity=".12" stroke="#0c2a40" stroke-width="1" fill="none">
    <circle cx="76" cy="20" r="11"/><path d="M76 8 L78 20 L76 32 L74 20 Z" fill="#0c2a40" stroke="none"/>
    <path d="M64 20 L76 18 L88 20 L76 22 Z" fill="#0c2a40" stroke="none"/></g>`;
}
// Nøytral dagscene: horisont, bølger, kompassrose og en enkel seilbåt-silhuett.
function sceneDayNeutral() {
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe7ef"/><stop offset="1" stop-color="#9ccadb"/></linearGradient></defs>
    <rect width="100" height="46" fill="url(#sky)"/>${compassRose()}
    <rect y="46" width="100" height="54" fill="#15526e"/>
    <g fill="#0c2a40" opacity=".85"><path d="M47 28 L47 46 L37 46 Q43 33 47 28 Z"/><path d="M49 30 L60 46 L49 46 Z"/><path d="M35 46 L63 46 L59 51 L39 51 Z"/></g>
    <g stroke="#4a97b3" stroke-width="1.2" fill="none" opacity=".8">
      <path d="M0 58 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0"/><path d="M0 70 q10 4 20 0 t20 0 t20 0 t20 0 t20 0"/>
      <path d="M0 82 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0"/></g></svg>`;
}
// Nøytral nattscene: stjerner, måne og mørk sjø. INGEN fargede lanterner.
function sceneNightNeutral() {
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
    <rect width="100" height="100" fill="#06192a"/>
    <circle cx="78" cy="16" r="7" fill="#e8e2cf" opacity=".5"/><circle cx="75" cy="14" r="6" fill="#06192a"/>
    <g fill="#cdd9e0"><circle cx="20" cy="14" r=".8"/><circle cx="40" cy="9" r=".6"/><circle cx="54" cy="20" r=".5"/><circle cx="30" cy="24" r=".5"/><circle cx="88" cy="30" r=".6"/></g>
    <g stroke="#0e2b40" stroke-width="1" fill="none" opacity=".8">
      <path d="M0 64 q10 -3 20 0 t20 0 t20 0 t20 0 t20 0"/><path d="M0 76 q12 3 24 0 t24 0 t24 0 t24 0"/>
      <path d="M0 88 q10 -3 20 0 t20 0 t20 0 t20 0 t20 0"/></g></svg>`;
}

// ---- Datalast ----
let DATA = { areas: [], concepts: [], questions: [], sources: [] };
let conceptById = {}, areaById = {};

async function loadData() {
  const base = "data/";
  const [syllabus, concepts, questions, sources, flashcards] = await Promise.all([
    fetch(base + "syllabus.json").then(r => r.json()),
    fetch(base + "concepts.json").then(r => r.json()),
    fetch(base + "questions.json").then(r => r.json()),
    fetch(base + "sources.json").then(r => r.json()),
    fetch(base + "flashcards.json").then(r => r.json()).catch(() => []),
  ]);
  DATA = { areas: syllabus, concepts, questions, sources, flashcards };
  conceptById = Object.fromEntries(concepts.map(c => [c.id, c]));
  areaById = Object.fromEntries(syllabus.map(a => [a.id, a]));
}

// ---- Profiler (localStorage, flere elever) ----
let STORE = { currentId: null, students: {} };
let P = null;   // gjeldende elevprofil

function uid() { return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function normProfile(p) {
  p.answers ||= {}; p.mastery ||= {}; p.lastSeen ||= {}; p.errors ||= []; p.recent ||= []; p.exams ||= []; p.srs ||= {};
  return p;
}
function loadStore() {
  try { STORE = JSON.parse(localStorage.getItem(STORE_KEY)); } catch { STORE = null; }
  if (!STORE || !STORE.students) {
    STORE = { currentId: null, students: {} };
    try {  // migrer gammel enkeltprofil
      const old = JSON.parse(localStorage.getItem(LEGACY_KEY));
      if (old && old.name) { const id = uid(); old.id = id; STORE.students[id] = normProfile(old); STORE.currentId = id; saveStore(); }
    } catch {}
  }
  Object.values(STORE.students).forEach(normProfile);
  P = STORE.currentId ? STORE.students[STORE.currentId] : null;
}
function saveStore() { localStorage.setItem(STORE_KEY, JSON.stringify(STORE)); }
const saveProfile = saveStore;   // alias (mange kallsteder)
function newStudent(name) {
  const id = uid();
  STORE.students[id] = normProfile({ id, name, created: new Date().toISOString() });
  STORE.currentId = id; P = STORE.students[id]; saveStore();
}
function switchStudent(id) { if (STORE.students[id]) { STORE.currentId = id; P = STORE.students[id]; saveStore(); } }
function deleteStudent(id) {
  delete STORE.students[id];
  if (STORE.currentId === id) STORE.currentId = Object.keys(STORE.students)[0] || null;
  P = STORE.currentId ? STORE.students[STORE.currentId] : null;
  saveStore();
}

// ---- Mestring & statistikk (parametrisert på profil for sammenligning) ----
const IMP_W = { normal: 1.0, high: 1.3, critical: 1.6 };
function masteryOf(cid) { return P.mastery[cid] ?? 0.3; }
function updateMastery(cid, correct) {
  const m = masteryOf(cid);
  const next = correct ? m + 0.25 * (1 - m) : m - 0.32 * m;
  P.mastery[cid] = Math.max(0, Math.min(1, next));
  P.lastSeen[cid] = Date.now();
}
function clarityOf(pr) {
  const m = pr.mastery || {}; const seen = Object.keys(m);
  return seen.length ? seen.reduce((s, id) => s + m[id], 0) / seen.length : null;
}
function areaMasteryOf(pr, areaId) {
  const m = pr.mastery || {};
  const cs = DATA.concepts.filter(c => c.area === areaId && m[c.id] !== undefined);
  return cs.length ? cs.reduce((s, c) => s + m[c.id], 0) / cs.length : null;
}
function spesieltMasteryOf(pr) {
  const m = pr.mastery || {};
  const ids = new Set(DATA.questions.filter(q => q.exam_area === "spesielt_viktige").map(q => q.concept_id));
  const seen = [...ids].filter(id => m[id] !== undefined);
  return seen.length ? seen.reduce((s, id) => s + m[id], 0) / seen.length : null;
}
function answeredStats(pr) {
  const a = Object.values(pr.answers || {}); const c = a.filter(x => x.correct).length;
  return { n: a.length, correctPct: a.length ? c / a.length : null };
}
function bestExam(pr) { const e = pr.exams || []; return e.length ? Math.max(...e.map(x => x.pct)) : null; }
// snarveier for gjeldende profil
function areaMastery(areaId) { return areaMasteryOf(P, areaId); }
function clarityIndex() { return clarityOf(P); }

// Adaptiv: flere spørsmål på svake/viktige emner, færre på sterke.
let filter = { view: "adaptive", area: null }; // area = id | "spesielt" | null

function candidatePool() {
  let qs = DATA.questions;
  if (filter.area === "spesielt") qs = qs.filter(q => q.exam_area === "spesielt_viktige");
  else if (filter.area) qs = qs.filter(q => conceptById[q.concept_id]?.area === filter.area);
  return qs;
}
function pickQuestion() {
  const pool = candidatePool();
  if (!pool.length) return null;
  const recent = new Set(P.recent.slice(-12));
  let best = null, bestScore = -1e9;
  pool.forEach((q, i) => {
    const c = conceptById[q.concept_id];
    const weakness = 1 - masteryOf(q.concept_id);
    const imp = IMP_W[q.importance] || 1;
    const due = P.lastSeen[q.concept_id] ? Math.min(1, (Date.now() - P.lastSeen[q.concept_id]) / 6e5) : 1;
    let score = 2.0 * weakness + 0.6 * imp + 0.6 * due;
    if (recent.has(q.id)) score -= 5;             // unngå repetisjon
    score += ((i * 2654435761) % 1000) / 4000;    // deterministisk «støy» for variasjon
    if (score > bestScore) { bestScore = score; best = q; }
  });
  return best;
}

// ---- Render: quiz ----
let current = null, answered = false;

const MAIN_SECTIONS = { quiz: "#taskCard", feillogg: "#errPanel", examStart: "#examStart", exam: "#examCard", result: "#resultPanel", sammenlign: "#comparePanel", flashcards: "#fcPanel" };
function showView(which) {
  for (const sel of Object.values(MAIN_SECTIONS)) { const el = $(sel); if (el) el.hidden = true; }
  const el = $(MAIN_SECTIONS[which]); if (el) el.hidden = false;
}

function renderQuestion(q) {
  current = q; answered = false;
  showView("quiz");
  const c = conceptById[q.concept_id] || {};
  const area = areaById[c.area];
  $("#taskModule").textContent = (area ? area.title : "Oppgave") + (c.title ? " · " + c.title : "");
  $("#taskCounter").textContent = "";
  $("#progressFill").style.width = Math.round((clarityIndex() || 0) * 100) + "%";

  // badge
  const badge = $("#qBadge");
  if (q.exam_area === "spesielt_viktige") { badge.hidden = false; badge.textContent = "★ Spesielt viktig"; badge.className = "badge crit"; }
  else if (q.importance === "high") { badge.hidden = false; badge.textContent = "Viktig"; badge.className = "badge"; }
  else badge.hidden = true;

  // scene / bilde
  const fig = $("#sceneFigure");
  if (q.image && q.image.src) {
    fig.innerHTML = `<img class="photo" src="${q.image.src}" alt="${q.image.alt || ""}">${imgCredit(q.image)}`;
  } else { fig.innerHTML = sceneFor(c.area); }

  $("#questionText").textContent = q.prompt;

  const choices = $("#choices");
  if (q.type === "flashcard" || !q.choices || !q.choices.length) {
    choices.innerHTML = `<li><button class="choice" data-i="0"><span class="key">?</span><span>Vis svar</span></button></li>`;
  } else {
    choices.innerHTML = q.choices.map((ch, i) =>
      `<li><button class="choice" data-i="${i}"><span class="key">${KEYS[i]}</span><span>${esc(ch)}</span></button></li>`).join("");
  }
  $("#feedback").hidden = true;
  $("#sourceLink").hidden = true;
  $("#nextLabel").textContent = "Hopp over";
  renderStreak();
}

function answer(i) {
  if (answered) return;
  const q = current;
  const correct = (q.type === "flashcard") ? true : (i === q.correct);
  answered = true;

  // marker valg
  document.querySelectorAll(".choice").forEach(btn => {
    const bi = Number(btn.dataset.i);
    btn.disabled = true;
    if (q.type !== "flashcard") {
      if (bi === q.correct) btn.classList.add("correct");
      else if (bi === i) btn.classList.add("wrong");
    }
  });

  // logg
  P.answers[q.id] = { correct, ts: Date.now() };
  P.recent.push(q.id);
  updateMastery(q.concept_id, correct);
  if (!correct) logError(q, i);
  saveProfile();

  // feedback
  $("#feedbackText").textContent = q.explanation || "";
  $("#feedback").hidden = false;
  const src = (q.sources || [])[0];
  const link = $("#sourceLink");
  if (src && src.url) {
    link.hidden = false; link.href = src.url;
    link.textContent = (src.section ? src.section + " — " : "") + "Les hos kilden →";
  } else link.hidden = true;
  $("#nextLabel").textContent = "Neste";
  renderStreak(); renderSidebar(); renderClarity();
}

function logError(q, chosen) {
  P.errors = P.errors.filter(e => e.qid !== q.id);   // unngå duplikat
  P.errors.unshift({ qid: q.id, concept_id: q.concept_id, ts: Date.now(),
                     chosen: q.choices ? q.choices[chosen] : null });
  P.errors = P.errors.slice(0, 100);
}

function renderStreak() {
  const a = Object.values(P.answers);
  const corr = a.filter(x => x.correct).length;
  $("#streak").textContent = a.length ? `${corr}/${a.length} riktige totalt` : "";
}

// ---- Render: feillogg ----
function renderErrors() {
  showView("feillogg");
  const list = $("#errList");
  if (!P.errors.length) { list.innerHTML = `<li class="err-empty">Ingen feil registrert ennå. Bra jobba! ⚓</li>`; return; }
  list.innerHTML = P.errors.map(e => {
    const q = DATA.questions.find(x => x.id === e.qid);
    const c = conceptById[e.concept_id] || {};
    const area = areaById[c.area];
    if (!q) return "";
    return `<li class="err-item" data-q="${e.qid}">
      <span class="err-x">✗</span>
      <div><div class="err-text">${esc(q.prompt)}</div>
        <div class="err-meta">${esc(area ? area.title : "")}${c.title ? " · " + esc(c.title) : ""} — trykk for å øve på dette temaet ·
          <button class="report-link" data-report="${e.qid}" type="button">⚑ Meld feil</button></div></div></li>`;
  }).join("");
}

// ---- Render: sidemeny + header ----
function renderSidebar() {
  $("#cAll").textContent = DATA.questions.length;
  $("#cErr").textContent = P.errors.length;
  if (DATA.flashcards) { const d = dueCount(); $("#cDue").textContent = d || ""; }
  // pensumområder med mestringsfelt
  const areaItems = DATA.areas.map(a => {
    const isSpes = a.id === "spesielt";
    const nq = isSpes
      ? DATA.questions.filter(q => q.exam_area === "spesielt_viktige").length
      : DATA.questions.filter(q => conceptById[q.concept_id]?.area === a.id).length;
    const m = isSpes ? spesieltMastery() : areaMastery(a.id);
    const pct = m == null ? 0 : Math.round(m * 100);
    const active = filter.area === a.id ? " active" : "";
    return `<li class="area-item${active}" data-area="${a.id}">
      <div class="area-row"><span>${esc(a.title)}</span><span class="count">${nq}</span></div>
      <div class="mastery"><i style="width:${pct}%"></i></div></li>`;
  }).join("");
  $("#areaList").innerHTML = areaItems;
  // marker aktiv modus
  document.querySelectorAll("#modeList li").forEach(li =>
    li.classList.toggle("active", filter.view === li.dataset.view && !filter.area));
  // foot
  const ci = clarityIndex();
  $("#footStats").textContent = ci == null
    ? `${DATA.questions.length} spørsmål · ${DATA.concepts.length} emner`
    : `Svart: ${Object.keys(P.answers).length} · Feillogg: ${P.errors.length}`;
}
function spesieltMastery() { return spesieltMasteryOf(P); }
function renderClarity() {
  const ci = clarityIndex();
  $("#clarityValue").textContent = ci == null ? "—" : Math.round(ci * 100) + " %";
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function imgCredit(img) {
  const txt = "Illustrasjon: " + (img.credit || "offentlig kilde");
  return img.source
    ? `<a class="img-credit" href="${esc(img.source)}" target="_blank" rel="noopener">${esc(txt)}</a>`
    : `<span class="img-credit">${esc(txt)}</span>`;
}

// ---- Meld feil / tilbakemelding ----
const FEEDBACK_EMAIL = "vesmir09@gmail.com";   // mottaker av tilbakemeldinger
// EmailJS-konfig. Fyll inn de to plassholderne fra EmailJS-dashbordet:
//   publicKey  : Account → General → API Keys (Public Key)
//   templateId : Email Templates → (din mal) → Template ID (f.eks. template_xxx)
// Template-malen bør bruke variablene under (Cc/To = {{to_email}}).
const EMAILJS = {
  publicKey: "-5S2PctOrxEViV5Pf",    // EmailJS Public Key
  serviceId: "baatfører",            // Service ID (bekreft at den matcher EmailJS → Email Services)
  templateId: "template_ucu8i6f",    // EmailJS Template ID
};
let emailjsReady = false;
function initEmailJS() {
  const k = EMAILJS.publicKey;
  if (window.emailjs && k && !k.startsWith("DIN_")) {
    try { emailjs.init({ publicKey: k }); emailjsReady = true; } catch (e) { console.warn("EmailJS init feilet", e); }
  }
}
let feedbackQ = null;
function findQ(id) { return DATA.questions.find(x => x.id === id) || null; }
function openFeedback(q) {
  feedbackQ = q || null;
  $("#fbContext").textContent = q ? `Oppgave ${q.id}: ${q.prompt}` : "Generell tilbakemelding om siden.";
  $("#fbText").value = "";
  $("#feedbackModal").hidden = false;
  setTimeout(() => $("#fbText").focus(), 50);
}
function buildFeedbackMailto(q, note) {
  const subject = "Båtføreprøven – tilbakemelding" + (q ? ` (oppgave ${q.id})` : "");
  const body = [
    "Tilbakemelding fra treningssiden Båtføreprøven:", "",
    q ? `Oppgave-ID: ${q.id}` : null,
    q ? `Spørsmål: ${q.prompt}` : null,
    (q && q.choices && q.choices.length && q.correct != null) ? `Oppgitt riktig svar: ${q.choices[q.correct]}` : null,
    (q && (q.sources || [])[0] && q.sources[0].url) ? `Kilde: ${q.sources[0].url}` : null,
    P ? `Elev: ${P.name}` : null,
    "", "Kommentar:", note || "(ingen kommentar)",
  ].filter(x => x !== null).join("\n");
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function feedbackParams(q, note) {
  return {
    to_email: FEEDBACK_EMAIL,
    subject: "Båtføreprøven – tilbakemelding" + (q ? ` (oppgave ${q.id})` : ""),
    question_id: q ? q.id : "",
    question: q ? q.prompt : "",
    correct_answer: (q && q.choices && q.correct != null) ? q.choices[q.correct] : "",
    source: (q && (q.sources || [])[0] && q.sources[0].url) || "",
    student: P ? P.name : "",
    comment: note || "(ingen kommentar)",
  };
}
async function sendFeedback() {
  const note = ($("#fbText").value || "").trim();
  const q = feedbackQ;
  $("#feedbackModal").hidden = true;
  if (emailjsReady) {
    try {
      await emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, feedbackParams(q, note));
      toast("Takk! Tilbakemeldingen er sendt. ⚓");
      return;
    } catch (e) {
      console.error("EmailJS-sending feilet – faller tilbake til e-postklient.", e);
    }
  }
  // Fallback (EmailJS ikke konfigurert eller feilet): åpne e-postklienten.
  window.location.href = buildFeedbackMailto(q, note);
}
let toastTimer = null;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.hidden = true, 300); }, 3500);
}

// ---- Flyt ----
function nextQuestion() {
  // Oversprang (ikke besvart): merk som nylig sett så velgeren ikke gjentar det.
  if (current && !answered) {
    P.recent.push(current.id);
    if (P.recent.length > 60) P.recent = P.recent.slice(-60);
    saveProfile();
  }
  const q = pickQuestion();
  if (q) renderQuestion(q);
  else { $("#questionText").textContent = "Ingen oppgaver i dette utvalget."; $("#choices").innerHTML = ""; }
}

function setView(view, area = null) {
  filter = { view, area };
  if ($("#sidebar").classList.contains("open")) $("#sidebar").classList.remove("open");
  if (exam.timerId && view !== "eksamen") stopExamTimer();
  if (view === "feillogg") renderErrors();
  else if (view === "eksamen") showView("examStart");
  else if (view === "sammenlign") renderCompare();
  else if (view === "flashcards") startFlashcards();
  else nextQuestion();
  renderSidebar();
}

// ---- Flashcards (spaced repetition, SM-2-lite) ----
const DAY = 864e5;
let fcQueue = [], fcCard = null, fcRevealed = false;
function dueCount() {
  const now = Date.now();
  return DATA.flashcards.filter(c => P.srs[c.id] && P.srs[c.id].due <= now).length;
}
function buildQueue(extraNew) {
  const now = Date.now();
  const due = DATA.flashcards.filter(c => P.srs[c.id] && P.srs[c.id].due <= now)
    .sort((a, b) => P.srs[a.id].due - P.srs[b.id].due);
  const fresh = DATA.flashcards.filter(c => !P.srs[c.id]).slice(0, extraNew);
  return [...due, ...fresh];
}
function startFlashcards() {
  showView("flashcards");
  fcQueue = buildQueue(10);
  nextCard();
}
function nextCard() {
  fcRevealed = false;
  $("#fcRate").hidden = true; $("#fcReveal").hidden = false; $("#fcBack").hidden = true;
  if (!fcQueue.length) { renderFcDone(); return; }
  $("#flashcard").hidden = false; $("#fcReveal").hidden = false; $("#fcDone").hidden = true;
  fcCard = fcQueue.shift();
  const c = fcCard;
  $("#fcKicker").textContent = c.kind === "image" ? "Identifiser bildet" : (areaById[c.category]?.title || "Konsept");
  const img = $("#fcImage");
  if (c.kind === "image" && c.src) { img.hidden = false; img.innerHTML = `<img src="${c.src}" alt=""><div class="cap">${esc("Illustrasjon: " + (c.credit || "offentlig kilde"))}</div>`; }
  else { img.hidden = true; img.innerHTML = ""; }
  $("#fcFront").textContent = c.front;
  $("#fcAnswer").textContent = c.answer;
  $("#fcDetail").textContent = c.detail || "";
  updateFcStats();
}
function revealCard() {
  if (!fcCard) return;
  fcRevealed = true;
  $("#fcBack").hidden = false; $("#fcReveal").hidden = true; $("#fcRate").hidden = false;
}
function rateCard(r) {
  if (!fcCard || !fcRevealed) return;
  const st = P.srs[fcCard.id] || { ease: 2.5, interval: 0, reps: 0 };
  if (r === "again") {
    st.reps = 0; st.interval = 0; st.ease = Math.max(1.3, st.ease - 0.2);
    st.due = Date.now() + 10 * 60 * 1000; fcQueue.push(fcCard);   // se igjen i økten
  } else {
    if (r === "hard") { st.ease = Math.max(1.3, st.ease - 0.15); st.interval = st.reps === 0 ? 1 : Math.max(1, Math.round(st.interval * 1.2)); }
    else if (r === "good") { st.interval = st.reps === 0 ? 1 : st.reps === 1 ? 3 : Math.round(st.interval * st.ease); }
    else if (r === "easy") { st.ease += 0.15; st.interval = st.reps === 0 ? 2 : Math.round(st.interval * st.ease * 1.3); }
    st.reps++; st.due = Date.now() + st.interval * DAY;
  }
  P.srs[fcCard.id] = st; saveProfile();
  nextCard(); renderSidebar();
}
function updateFcStats() {
  const learned = Object.keys(P.srs).length;
  $("#fcStats").textContent = `${fcQueue.length + 1} igjen i økten · ${learned}/${DATA.flashcards.length} kort lært`;
}
function renderFcDone() {
  $("#flashcard").hidden = true; $("#fcReveal").hidden = true; $("#fcRate").hidden = true;
  $("#fcDone").hidden = false;
  const remainingNew = DATA.flashcards.filter(c => !P.srs[c.id]).length;
  $("#fcMore").hidden = remainingNew === 0;
  $("#fcMore").textContent = `Lær ${Math.min(10, remainingNew)} nye kort`;
  $("#fcStats").textContent = `${Object.keys(P.srs).length}/${DATA.flashcards.length} kort lært`;
}

// ---- Elev-håndtering (modal med flere elever) ----
function openStudentModal() {
  renderStudentList();
  $("#nameInput").value = "";
  $("#nameModal").hidden = false;
  $("#closeModal").style.visibility = P ? "visible" : "hidden";
  $("#resetBtn").style.visibility = P ? "visible" : "hidden";
  $("#compareBtn").style.visibility = Object.keys(STORE.students).length > 1 ? "visible" : "hidden";
  setTimeout(() => $("#nameInput").focus(), 50);
}
function renderStudentList() {
  const ids = Object.keys(STORE.students);
  $("#studentList").innerHTML = ids.length ? ids.map(id => {
    const s = STORE.students[id]; const ci = clarityOf(s);
    const cl = ci == null ? "ny" : Math.round(ci * 100) + " %";
    return `<li class="student-row ${id === STORE.currentId ? "active" : ""}">
      <button class="student-pick" data-id="${id}"><b>${esc(s.name)}</b>
        <span>${cl} klarhetsindeks · ${Object.keys(s.answers || {}).length} svart</span></button>
      <button class="student-del" data-id="${id}" title="Slett elev">✕</button></li>`;
  }).join("") : `<li class="err-empty">Ingen elever ennå — legg til én under.</li>`;
}
function afterStudentChange() {
  $("#studentName").textContent = P ? P.name : "—";
  $("#nameModal").hidden = true;
  filter = { view: "adaptive", area: null }; current = null;
  nextQuestion(); renderSidebar(); renderClarity();
}
function addStudentFromInput() {
  const name = ($("#nameInput").value || "").trim();
  if (!name) { $("#nameInput").focus(); return; }
  newStudent(name); afterStudentChange();
}

// ---- Eksamensmodus (50 spm / 60 min / ≥80 % + ≥80 % spesielt) ----
let exam = { questions: [], answers: {}, idx: 0, endAt: 0, timerId: null, submitted: false };

function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function pickExamSet() {
  const target = { sjomannskap: 16, lover: 17, navigasjon: 17 }; // ~50
  const out = [];
  for (const a of Object.keys(target)) {
    const pool = DATA.questions.filter(q => conceptById[q.concept_id]?.area === a);
    const spes = shuffle(pool.filter(q => q.exam_area === "spesielt_viktige"));
    const rest = shuffle(pool.filter(q => q.exam_area !== "spesielt_viktige"));
    const t = target[a];
    const nspes = Math.min(spes.length, Math.round(t * 0.45));
    let sel = [...spes.slice(0, nspes), ...rest.slice(0, t - nspes)];
    for (let k = nspes; sel.length < t && k < spes.length; k++) sel.push(spes[k]); // fyll om for få rest
    out.push(...sel.slice(0, t));
  }
  return shuffle(out).slice(0, 50);
}

function startExam() {
  exam = { questions: pickExamSet(), answers: {}, idx: 0, endAt: Date.now() + 60 * 60 * 1000, timerId: null, submitted: false };
  showView("exam");
  exam.timerId = setInterval(tickExam, 1000);
  renderExamQuestion();
}
function stopExamTimer() { if (exam.timerId) { clearInterval(exam.timerId); exam.timerId = null; } }
function tickExam() {
  const left = Math.max(0, exam.endAt - Date.now());
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
  const t = $("#examTimer"); t.textContent = `${m}:${String(s).padStart(2, "0")}`;
  t.classList.toggle("warn", left < 5 * 60000);
  if (left <= 0) submitExam();
}
function renderPalette() {
  $("#examPalette").innerHTML = exam.questions.map((q, i) =>
    `<button class="pal-dot ${exam.answers[i] != null ? "done" : ""} ${i === exam.idx ? "current" : ""}" data-i="${i}">${i + 1}</button>`).join("");
}
function renderExamQuestion() {
  const q = exam.questions[exam.idx]; const c = conceptById[q.concept_id] || {};
  renderPalette();
  $("#examCounter").textContent = `Spørsmål ${exam.idx + 1} av ${exam.questions.length}`;
  const badge = $("#examBadge");
  if (q.exam_area === "spesielt_viktige") { badge.hidden = false; badge.textContent = "★ Spesielt viktig"; badge.className = "badge crit"; } else badge.hidden = true;
  const fig = $("#examScene");
  fig.innerHTML = (q.image && q.image.src) ? `<img class="photo" src="${q.image.src}" alt="${q.image.alt || ""}">${imgCredit(q.image)}` : sceneFor(c.area);
  $("#examQuestion").textContent = q.prompt;
  const chosen = exam.answers[exam.idx];
  $("#examChoices").innerHTML = (q.choices || []).map((ch, i) =>
    `<li><button class="choice ${chosen === i ? "chosen" : ""}" data-i="${i}"><span class="key">${KEYS[i]}</span><span>${esc(ch)}</span></button></li>`).join("");
  $("#examPrev").disabled = exam.idx === 0;
  $("#examNext").disabled = exam.idx === exam.questions.length - 1;
}
function examChoose(i) {
  exam.answers[exam.idx] = i;
  renderExamQuestion();
}
function examGo(d) { exam.idx = Math.max(0, Math.min(exam.questions.length - 1, exam.idx + d)); renderExamQuestion(); }

function submitExam() {
  if (exam.submitted) return;
  exam.submitted = true; stopExamTimer();
  let correct = 0, spesTot = 0, spesCorr = 0;
  const perArea = {}; const wrong = [];
  exam.questions.forEach((q, i) => {
    const ok = exam.answers[i] === q.correct;
    const area = conceptById[q.concept_id]?.area || "?";
    perArea[area] = perArea[area] || { n: 0, c: 0 };
    perArea[area].n++; if (ok) perArea[area].c++;
    if (ok) correct++; else wrong.push({ q, chosen: exam.answers[i] });
    if (q.exam_area === "spesielt_viktige") { spesTot++; if (ok) spesCorr++; }
    // oppdater mestring + feillogg
    updateMastery(q.concept_id, ok);
    if (!ok) logError(q, exam.answers[i] ?? -1);
  });
  const pct = correct / exam.questions.length;
  const spesPct = spesTot ? spesCorr / spesTot : 1;
  const pass = pct >= 0.8 && spesPct >= 0.8;
  P.exams.push({ ts: Date.now(), pct, spesPct, pass, correct, total: exam.questions.length });
  saveProfile();
  renderResult({ correct, total: exam.questions.length, pct, spesTot, spesCorr, spesPct, pass, perArea, wrong });
  renderSidebar(); renderClarity();
}

function renderResult(r) {
  showView("result");
  $("#resultTitle").textContent = r.pass ? "Bestått 🎉" : "Ikke bestått";
  const sc = $("#resultScore"); sc.className = "result-score " + (r.pass ? "pass" : "fail");
  sc.innerHTML = `<div class="verdict">${r.correct} / ${r.total} riktige (${Math.round(r.pct * 100)} %)</div>
    <div class="pct">Spesielt viktige emner: ${r.spesCorr}/${r.spesTot} (${Math.round(r.spesPct * 100)} %) · krav ≥ 80 % på begge</div>`;
  const areas = $("#resultAreas");
  areas.innerHTML = DATA.areas.filter(a => r.perArea[a.id]).map(a => {
    const p = r.perArea[a.id];
    return `<div class="result-area"><div class="ra-title">${esc(a.title)}</div><div class="ra-val">${Math.round(p.c / p.n * 100)} %</div><div class="ra-title">${p.c}/${p.n}</div></div>`;
  }).join("") + `<div class="result-area crit"><div class="ra-title">★ Spesielt viktige</div><div class="ra-val">${Math.round(r.spesPct * 100)} %</div><div class="ra-title">${r.spesCorr}/${r.spesTot}</div></div>`;
  $("#resultReviewHead").style.display = r.wrong.length ? "" : "none";
  $("#resultReview").innerHTML = r.wrong.map(({ q, chosen }) => {
    const src = (q.sources || [])[0];
    const right = q.choices ? q.choices[q.correct] : "";
    const your = (chosen != null && chosen >= 0 && q.choices) ? q.choices[chosen] : "(ubesvart)";
    return `<li class="result-review-item"><div class="rq">${esc(q.prompt)}</div>
      <div class="ra wrong">Ditt svar: ${esc(your)}</div>
      <div class="ra right">Riktig: ${esc(right)}</div>
      <div class="rexpl">${esc(q.explanation || "")}</div>
      <div class="feedback-actions">
        ${src && src.url ? `<a class="source-link" href="${src.url}" target="_blank" rel="noopener">${esc(src.section || "Kilde")} →</a>` : ""}
        <button class="report-link" data-report="${q.id}" type="button">⚑ Meld feil</button>
      </div></li>`;
  }).join("");
}

// ---- Sammenlign elever ----
function renderCompare() {
  showView("sammenlign");
  const ids = Object.keys(STORE.students);
  const pc = v => v == null ? "–" : Math.round(v * 100) + " %";
  const rows = ids.map(id => {
    const s = STORE.students[id]; const ci = clarityOf(s); const st = answeredStats(s); const be = bestExam(s);
    return `<tr class="${id === STORE.currentId ? "me" : ""}">
      <td class="c-name">${esc(s.name)}${id === STORE.currentId ? ' <span class="c-you">(deg)</span>' : ""}</td>
      <td><div class="cbar"><i style="width:${ci ? Math.round(ci * 100) : 0}%"></i></div><span class="cbar-v">${pc(ci)}</span></td>
      <td>${st.n}</td>
      <td>${pc(st.correctPct)}</td>
      <td>${pc(areaMasteryOf(s, "sjomannskap"))}</td>
      <td>${pc(areaMasteryOf(s, "lover"))}</td>
      <td>${pc(areaMasteryOf(s, "navigasjon"))}</td>
      <td class="c-spes">${pc(spesieltMasteryOf(s))}</td>
      <td>${be == null ? "–" : Math.round(be * 100) + " %"}</td></tr>`;
  }).join("");
  $("#compareBody").innerHTML = rows || `<tr><td colspan="9" class="err-empty">Ingen elever ennå.</td></tr>`;
}

// ---- Init ----
function bindEvents() {
  $("#choices").addEventListener("click", e => {
    const btn = e.target.closest(".choice"); if (btn) answer(Number(btn.dataset.i));
  });
  $("#nextBtn").addEventListener("click", () => { if (filter.view === "feillogg") return; nextQuestion(); });
  $("#reportBtn").addEventListener("click", () => openFeedback(current));
  $("#fbSend").addEventListener("click", sendFeedback);
  $("#fbCancel").addEventListener("click", () => { $("#feedbackModal").hidden = true; });
  document.addEventListener("keydown", e => {
    if (!$("#feedbackModal").hidden) { if (e.key === "Escape") $("#feedbackModal").hidden = true; return; }
    if (!$("#nameModal").hidden) { if (e.key === "Enter") addStudentFromInput(); else if (e.key === "Escape" && P) $("#nameModal").hidden = true; return; }
    if (filter.view === "eksamen" && !$("#examCard").hidden) {
      if (e.key === "ArrowRight") examGo(1);
      else if (e.key === "ArrowLeft") examGo(-1);
      else { const k = KEYS.indexOf(e.key.toUpperCase()); if (k >= 0) examChoose(k); }
      return;
    }
    if (filter.view === "flashcards" && !$("#fcPanel").hidden) {
      if (!fcRevealed) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); revealCard(); } }
      else { const m = { "1": "again", "2": "hard", "3": "good", "4": "easy" }; if (m[e.key]) rateCard(m[e.key]); }
      return;
    }
    if (filter.view !== "adaptive" && filter.view !== "quiz") return;
    if (e.key === "Enter" || e.key === "ArrowRight") $("#nextBtn").click();
    const k = KEYS.indexOf(e.key.toUpperCase());
    if (k >= 0 && !answered) { const b = document.querySelector(`.choice[data-i="${k}"]`); if (b) b.click(); }
  });
  $("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#studentBtn").addEventListener("click", openStudentModal);
  $("#addStudent").addEventListener("click", addStudentFromInput);
  $("#studentList").addEventListener("click", e => {
    const pick = e.target.closest(".student-pick"), del = e.target.closest(".student-del");
    if (pick) { switchStudent(pick.dataset.id); afterStudentChange(); }
    else if (del) {
      const s = STORE.students[del.dataset.id];
      if (s && confirm(`Slette eleven «${s.name}» og all fremgang?`)) {
        deleteStudent(del.dataset.id);
        renderStudentList();
        $("#studentName").textContent = P ? P.name : "—";
        if (P) { renderSidebar(); renderClarity(); }
      }
    }
  });
  $("#resetBtn").addEventListener("click", () => {
    if (!P) return;
    if (confirm(`Nullstille all fremgang for «${P.name}»?`)) {
      STORE.students[P.id] = normProfile({ id: P.id, name: P.name, created: P.created });
      P = STORE.students[P.id]; saveStore(); afterStudentChange(); renderStudentList();
    }
  });
  $("#compareBtn").addEventListener("click", () => { if (P) { $("#nameModal").hidden = true; setView("sammenlign"); } });
  $("#closeModal").addEventListener("click", () => { if (P) $("#nameModal").hidden = true; });
  $("#addFromCompare").addEventListener("click", openStudentModal);
  $("#modeList").addEventListener("click", e => {
    const li = e.target.closest("li"); if (li) setView(li.dataset.view, null);
  });
  $("#areaList").addEventListener("click", e => {
    const li = e.target.closest("li"); if (li) setView("adaptive", li.dataset.area);
  });
  $("#errList").addEventListener("click", e => {
    const rep = e.target.closest(".report-link");
    if (rep) { e.stopPropagation(); openFeedback(findQ(rep.dataset.report)); return; }
    const li = e.target.closest(".err-item"); if (!li) return;
    const q = DATA.questions.find(x => x.id === li.dataset.q);
    if (q) { filter = { view: "adaptive", area: conceptById[q.concept_id]?.area || null }; renderQuestion(q); renderSidebar(); }
  });
  $("#resultReview").addEventListener("click", e => {
    const rep = e.target.closest(".report-link"); if (rep) openFeedback(findQ(rep.dataset.report));
  });
  $("#clearErr").addEventListener("click", () => { if (confirm("Tømme feilloggen?")) { P.errors = []; saveProfile(); renderErrors(); renderSidebar(); } });

  // eksamen
  $("#startExam").addEventListener("click", startExam);
  $("#examChoices").addEventListener("click", e => { const b = e.target.closest(".choice"); if (b) examChoose(Number(b.dataset.i)); });
  $("#examPalette").addEventListener("click", e => { const b = e.target.closest(".pal-dot"); if (b) { exam.idx = Number(b.dataset.i); renderExamQuestion(); } });
  $("#examPrev").addEventListener("click", () => examGo(-1));
  $("#examNext").addEventListener("click", () => examGo(1));
  $("#examSubmit").addEventListener("click", () => {
    const n = Object.keys(exam.answers).length;
    if (n < exam.questions.length && !confirm(`Du har svart på ${n} av ${exam.questions.length}. Levere likevel?`)) return;
    submitExam();
  });
  $("#resultClose").addEventListener("click", () => setView("adaptive", null));

  // flashcards
  $("#fcShow").addEventListener("click", revealCard);
  $("#fcRate").addEventListener("click", e => { const b = e.target.closest(".rate-btn"); if (b) rateCard(b.dataset.r); });
  $("#fcMore").addEventListener("click", () => { fcQueue = buildQueue(10); nextCard(); });
}

function renderResources() {
  const off = DATA.sources.filter(s => s.authority === "official" || s.authority === "official_law").slice(0, 6);
  $("#resourceList").innerHTML = off.map(s => `<li onclick="window.open('${s.url}','_blank')">${esc(s.name)}</li>`).join("");
}

async function init() {
  bindEvents();
  initEmailJS();
  try { await loadData(); }
  catch (err) {
    $("#questionText").textContent = "Kunne ikke laste data. Siden må kjøres via en webserver (GitHub Pages), ikke fra fil.";
    console.error(err); return;
  }
  renderResources();
  loadStore();
  if (!P) { openStudentModal(); $("#studentName").textContent = "—"; }
  else { $("#studentName").textContent = P.name; nextQuestion(); renderSidebar(); renderClarity(); }
}

init();
