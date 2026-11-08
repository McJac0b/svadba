/* Zámok plánovača – 8-miestny číselný kód.
   Mená (a prípadne ďalšie údaje) sú v js/lock-config.js zašifrované AES-GCM kľúčom odvodeným z kódu (PBKDF2).
   Kód nie je nikde uložený – správny je ten, ktorým sa dá obsah rozšifrovať.
   Toto je ochrana pred zvedavcami a scrapermi, nie bankové zabezpečenie. */
(function () {
  "use strict";
  const LEN = 8;
  const REMEMBER_KEY = "svadba-odomknute";
  const ATTEMPTS_KEY = "svadba-pokusy";
  let resolveUnlock;
  const unlocked = new Promise(r => { resolveUnlock = r; });
  window.whenUnlocked = fn => unlocked.then(fn);

  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function decrypt(pin, cfg) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64(cfg.salt), iterations: cfg.iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(cfg.iv) }, key, b64(cfg.ct));
    return JSON.parse(new TextDecoder().decode(plain));
  }

  function finish(secret) {
    document.body.classList.remove("locked");
    const el = document.getElementById("lock"); if (el) el.remove();
    resolveUnlock(secret);
  }
  window.lockPlanner = function () {
    try { localStorage.removeItem(REMEMBER_KEY); sessionStorage.removeItem(REMEMBER_KEY); } catch (e) { }
    location.reload();
  };

  // Už odomknuté na tomto zariadení?
  try {
    const saved = localStorage.getItem(REMEMBER_KEY) || sessionStorage.getItem(REMEMBER_KEY);
    if (saved) { const s = JSON.parse(saved); if (s && s.nameA) { finish(s); return; } }
  } catch (e) { }

  const cfg = window.LOCK;
  document.body.classList.add("locked");
  const box = document.createElement("div");
  box.id = "lock";
  box.innerHTML = `
    <div class="lock-card" role="dialog" aria-modal="true" aria-labelledby="lockTitle">
      <svg class="lock-rings" viewBox="0 0 64 40" aria-hidden="true"><circle cx="24" cy="20" r="14" fill="none" stroke="#2b7297" stroke-width="3"/><circle cx="40" cy="20" r="14" fill="none" stroke="#5aa5b8" stroke-width="3"/></svg>
      <h1 id="lockTitle">Svadobný plánovač</h1>
      <p class="lock-sub" id="lockMsg">Zadajte 8-miestny kód</p>
      <div class="dots" id="dots" aria-hidden="true">${"<i></i>".repeat(LEN)}</div>
      <input id="pinInput" class="pin-input" type="password" inputmode="numeric" pattern="[0-9]*" autocomplete="current-password" maxlength="${LEN}" aria-label="Kód">
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-k="${n}">${n}</button>`).join("")}<span></span><button type="button" data-k="0">0</button><button type="button" data-k="del" aria-label="Zmazať číslicu">⌫</button></div>
      <label class="remember"><input type="checkbox" id="remember" checked> Zapamätať si na tomto zariadení</label>
      ${cfg && cfg.isDefault ? `<p class="lock-warn">Používa sa predvolený kód <b>12345678</b>. Pred zverejnením si nastavte vlastný (README → Zmena kódu).</p>` : ""}
    </div>`;
  document.body.appendChild(box);

  const input = box.querySelector("#pinInput");
  const dots = [...box.querySelectorAll("#dots i")];
  const msg = box.querySelector("#lockMsg");
  let pin = "", busy = false;

  const draw = () => dots.forEach((d, i) => d.classList.toggle("on", i < pin.length));
  const attempts = () => { try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '{"n":0,"t":0}'); } catch (e) { return { n: 0, t: 0 }; } };
  const setAttempts = a => { try { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(a)); } catch (e) { } };

  async function check() {
    const a = attempts();
    const wait = a.t - Date.now();
    if (wait > 0) { msg.textContent = `Príliš veľa pokusov. Skúste o ${Math.ceil(wait / 1000)} s.`; pin = ""; input.value = ""; draw(); return; }
    busy = true; msg.textContent = "Overujem…";
    try {
      if (!cfg || !window.crypto || !crypto.subtle) throw new Error("nocrypto");
      const secret = await decrypt(pin, cfg);
      setAttempts({ n: 0, t: 0 });
      const store = box.querySelector("#remember").checked ? localStorage : sessionStorage;
      try { store.setItem(REMEMBER_KEY, JSON.stringify(secret)); } catch (e) { }
      finish(secret);
    } catch (e) {
      if (e && e.message === "nocrypto") { msg.textContent = "Tento prehliadač nepodporuje odomknutie. Otvorte stránku cez https."; busy = false; return; }
      const n = a.n + 1;
      setAttempts({ n, t: n >= 5 ? Date.now() + 30000 * Math.pow(2, n - 5) : 0 });
      msg.textContent = n >= 5 ? "Nesprávny kód. Ďalší pokus o chvíľu." : "Nesprávny kód, skúste znova.";
      box.querySelector(".lock-card").classList.remove("shake"); void box.offsetWidth; box.querySelector(".lock-card").classList.add("shake");
      pin = ""; input.value = ""; draw(); busy = false;
    }
  }
  function press(k) {
    if (busy) return;
    if (k === "del") pin = pin.slice(0, -1);
    else if (/^\d$/.test(k) && pin.length < LEN) pin += k;
    input.value = pin; draw();
    if (pin.length === LEN) check();
  }
  box.querySelector(".keypad").addEventListener("click", e => { const b = e.target.closest("button[data-k]"); if (b) press(b.dataset.k); });
  input.addEventListener("input", () => { if (busy) return; pin = input.value.replace(/\D/g, "").slice(0, LEN); input.value = pin; draw(); if (pin.length === LEN) check(); });
  document.addEventListener("keydown", e => {
    if (!document.getElementById("lock") || e.target === input) return;
    if (/^\d$/.test(e.key)) press(e.key); else if (e.key === "Backspace") press("del");
  });
  if (!matchMedia("(pointer: coarse)").matches) input.focus();
})();
