# Svadobný plánovač

Statická webová aplikácia (HTML + CSS + JavaScript, bez knižníc a bez buildu) na plánovanie svadby.

## Čo obsahuje

| Záložka | Čo v nej je |
|---|---|
| **Prehľad** | odpočet dní, plnenie checklistu (zvlášť ženích / nevesta / spolu), rozpočet, platby, hostia, program |
| **Checklist** | ~100 úloh v 10 sekciách (vrátane **Ženích** a **Nevesta**), vlastné sekcie, rýchle pridávanie úloh, filtre podľa stavu a osoby, zoskupenie podľa sekcií alebo času |
| **Rozpočet** | editovateľná tabuľka podľa kategórií: odhad, dohodnutá cena, zaplatené, zostáva, termín platby, stav, kto platí; súčty, grafy, export do Excelu |
| **Hostia** | pozvánky (rodina, pár, jednotlivec) so zoznamom osôb; pri každej osobe dospelý/dieťa a vek, menu, porcia, alergie a vlastná odpoveď; za pozvánku strana, skupina, stôl, kontakt, ubytovanie, odvoz, dar; súhrny menu, porcií a alergií, export do Excelu po osobách |
| **Harmonogram** | body programu s časom, názvom, popisom, miestom a zodpovednou osobou + **náhľad časovej osi** (dá sa vytlačiť / uložiť ako PDF) |
| **Poznámky** | kartičky s automatickým ukladaním |
| **Tabuľky** | vlastné tabuľky so stĺpcami typu text / číslo / zaškrtávacie / dátum, súčty, export; pripravené: Porovnanie ponúk, Kto čo platí, Kontakty, Svadobné dary |

## Nasadenie na GitHub Pages

1. Vytvorte nový repozitár na GitHube (napr. `svadba`).
2. Nahrajte doň obsah tohto priečinka tak, aby `index.html` bol v koreni repozitára:
   ```bash
   git init
   git add .
   git commit -m "Svadobný plánovač"
   git branch -M main
   git remote add origin https://github.com/<vas-ucet>/svadba.git
   git push -u origin main
   ```
3. V repozitári otvorte **Settings → Pages**, v časti *Build and deployment* zvoľte **Deploy from a branch**, vetvu `main` a priečinok `/ (root)`, uložte.
4. O minútu-dve bude stránka na `https://<vas-ucet>.github.io/svadba/`.

Lokálne stačí otvoriť `index.html` v prehliadači (alebo `python3 -m http.server`).

## Zámok s kódom

Pri otvorení stránky sa zobrazí číselník na **8-miestny kód**. Predvolený kód je **12345678**. **Pred nahraním na GitHub si ho zmeňte:**

1. Otvorte lokálne `tools/nastav-kod.html` (dvojklik alebo cez `python3 -m http.server`).
2. Zadajte nový kód a mená, kliknite **Vygenerovať**.
3. Vygenerovaný text vložte namiesto obsahu `js/lock-config.js` a nahrajte na GitHub.

Ako to funguje:
- Mená nie sú vo verejnom kóde čitateľné. V `js/lock-config.js` sú zašifrované (AES-GCM, kľúč z kódu cez PBKDF2) a kód samotný nie je uložený nikde.
- `robots.txt` a `noindex` hovoria vyhľadávačom, aby stránku neindexovali.
- Po odomknutí si zariadenie odomknutie pamätá (dá sa vypnúť pri zadávaní kódu). Tlačidlo **Zamknúť** dole na stránke ho zruší.
- Po 5 nesprávnych pokusoch nasleduje čakanie, ktoré sa zakaždým predĺži.
- Je to ochrana pred zvedavcami a scrapermi, nie bankové zabezpečenie. Vaše skutočné údaje (úlohy, rozpočet, hostia) aj tak nie sú na GitHube, ale iba v prehliadači.

## Kde sú dáta

Všetko sa ukladá do `localStorage` **v prehliadači, kde plánovač používate**. Na GitHub sa nič neposiela.

- **Záloha dát → Stiahnuť zálohu** uloží `.json` súbor so všetkým.
- **Načítať zálohu** ho nahrá späť (napr. na inom zariadení alebo u partnera).
- Pri vymazaní dát prehliadača sa dáta stratia, preto si zálohu sťahujte priebežne.

> Ak budete chcieť, aby ste plánovač upravovali obaja naraz z rôznych zariadení, dá sa doplniť synchronizácia cez Firebase / Supabase. Ostatný kód ostane rovnaký, mení sa len funkcia `save()` / `load()` v `js/app.js`.

## Štruktúra

```
index.html        – kostra stránky
robots.txt        – zákaz indexovania
js/lock-config.js – zašifrované údaje pre zámok (generuje tools/nastav-kod.html)
js/lock.js        – obrazovka s kódom
tools/nastav-kod.html – nástroj na zmenu kódu (otvárajte lokálne)
css/style.css     – vzhľad (farby sú premenné v :root na začiatku súboru)
js/data.js        – štartovacie dáta: sekcie a úlohy checklistu, kategórie rozpočtu, program, tabuľky
js/app.js         – celá logika aplikácie
```

Úpravy štartovacieho checklistu robte v `js/data.js`. Prejavia sa po kliknutí na **Záloha dát → Obnoviť pôvodné dáta** (to zmaže vaše zmeny, takže najprv si stiahnite zálohu) alebo v novom prehliadači.
