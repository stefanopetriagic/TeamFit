const fs = require('fs');
const path = require('path');
let docx;
try {
  docx = require('docx');
} catch {
  docx = require('/tmp/opencode/node_modules/docx');
}
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageNumber,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = docx;

const OUT = path.resolve('docs/analisi-funzionale/INFRA_TeamFit_2026-06-20.docx');
const POC_PNG = path.resolve('docs/analisi-funzionale/img/teamfit-poc-infrastructure.png');
const ENT_PNG = path.resolve('docs/analisi-funzionale/img/teamfit-enterprise-infrastructure.png');

const PAGE_WIDTH = 14400;
const BLUE = '1F4E79';
const LIGHT_BLUE = 'D9EAF7';
const LIGHT_GRAY = 'F2F2F2';
const WHITE = 'FFFFFF';
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function text(value, options = {}) {
  return new TextRun({ text: value, font: 'Arial', size: options.size || 20, bold: options.bold, color: options.color });
}

function p(value, options = {}) {
  return new Paragraph({
    heading: options.heading,
    alignment: options.alignment,
    spacing: { before: options.before || 0, after: options.after || 140 },
    children: [text(value, options)],
  });
}

function cell(value, width, options = {}) {
  const runs = Array.isArray(value) ? value.map(v => text(v, options)) : [text(String(value), options)];
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: BORDERS,
    shading: options.header ? { fill: BLUE, type: ShadingType.CLEAR, color: 'auto' } : options.total ? { fill: LIGHT_BLUE, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: [new Paragraph({ children: runs, spacing: { after: 0 } })],
  });
}

function table(headers, rows, widths) {
  return new Table({
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((h, i) => cell(h, widths[i], { bold: true, color: WHITE, header: true })) }),
      ...rows.map(row => new TableRow({ children: row.map((v, i) => cell(v, widths[i], { total: row[0] && String(row[0]).startsWith('Totale') })) })),
    ],
  });
}

function bullet(value) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 80 },
    children: [text(value)],
  });
}

function imageParagraph(file, title) {
  return [
    p(title, { bold: true, before: 120 }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new ImageRun({
          type: 'png',
          data: fs.readFileSync(file),
          transformation: { width: 760, height: 484 },
          altText: { title, description: title, name: path.basename(file) },
        }),
      ],
    }),
  ];
}

const pocPricing = [
  ['App Service Plan', 'B1 Linux', '~11–12'],
  ['Static Web App', 'Free di default; Standard se serve linked backend /api/*', '0 o costo Standard'],
  ['Azure SQL', 'Free se disponibile; fallback Basic B', '0–5'],
  ['Cosmos DB', 'Serverless', '~0–5'],
  ['Storage Account', 'Standard LRS', '<1'],
  ['Key Vault', 'Standard', '<1'],
  ['Azure OpenAI via Azure AI Foundry', 'Private endpoint, costo a token/modello', '0 fisso + consumo'],
  ['Margine networking', 'VNet, 2 subnet, 5 Private Endpoint, Private DNS Zone, traffico leggero', '~35–50'],
  ['Log Analytics', 'PerGB2018', '~0–5'],
  ['Application Insights', 'Workspace-based', 'incluso in LAW'],
  ['Totale stimato', 'Solo infrastruttura fissa; consumo Azure OpenAI escluso', '~50–80 €/mese'],
];

const enterprisePricing = [
  ['Application Gateway WAF_v2', 'Costo fisso + 2 capacity unit', '~310–320'],
  ['App Service Plan frontend', 'P1v3 Linux', '~110–115'],
  ['App Service Plan backend', 'P1v3 Linux', '~110–115'],
  ['VM Agent', 'Standard_B2s + OS disk', '~35–45'],
  ['Azure SQL', 'S2 (50 DTU)', '~60–75'],
  ['Cosmos DB', 'Provisioned 400 RU/s', '~25'],
  ['Storage Account', 'Standard LRS', '<5'],
  ['Key Vault', 'Standard', '<5'],
  ['Azure OpenAI via Azure AI Foundry', 'Private endpoint, costo a token/modello', '0 fisso + consumo'],
  ['Margine networking', '7+ Private Endpoint, Private DNS, Public IP, traffico leggero', '~50–80'],
  ['Log Analytics', 'PerGB2018', '~10–30'],
  ['Application Insights', 'Workspace-based', 'incluso in LAW'],
  ['Totale stimato', 'Solo infrastruttura fissa; consumo Azure OpenAI escluso', '~705–800 €/mese'],
];

const enterpriseTiming = [
  ['Moduli Terraform base (RG, VNet, subnet, NSG, DNS privato)', '1.5–2 giorni', '1 giorno'],
  ['Data service privati (SQL, Cosmos DB, Storage, Key Vault, Azure OpenAI/Foundry, Private Endpoint)', '1.5–2 giorni', '1 giorno'],
  ['App Service Enterprise (2 app/plan, identity, settings, private endpoint, VNet Integration)', '1.5–2 giorni', '1 giorno'],
  ['Application Gateway WAF_v2 + health probe + routing HTTPS verso frontend', '1–1.5 giorni', '0.75–1 giorno'],
  ['Subnet VM Agent + VM + hardening baseline', '0.5–1 giorno', '0.25–0.5 giorno'],
  ['terraform fmt/validate/plan, variabili, output, README operativo', '0.5 giorno', '0.25–0.5 giorno'],
  ['Totale validate/plan', '6–8 giorni', '4–5 giorni'],
  ['Apply, debug DNS/private endpoint, smoke test', '+2–3 giorni', '+1–2 giorni'],
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 20 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: 'Arial', color: BLUE }, paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: 'Arial', color: BLUE }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 220 } } } }] }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
        margin: { top: 720, right: 720, bottom: 720, left: 720 },
      },
    },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [text('TeamFit — Infrastruttura PoC & Enterprise', { size: 16, color: '666666' })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [text('Page ', { size: 16 }), new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Arial' })] })] }) },
    children: [
      p('Documento Infrastrutturale TeamFit', { size: 38, bold: true, color: BLUE, alignment: AlignmentType.CENTER, before: 120, after: 80 }),
      p('Panoramica Azure PoC ed Enterprise, scelte architetturali, pricing e tempi di implementazione', { size: 22, alignment: AlignmentType.CENTER, after: 260 }),
      p('Data: 2026-06-20', { alignment: AlignmentType.CENTER, after: 60 }),
      p('Stato: documento generato dai sorgenti del repository e dai diagrammi Draw.io esportati in PNG.', { alignment: AlignmentType.CENTER, after: 300 }),

      p('1. Sintesi Esecutiva', { heading: HeadingLevel.HEADING_1 }),
      p('TeamFit prevede due profili infrastrutturali Azure. Il profilo PoC valida l’applicazione con costo ricorrente basso, mantenendo comunque i requisiti networking rilevanti: VNet Integration per App Service, Private Endpoint, Private DNS e accesso privato ai data service. Il profilo Enterprise rende la stessa soluzione adatta a produzione, portando il perimetro pubblico su Application Gateway WAF_v2 e mantenendo App Service, dati e servizi AI su endpoint privati.'),
      p('Entrambe le topologie includono Azure SQL, Cosmos DB, Storage, Key Vault, Log Analytics, Application Insights e Azure OpenAI tramite Azure AI Foundry. Il consumo Azure OpenAI / Foundry è escluso dai totali fissi perché dipende dal modello scelto, dal volume di token e dalle funzionalità abilitate.'),

      p('2. Scelte Architetturali', { heading: HeadingLevel.HEADING_1 }),
      bullet('La PoC mantiene App Service pubblico in ingresso per semplicità e costo, ma usa VNet Integration e Private Endpoint per l’accesso outbound ai dati.'),
      bullet('La PoC usa App Service B1 Linux perché il tier Basic+ supporta Regional VNet Integration, mentre F1/Shared non la supportano.'),
      bullet('La PoC mantiene Static Web App Free di default; il linked backend /api/* resta opzionale e richiede Static Web App Standard.'),
      bullet('Enterprise espone pubblicamente solo Application Gateway WAF_v2. Frontend e backend App Service sono raggiungibili solo tramite private endpoint.'),
      bullet('Azure OpenAI via Azure AI Foundry è rappresentato in entrambi i diagrammi; l’accesso resta privato per riflettere i requisiti networking richiesti.'),
      bullet('La delivery Terraform Enterprise è stimata per AGIC Figura F, separando validate/plan da apply/debug/smoke test.'),

      p('3. Infrastruttura PoC', { heading: HeadingLevel.HEADING_1 }),
      p('La topologia PoC è ottimizzata per contenere il costo mensile preservando il comportamento networking atteso: API pubblica su App Service, VNet Integration per il traffico outbound, subnet dedicata ai private endpoint e Private DNS Zone linkate alla VNet.'),
      ...imageParagraph(POC_PNG, 'Diagramma Infrastruttura PoC'),
      p('Pricing risorse PoC', { heading: HeadingLevel.HEADING_2 }),
      table(['Risorsa', 'SKU / Assunzione', '€/mese ca.'], pocPricing, [3300, 8300, 2800]),

      p('4. Infrastruttura Enterprise', { heading: HeadingLevel.HEADING_1 }),
      p('La topologia Enterprise è pensata per produzione. Application Gateway WAF_v2 è l’unico punto di ingresso pubblico. Frontend e backend App Service usano private endpoint, i servizi backend sono raggiunti tramite VNet Integration e Private Link, e l’agent CI/CD è dentro la VNet per raggiungere gli endpoint SCM privati.'),
      ...imageParagraph(ENT_PNG, 'Diagramma Infrastruttura Enterprise'),
      p('Pricing risorse Enterprise', { heading: HeadingLevel.HEADING_2 }),
      table(['Risorsa', 'SKU / Assunzione', '€/mese ca.'], enterprisePricing, [3300, 8300, 2800]),
      p('Tempi implementazione Enterprise', { heading: HeadingLevel.HEADING_2 }),
      table(['Attività', 'Baseline precedente', 'Stima aggiornata AGIC Figura F'], enterpriseTiming, [7200, 3400, 3800]),

      p('5. Note su Costi e Delivery', { heading: HeadingLevel.HEADING_1 }),
      bullet('Tutti i prezzi sono indicativi, West Europe, pay-as-you-go, IVA esclusa.'),
      bullet('Azure OpenAI / Azure AI Foundry è fatturato separatamente in base a modello, token e funzionalità usate.'),
      bullet('La stima Enterprise assume moduli Terraform riusabili, naming già definito, assenza di Azure Policy bloccanti e nessun dominio/certificato TLS custom nel perimetro.'),
      bullet('Fuori scope stima: autenticazione reale Entra ID, terraform apply durante MVP, certificato TLS custom, bootstrap completo runner CI/CD, NAT Gateway, Azure Firewall, Bastion e integrazione hub-spoke landing zone.'),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buffer);
  console.log(OUT);
});
