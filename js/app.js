/* Svadobný plánovač
   Čistý JavaScript bez knižníc. Dáta sa ukladajú do localStorage v prehliadači,
   zálohu / prenos medzi zariadeniami robí Export a Import (JSON). */
(function () {
"use strict";

const KEY = "svadba-planovac-v1";

const PHASES = [
  { key: "p12", label: "12+ mesiacov pred", short: "12+ mes.", m: -12 },
  { key: "p9",  label: "9 – 12 mesiacov pred", short: "9–12 mes.", m: -9 },
  { key: "p6",  label: "6 – 9 mesiacov pred", short: "6–9 mes.", m: -6 },
  { key: "p3",  label: "3 – 6 mesiacov pred", short: "3–6 mes.", m: -3 },
  { key: "p1",  label: "1 – 3 mesiace pred", short: "1–3 mes.", m: -1 },
  { key: "m",   label: "Posledný mesiac", short: "Posl. mesiac", d: -7 },
  { key: "w",   label: "Posledný týždeň", short: "Posl. týždeň", d: -1 },
  { key: "d",   label: "Svadobný deň", short: "V deň D", d: 0 },
  { key: "po",  label: "Po svadbe", short: "Po svadbe", d: 60 },
  { key: "x",   label: "Bez termínu", short: "Bez termínu" }
];
const EXP_STATUS = [["napad", "Nápad"], ["osloveny", "Oslovený"], ["rezervovane", "Rezervované"], ["zmluva", "Zmluva / záloha"], ["zaplatene", "Zaplatené"]];
const PAYERS = [["my", "My"], ["rodB", "Rodičia nevesty"], ["rodA", "Rodičia ženícha"], ["ine", "Iné"]];
const RSVP = [["neodoslane", "Pozvánka neodoslaná"], ["pozvany", "Čaká na odpoveď"], ["pride", "Príde"], ["mozno", "Možno"], ["nepride", "Nepríde"]];
const MENU = [["standard", "Štandardné"], ["vegetarian", "Vegetariánske"], ["vegan", "Vegánske"], ["bezlepok", "Bezlepkové"], ["detske", "Detské"], ["ine", "Iné"]];
const KINDS = [["priprava", "Príprava"], ["obrad", "Obrad"], ["foto", "Fotenie"], ["hostina", "Jedlo a hostina"], ["zabava", "Zábava"], ["tradicia", "Tradícia"], ["ine", "Iné"]];
const COLTYPES = [["text", "Text"], ["number", "Číslo / suma"], ["check", "Zaškrtávacie"], ["date", "Dátum"]];
const TABS = [["prehlad", "Prehľad"], ["checklist", "Checklist"], ["rozpocet", "Rozpočet"], ["hostia", "Hostia"], ["harmonogram", "Harmonogram"], ["poznamky", "Poznámky"], ["tabulky", "Tabuľky"]];

/* ---------- pomocné funkcie ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = v => { const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", ".")); return isFinite(n) ? n : 0; };
const eurF = new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur = n => eurF.format(Math.round(num(n)));
const pad = n => String(n).padStart(2, "0");
const uid = p => (p || "x") + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const parseISO = s => { if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const fmtD = s => { const d = typeof s === "string" ? parseISO(s) : s; return d ? `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}` : ""; };
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const dayDiff = (a, b) => Math.round((b - a) / 86400000);
const plural = (n, one, few, many) => { const a = Math.abs(n); return a === 1 ? one : (a >= 2 && a <= 4 ? few : many); };
const pct = (a, b) => b > 0 ? Math.max(0, Math.min(100, Math.round(a / b * 100))) : 0;
const opt = (pairs, val) => pairs.map(([k, l]) => `<option value="${esc(k)}" ${String(val) === String(k) ? "selected" : ""}>${esc(l)}</option>`).join("");
const lbl = (pairs, k) => (pairs.find(p => p[0] === k) || pairs[0])[1];
const WEEKDAYS = ["nedeľa", "pondelok", "utorok", "streda", "štvrtok", "piatok", "sobota"];

/* ---------- stav ---------- */
function freshState() {
  const T = window.TEMPLATE;
  let order = 0;
  const s = {
    version: 1,
    settings: { ...T.settings },
    sections: T.sections.map(sec => ({ id: sec.id, name: sec.name })),
    tasks: [],
    budgetCats: [],
    budget: [],
    guests: [],
    timeline: [],
    notes: [],
    tables: []
  };
  T.sections.forEach(sec => sec.tasks.forEach(([title, phase, owner, note]) =>
    s.tasks.push({ id: uid("t"), sectionId: sec.id, title, phase, owner, note, due: "", done: false, order: ++order })));
  T.budget.forEach(cat => {
    const cid = uid("c"); s.budgetCats.push({ id: cid, name: cat.name });
    cat.items.forEach(name => s.budget.push({ id: uid("b"), catId: cid, name, vendor: "", payer: "my", planned: 0, actual: 0, paid: 0, due: "", status: "napad", note: "" }));
  });
  s.timeline = T.timeline.map(([time, end, title, desc, place, who, kind]) => ({ id: uid("h"), time, end, title, desc, place, who, kind }));
  s.notes = T.notes.map((n, i) => ({ id: uid("n"), title: n.title, body: n.body, color: i % 2 ? "c-sage" : "", updated: Date.now() }));
  s.tables = T.tables.map(t => {
    const cols = t.columns.map(([name, type]) => ({ id: uid("k"), name, type }));
    return { id: uid("tb"), title: t.title, columns: cols, rows: t.rows.map(r => ({ id: uid("r"), cells: Object.fromEntries(cols.map((c, i) => [c.id, r[i] ?? (c.type === "check" ? false : "")])) })) };
  });
  return s;
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && s.version === 1) return s;
  } catch (e) { /* poškodené dáta – začneme odznova */ }
  return freshState();
}
let S = load();
let storageOk = true;
function save(quiet) {
  try { localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; }
  catch (e) { storageOk = false; toast("Uloženie zlyhalo – stiahnite si zálohu (Export)."); }
  if (!quiet) renderFootSaved();
}

const ui = {
  sec: "all", taskGroup: "sections", taskFilter: "open", owner: "all",
  budgetView: "table",
  guestQ: "", guestSide: "all", guestRsvp: "all", guestGroup: "all",
  table: null
};

/* ---------- odvodené hodnoty ---------- */
const nameA = () => (S.settings.nameA || "Ženích").trim();
const nameB = () => (S.settings.nameB || "Nevesta").trim();
const ownerName = o => o === "A" ? `${nameA()} (ženích)` : o === "B" ? `${nameB()} (nevesta)` : "Spolu";
const ownerShort = o => o === "A" ? nameA() : o === "B" ? nameB() : "Spolu";
const sideName = s => s === "A" ? nameA() : s === "B" ? nameB() : "Spoloční";
const wDate = () => parseISO(S.settings.date);
function phaseDue(key) {
  const W = wDate(); const p = PHASES.find(x => x.key === key);
  if (!W || !p || (p.m === undefined && p.d === undefined)) return null;
  return p.m !== undefined ? new Date(W.getFullYear(), W.getMonth() + p.m, W.getDate()) : new Date(W.getFullYear(), W.getMonth(), W.getDate() + p.d);
}
const effDue = t => parseISO(t.due) || phaseDue(t.phase);
const isLate = t => { const d = effDue(t); return !t.done && d && d < today(); };
const phaseIdx = k => { const i = PHASES.findIndex(p => p.key === k); return i < 0 ? 99 : i; };
const sortTasks = (a, b) => (phaseIdx(a.phase) - phaseIdx(b.phase)) || (num(a.order) - num(b.order));
const cost = e => num(e.actual) > 0 ? num(e.actual) : num(e.planned);
const left = e => Math.max(0, cost(e) - num(e.paid));
const persons = g => Math.max(0, num(g.adults)) + Math.max(0, num(g.kids));
const sectionName = id => (S.sections.find(s => s.id === id) || { name: "Bez sekcie" }).name;
const timeKey = t => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ""); if (!m) return 99999; const v = +m[1] * 60 + +m[2]; return v < 300 ? v + 1440 : v; };
const sortedTimeline = () => S.timeline.slice().sort((a, b) => timeKey(a.time) - timeKey(b.time));

function stats() {
  const tasks = S.tasks;
  const by = o => { const l = tasks.filter(t => t.owner === o); return { total: l.length, done: l.filter(t => t.done).length }; };
  const budget = num(S.settings.budget);
  const est = S.budget.reduce((a, e) => a + cost(e), 0);
  const paid = S.budget.reduce((a, e) => a + num(e.paid), 0);
  const rest = S.budget.reduce((a, e) => a + left(e), 0);
  const coming = S.guests.filter(g => g.rsvp !== "nepride");
  const sum = (list, f) => list.reduce((a, g) => a + f(g), 0);
  return {
    total: tasks.length, done: tasks.filter(t => t.done).length, late: tasks.filter(isLate).length,
    A: by("A"), B: by("B"), AB: by("AB"),
    budget, est, paid, rest,
    invited: sum(S.guests, persons), yes: sum(S.guests.filter(g => g.rsvp === "pride"), persons),
    no: sum(S.guests.filter(g => g.rsvp === "nepride"), persons),
    wait: sum(S.guests.filter(g => g.rsvp === "pozvany" || g.rsvp === "mozno"), persons),
    notSent: sum(S.guests.filter(g => !g.rsvp || g.rsvp === "neodoslane"), persons),
    kids: sum(coming, g => num(g.kids)), adults: sum(coming, g => num(g.adults)),
    lodging: sum(coming.filter(g => g.lodging), persons), transport: sum(coming.filter(g => g.transport), persons)
  };
}

/* ---------- vykreslenie ---------- */
const tab = () => { const h = (location.hash || "").slice(1); return h === "nahlad" || TABS.some(t => t[0] === h) ? h : "prehlad"; };
let renderQueued = false;
function renderSoon() { if (renderQueued) return; renderQueued = true; setTimeout(() => { renderQueued = false; render(); }, 0); }

function render() {
  const ae = document.activeElement;
  const fid = ae && ae.id && $("view").contains(ae) ? ae.id : null;
  const sel = fid && typeof ae.selectionStart === "number" ? [ae.selectionStart, ae.selectionEnd] : null;
  const t = tab();
  document.body.classList.toggle("is-preview", t === "nahlad");
  renderHero(); renderNav(); renderFoot();
  const views = { prehlad: vOverview, checklist: vChecklist, rozpocet: vBudget, hostia: vGuests, harmonogram: vTimeline, poznamky: vNotes, tabulky: vTables, nahlad: vPreview };
  $("view").innerHTML = views[t]();
  if (fid) { const el = $(fid); if (el) { el.focus(); if (sel && el.setSelectionRange) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { } } }
}

function renderHero() {
  const W = wDate(); const st = S.settings;
  const meta = [];
  meta.push(W ? `<span><b>${esc(fmtD(W))}</b>${st.time ? " o " + esc(st.time) : ""} · ${WEEKDAYS[W.getDay()]}</span>` : `<span>Dátum ešte nie je určený</span>`);
  if (st.ceremony) meta.push(`<span>Obrad: <b>${esc(st.ceremony)}</b></span>`);
  if (st.venue) meta.push(`<span>Hostina: <b>${esc(st.venue)}</b></span>`);
  let count;
  if (!W) count = `<button class="btn primary" data-act="settings" type="button">Nastaviť dátum svadby</button>`;
  else {
    const n = dayDiff(today(), W);
    count = n > 0 ? `<div class="big">${n}</div><div class="lbl">${plural(n, "deň", "dni", "dní")} do svadby</div>`
      : n === 0 ? `<div class="big">Dnes</div><div class="lbl">je váš deň</div>`
      : `<div class="big">${-n}</div><div class="lbl">${plural(-n, "deň", "dni", "dní")} od svadby</div>`;
  }
  $("hero").innerHTML = `<div class="wrap hero-in">
    <div><div class="eyebrow">Svadobný plánovač</div>
      <h1 class="names">${esc(nameA())}<span class="amp">&amp;</span>${esc(nameB())}</h1>
      <div class="hero-meta">${meta.join("")}</div></div>
    <div class="hero-right"><div class="count">${count}</div>
      <div class="hero-actions"><button class="btn sm" data-act="settings" type="button">Nastavenia</button><button class="btn sm ghost" data-act="dataMenu" type="button">Záloha dát</button></div></div>
  </div>`;
}
function renderNav() {
  const t = tab() === "nahlad" ? "harmonogram" : tab();
  const s = stats();
  const counts = { checklist: s.total - s.done, hostia: s.invited - s.no };
  $("nav").innerHTML = TABS.map(([k, l]) => `<a href="#${k}" ${k === t ? 'aria-current="page"' : ""}>${l}${counts[k] ? `<span class="cnt">${counts[k]}</span>` : ""}</a>`).join("");
}
function renderFoot() {
  $("foot").innerHTML = `<span id="savedInfo">${storageOk ? "Všetko sa ukladá automaticky v tomto prehliadači." : "Pozor: uloženie v prehliadači nefunguje."}</span>
    <button class="btn sm ghost" data-act="export" type="button">Stiahnuť zálohu</button>
    <button class="btn sm ghost" data-act="import" type="button">Načítať zálohu</button>
    <button class="btn sm ghost" data-act="lock" type="button">Zamknúť</button>`;
}
let savedTimer;
function renderFootSaved() {
  const el = $("savedInfo"); if (!el) return;
  el.textContent = storageOk ? "Uložené ✓" : "Pozor: uloženie v prehliadači nefunguje.";
  clearTimeout(savedTimer); savedTimer = setTimeout(() => { if ($("savedInfo") && storageOk) $("savedInfo").textContent = "Všetko sa ukladá automaticky v tomto prehliadači."; }, 1600);
}
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.tm); toast.tm = setTimeout(() => t.classList.remove("on"), 2200); }

/* ---------- Prehľad ---------- */
function taskRow(t, opts = {}) {
  const d = effDue(t); const late = isLate(t);
  const own = t.owner === "A" ? "" : t.owner === "B" ? "rose" : "line";
  const sub = [t.note, opts.showSection ? sectionName(t.sectionId) : ""].filter(Boolean);
  return `<div class="row ${t.done ? "done" : ""}">
    <label class="check"><input type="checkbox" id="ck-${esc(t.id)}" data-act="toggleTask" data-id="${esc(t.id)}" ${t.done ? "checked" : ""} aria-label="Hotovo: ${esc(t.title)}"></label>
    <div><button class="t" type="button" data-act="editTask" data-id="${esc(t.id)}">${esc(t.title)}</button>${sub.map(x => `<span class="sub">${esc(x)}</span>`).join("")}</div>
    <div class="meta"><span class="pill ${own}">${esc(ownerShort(t.owner))}</span>${d ? `<span class="due ${late ? "late" : ""}">${late ? "Po termíne · " : ""}${esc(fmtD(d))}</span>` : `<span class="due">${esc((PHASES.find(p => p.key === t.phase) || PHASES[9]).short)}</span>`}</div>
  </div>`;
}
function vOverview() {
  const s = stats(); const W = wDate();
  const over = s.budget > 0 && s.est > s.budget;
  const next = S.tasks.filter(t => !t.done && effDue(t)).sort((a, b) => effDue(a) - effDue(b) || sortTasks(a, b)).slice(0, 8);
  const pays = S.budget.filter(e => left(e) > 0 && parseISO(e.due)).sort((a, b) => parseISO(a.due) - parseISO(b.due)).slice(0, 5);
  const prog = sortedTimeline().slice(0, 6);
  const ownRow = (name, o) => `<div class="r"><span>${esc(name)}</span><div class="bar"><i class="sage" style="width:${pct(o.done, o.total)}%"></i></div><span class="num muted">${o.done}/${o.total}</span></div>`;
  return `
  <section class="stats">
    <div class="card pad stat"><div class="k">Checklist</div>
      <div class="v">${s.done}<small> / ${s.total}</small></div><div class="s">hotových úloh${s.late ? ` · <span style="color:var(--crit);font-weight:700">${s.late} po termíne</span>` : ""}</div>
      <div class="split">${ownRow("Ženích", s.A)}${ownRow("Nevesta", s.B)}${ownRow("Spolu", s.AB)}</div></div>
    <div class="card pad stat"><div class="k">Rozpočet</div>
      <div class="v">${eur(s.est)}</div><div class="s">${s.budget ? `odhad nákladov z ${eur(s.budget)}` : "odhad nákladov · celkový rozpočet nie je nastavený"}</div>
      <div class="bar"><i class="${over ? "crit" : ""}" style="width:${pct(s.est, s.budget)}%"></i></div>
      <div class="foot2">${s.budget ? (over ? `<span class="pill crit">Prekročené o ${eur(s.est - s.budget)}</span>` : `<span class="pill sage">Rezerva ${eur(s.budget - s.est)}</span>`) : `<button class="btn sm" data-act="settings" type="button">Nastaviť rozpočet</button>`}</div></div>
    <div class="card pad stat"><div class="k">Zaplatené</div>
      <div class="v">${eur(s.paid)}</div><div class="s">zostáva doplatiť ${eur(s.rest)}</div>
      <div class="bar"><i class="sage" style="width:${pct(s.paid, s.est)}%"></i></div>
      <div class="foot2">${pays.length ? `<span class="pill">Najbližšia platba ${esc(fmtD(pays[0].due))}</span>` : `<span class="pill line">Žiadne naplánované platby</span>`}</div></div>
    <div class="card pad stat"><div class="k">Hostia</div>
      <div class="v">${s.yes}<small> / ${s.invited - s.no}</small></div><div class="s">potvrdených osôb${s.kids ? ` · ${s.kids} ${plural(s.kids, "dieťa", "deti", "detí")}` : ""}</div>
      <div class="bar"><i class="sage" style="width:${pct(s.yes, s.invited - s.no)}%"></i></div>
      <div class="foot2">${s.wait ? `<span class="pill">Čaká na odpoveď ${s.wait}</span>` : ""}${s.notSent ? `<span class="pill line">Neodoslané ${s.notSent}</span>` : ""}${!S.guests.length ? `<a class="btn sm" href="#hostia">Pridať hostí</a>` : ""}</div></div>
  </section>
  <section class="cols">
    <div><div class="sec-title"><h2>Čo je na rade</h2><a href="#checklist" class="small">Celý checklist →</a></div>
      ${!W ? `<div class="list"><div class="empty">Zadajte dátum svadby a úlohy dostanú termíny podľa toho, koľko času zostáva.<br><button class="btn primary" data-act="settings" type="button">Nastaviť dátum</button></div></div>`
        : next.length ? `<div class="list">${next.map(t => taskRow(t, { showSection: true })).join("")}</div>` : `<div class="list"><div class="empty">Všetky úlohy s termínom sú hotové.</div></div>`}
    </div>
    <div class="stack">
      <div><div class="sec-title"><h2>Najbližšie platby</h2><a href="#rozpocet" class="small">Rozpočet →</a></div>
        <div class="list">${pays.length ? pays.map(e => `<div class="row"><span class="dot" style="--k:${parseISO(e.due) < today() ? "var(--crit)" : "var(--sea)"}"></span>
          <div><span class="t" style="cursor:default">${esc(e.name)}</span><span class="sub">${esc(e.vendor || catName(e.catId))}</span></div>
          <div class="meta"><span class="due ${parseISO(e.due) < today() ? "late" : ""}">${esc(fmtD(e.due))}</span><b class="num">${eur(left(e))}</b></div></div>`).join("")
          : `<div class="empty">Keď v Rozpočte vyplníte termín platby, objaví sa tu.</div>`}</div></div>
      <div><div class="sec-title"><h2>Program dňa</h2><a href="#nahlad" class="small">Náhľad →</a></div>
        <div class="list">${prog.length ? prog.map(h => `<div class="row"><span class="tl-time" style="font-size:20px">${esc(h.time)}</span><div><span class="t" style="cursor:default"><span class="dot k-${esc(h.kind || "ine")}"></span>${esc(h.title)}</span></div><div></div></div>`).join("")
          : `<div class="empty">Harmonogram je prázdny.</div>`}</div></div>
    </div>
  </section>`;
}

/* ---------- Checklist ---------- */
function vChecklist() {
  const secs = S.sections;
  const prog = id => { const l = id === "all" ? S.tasks : S.tasks.filter(t => t.sectionId === id); return [l.filter(t => t.done).length, l.length]; };
  const sideBtn = (id, name) => { const [d, n] = prog(id); return `<button type="button" data-act="sec" data-id="${esc(id)}" aria-current="${ui.sec === id}"><span>${esc(name)}</span><span class="c">${d}/${n}</span><span class="bar"><i class="sage" style="width:${pct(d, n)}%"></i></span></button>`; };
  if (ui.sec !== "all" && !secs.some(s => s.id === ui.sec)) ui.sec = "all";

  let list = S.tasks.slice();
  if (ui.sec !== "all") list = list.filter(t => t.sectionId === ui.sec);
  if (ui.owner !== "all") list = list.filter(t => t.owner === ui.owner);
  if (ui.taskFilter === "open") list = list.filter(t => !t.done);
  if (ui.taskFilter === "done") list = list.filter(t => t.done);
  if (ui.taskFilter === "late") list = list.filter(isLate);
  list.sort(sortTasks);

  const cur = secs.find(s => s.id === ui.sec);
  const quick = secId => `<form class="quick" data-form="quickTask" data-sec="${esc(secId)}">
      <input class="input" id="qa-${esc(secId)}" placeholder="Pridať úlohu do „${esc(sectionName(secId))}“ a stlačiť Enter…" aria-label="Nová úloha">
      <select class="input" id="qo-${esc(secId)}" aria-label="Kto">${opt([["AB", "Spolu"], ["A", nameA()], ["B", nameB()]], secId === "s-zenich" ? "A" : secId === "s-nevesta" ? "B" : "AB")}</select>
      <button class="btn sm" type="submit">Pridať</button></form>`;

  let body = "";
  const filterEmpty = `<div class="empty">Tomuto filtru nezodpovedá žiadna úloha.</div>`;
  if (ui.taskGroup === "sections") {
    const groups = ui.sec === "all" ? secs : [cur];
    body = groups.map(sec => {
      const items = list.filter(t => t.sectionId === sec.id);
      const [d, n] = prog(sec.id);
      return `<section class="group"><div class="group-h"><h3>${esc(sec.name)}</h3><div class="r"><span class="num">${d}/${n} hotovo</span><span class="bar"><i class="sage" style="width:${pct(d, n)}%"></i></span>
          <button class="btn sm ghost" type="button" data-act="editSection" data-id="${esc(sec.id)}">Upraviť sekciu</button></div></div>
        <div class="list">${items.map(t => taskRow(t)).join("") || (n ? filterEmpty : `<div class="empty">Sekcia je zatiaľ prázdna.</div>`)}${quick(sec.id)}</div></section>`;
    }).join("");
  } else {
    body = PHASES.map(p => {
      const items = list.filter(t => (t.phase || "x") === p.key);
      if (!items.length) return "";
      const pd = phaseDue(p.key);
      return `<section class="group"><div class="group-h"><h3>${esc(p.label)}</h3><div class="r">${pd ? `<span>do ${esc(fmtD(pd))}</span>` : ""}<span>${items.length} ${plural(items.length, "úloha", "úlohy", "úloh")}</span></div></div>
        <div class="list">${items.map(t => taskRow(t, { showSection: ui.sec === "all" })).join("")}</div></section>`;
    }).join("") || `<div class="list">${filterEmpty}</div>`;
  }
  const late = S.tasks.filter(isLate).length;
  const seg = (k, l) => `<button type="button" data-act="taskFilter" data-v="${k}" aria-pressed="${ui.taskFilter === k}">${l}</button>`;
  return `<div class="cl">
    <aside class="side" aria-label="Sekcie checklistu">${sideBtn("all", "Všetky úlohy")}<div class="lbl">Sekcie</div>${secs.map(s => sideBtn(s.id, s.name)).join("")}
      <button type="button" class="add" data-act="addSection">+ Nová sekcia</button></aside>
    <div>
      <div class="page-head"><div><h2>${esc(cur ? cur.name : "Všetky úlohy")}</h2>
        <p>${wDate() ? "Termíny sa počítajú od dátumu svadby; úlohe môžete dať aj vlastný dátum." : "Zadajte dátum svadby v Nastaveniach a úlohy dostanú termíny."}</p></div>
        <button class="btn primary" type="button" data-act="addTask">+ Nová úloha</button></div>
      <div class="toolbar"><div class="grp">
        <div class="seg" role="group" aria-label="Stav úloh">${seg("open", "Nesplnené")}${seg("late", "Po termíne" + (late ? ` (${late})` : ""))}${seg("done", "Hotové")}${seg("all", "Všetky")}</div>
        <select class="input" id="ownerSel" data-act="owner" aria-label="Kto">${opt([["all", "Ženích aj nevesta"], ["A", "Ženích – " + nameA()], ["B", "Nevesta – " + nameB()], ["AB", "Spoločné"]], ui.owner)}</select></div>
        <div class="seg" role="group" aria-label="Zoskupenie"><button type="button" data-act="taskGroup" data-v="sections" aria-pressed="${ui.taskGroup === "sections"}">Podľa sekcií</button><button type="button" data-act="taskGroup" data-v="time" aria-pressed="${ui.taskGroup === "time"}">Podľa času</button></div>
      </div>
      ${body}
    </div></div>`;
}

/* ---------- Rozpočet ---------- */
const catName = id => (S.budgetCats.find(c => c.id === id) || { name: "Ostatné" }).name;
function vBudget() {
  const s = stats(); const over = s.budget > 0 && s.est > s.budget;
  const cats = S.budgetCats;
  const totals = list => ({ planned: list.reduce((a, e) => a + num(e.planned), 0), actual: list.reduce((a, e) => a + num(e.actual), 0), paid: list.reduce((a, e) => a + num(e.paid), 0), left: list.reduce((a, e) => a + left(e), 0), cost: list.reduce((a, e) => a + cost(e), 0) });
  const all = totals(S.budget);
  const nInput = (e, k) => `<input class="cell" type="number" min="0" step="any" inputmode="decimal" id="b-${esc(e.id)}-${k}" data-bud="${esc(e.id)}" data-k="${k}" value="${num(e[k]) ? num(e[k]) : ""}" placeholder="0" aria-label="${k}">`;
  const rows = cats.map(c => {
    const items = S.budget.filter(e => e.catId === c.id);
    const t = totals(items);
    return `<tr class="cat"><td colspan="10"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <span class="name">${esc(c.name)}</span><span style="display:flex;gap:6px;align-items:center"><span class="num small muted" style="margin-right:8px">${eur(t.cost)}</span>
        <button class="btn sm" type="button" data-act="addBud" data-id="${esc(c.id)}">+ Položka</button>
        <button class="btn sm ghost" type="button" data-act="editCat" data-id="${esc(c.id)}">Premenovať</button>
        <button class="btn sm ghost danger" type="button" data-act="delCat" data-id="${esc(c.id)}">Zmazať</button></span></div></td></tr>
      ${items.map(e => `<tr>
        <td><input class="cell wide left-col" id="b-${esc(e.id)}-name" data-bud="${esc(e.id)}" data-k="name" value="${esc(e.name)}" aria-label="Položka"></td>
        <td><input class="cell" id="b-${esc(e.id)}-vendor" data-bud="${esc(e.id)}" data-k="vendor" value="${esc(e.vendor)}" placeholder="dodávateľ" aria-label="Dodávateľ"></td>
        <td><select class="cell" id="b-${esc(e.id)}-payer" data-bud="${esc(e.id)}" data-k="payer" aria-label="Kto platí">${opt(PAYERS, e.payer || "my")}</select></td>
        <td>${nInput(e, "planned")}</td><td>${nInput(e, "actual")}</td><td>${nInput(e, "paid")}</td>
        <td class="ro r num ${left(e) > 0 ? "" : "muted"}">${left(e) > 0 ? eur(left(e)) : "–"}</td>
        <td><input class="cell" type="date" id="b-${esc(e.id)}-due" data-bud="${esc(e.id)}" data-k="due" value="${esc(e.due)}" aria-label="Termín platby" style="min-width:130px"></td>
        <td><select class="cell st s-${esc(e.status)}" id="b-${esc(e.id)}-status" data-bud="${esc(e.id)}" data-k="status" aria-label="Stav">${opt(EXP_STATUS, e.status)}</select></td>
        <td class="ro"><button class="btn icon ghost" type="button" data-act="editBud" data-id="${esc(e.id)}" title="Detail a poznámka" aria-label="Detail">✎</button><button class="btn icon ghost danger" type="button" data-act="delBud" data-id="${esc(e.id)}" title="Zmazať" aria-label="Zmazať">×</button></td>
      </tr>`).join("")}
      ${items.length ? `<tr class="sum"><td class="ro" colspan="3">Spolu ${esc(c.name)}</td><td class="ro r num">${eur(t.planned)}</td><td class="ro r num">${eur(t.actual)}</td><td class="ro r num">${eur(t.paid)}</td><td class="ro r num">${eur(t.left)}</td><td colspan="3"></td></tr>` : ""}`;
  }).join("");

  const catStats = cats.map(c => { const l = S.budget.filter(e => e.catId === c.id); return { name: c.name, cost: l.reduce((a, e) => a + cost(e), 0), paid: l.reduce((a, e) => a + num(e.paid), 0) }; }).filter(x => x.cost > 0).sort((a, b) => b.cost - a.cost);
  const maxC = Math.max(1, ...catStats.map(x => x.cost));
  const payerStats = PAYERS.map(([k, l]) => ({ l, v: S.budget.filter(e => (e.payer || "my") === k).reduce((a, e) => a + cost(e), 0) })).filter(x => x.v > 0);

  return `<div class="page-head"><div><h2>Rozpočet</h2><p>Píšte rovno do tabuľky. Odhad nákladov sa ráta z dohodnutej ceny, a kde ešte nie je, z vášho odhadu.</p></div>
    <div class="grp" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-act="addCat">+ Kategória</button><button class="btn" type="button" data-act="budgetCsv">Stiahnuť do Excelu</button></div></div>
  <div class="sumgrid">
    <div><div class="k">Celkový rozpočet</div><div class="v">${s.budget ? eur(s.budget) : `<button class="btn sm" data-act="settings" type="button">Nastaviť</button>`}</div></div>
    <div><div class="k">Odhad nákladov</div><div class="v">${eur(s.est)}</div></div>
    <div><div class="k">${over ? "Prekročenie" : "Rezerva"}</div><div class="v ${over ? "crit" : s.budget ? "sage" : ""}">${s.budget ? eur(Math.abs(s.budget - s.est)) : "–"}</div></div>
    <div><div class="k">Zaplatené</div><div class="v">${eur(s.paid)}</div></div>
    <div><div class="k">Zostáva doplatiť</div><div class="v">${eur(s.rest)}</div></div>
  </div>
  <div class="tbl-wrap" style="margin-bottom:30px"><table class="grid">
    <thead><tr><th>Položka</th><th>Dodávateľ</th><th>Kto platí</th><th class="r">Odhad €</th><th class="r">Cena €</th><th class="r">Zaplatené €</th><th class="r">Zostáva</th><th>Termín platby</th><th>Stav</th><th></th></tr></thead>
    <tbody>${rows || `<tr><td colspan="10" class="empty">Zatiaľ žiadne kategórie.</td></tr>`}</tbody>
    <tfoot><tr><td colspan="3">Spolu</td><td class="r num">${eur(all.planned)}</td><td class="r num">${eur(all.actual)}</td><td class="r num">${eur(all.paid)}</td><td class="r num">${eur(all.left)}</td><td colspan="3"></td></tr></tfoot>
  </table></div>
  <section class="cols">
    <div class="card pad"><h3 style="margin-bottom:12px">Podľa kategórií</h3>
      ${catStats.length ? `<div class="legend"><span><i style="background:var(--sage)"></i>zaplatené</span><span><i style="background:var(--sea);opacity:.45"></i>odhad nákladov</span></div>
      <div class="catbars">${catStats.map(x => `<div class="catbar"><div class="l"><span>${esc(x.name)}</span><span class="num">${eur(x.cost)}</span></div><div class="bar"><i class="gold" style="width:${x.cost / maxC * 100}%"></i><i class="sage" style="width:${Math.min(x.paid, x.cost) / maxC * 100}%"></i></div></div>`).join("")}</div>`
      : `<p class="muted">Keď vyplníte sumy, uvidíte tu, kam idú peniaze.</p>`}</div>
    <div class="card pad"><h3 style="margin-bottom:12px">Kto čo platí</h3>
      ${payerStats.length ? `<div class="catbars">${payerStats.map(x => `<div class="catbar"><div class="l"><span>${esc(x.l)}</span><span class="num">${eur(x.v)} · ${pct(x.v, s.est)} %</span></div><div class="bar"><i style="width:${pct(x.v, s.est)}%"></i></div></div>`).join("")}</div>`
      : `<p class="muted">Pri položkách vyberte, kto ich platí.</p>`}</div>
  </section>`;
}

/* ---------- Hostia ---------- */
function vGuests() {
  const s = stats();
  const groups = [...new Set(S.guests.map(g => (g.group || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "sk"));
  const q = ui.guestQ.trim().toLowerCase();
  let list = S.guests.slice().sort((a, b) => String(a.name).localeCompare(b.name, "sk"));
  if (q) list = list.filter(g => [g.name, g.group, g.prefs, g.allergies, g.note, g.table, g.phone].join(" ").toLowerCase().includes(q));
  if (ui.guestSide !== "all") list = list.filter(g => (g.side || "AB") === ui.guestSide);
  if (ui.guestRsvp !== "all") list = list.filter(g => (g.rsvp || "neodoslane") === ui.guestRsvp);
  if (ui.guestGroup !== "all") list = list.filter(g => (g.group || "").trim() === ui.guestGroup);
  const coming = S.guests.filter(g => g.rsvp !== "nepride");
  const menuCounts = MENU.map(([k, l]) => ({ l, n: coming.filter(g => (g.menu || "standard") === k).reduce((a, g) => a + num(g.adults), 0) + (k === "detske" ? coming.reduce((a, g) => a + num(g.kids), 0) : 0) })).filter(x => x.n);
  const sideCounts = [["A", nameA()], ["B", nameB()], ["AB", "Spoloční"]].map(([k, l]) => ({ l, n: coming.filter(g => (g.side || "AB") === k).reduce((a, g) => a + persons(g), 0) })).filter(x => x.n);
  const rsvpCls = r => r === "pride" ? "sage" : r === "nepride" ? "crit" : r === "neodoslane" ? "line" : "";
  const listPersons = list.reduce((a, g) => a + persons(g), 0);
  return `<div class="page-head"><div><h2>Hostia</h2><p>Pár alebo rodinu zapíšte ako jeden záznam s počtom dospelých a detí.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-act="guestCsv" ${S.guests.length ? "" : "disabled"}>Stiahnuť do Excelu</button><button class="btn primary" type="button" data-act="addGuest">+ Pridať hosťa</button></div></div>
  <div class="sumgrid">
    <div><div class="k">Na zozname</div><div class="v">${s.invited}</div></div>
    <div><div class="k">Príde</div><div class="v sage">${s.yes}</div></div>
    <div><div class="k">Čaká / možno</div><div class="v">${s.wait}</div></div>
    <div><div class="k">Nepríde</div><div class="v">${s.no}</div></div>
    <div><div class="k">Deti</div><div class="v">${s.kids}</div></div>
    <div><div class="k">Ubytovanie</div><div class="v">${s.lodging}</div></div>
    <div><div class="k">Odvoz</div><div class="v">${s.transport}</div></div>
  </div>
  ${coming.length ? `<div style="display:grid;gap:10px;margin-bottom:22px">
    <div class="chips"><span class="small muted" style="align-self:center;min-width:90px">Menu:</span>${menuCounts.map(x => `<span class="chip">${esc(x.l)} <b>${x.n}</b></span>`).join("")}</div>
    <div class="chips"><span class="small muted" style="align-self:center;min-width:90px">Podľa strany:</span>${sideCounts.map(x => `<span class="chip">${esc(x.l)} <b>${x.n}</b></span>`).join("")}</div></div>` : ""}
  <div class="toolbar"><div class="grp">
    <input class="input" type="search" id="guestQ" data-act="guestQ" placeholder="Hľadať meno, stôl, alergiu…" value="${esc(ui.guestQ)}" aria-label="Hľadať">
    <select class="input" id="guestSide" data-act="guestSide" aria-label="Strana">${opt([["all", "Obe strany"], ["A", "Strana " + nameA()], ["B", "Strana " + nameB()], ["AB", "Spoloční"]], ui.guestSide)}</select>
    <select class="input" id="guestRsvp" data-act="guestRsvp" aria-label="Odpoveď">${opt([["all", "Každá odpoveď"], ...RSVP], ui.guestRsvp)}</select>
    ${groups.length ? `<select class="input" id="guestGroup" data-act="guestGroup" aria-label="Skupina">${opt([["all", "Všetky skupiny"], ...groups.map(g => [g, g])], ui.guestGroup)}</select>` : ""}
  </div><span class="small muted">${list.length} ${plural(list.length, "záznam", "záznamy", "záznamov")} · ${listPersons} ${plural(listPersons, "osoba", "osoby", "osôb")}</span></div>
  ${list.length ? `<div class="tbl-wrap"><table class="grid">
    <thead><tr><th>Meno</th><th>Strana</th><th>Skupina</th><th class="r">Dosp.</th><th class="r">Deti</th><th>Odpoveď</th><th>Menu</th><th>Alergie a preferencie</th><th>Ubyt.</th><th>Stôl</th></tr></thead>
    <tbody>${list.map(g => `<tr>
      <td class="ro"><button class="btn ghost sm" style="font-weight:700;color:var(--ink);padding-left:0" type="button" data-act="editGuest" data-id="${esc(g.id)}">${esc(g.name)}</button></td>
      <td class="ro"><span class="pill ${g.side === "B" ? "rose" : g.side === "A" ? "" : "line"}">${esc(sideName(g.side || "AB"))}</span></td>
      <td class="ro muted">${esc(g.group)}</td>
      <td class="ro r num">${num(g.adults)}</td><td class="ro r num">${num(g.kids) || "–"}</td>
      <td><select class="cell st" id="gr-${esc(g.id)}" data-guest="${esc(g.id)}" data-k="rsvp" aria-label="Odpoveď">${opt(RSVP, g.rsvp || "neodoslane")}</select></td>
      <td class="ro">${(g.menu && g.menu !== "standard") ? `<span class="pill">${esc(lbl(MENU, g.menu))}</span>` : `<span class="muted">Štandard</span>`}</td>
      <td class="ro small" style="white-space:normal;min-width:180px">${[g.allergies ? `<b style="color:var(--crit)">${esc(g.allergies)}</b>` : "", esc(g.prefs)].filter(Boolean).join(" · ") || `<span class="muted">–</span>`}</td>
      <td class="ro">${g.lodging ? `<span class="pill sage">${num(g.nights) ? num(g.nights) + " " + plural(num(g.nights), "noc", "noci", "nocí") : "áno"}</span>` : ""}</td>
      <td><input class="cell" id="gt-${esc(g.id)}" data-guest="${esc(g.id)}" data-k="table" value="${esc(g.table)}" placeholder="–" aria-label="Stôl" style="min-width:56px;width:64px"></td>
    </tr>`).join("")}</tbody></table></div>`
  : `<div class="list"><div class="empty">${S.guests.length ? "Nikto nezodpovedá filtru." : "Zoznam hostí je zatiaľ prázdny."}<br>${S.guests.length ? "" : `<button class="btn primary" type="button" data-act="addGuest">Pridať prvého hosťa</button>`}</div></div>`}`;
}

/* ---------- Harmonogram ---------- */
function vTimeline() {
  const list = sortedTimeline();
  return `<div class="page-head"><div><h2>Harmonogram dňa</h2><p>Pridajte čas, názov a popis. Body po polnoci (do 5:00) sa radia na koniec dňa.</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn soft" href="#nahlad">Zobraziť náhľad časovej osi</a><button class="btn primary" type="button" data-act="addTl">+ Bod programu</button></div></div>
  <div class="list tl-edit">${list.length ? list.map(h => `<div class="row">
      <div class="tl-time">${esc(h.time || "–")}${h.end ? `<small>do ${esc(h.end)}</small>` : ""}</div>
      <div><button class="t" type="button" data-act="editTl" data-id="${esc(h.id)}"><span class="dot k-${esc(h.kind || "ine")}"></span>${esc(h.title)}</button>
        ${h.desc ? `<span class="sub">${esc(h.desc)}</span>` : ""}${h.place || h.who ? `<span class="sub">${[h.place && "📍 " + h.place, h.who && "Zodpovedá: " + h.who].filter(Boolean).map(esc).join(" · ")}</span>` : ""}</div>
      <div class="meta"><span class="pill line">${esc(lbl(KINDS, h.kind || "ine"))}</span><button class="btn icon ghost danger" type="button" data-act="delTl" data-id="${esc(h.id)}" aria-label="Zmazať">×</button></div>
    </div>`).join("") : `<div class="empty">Program je prázdny.<br><button class="btn primary" type="button" data-act="addTl">Pridať prvý bod</button></div>`}</div>`;
}
function vPreview() {
  const list = sortedTimeline(); const W = wDate();
  const flourish = `<svg class="flourish" viewBox="0 0 120 14" aria-hidden="true"><path d="M2 7 H48 M72 7 H118" stroke="#b9d0dc" stroke-width="1"/><circle cx="54" cy="7" r="4" fill="none" stroke="#2b7297" stroke-width="1.4"/><circle cx="66" cy="7" r="4" fill="none" stroke="#5aa5b8" stroke-width="1.4"/></svg>`;
  return `<div class="preview-bar"><a class="btn" href="#harmonogram">← Späť na úpravy</a><button class="btn primary" type="button" data-act="print">Vytlačiť / uložiť ako PDF</button></div>
  <article class="preview">
    <header class="preview-head"><div class="eyebrow">Program svadobného dňa</div>
      <h1 class="names">${esc(nameA())}<span class="amp">&amp;</span>${esc(nameB())}</h1>
      <div class="date">${W ? esc(`${WEEKDAYS[W.getDay()]}, ${fmtD(W)}`) : ""}${S.settings.venue ? " · " + esc(S.settings.venue) : ""}</div>${flourish}</header>
    ${list.length ? `<div class="ptl">${list.map(h => `<div class="pitem k-${esc(h.kind || "ine")} ${h.kind === "obrad" ? "big" : ""}">
      <div class="time">${esc(h.time)}${h.end ? `<small>– ${esc(h.end)}</small>` : ""}</div><div class="node"></div>
      <div class="body"><h4>${esc(h.title)}</h4>${h.desc ? `<p>${esc(h.desc)}</p>` : ""}${h.place || h.who ? `<div class="where">${h.place ? `<span>${esc(h.place)}</span>` : ""}${h.who ? `<span>${esc(h.who)}</span>` : ""}</div>` : ""}</div>
    </div>`).join("")}</div>` : `<p class="muted" style="text-align:center">Harmonogram je zatiaľ prázdny.</p>`}
  </article>`;
}

/* ---------- Poznámky ---------- */
function vNotes() {
  const list = S.notes.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || num(b.updated) - num(a.updated));
  const when = ts => { const d = new Date(num(ts)); return isNaN(d) ? "" : `${d.getDate()}. ${d.getMonth() + 1}. ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  return `<div class="page-head"><div><h2>Poznámky</h2><p>Píšte rovno do kartičiek, ukladá sa to samo.</p></div><button class="btn primary" type="button" data-act="addNote">+ Nová poznámka</button></div>
  ${list.length ? `<div class="notes">${list.map(n => `<div class="note ${esc(n.color || "")}">
    <input class="nt" id="nt-${esc(n.id)}" data-note="${esc(n.id)}" data-k="title" value="${esc(n.title)}" placeholder="Názov" aria-label="Názov poznámky">
    <textarea id="nb-${esc(n.id)}" data-note="${esc(n.id)}" data-k="body" placeholder="Text poznámky…" aria-label="Text poznámky">${esc(n.body)}</textarea>
    <div class="nf"><span>Upravené ${esc(when(n.updated))}</span><span style="display:flex;gap:10px;align-items:center">
      <span class="swatches">${[["", "#f6fbfd"], ["c-rose", "#eaf2fb"], ["c-sage", "#ebf6f2"]].map(([c, bg]) => `<button type="button" data-act="noteColor" data-id="${esc(n.id)}" data-v="${c}" style="background:${bg}" aria-label="Farba"></button>`).join("")}</span>
      <button class="btn sm ghost danger" type="button" data-act="delNote" data-id="${esc(n.id)}">Zmazať</button></span></div>
  </div>`).join("")}</div>` : `<div class="list"><div class="empty">Žiadne poznámky.</div></div>`}`;
}

/* ---------- Tabuľky ---------- */
function vTables() {
  if (!S.tables.some(t => t.id === ui.table)) ui.table = S.tables[0] ? S.tables[0].id : null;
  const t = S.tables.find(x => x.id === ui.table);
  const side = `<aside class="side" aria-label="Tabuľky"><div class="lbl">Vaše tabuľky</div>${S.tables.map(x => `<button type="button" data-act="pickTable" data-id="${esc(x.id)}" aria-current="${x.id === ui.table}"><span>${esc(x.title)}</span><span class="c">${x.rows.length}</span></button>`).join("")}
    <button type="button" class="add" data-act="addTable">+ Nová tabuľka</button></aside>`;
  if (!t) return `<div class="cl">${side}<div class="list"><div class="empty">Zatiaľ žiadne tabuľky.<br><button class="btn primary" type="button" data-act="addTable">Vytvoriť tabuľku</button></div></div></div>`;
  const cell = (r, c) => {
    const v = r.cells[c.id]; const id = `tc-${r.id}-${c.id}`;
    const attrs = `id="${esc(id)}" data-tbl="${esc(t.id)}" data-row="${esc(r.id)}" data-col="${esc(c.id)}"`;
    if (c.type === "check") return `<td class="ro" style="text-align:center"><label class="check"><input type="checkbox" ${attrs} ${v ? "checked" : ""} aria-label="${esc(c.name)}"></label></td>`;
    if (c.type === "number") return `<td><input class="cell" type="number" step="any" inputmode="decimal" ${attrs} value="${v === "" || v == null ? "" : esc(v)}" aria-label="${esc(c.name)}"></td>`;
    if (c.type === "date") return `<td><input class="cell" type="date" ${attrs} value="${esc(v)}" aria-label="${esc(c.name)}" style="min-width:130px"></td>`;
    return `<td><input class="cell ${c === t.columns[0] ? "wide left-col" : ""}" ${attrs} value="${esc(v)}" aria-label="${esc(c.name)}"></td>`;
  };
  const hasNum = t.columns.some(c => c.type === "number" || c.type === "check");
  const foot = hasNum ? `<tfoot><tr>${t.columns.map((c, i) => {
    if (c.type === "number") return `<td class="r num">${eur(t.rows.reduce((a, r) => a + num(r.cells[c.id]), 0)).replace(/\s?€/, "")}</td>`;
    if (c.type === "check") return `<td style="text-align:center" class="num">${t.rows.filter(r => r.cells[c.id]).length}/${t.rows.length}</td>`;
    return `<td>${i === 0 ? "Spolu" : ""}</td>`;
  }).join("")}<td></td></tr></tfoot>` : "";
  return `<div class="cl">${side}<div>
    <div class="page-head"><div style="flex:1;min-width:240px"><input class="input" id="tblTitle" data-act="tblTitle" data-id="${esc(t.id)}" value="${esc(t.title)}" aria-label="Názov tabuľky" style="font-size:24px;font-weight:700;border-color:transparent;background:transparent;padding:0 4px;width:100%"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-act="addCol">+ Stĺpec</button><button class="btn" type="button" data-act="tableCsv">Stiahnuť do Excelu</button><button class="btn ghost danger" type="button" data-act="delTable">Zmazať tabuľku</button></div></div>
    <div class="tbl-wrap"><table class="grid">
      <thead><tr>${t.columns.map(c => `<th class="colh ${c.type === "number" ? "r" : ""}"><button type="button" data-act="editCol" data-id="${esc(c.id)}" title="Upraviť stĺpec">${esc(c.name)} ✎</button></th>`).join("")}<th></th></tr></thead>
      <tbody>${t.rows.map(r => `<tr>${t.columns.map(c => cell(r, c)).join("")}<td class="ro"><button class="btn icon ghost danger" type="button" data-act="delRow" data-id="${esc(r.id)}" aria-label="Zmazať riadok">×</button></td></tr>`).join("") || `<tr><td colspan="${t.columns.length + 1}" class="empty">Žiadne riadky.</td></tr>`}</tbody>
      ${foot}
    </table></div>
    <div style="margin-top:12px"><button class="btn" type="button" data-act="addRow">+ Riadok</button> <span class="small muted" style="margin-left:8px">Na úpravu stĺpca kliknite na jeho názov.</span></div>
  </div></div>`;
}

/* ---------- Formuláre (modal) ---------- */
let modalOpen = false;
function openForm({ title, fields, values = {}, onSave, onDelete, hint, saveLabel = "Uložiť" }) {
  const v = k => values[k] ?? "";
  const html = fields.map(fd => {
    const id = "f_" + fd.k, cls = fd.full ? "full" : "";
    if (fd.type === "checkbox") return `<label class="cb ${cls}"><span class="check"><input type="checkbox" id="${id}" ${values[fd.k] ? "checked" : ""}></span>${esc(fd.label)}</label>`;
    let input;
    if (fd.type === "select") input = `<select class="input" id="${id}">${opt(fd.options, v(fd.k) !== "" ? v(fd.k) : (fd.def ?? ""))}</select>`;
    else if (fd.type === "textarea") input = `<textarea class="input" id="${id}" placeholder="${esc(fd.ph || "")}">${esc(v(fd.k))}</textarea>`;
    else {
      const val = fd.type === "number" && !num(v(fd.k)) && !fd.keepZero ? "" : v(fd.k);
      input = `<input class="input" id="${id}" type="${fd.type === "number" ? "number" : (fd.type || "text")}" ${fd.type === "number" ? 'step="any" min="0" inputmode="decimal"' : ""} value="${esc(val)}" placeholder="${esc(fd.ph || "")}" ${fd.list ? `list="dl_${fd.k}"` : ""}>${fd.list ? `<datalist id="dl_${fd.k}">${fd.list.map(x => `<option value="${esc(x)}">`).join("")}</datalist>` : ""}`;
    }
    return `<label class="${cls}">${esc(fd.label)}${input}</label>`;
  }).join("");
  $("modal").innerHTML = `<form id="mform" novalidate><h2 id="modalTitle">${esc(title)}</h2><div class="fields">${html}</div>${hint ? `<div class="hint">${hint}</div>` : ""}<p class="err" id="ferr"></p>
    <div class="actions">${onDelete ? `<button class="btn ghost danger" type="button" id="mdel">Zmazať</button>` : ""}<div class="r"><button class="btn" type="button" data-act="closeModal">Zrušiť</button>${onSave ? `<button class="btn primary" type="submit">${esc(saveLabel)}</button>` : ""}</div></div></form>`;
  $("modalBack").classList.add("open"); modalOpen = true;
  const first = $("modal").querySelector(".input"); if (first) first.focus();
  $("mform").addEventListener("submit", ev => {
    ev.preventDefault();
    const out = {};
    for (const fd of fields) {
      const el = $("f_" + fd.k);
      out[fd.k] = fd.type === "checkbox" ? el.checked : fd.type === "number" ? num(el.value) : el.value.trim();
      if (fd.req && !out[fd.k]) { $("ferr").textContent = `Vyplňte „${fd.label}“.`; el.focus(); return; }
    }
    if (onSave(out) !== false) { closeModal(); save(); render(); }
  });
  const del = $("mdel");
  if (del) del.addEventListener("click", () => {
    if (!del.dataset.armed) { del.dataset.armed = "1"; del.textContent = "Naozaj zmazať?"; del.classList.remove("ghost"); return; }
    onDelete(); closeModal(); save(); render();
  });
}
function closeModal() { $("modalBack").classList.remove("open"); $("modal").innerHTML = ""; modalOpen = false; }

const ownerOpts = () => [["AB", "Spolu"], ["A", `${nameA()} (ženích)`], ["B", `${nameB()} (nevesta)`]];
function taskForm(t) {
  const isNew = !t;
  const defSec = ui.sec !== "all" ? ui.sec : (S.sections[0] || {}).id;
  openForm({
    title: isNew ? "Nová úloha" : "Upraviť úlohu",
    values: t || { sectionId: defSec, phase: suggestPhase(), owner: defSec === "s-zenich" ? "A" : defSec === "s-nevesta" ? "B" : "AB" },
    fields: [
      { k: "title", label: "Úloha", full: true, req: true },
      { k: "sectionId", label: "Sekcia", type: "select", options: S.sections.map(s => [s.id, s.name]) },
      { k: "owner", label: "Kto má na starosti", type: "select", options: ownerOpts() },
      { k: "phase", label: "Kedy", type: "select", options: PHASES.map(p => [p.key, p.label]) },
      { k: "due", label: "Vlastný termín (nepovinné)", type: "date" },
      { k: "note", label: "Poznámka", type: "textarea", full: true },
      { k: "done", label: "Hotovo", type: "checkbox" }
    ],
    hint: S.sections.length ? "" : "Najprv si vytvorte aspoň jednu sekciu.",
    onSave: v => {
      if (!v.sectionId) { $("ferr").textContent = "Vyberte sekciu."; return false; }
      if (isNew) S.tasks.push({ id: uid("t"), ...v, order: Date.now() }); else Object.assign(t, v);
    },
    onDelete: isNew ? null : () => { S.tasks = S.tasks.filter(x => x !== t); }
  });
}
function suggestPhase() {
  const W = wDate(); if (!W) return "x";
  const months = (W - today()) / (30.44 * 86400000);
  return months > 12 ? "p12" : months > 9 ? "p9" : months > 6 ? "p6" : months > 3 ? "p3" : months > 1 ? "p1" : dayDiff(today(), W) > 7 ? "m" : "w";
}
function sectionForm(sec) {
  const isNew = !sec;
  const cnt = sec ? S.tasks.filter(t => t.sectionId === sec.id).length : 0;
  openForm({
    title: isNew ? "Nová sekcia" : "Upraviť sekciu",
    values: sec || {},
    fields: [{ k: "name", label: "Názov sekcie", full: true, req: true, ph: "napr. Svadobná cesta, Rozlúčka so slobodou…" }],
    hint: !isNew && cnt ? `Zmazaním sekcie zmažete aj ${cnt} ${plural(cnt, "úlohu", "úlohy", "úloh")} v nej.` : "",
    onSave: v => { if (isNew) { const id = uid("s"); S.sections.push({ id, name: v.name }); ui.sec = id; } else sec.name = v.name; },
    onDelete: isNew ? null : () => { S.sections = S.sections.filter(x => x !== sec); S.tasks = S.tasks.filter(t => t.sectionId !== sec.id); ui.sec = "all"; }
  });
}
function budgetForm(e, catId) {
  const isNew = !e;
  openForm({
    title: isNew ? "Nová položka rozpočtu" : "Detail položky",
    values: e || { catId: catId || (S.budgetCats[0] || {}).id, payer: "my", status: "napad" },
    fields: [
      { k: "name", label: "Položka", req: true },
      { k: "catId", label: "Kategória", type: "select", options: S.budgetCats.map(c => [c.id, c.name]) },
      { k: "vendor", label: "Dodávateľ" },
      { k: "contact", label: "Kontakt", ph: "telefón, e-mail, web" },
      { k: "planned", label: "Odhad €", type: "number" },
      { k: "actual", label: "Dohodnutá cena €", type: "number" },
      { k: "paid", label: "Zaplatené €", type: "number" },
      { k: "due", label: "Termín ďalšej platby", type: "date" },
      { k: "payer", label: "Kto platí", type: "select", options: PAYERS },
      { k: "status", label: "Stav", type: "select", options: EXP_STATUS },
      { k: "note", label: "Poznámka", type: "textarea", full: true, ph: "čo je v cene, zálohy, storno podmienky…" }
    ],
    onSave: v => { if (isNew) S.budget.push({ id: uid("b"), ...v }); else Object.assign(e, v); },
    onDelete: isNew ? null : () => { S.budget = S.budget.filter(x => x !== e); }
  });
}
function catForm(c) {
  const isNew = !c;
  openForm({
    title: isNew ? "Nová kategória rozpočtu" : "Premenovať kategóriu", values: c || {},
    fields: [{ k: "name", label: "Názov kategórie", full: true, req: true }],
    onSave: v => { if (isNew) S.budgetCats.push({ id: uid("c"), name: v.name }); else c.name = v.name; }
  });
}
function guestForm(g) {
  const isNew = !g;
  const groups = [...new Set(S.guests.map(x => x.group).filter(Boolean))];
  openForm({
    title: isNew ? "Nový hosť" : "Upraviť hosťa",
    values: g || { side: ui.guestSide !== "all" ? ui.guestSide : "AB", adults: 1, kids: 0, rsvp: "neodoslane", menu: "standard" },
    fields: [
      { k: "name", label: "Meno (osoba, pár alebo rodina)", full: true, req: true, ph: "napr. Peter a Jana Novákovci" },
      { k: "side", label: "Strana", type: "select", options: [["AB", "Spoloční"], ["A", nameA()], ["B", nameB()]] },
      { k: "group", label: "Skupina", ph: "rodina, kamaráti, práca…", list: groups },
      { k: "adults", label: "Dospelí", type: "number", keepZero: true },
      { k: "kids", label: "Deti", type: "number" },
      { k: "rsvp", label: "Odpoveď", type: "select", options: RSVP },
      { k: "menu", label: "Menu", type: "select", options: MENU },
      { k: "allergies", label: "Alergie / diéta", ph: "orechy, laktóza…" },
      { k: "prefs", label: "Preferencie", ph: "nepije alkohol, sedieť pri…, obľúbená pesnička" },
      { k: "phone", label: "Telefón" },
      { k: "email", label: "E-mail" },
      { k: "table", label: "Stôl" },
      { k: "nights", label: "Počet nocí ubytovania", type: "number" },
      { k: "lodging", label: "Potrebujú ubytovanie", type: "checkbox" },
      { k: "transport", label: "Potrebujú odvoz", type: "checkbox" },
      { k: "gift", label: "Dar", full: true },
      { k: "note", label: "Poznámka", type: "textarea", full: true }
    ],
    onSave: v => {
      v.adults = Math.max(0, Math.round(v.adults)); v.kids = Math.max(0, Math.round(v.kids));
      if (!v.adults && !v.kids) v.adults = 1;
      if (isNew) S.guests.push({ id: uid("g"), ...v }); else Object.assign(g, v);
    },
    onDelete: isNew ? null : () => { S.guests = S.guests.filter(x => x !== g); }
  });
}
function tlForm(h) {
  const isNew = !h;
  openForm({
    title: isNew ? "Nový bod programu" : "Upraviť bod programu",
    values: h || { kind: "ine" },
    fields: [
      { k: "time", label: "Začiatok", type: "time", req: true },
      { k: "end", label: "Koniec (nepovinné)", type: "time" },
      { k: "title", label: "Názov", full: true, req: true, ph: "napr. Prvý tanec" },
      { k: "desc", label: "Popis", type: "textarea", full: true, ph: "čo sa deje, na čo nezabudnúť" },
      { k: "place", label: "Miesto" },
      { k: "who", label: "Kto zodpovedá", ph: "starejší, DJ, svedok…" },
      { k: "kind", label: "Typ", type: "select", options: KINDS }
    ],
    onSave: v => { if (isNew) S.timeline.push({ id: uid("h"), ...v }); else Object.assign(h, v); },
    onDelete: isNew ? null : () => { S.timeline = S.timeline.filter(x => x !== h); }
  });
}
function colForm(c) {
  const t = S.tables.find(x => x.id === ui.table); if (!t) return;
  const isNew = !c;
  openForm({
    title: isNew ? "Nový stĺpec" : "Upraviť stĺpec", values: c || { type: "text" },
    fields: [{ k: "name", label: "Názov stĺpca", req: true }, { k: "type", label: "Typ", type: "select", options: COLTYPES }],
    onSave: v => {
      if (isNew) { const col = { id: uid("k"), ...v }; t.columns.push(col); t.rows.forEach(r => { r.cells[col.id] = v.type === "check" ? false : ""; }); }
      else Object.assign(c, v);
    },
    onDelete: isNew || t.columns.length < 2 ? null : () => { t.columns = t.columns.filter(x => x !== c); t.rows.forEach(r => delete r.cells[c.id]); }
  });
}
function tableForm() {
  openForm({
    title: "Nová tabuľka", values: { cols: "Názov, Poznámka" },
    fields: [
      { k: "title", label: "Názov tabuľky", full: true, req: true, ph: "napr. Playlist, Zoznam darov, Balenie na svadobnú cestu" },
      { k: "cols", label: "Stĺpce (oddelené čiarkou)", full: true, req: true },
      { k: "money", label: "Pridať stĺpec Suma €", type: "checkbox" },
      { k: "check", label: "Pridať stĺpec Hotovo ✓", type: "checkbox" }
    ],
    hint: "Typ každého stĺpca neskôr zmeníte kliknutím na jeho názov.",
    onSave: v => {
      const cols = v.cols.split(",").map(x => x.trim()).filter(Boolean).map(name => ({ id: uid("k"), name, type: "text" }));
      if (v.money) cols.push({ id: uid("k"), name: "Suma €", type: "number" });
      if (v.check) cols.push({ id: uid("k"), name: "Hotovo", type: "check" });
      if (!cols.length) cols.push({ id: uid("k"), name: "Názov", type: "text" });
      const t = { id: uid("tb"), title: v.title, columns: cols, rows: [] };
      for (let i = 0; i < 3; i++) t.rows.push(newRow(t));
      S.tables.push(t); ui.table = t.id;
    }
  });
}
function newRow(t) { return { id: uid("r"), cells: Object.fromEntries(t.columns.map(c => [c.id, c.type === "check" ? false : ""])) }; }
function settingsForm() {
  openForm({
    title: "Nastavenia svadby", values: { ...S.settings, budget: num(S.settings.budget) },
    fields: [
      { k: "nameA", label: "Ženích", req: true }, { k: "nameB", label: "Nevesta", req: true },
      { k: "date", label: "Dátum svadby", type: "date" }, { k: "time", label: "Čas obradu", type: "time" },
      { k: "ceremony", label: "Obrad", ph: "napr. Kostol sv. Anny" }, { k: "venue", label: "Hostina", ph: "napr. Penzión pod hájom" },
      { k: "budget", label: "Celkový rozpočet €", type: "number", full: true }
    ],
    onSave: v => { S.settings = { ...S.settings, ...v }; }
  });
}
function dataMenu() {
  openForm({
    title: "Záloha a prenos dát", fields: [],
    hint: `Dáta sa ukladajú iba v tomto prehliadači. Ak chcete plánovač používať na viacerých zariadeniach alebo spolu s partnerom, stiahnite zálohu a na druhom zariadení ju načítajte.
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
        <button class="btn" type="button" data-act="export">Stiahnuť zálohu (.json)</button>
        <button class="btn" type="button" data-act="import">Načítať zálohu</button>
        <button class="btn ghost danger" type="button" data-act="reset">Obnoviť pôvodné dáta</button></div>`
  });
}

/* ---------- export / import / CSV ---------- */
function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function csv(rows) { return "﻿" + rows.map(r => r.map(c => { const s = String(c ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(";")).join("\r\n"); }
const stamp = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const xnum = n => String(Math.round(num(n) * 100) / 100).replace(".", ",");
function exportJson() { download(`svadba-zaloha-${stamp()}.json`, JSON.stringify(S, null, 2), "application/json"); toast("Záloha stiahnutá"); }
function importJson(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || d.version !== 1 || !Array.isArray(d.tasks)) throw new Error("format");
      if (!confirm("Načítať zálohu? Súčasné dáta v tomto prehliadači sa nahradia.")) return;
      S = d; save(); closeModal(); render(); toast("Záloha načítaná");
    } catch (e) { alert("Tento súbor nie je záloha svadobného plánovača."); }
  };
  r.readAsText(file);
}

/* ---------- udalosti ---------- */
document.addEventListener("click", ev => {
  const el = ev.target.closest("[data-act]"); if (!el) return;
  if (el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type !== "button")) return;
  const a = el.dataset.act, id = el.dataset.id;
  const tbl = () => S.tables.find(x => x.id === ui.table);
  switch (a) {
    case "settings": settingsForm(); break;
    case "dataMenu": dataMenu(); break;
    case "closeModal": closeModal(); break;
    case "export": exportJson(); break;
    case "import": $("importFile").click(); break;
    case "reset": if (confirm("Naozaj vymazať všetky vaše dáta a začať s pôvodným checklistom? Odporúčame najprv stiahnuť zálohu.")) { S = freshState(); save(); closeModal(); render(); toast("Plánovač obnovený"); } break;
    case "print": window.print(); break;
    case "lock": if (window.lockPlanner) window.lockPlanner(); break;
    // checklist
    case "sec": ui.sec = id; render(); window.scrollTo({ top: $("view").offsetTop - 60 }); break;
    case "taskFilter": ui.taskFilter = el.dataset.v; render(); break;
    case "taskGroup": ui.taskGroup = el.dataset.v; render(); break;
    case "addTask": taskForm(null); break;
    case "editTask": taskForm(S.tasks.find(t => t.id === id)); break;
    case "addSection": sectionForm(null); break;
    case "editSection": sectionForm(S.sections.find(s => s.id === id)); break;
    // rozpočet
    case "addCat": catForm(null); break;
    case "editCat": catForm(S.budgetCats.find(c => c.id === id)); break;
    case "delCat": {
      const c = S.budgetCats.find(x => x.id === id); const n = S.budget.filter(e => e.catId === id).length;
      if (confirm(`Zmazať kategóriu „${c.name}“${n ? ` aj s ${n} ${plural(n, "položkou", "položkami", "položkami")}` : ""}?`)) { S.budgetCats = S.budgetCats.filter(x => x !== c); S.budget = S.budget.filter(e => e.catId !== id); save(); render(); }
      break;
    }
    case "addBud": { const e = { id: uid("b"), catId: id, name: "", vendor: "", payer: "my", planned: 0, actual: 0, paid: 0, due: "", status: "napad", note: "" }; S.budget.push(e); save(); render(); const inp = $(`b-${e.id}-name`); if (inp) inp.focus(); break; }
    case "editBud": budgetForm(S.budget.find(e => e.id === id)); break;
    case "delBud": { const e = S.budget.find(x => x.id === id); if (!e.name && !cost(e) || confirm(`Zmazať položku „${e.name || "bez názvu"}“?`)) { S.budget = S.budget.filter(x => x !== e); save(); render(); } break; }
    case "budgetCsv": {
      const rows = [["Kategória", "Položka", "Dodávateľ", "Kontakt", "Kto platí", "Odhad €", "Cena €", "Zaplatené €", "Zostáva €", "Termín platby", "Stav", "Poznámka"]];
      S.budgetCats.forEach(c => S.budget.filter(e => e.catId === c.id).forEach(e => rows.push([c.name, e.name, e.vendor, e.contact, lbl(PAYERS, e.payer || "my"), xnum(e.planned), xnum(e.actual), xnum(e.paid), xnum(left(e)), fmtD(e.due), lbl(EXP_STATUS, e.status), e.note])));
      download(`rozpocet-${stamp()}.csv`, csv(rows), "text/csv;charset=utf-8"); break;
    }
    // hostia
    case "addGuest": guestForm(null); break;
    case "editGuest": guestForm(S.guests.find(g => g.id === id)); break;
    case "guestCsv": {
      const rows = [["Meno", "Strana", "Skupina", "Dospelí", "Deti", "Odpoveď", "Menu", "Alergie", "Preferencie", "Telefón", "E-mail", "Stôl", "Ubytovanie", "Noci", "Odvoz", "Dar", "Poznámka"]];
      S.guests.slice().sort((a, b) => String(a.name).localeCompare(b.name, "sk")).forEach(g => rows.push([g.name, sideName(g.side || "AB"), g.group, num(g.adults), num(g.kids), lbl(RSVP, g.rsvp || "neodoslane"), lbl(MENU, g.menu || "standard"), g.allergies, g.prefs, g.phone, g.email, g.table, g.lodging ? "áno" : "", num(g.nights) || "", g.transport ? "áno" : "", g.gift, g.note]));
      download(`hostia-${stamp()}.csv`, csv(rows), "text/csv;charset=utf-8"); break;
    }
    // harmonogram
    case "addTl": tlForm(null); break;
    case "editTl": tlForm(S.timeline.find(h => h.id === id)); break;
    case "delTl": { const h = S.timeline.find(x => x.id === id); if (confirm(`Zmazať „${h.title}“ z programu?`)) { S.timeline = S.timeline.filter(x => x !== h); save(); render(); } break; }
    // poznámky
    case "addNote": { const n = { id: uid("n"), title: "", body: "", color: "", updated: Date.now() }; S.notes.unshift(n); save(); render(); $(`nt-${n.id}`).focus(); break; }
    case "delNote": { const n = S.notes.find(x => x.id === id); if (!(n.title || n.body) || confirm(`Zmazať poznámku „${n.title || "bez názvu"}“?`)) { S.notes = S.notes.filter(x => x !== n); save(); render(); } break; }
    case "noteColor": { const n = S.notes.find(x => x.id === id); n.color = el.dataset.v; save(); render(); break; }
    // tabuľky
    case "pickTable": ui.table = id; render(); break;
    case "addTable": tableForm(); break;
    case "delTable": { const t = tbl(); if (t && confirm(`Zmazať tabuľku „${t.title}“ so všetkými riadkami?`)) { S.tables = S.tables.filter(x => x !== t); ui.table = null; save(); render(); } break; }
    case "addCol": colForm(null); break;
    case "editCol": { const t = tbl(); colForm(t.columns.find(c => c.id === id)); break; }
    case "addRow": { const t = tbl(); const r = newRow(t); t.rows.push(r); save(); render(); const f = $(`tc-${r.id}-${t.columns[0].id}`); if (f) f.focus(); break; }
    case "delRow": { const t = tbl(); const r = t.rows.find(x => x.id === id); const filled = Object.values(r.cells).some(v => v !== "" && v !== false); if (!filled || confirm("Zmazať riadok?")) { t.rows = t.rows.filter(x => x !== r); save(); render(); } break; }
    case "tableCsv": { const t = tbl(); download(`${t.title.replace(/[^\p{L}\p{N}-]+/gu, "-").toLowerCase()}.csv`, csv([t.columns.map(c => c.name), ...t.rows.map(r => t.columns.map(c => c.type === "check" ? (r.cells[c.id] ? "áno" : "") : c.type === "number" ? (r.cells[c.id] === "" ? "" : xnum(r.cells[c.id])) : c.type === "date" ? fmtD(r.cells[c.id]) : r.cells[c.id]))]), "text/csv;charset=utf-8"); break; }
  }
});

document.addEventListener("submit", ev => {
  const f = ev.target;
  if (f.dataset.form === "quickTask") {
    ev.preventDefault();
    const sec = f.dataset.sec; const inp = $(`qa-${sec}`); const title = inp.value.trim();
    if (!title) { inp.focus(); return; }
    S.tasks.push({ id: uid("t"), sectionId: sec, title, owner: $(`qo-${sec}`).value, phase: suggestPhase(), due: "", note: "", done: false, order: Date.now() });
    if (ui.taskFilter === "done") ui.taskFilter = "open";
    save(); render(); const again = $(`qa-${sec}`); if (again) again.focus(); toast("Úloha pridaná");
  }
});

document.addEventListener("change", ev => {
  const el = ev.target;
  if (el.id === "importFile") { if (el.files[0]) importJson(el.files[0]); el.value = ""; return; }
  const d = el.dataset || {};
  if (d.act === "toggleTask") { const t = S.tasks.find(x => x.id === d.id); t.done = el.checked; save(); renderSoon(); return; }
  if (d.act === "owner") { ui.owner = el.value; render(); return; }
  if (d.act === "guestSide") { ui.guestSide = el.value; render(); return; }
  if (d.act === "guestRsvp") { ui.guestRsvp = el.value; render(); return; }
  if (d.act === "guestGroup") { ui.guestGroup = el.value; render(); return; }
  if (d.bud) { const e = S.budget.find(x => x.id === d.bud); if (!e) return; e[d.k] = ["planned", "actual", "paid"].includes(d.k) ? num(el.value) : el.value; if (d.k === "status" && el.value === "zaplatene" && cost(e) > num(e.paid) && confirm("Označiť ako celé zaplatené (Zaplatené = cena)?")) e.paid = cost(e); save(); renderSoon(); return; }
  if (d.guest) { const g = S.guests.find(x => x.id === d.guest); if (!g) return; g[d.k] = el.value; save(); renderSoon(); return; }
  if (d.tbl) {
    const t = S.tables.find(x => x.id === d.tbl); const r = t && t.rows.find(x => x.id === d.row); const c = t && t.columns.find(x => x.id === d.col); if (!r || !c) return;
    r.cells[c.id] = c.type === "check" ? el.checked : c.type === "number" ? (el.value === "" ? "" : num(el.value)) : el.value;
    save(); if (c.type !== "text" && c.type !== "date") renderSoon(); return;
  }
  if (d.act === "tblTitle") { const t = S.tables.find(x => x.id === d.id); t.title = el.value.trim() || "Bez názvu"; save(); renderSoon(); }
});

let noteTimer;
document.addEventListener("input", ev => {
  const el = ev.target; const d = el.dataset || {};
  if (d.act === "guestQ") { ui.guestQ = el.value; render(); return; }
  if (d.note) {
    const n = S.notes.find(x => x.id === d.note); if (!n) return;
    n[d.k] = el.value; n.updated = Date.now();
    clearTimeout(noteTimer); noteTimer = setTimeout(() => save(), 400);
  }
});

$("modalBack").addEventListener("mousedown", ev => { if (ev.target.id === "modalBack") closeModal(); });
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && modalOpen) closeModal(); });
window.addEventListener("hashchange", () => { render(); window.scrollTo({ top: 0 }); });
window.addEventListener("beforeunload", () => { clearTimeout(noteTimer); save(true); });

window.whenUnlocked(secret => {
  // mená prídu z odomknutého (zašifrovaného) configu, nie z verejného kódu
  let changed = false;
  if (secret && !S.settings.nameA && secret.nameA) { S.settings.nameA = secret.nameA; changed = true; }
  if (secret && !S.settings.nameB && secret.nameB) { S.settings.nameB = secret.nameB; changed = true; }
  if (changed) save(true);
  document.title = `${nameA()} & ${nameB()} · Svadobný plánovač`;
  render();
});
})();
