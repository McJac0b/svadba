/* Štartovacie dáta plánovača. Načítajú sa len pri prvom otvorení (alebo po „Obnoviť pôvodné dáta“). */
window.TEMPLATE = {
  settings: { nameA: "", nameB: "", date: "", time: "", ceremony: "", venue: "", budget: 0 },

  // Fázy: p12 = 12+ mesiacov pred, p9 = 9–12, p6 = 6–9, p3 = 3–6, p1 = 1–3, m = posledný mesiac,
  // w = posledný týždeň, d = svadobný deň, po = po svadbe.  Kto: A = ženích, B = nevesta, AB = spolu.
  sections: [
    { id: "s-zaklad", name: "Základy a plánovanie", tasks: [
      ["Dohodnúť si predstavu svadby: veľkosť, štýl, ročné obdobie", "p12", "AB", ""],
      ["Zvoliť termín svadby (aj náhradný)", "p12", "AB", ""],
      ["Stanoviť celkový rozpočet", "p12", "AB", "Sumu zapíšte v Nastaveniach, rozpis v záložke Rozpočet."],
      ["Dohodnúť s rodičmi, kto čím prispeje", "p12", "AB", "Pomôže tabuľka „Kto čo platí“."],
      ["Vybrať svedkov", "p12", "AB", ""],
      ["Vybrať starejšieho / moderátora", "p12", "AB", ""],
      ["Vybrať družbov a družičky", "p9", "AB", ""],
      ["Zvážiť svadobnú koordinátorku", "p12", "AB", ""]
    ]},
    { id: "s-obrad", name: "Obrad", tasks: [
      ["Rozhodnúť: cirkevný alebo civilný obrad", "p12", "AB", ""],
      ["Rezervovať termín na matrike / na fare", "p12", "AB", "Overte si lehoty a poplatky."],
      ["Zistiť zoznam potrebných dokladov", "p6", "AB", "Zvyčajne rodné listy a občianske preukazy; presný zoznam dá matrika."],
      ["Predmanželská príprava (pri cirkevnom sobáši)", "p6", "AB", ""],
      ["Podať žiadosť o uzavretie manželstva na matrike", "p3", "AB", ""],
      ["Dohodnúť priebeh obradu s farárom / oddávajúcim", "p3", "AB", ""],
      ["Hudba na obrad: organista, spevák, kvarteto", "p6", "AB", ""],
      ["Vybrať čítania / texty a kto ich prečíta", "p1", "AB", ""],
      ["Rozhodnúť o priezvisku po sobáši", "p3", "AB", ""],
      ["Vybrať a objednať obrúčky", "p6", "AB", ""],
      ["Gravírovanie obrúčok", "p3", "AB", ""],
      ["Kto nesie obrúčky, vankúšik", "p1", "AB", ""],
      ["Lupene / bublifuky na odchod z obradu", "p1", "AB", ""]
    ]},
    { id: "s-sala", name: "Sála a catering", tasks: [
      ["Obhliadnuť 3–5 sál a porovnať ponuky", "p12", "AB", "Kapacita, korkovné, ubytovanie, do koľkej sa môže hrať, parkovanie."],
      ["Rezervovať sálu, podpísať zmluvu, zaplatiť zálohu", "p12", "AB", ""],
      ["Ochutnávka menu", "p3", "AB", ""],
      ["Vybrať menu: predjedlo, polievka, hlavný chod, večera, polnočné", "p3", "AB", ""],
      ["Detské menu a špeciálne diéty", "p1", "AB", "Počty nájdete v záložke Hostia."],
      ["Nápoje: zo sály alebo vlastné (korkovné)", "p3", "AB", ""],
      ["Svadobná torta: cukrárka, príchuť, dizajn", "p6", "AB", ""],
      ["Zákusky a koláče (rodina / cukráreň)", "p3", "AB", ""],
      ["Výslužky pre hostí", "p1", "AB", ""],
      ["Zasadací poriadok a rozloženie stolov", "p1", "AB", ""],
      ["Nahlásiť konečný počet hostí a jedál", "p1", "AB", ""],
      ["Dohodnúť, kedy môžu dodávatelia prísť do sály", "m", "AB", ""]
    ]},
    { id: "s-dodavatelia", name: "Dodávatelia", tasks: [
      ["Fotograf: porovnať portfóliá a rezervovať", "p9", "AB", "Pýtajte si celé galérie zo svadieb, nielen výber."],
      ["Kameraman", "p9", "AB", ""],
      ["DJ / kapela", "p9", "AB", ""],
      ["Playlist: nástup, prvý tanec, piesne, ktoré nechcete", "p1", "AB", ""],
      ["Florista: kytica, pierka, výzdoba", "p6", "AB", ""],
      ["Svadobné auto a odvoz hostí", "p3", "AB", ""],
      ["Fotokútik / zábava pre hostí", "p6", "AB", ""],
      ["Potvrdiť časy a adresy so všetkými dodávateľmi", "m", "AB", ""],
      ["Pripraviť obálky s doplatkami", "m", "AB", "Sumy sú v Rozpočte v stĺpci Zostáva."]
    ]},
    { id: "s-hostia", name: "Hostia a oznámenia", tasks: [
      ["Predbežný zoznam hostí", "p12", "AB", "Zapisujte rovno do záložky Hostia."],
      ["Save the date pre najbližších", "p9", "AB", ""],
      ["Navrhnúť a objednať oznámenia", "p6", "AB", ""],
      ["Pozvánky na hostinu", "p6", "AB", ""],
      ["Zabezpečiť ubytovanie pre hostí z ďaleka", "p6", "AB", ""],
      ["Rozoslať / rozniesť oznámenia", "p3", "AB", ""],
      ["Zozbierať potvrdenia účasti", "p1", "AB", ""],
      ["Pripomenúť sa tým, čo neodpovedali", "p1", "AB", ""],
      ["Zistiť diéty, alergie a preferencie hostí", "p1", "AB", ""],
      ["Menovky a tabuľa so zasadacím poriadkom", "p1", "AB", ""]
    ]},
    { id: "s-nevesta", name: "Nevesta", tasks: [
      ["Inšpirácia na šaty, vybrať salóny", "p12", "B", ""],
      ["Skúšky a výber šiat", "p9", "B", "Šaty na objednávku trvajú aj 4–6 mesiacov."],
      ["Objednať / rezervovať šaty", "p9", "B", ""],
      ["Kytica (s floristom)", "p6", "B", ""],
      ["Závoj, šperky, doplnky", "p3", "B", ""],
      ["Svadobné topánky – rozchodiť doma", "p3", "B", ""],
      ["Spodná bielizeň a podväzok", "p3", "B", ""],
      ["Kaderníčka – skúšobný účes", "p3", "B", ""],
      ["Vizážistka – skúšobné líčenie", "p3", "B", ""],
      ["Šaty na čepčenie / druhé šaty", "p3", "B", ""],
      ["Úprava šiat (1–3 skúšky)", "p1", "B", ""],
      ["Bolerko / kabátik podľa počasia", "p1", "B", ""],
      ["Rozlúčka so slobodou", "m", "B", ""],
      ["Manikúra a pedikúra", "w", "B", ""],
      ["Núdzový balíček: ihla a niť, náplasti, lieky, make-up", "w", "B", ""]
    ]},
    { id: "s-zenich", name: "Ženích", tasks: [
      ["Vybrať štýl obleku (ladiť k šatám)", "p6", "A", ""],
      ["Oblek: kúpiť alebo ušiť na mieru", "p6", "A", ""],
      ["Košeľa, kravata / motýlik, manžetové gombíky", "p3", "A", ""],
      ["Topánky, opasok, ponožky", "p3", "A", ""],
      ["Pierko (s floristom)", "p3", "A", ""],
      ["Úprava obleku", "p1", "A", ""],
      ["Príhovor pre hostí", "p1", "A", ""],
      ["Darčeky pre svedkov a rodičov", "p1", "A", ""],
      ["Rozlúčka so slobodou", "m", "A", ""],
      ["Vyzdvihnúť obrúčky", "m", "A", ""],
      ["Holič pár dní pred svadbou", "w", "A", ""]
    ]},
    { id: "s-vyzdoba", name: "Výzdoba a detaily", tasks: [
      ["Farebná paleta a štýl výzdoby", "p6", "AB", ""],
      ["Výzdoba sály: obrusy, stredy stolov, sviečky", "p3", "AB", ""],
      ["Výzdoba kostola / miesta obradu", "p3", "AB", ""],
      ["Kniha hostí alebo jej alternatíva", "p3", "AB", ""],
      ["Uvítacia tabuľa a program pre hostí", "p1", "AB", ""],
      ["Výzdoba auta", "p1", "AB", ""],
      ["Odovzdať výzdobu do sály", "w", "AB", ""]
    ]},
    { id: "s-den", name: "Svadobný deň", tasks: [
      ["Rozposlať harmonogram svedkom, starejšiemu a fotografovi", "m", "AB", "Náhľad programu nájdete v záložke Harmonogram."],
      ["Určiť človeka, ktorý počas dňa rieši problémy namiesto vás", "m", "AB", ""],
      ["Pripraviť odobierku so starejším", "p1", "AB", ""],
      ["Čepčenie: kto čepčí, hudba, rekvizity", "p1", "AB", ""],
      ["Zbaliť: obrúčky, doklady, obálky, oblečenie na prezlečenie", "d", "AB", ""],
      ["Raňajky a pitný režim", "d", "AB", ""]
    ]},
    { id: "s-po", name: "Po svadbe", tasks: [
      ["Rezervovať svadobnú cestu", "p6", "AB", "Skontrolujte platnosť dokladov."],
      ["Vrátiť požičané veci", "po", "AB", ""],
      ["Vyčistiť šaty a oblek", "po", "AB", ""],
      ["Vyzdvihnúť sobášny list", "po", "AB", ""],
      ["Zmena priezviska: OP, pas, vodičák", "po", "B", ""],
      ["Nahlásiť zmenu banke, zamestnávateľovi, poisťovni", "po", "AB", ""],
      ["Poďakovať hosťom", "po", "AB", ""],
      ["Vybrať fotky do albumu", "po", "AB", ""],
      ["Napísať recenzie dodávateľom", "po", "AB", ""]
    ]}
  ],

  budget: [
    { name: "Obrad", items: ["Poplatok matrika / fara", "Hudba na obrade", "Obrúčky"] },
    { name: "Sála a catering", items: ["Prenájom sály", "Menu", "Nápoje", "Torta", "Zákusky a koláče", "Výslužky"] },
    { name: "Foto a video", items: ["Fotograf", "Kameraman", "Fotokútik"] },
    { name: "Hudba a program", items: ["DJ / kapela", "Starejší"] },
    { name: "Nevesta", items: ["Šaty", "Topánky a doplnky", "Účes a líčenie"] },
    { name: "Ženích", items: ["Oblek", "Topánky a doplnky"] },
    { name: "Kvety a výzdoba", items: ["Kytica a pierka", "Výzdoba sály", "Výzdoba kostola"] },
    { name: "Oznámenia a tlačoviny", items: ["Oznámenia a pozvánky", "Menovky a menu karty"] },
    { name: "Doprava a ubytovanie", items: ["Svadobné auto", "Odvoz hostí", "Ubytovanie hostí"] },
    { name: "Ostatné", items: ["Darčeky pre rodičov a svedkov", "Svadobná cesta", "Rezerva na nečakané výdavky"] }
  ],

  timeline: [
    ["08:00", "", "Príprava nevesty", "Účes a líčenie, fotograf fotí detaily.", "Doma u nevesty", "Kaderníčka, vizážistka", "priprava"],
    ["10:30", "", "Príprava ženícha", "Oblečenie, pierko, posledná kontrola obrúčok.", "", "Svedok", "priprava"],
    ["12:30", "13:15", "Odobierka", "Starejší vyprosí nevestu, rozlúčka s rodičmi.", "Doma u nevesty", "Starejší", "tradicia"],
    ["14:00", "15:00", "Obrad", "", "", "", "obrad"],
    ["15:00", "15:45", "Gratulácie a skupinové fotky", "Najprv rodina, potom kamaráti.", "Pred kostolom", "Fotograf", "foto"],
    ["16:00", "", "Privítanie v sále", "Chlieb a soľ, rozbitie taniera, prípitok.", "Sála", "Starejší", "tradicia"],
    ["16:30", "", "Svadobný obed", "Polievka a hlavný chod.", "Sála", "", "hostina"],
    ["18:00", "", "Prvý tanec", "", "Sála", "DJ / kapela", "zabava"],
    ["19:00", "", "Krájanie torty", "", "Sála", "", "hostina"],
    ["20:30", "", "Večera", "", "Sála", "", "hostina"],
    ["22:00", "", "Hry a súťaže", "", "Sála", "Starejší", "zabava"],
    ["00:00", "", "Čepčenie", "Redový tanec, nevesta mení šaty.", "Sála", "Starejší", "tradicia"],
    ["00:30", "", "Polnočná kapustnica", "", "Sála", "", "hostina"]
  ],

  notes: [
    { title: "Otázky na sálu", body: "• Koľko hostí sa zmestí pri okrúhlych / dlhých stoloch?\n• Je v cene obsluha, obrusy, výzdoba?\n• Korkovné na vlastné víno a pálenku?\n• Do koľkej sa môže hrať hudba?\n• Ubytovanie pre hostí, parkovanie?\n• Kedy treba nahlásiť konečný počet a koľko je záloha?" },
    { title: "Inšpirácia", body: "Sem si píšte nápady na výzdobu, farby, hudbu, odkazy na Pinterest…" }
  ],

  tables: [
    { title: "Porovnanie ponúk", columns: [["Dodávateľ","text"],["Kategória","text"],["Cena €","number"],["Čo je v cene","text"],["Kontakt","text"],["Hodnotenie (1–5)","number"],["Vybrané","check"]],
      rows: [["", "Fotograf", "", "", "", "", false], ["", "Fotograf", "", "", "", "", false], ["", "DJ", "", "", "", "", false]] },
    { title: "Kto čo platí", columns: [["Položka","text"],["My €","number"],["Rodičia nevesty €","number"],["Rodičia ženícha €","number"],["Poznámka","text"]],
      rows: [["Sála a menu", "", "", "", ""], ["Šaty", "", "", "", ""], ["Oblek", "", "", "", ""], ["Hudba", "", "", "", ""], ["Foto a video", "", "", "", ""]] },
    { title: "Kontakty", columns: [["Meno","text"],["Rola","text"],["Telefón","text"],["E-mail","text"],["Poznámka","text"]],
      rows: [["", "Starejší", "", "", ""], ["", "Svedok ženícha", "", "", ""], ["", "Svedkyňa nevesty", "", "", ""], ["", "Fotograf", "", "", ""]] },
    { title: "Svadobné dary", columns: [["Od koho","text"],["Dar","text"],["Suma €","number"],["Poďakované","check"]], rows: [] }
  ]
};
