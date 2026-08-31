# Arkitekturvision

## Grundprincip

Detta projekt ska inte ses som:

```text
Application
 └─ renders documents
```

utan som:

```text
Documents
 └─ invoke components
     └─ invoke data
```

Dokumenten är produkten.

React fungerar som renderingsmotorn och Fumadocs används som plattform för att bygga och presentera innehållet.

---

# Målsättning

Bygga en MDX-driven analys- och rapportplattform där:

- Dokument är förstaklassmedborgare
- Visualiseringar byggs som återanvändbara React-komponenter
- Data hämtas via ett gemensamt abstraktionslager
- Dokument kan fungera som interaktiva analyser
- Lösningen påminner konceptuellt om Jupyter Notebook

---

# Önskad struktur

```text
repo/
├─ docs/
│  ├─ portfolio/
│  │  ├─ summary.mdx
│  │  ├─ risk-analysis.mdx
│  │  └─ allocation.mdx
│  │
│  ├─ sales/
│  │  ├─ yearly-report.mdx
│  │  └─ forecast.mdx
│  │
│  └─ operations/
│      └─ capacity.mdx
│
├─ src/
│  ├─ components/
│  │  ├─ charts/
│  │  ├─ tables/
│  │  ├─ kpi/
│  │  └─ layouts/
│  │
│  ├─ data/
│  │  ├─ sources/
│  │  ├─ transforms/
│  │  └─ cache/
│  │
│  ├─ document-runtime/
│  ├─ mdx-components/
│  └─ types/
│
└─ generators/
```

---

# Dokumentdriven utveckling

MDX-filer ska beskriva analysen.

Exempel:

```mdx
# Sales Overview

<KpiCard source="sales.totalRevenue" />

<RevenueChart
  source="sales.monthlyRevenue"
/>

<ForecastModel
  source="sales.forecast"
/>
```

Dokumentet beskriver:

- vad som ska analyseras
- vilka visualiseringar som används
- vilka datapunkter som visas

Komponenterna ansvarar för rendering.

Dataplattformen ansvarar för datahämtning.

---

# Document Blocks

För att skapa notebook-liknande funktionalitet införs standardiserade byggblock.

Exempel:

```tsx
<MarkdownSection />

<KpiBlock />

<TableBlock />

<ChartBlock />

<InsightBlock />

<QueryBlock />

<WarningBlock />
```

MDX-filer kan då byggas upp enligt:

```mdx
# Quarterly Analysis

<QueryBlock
  query="sales-quarterly"
/>

<ChartBlock
  type="bar"
  dataset="quarterly-sales"
/>

<InsightBlock>
Revenue increased by 12%.
</InsightBlock>
```

Det ger:

- konsekvent struktur
- återanvändbara visualiseringar
- enklare generering av nya rapporter

---

# Abstraktionslager för data

Dokument ska aldrig känna till den faktiska datakällan.

Undvik:

```ts
await fetch(...)
```

Istället:

```ts
const data = await dataProvider.get(
  "sales.monthly"
);
```

Det gör att datakällor kan bytas utan att dokumenten påverkas.

Möjliga framtida källor:

```text
CSV
JSON
REST API
GraphQL
SQL
Microsoft Fabric
Databricks
Azure Storage
Lakehouse
```

---

# Rapport som självständig enhet

En rapport bör kunna innehålla:

```text
Markdown
+
Query
+
Transformation
+
Visualization
```

Exempel:

```text
docs/
└─ reports/
   └─ revenue/
      ├─ report.mdx
      ├─ revenue.query.ts
      ├─ revenue.transform.ts
      └─ metadata.json
```

Varje rapport blir då självförsörjande.

---

# Konceptuell modell

```text
Fumadocs
+
MDX
+
React
+
TypeScript

        ↓

Analytics Documentation Platform

        ↓

Documents as Applications
```

Projektet ska inte betraktas som en traditionell dokumentationssida eller en klassisk React-applikation.

Det är en dokumentdriven analysplattform där varje dokument kan innehålla:

- text
- KPI:er
- tabeller
- diagram
- datainsamling
- transformationer
- insikter
- interaktiva visualiseringar

och där dokumenten i praktiken fungerar som applikationer.
