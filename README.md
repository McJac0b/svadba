# Svadobný plánovač

Statická webová aplikácia (HTML + CSS + JavaScript, bez knižníc a bez buildu) na plánovanie svadby.

## Čo obsahuje

| Záložka | Čo v nej je |
|---|---|
| **Prehľad** | odpočet dní, plnenie checklistu (zvlášť ženích / nevesta / spolu), rozpočet, platby, hostia, program |
| **Checklist** | ~100 úloh v 10 sekciách (vrátane **Ženích** a **Nevesta**), vlastné sekcie, rýchle pridávanie úloh, filtre podľa stavu a osoby, zoskupenie podľa sekcií alebo času |
| **Rozpočet** | editovateľná tabuľka podľa kategórií: odhad, dohodnutá cena, zaplatené, zostáva, termín platby, stav, kto platí; súčty, grafy, export do Excelu |
| **Hostia** | pozvánky (rodina, pár, jednotlivec) so zoznamom osôb; pri každej osobe dospelý/dieťa a vek, menu, porcia, alergie, alkohol (viac druhov alebo nepije) a vlastná odpoveď; za pozvánku strana, skupina, stôl, kontakt, ubytovanie, odvoz, dar; počet pozvánok (spoločná pre rodinu alebo vlastná pre každého dospelého, automaticky podľa skupiny: kamaráti každý svoju) a koľko je rozdaných, po skupinách; súhrny menu, porcií a alergií, odhad alkoholu (fľaše, litre, sudy) s nastaviteľnou spotrebou, export do Excelu po osobách |
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

Bez spoločnej databázy sa všetko ukladá do `localStorage` **v prehliadači, kde plánovač používate**.

- **Záloha dát → Stiahnuť zálohu** uloží `.json` súbor so všetkým.
- **Načítať zálohu** ho nahrá späť (napr. na inom zariadení).
- Pri vymazaní dát prehliadača sa dáta stratia, preto si zálohu sťahujte priebežne.

## Spoločná databáza (Supabase)

Aby ste plánovač upravovali dvaja z rôznych zariadení, dáta sa ukladajú do jednej databázy v Supabase. Obaja len otvoríte stránku a zadáte 8-miestny kód; prihlásenie do databázy prebehne samo. Zmeny partnera sa zobrazia do pár sekúnd. Keď upravujete naraz, zmeny sa zlúčia (napr. jeden mení hostí, druhý rozpočet). Bez internetu sa ukladá do prehliadača a odošle sa po pripojení.

**Jednorazové nastavenie (asi 10 minút):**

1. Na [supabase.com](https://supabase.com) si založte účet a nový projekt (bezplatný plán stačí, región napr. Frankfurt). Heslo databázy si uložte, aplikácia ho nepotrebuje.
2. **SQL Editor → New query**: vložte obsah súboru `supabase/schema.sql` a kliknite **Run**.
3. **Authentication → Sign In / Providers** (alebo *Settings*): vypnite **Allow new users to sign up**.
4. **Authentication → Users → Add user → Create new user**: zadajte e-mail a silné heslo spoločného účtu, zaškrtnite **Auto Confirm User**. Tento účet budete používať obaja (zadávať ho nebudete, zašifruje sa do kódu).
5. **Project Settings → API Keys**: skopírujte **Project URL** a kľúč **anon public** (záložka *Legacy API keys*), prípadne **publishable** kľúč.
6. Otvorte lokálne `tools/nastav-kod.html`, zadajte svoj 8-miestny kód, mená a vyplňte časť *Spoločná databáza* (URL, kľúč, e-mail a heslo z bodu 4). Kliknite **Vygenerovať** a výsledkom nahraďte `js/lock-config.js`. Nahrajte na GitHub.
7. Otvorte stránku **najprv na zariadení, kde máte doterajšie dáta**: tie sa nahrajú do databázy. Na ďalšom zariadení potvrďte **OK = použiť dáta zo spoločnej databázy**.

Stav synchronizácie je dole na stránke. Údaje k databáze sú v `js/lock-config.js` zašifrované kódom, vo verejnom kóde nie sú čitateľné. Bezplatný projekt Supabase sa po týždni bez používania uspí; v Supabase ho jedným klikom zobudíte (dáta ostanú).

## Štruktúra

```
index.html        – kostra stránky
robots.txt        – zákaz indexovania
js/lock-config.js – zašifrované údaje pre zámok (generuje tools/nastav-kod.html)
js/lock.js        – obrazovka s kódom
tools/nastav-kod.html – nástroj na zmenu kódu a údajov k databáze (otvárajte lokálne)
supabase/schema.sql – tabuľka a prístupové pravidlá pre spoločnú databázu
css/style.css     – vzhľad (farby sú premenné v :root na začiatku súboru)
js/data.js        – štartovacie dáta: sekcie a úlohy checklistu, kategórie rozpočtu, program, tabuľky
js/app.js         – celá logika aplikácie
```

Úpravy štartovacieho checklistu robte v `js/data.js`. Prejavia sa po kliknutí na **Záloha dát → Obnoviť pôvodné dáta** (to zmaže vaše zmeny, takže najprv si stiahnite zálohu) alebo v novom prehliadači.
