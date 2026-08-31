# Kravbild (applikationsnivå)

Detta dokument fångar de krav och beslut som klargjorts för `ddd-flax` innan implementation påbörjas. Se [ARCHITECTURE.md](./ARCHITECTURE.md) för den övergripande visionen. Datalagrets konkreta utformning (datakällor, providers, cache) hanteras separat och medvetet inte här.

---

## 1. Målgrupp

Primär målgrupp: **interna analytiker/team** (tekniskt bekväma användare). Inte optimerat för lekmanna-/ledningsvyer eller externa kunder i första versionen.

## 2. Interaktivitet — roadmap

Startpunkt: **lätt interaktivitet** (filter, datumval, toggles).
Riktning: ska kunna växa mot notebook-/BI-liknande interaktivitet (parametrisering, drill-down) utan att arkitekturen behöver göras om.

**Implikation:** document-runtime bör designas med delad state/context från start, även om första blocken är enkla.

## 3. Författarflöde

MDX-dokumenten skrivs **enbart av utvecklare**. Inget krav på WYSIWYG-editor eller förenklat författarverktyg för icke-tekniska användare i denna fas.

## 4. Navigation & Dashboard

Startsida fungerar som **dashboard**, inte ren dokumentlista. Den ska visa:
- Genvägar grupperade per domän
- Senast uppdaterade dokument (dvs. senast ändrad MDX-definition/kod — inte data)

Ingen global sök på dashboarden i v1.

## 5. Domänstruktur

Domänerna i visionsdokumentet (`portfolio`, `sales`, `operations`) var **enbart exempel** — ersätts nu av riktig struktur.

- Domäner definieras av **verksamheten**, via formella krav, allteftersom de uppstår. Det är inte den tekniska lösningens uppgift att förstå eller motivera *varför* en domän finns — bara att representera den strukturellt.
- En domän **består av minst en IGM-källa** (se ordlista nedan). Ett dokument inom en domän kan bero på **flera IGM-källor** samtidigt.
- Känd domän hittills: **`Frx`** — beräknar tekniska laster/förbrukningar och toleranser. Fler domäner tillkommer efter hand, inga fler är definierade än.
- `docs/`-trädet ska alltså inte byggas med de gamla platshållarnamnen (`portfolio`/`sales`/`operations`) — `Frx` är den första verkliga domänen att utgå från.
- **Mappstrukturen definierar applikationens omfattning:** toppnivåmappar under `docs/` motsvarar domäner. Underliggande mappar/dokument anger **exakt vilka block som är intressanta att visualisera** för det området. Strukturen är alltså inte bara innehåll — den *är* scope-definitionen för vad applikationen kan göra.

## 6. Ordlista: datakällebegrepp (för att kunna namnge struktur — ej datalagrets implementation)

Dessa begrepp kommer från verksamheten och avgör hur domäner/dokument refererar till data, men *hur* data faktiskt hämtas hör fortsatt till datalagret och tas inte upp här.

- **IGM** ("individual model") — en central datakälla/modell, ofta identifierad med ett nummer (modellversion). En domän kan bestå av en eller flera IGM:er.
- **Mockbar dataform (exempel, ej bindande datakontrakt):** de flesta IGM:er kan grovt beskrivas som tidsserier — ett objekt per timme/dygn: `{ edd: "20260828", mtu: 1..25, [propName]: number }`, där `edd` är epokens datum och `mtu` är timindex inom dygnet (1–25, för att rymma tidsomställningsdygn). `propName` varierar per IGM/domän. Detta är enbart till för att kunna bygga mockdata under scaffolding — den faktiska datamodellen hör till datalagret och specificeras senare.
- **Epok** — den tidsperiod ett dataset avser. Prognosen för en given epok levereras morgonen innan epoken själv (t.ex. imorgondagens epok fick sitt dataset i morse).
- **Revision/version av en epok** — en epok kan uppdateras i efterhand; samma epok kan alltså existera i flera versioner över tid. Detta är en egenskap hos *datat*, inte hos dokumentet (se §7 — dokument sparar inga egna versioner).

## 7. Dokument- och körningsmodell

**Beslut: inga snapshots.** Rapporter/dokument sparar inte egna versioner eller historiska körningar.

- MDX-dokumenten under `docs/` definierar **struktur och scope**: vilken domän, vilka block, vilken layout. Detta är statiskt och byggs/releasas som vanlig kod.
- Kopplingen till data sker via ett **typsäkert kontrakt** (se §12) mellan datamodell och komponenter — säkerställer vid byggtid att rätt data konsumeras av respektive block.
- **I runtime**, när en användare besöker en dokumentrutt, väljer de själva **epok/tidsspann och ev. filter/begränsningar**. Applikationen hämtar då data live och renderar visualiseringen på plats.
- En rapport är alltså **ett ögonblick** (ephemeral) — resultatet av ett specifikt val av epok/tidsspann/filter vid en given tidpunkt, inte något som sparas av applikationen.
- **Export ska vara möjligt på begäran** (t.ex. om en analytiker vill spara en specifik vy), men **syftet är inte att applikationen lagrar rapporter** — export är en användarinitierad utdata, inte en intern lagringsmekanism.
- Varje dokument beskriver i prosa (innan visualisering renderas): vad som mäts, ev. metod/formel (som vanlig text/kodblock — **inget LaTeX/KaTeX-stöd krävs**), och vilket datakontrakt (endpoint/källdata) som förväntas — utan att dokumentet känner till den faktiska implementationen.

## 8. Document Blocks

### MVP (byggs först)
- `ChartBlock` — visualiseringar via Bklit-komponenterna
- `TableBlock`
- `InsightBlock` / `WarningBlock`
- **Nytt block: tidsintervall/scrubber** (arbetsnamn `DateRangeBlock` / `ScrubberBlock`)
  - Deklarerar **min/max-gränser per dokument** (hur långt bak/fram man får välja)
  - Inkluderar en **scrubber** för finkornig navigering (inte bara start/slut-datumval)
  - Detta är kontrollen användaren använder i runtime för att välja epok/tidsspann (se §7)
  - **Ingen jämförelseperiod** (WoW/MoM) i v1 — medvetet uteslutet

### Senare fas
- `KpiBlock` — avsiktligt uteskjutet från MVP
- `QueryBlock` — ej prioriterat ännu
- `MarkdownSection` — implicit redan via MDX-prosa

## 9. Dokumentstruktur/mall

Sekvensen *prosa → (ev. formel) → datakontrakt → visualisering* är ett **löst mönster/rekommendation**, inte en tvingad mall eller delad layout-komponent. Utvecklaren avgör friheten per dokument.

## 10. Delbar state (interaktivitet)

- Epok/tidsspann/filter som användaren väljer i runtime (§7) ska **reflekteras i URL:ens query params** på respektive rutt, så en analytiker kan dela en länk med förvalt läge.
- Interaktions-scope: block kan **prenumerera på ett delat dokument-scope** (t.ex. ett datumintervall satt högst upp), men är inte tvingade till det — arkitekturen ska stödja båda lägena.

## 11. Visualiseringskomponenter

Alla visualiseringar byggs med **[Bklit](https://bklit.com/docs/components)**, ett chart-bibliotek distribuerat via shadcn/ui:s registry (copy-paste-komponenter, inte npm-paket).

**Tekniska implikationer:**
- Kräver `shadcn/ui` konfigurerat i projektet (`npx shadcn@latest init`)
- Kräver Tailwind CSS
- Passar naturligt med Next.js (som Fumadocs redan bygger på)
- Vissa komponenter drar med sig egna beroenden automatiskt (t.ex. `@bklit/shimmering-text` för `area-chart`) — antyder att **loading/skeleton-tillstånd** är en inbyggd del av komponenternas UX och bör tas i beaktning för övriga block också (särskilt relevant nu när data hämtas live per besök, se §7).

## 12. Typsäkerhet mellan datamodell och komponenter

Efter att `docs/`-strukturen (scope) är på plats och datakällorna kopplas på, ska **typer säkerställa** att datamodellen och komponenterna (blocken) är kompatibla — dvs. att ett block bara kan konsumera data i den form det faktiskt förväntar sig. Detta är ett byggtidskontrakt, inte en runtime-validering av själva datainnehållet. Den konkreta typdesignen hör ihop med datalagret och specificeras senare — här noteras bara att kontraktet ska finnas.

## 13. Design & tema

- Organisationens designregler finns dokumenterade separat och **tillämpas senare** (inte en blockerare för att börja bygga).
- **Dark/Light mode ska stödjas från start**, inte läggas till i efterhand.

## 14. Öppna frågor (medvetet inte beslutade än)

- Datalagrets konkreta utformning (dataProvider-API, källor, cache, typkontraktets exakta form) — hanteras separat, ointressant i detta scope.
- Exportfunktionens format/omfattning (§7) — inte specificerat.
- Access control/behörigheter, deployment/hosting-modell — förklarat ointressanta i detta scope, tas inte upp vidare.

~~Snapshot-triggerflöde~~ — **struket**. Applikationen sparar inga dokumentsnapshots; rapporter är ögonblicksbilder som renderas live i runtime utifrån användarens val av epok/tidsspann (se §7).

## 15. Implementation (status 2026-08-28)

Ett fungerande scaffold är byggt och verifierat (dev-server + `npm run build`). Tekniska val och fallgropar värda att känna till innan vidare arbete:

- **Stack:** Vite + React Router v7 (`--template react-router-spa`, `ssr: false`) — **inte Next.js**, på uttrycklig begäran. Fumadocs (`fumadocs-core`/`fumadocs-mdx`/`fumadocs-ui`) kör på detta precis som på Next.js. Tailwind v4 + shadcn/ui (`base-nova`-preset) + Bklit-charts (visx-baserade, inte Recharts) är på plats.
- **`create-fumadocs-app`/`shadcn` CLI:orna är interaktiva wizards som hänger sig i den här icke-TTY-miljön** även med flaggor för de flesta val — scaffolda i ett tomt temp-directory och flytta in filerna, eller passera *alla* prompt-flaggor (sök, og-image, ai-chat, preset, base) för att undvika att fastna. `npx shadcn add <namn> --yes` funkar dock fint för enskilda komponenter.
- **Bklit-registret lade `components/` och `lib/utils.ts` på repo-roten** (utanför `app/`), inte enligt vårt `app/`-alias — flyttades manuellt till `app/components/charts` och `app/components/shimmering-text.tsx`. En intern relativ import (`chart-loading-label.tsx`) pekade fel efter flytten och fick bytas till `@/components/shimmering-text`.
- **Bklits pinnade `@visx/*`-beroenden (`^4.0.1-alpha.0`) är trasiga** (saknar `.js`-filändelse i ett internt re-export, kraschar Node/Tailwind:s modulscanning) — nedpinnade till stabil `4.0.0` i `package.json`.
- **`BarChart` är kategorisk, inte tidsserie** — matar man den tät timvis data (som vår mock-IGM) kolliderar flera punkter på samma x-axel-etikett och `xScale` kraschar. `ChartBlock` har en kommentar om detta; använd `kind="area"` (default) för tidsserier, spara `kind="bar"` för redan aggregerad/dag-nivå-data.
- **`docs.async: true` (fumadocs-mdx) gör att `lastModified` bara finns bakom `page.data.load()`**, inte synkront på `getPages()`. Dashboardens "senast uppdaterade" laddar därför asynkront i en `useEffect` (`app/routes/home.tsx`).
- **`lastModified` är git-baserat (`lastModified: true` i `app/lib/source.ts`)**, inte fil-mtime — ett `fs.stat`-baserat försök drog in `node:fs/promises` i klient-bundeln (appen är SPA, ingen server) och kraschade. Eftersom repot inte är ett git-repo än visar dashboardens "Senast uppdaterade dokument" tomt tills `git init` + commits finns.
- **`docs/` (inte `content/docs/`) är omdöpt till repo-rot-namnet** för att matcha ARCHITECTURE.md/REQUIREMENTS.md ordagrant (Fumadocs standard hade varit `content/docs/`).
- Första riktiga innehållet: `docs/frx/index.mdx` + `docs/frx/technical-load.mdx` — ett fullständigt exempeldokument som använder alla fem MVP-block (`ChartBlock`, `TableBlock`, `InsightBlock`, `WarningBlock`, `DateRangeBlock`) mot mock-IGM-data (`igm-7`, props `load`/`tolerance`).
- Dev-server: `npm run dev` (port 5173), startas via `.claude/launch.json` (`preview_start` med name `ddd-flax`).
