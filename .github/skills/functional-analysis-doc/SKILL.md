---
name: functional-analysis-doc
description: Genera un documento Word (.docx) di analisi funzionale per TeamFit o per nuove feature. USE WHEN viene chiesto di creare/aggiornare un'analisi funzionale, specifica funzionale, FSD, documento di analisi, requisiti funzionali, use case document, scope document. Triggers - analisi funzionale, specifica funzionale, FSD, functional analysis, requisiti, use case, documento Word, .docx, scope document, business requirements, BRD.
---

# Functional Analysis Doc — TeamFit

Skill operativa per produrre un **documento Word** di analisi funzionale coerente
con il contesto TeamFit. Il documento deve essere generato per essere consegnato
a stakeholder business (PM, sponsor, manager) e tecnici.

## Output

- **Cartella**: `docs/analisi-funzionale/`
- **Nome file**: `AF_<argomento>_<YYYY-MM-DD>.docx`
  - esempio: `AF_TeamFit_MVP_2026-06-20.docx`, `AF_AlertingEngine_2026-06-20.docx`
- **Lingua**: italiano.

## Tooling

Usa **python-docx** (cross-platform, deterministico, no Word installato).

```pwsh
# requisito una tantum
python -m pip install python-docx
```

> Alternativa accettata se python-docx non è installabile: genera un file
> Markdown `.md` con la stessa struttura e converti con pandoc
> (`pandoc input.md -o output.docx --reference-doc=reference.docx`).
> **Non** generare HTML stampato in PDF.

## Fonti di verità da cui attingere

Prima di scrivere, **leggi sempre**:

1. [`docs/project-context.md`](../../../docs/project-context.md) — scope, glossario, KPI, ruoli, regole alert, decisioni MVP
2. [`docs/domain-model.md`](../../../docs/domain-model.md) — entità, invariants, calcoli
3. [`docs/architecture.md`](../../../docs/architecture.md) — bounded context, deploy
4. [`AGENTS.md`](../../../AGENTS.md) — vincoli e fuori scope

Non inventare contenuti: se manca un'informazione, chiedila all'utente prima di scrivere il file.

## Struttura standard del documento

Ordine obbligatorio delle sezioni. Per ogni progetto/feature si possono accorciare,
mai riordinare.

1. **Copertina** — titolo, sottotitolo "Analisi Funzionale", versione, data, autore, classificazione (`Interno`).
2. **Cronologia revisioni** — tabella (versione, data, autore, modifiche).
3. **Indice** — generato (`add_paragraph(..., style='TOC Heading')` + segnaposto rigenerabile in Word).
4. **1. Executive Summary** — 5-10 righe: cos'è, a chi serve, valore, vincoli.
5. **2. Scope**
   - 2.1 In scope (bullet list)
   - 2.2 Fuori scope (bullet list, citare le esclusioni MVP)
6. **3. Glossario** — tabella `Termine | Definizione` (riusa quello di `project-context.md §2`).
7. **4. Attori e ruoli**
   - 4.1 Elenco ruoli (Admin, Manager, Presales, PM)
   - 4.2 Matrice permessi `Ruolo × Azione` (tabella `R/W/-`).
8. **5. Requisiti funzionali** — uno per riga, con codice `RF-XXX`:
   - tabella `Codice | Titolo | Descrizione | Priorità (MUST/SHOULD/COULD) | Note`
9. **6. Requisiti non funzionali** — `RNF-XXX`: performance, sicurezza, accessibilità, browser supportati, lingua.
10. **7. Casi d'uso principali** — per ciascuno:
    - Titolo + codice `UC-XXX`
    - Attore primario
    - Precondizioni
    - Flusso base (numerato)
    - Flussi alternativi
    - Postcondizioni
    - Criteri di accettazione
11. **8. Modello dati** — sintesi delle entità (aggregate roots), attributi chiave, invariants. Inserire l'ER come immagine PNG esportata dal Mermaid di `domain-model.md` se disponibile (vedi sezione "Diagrammi" più sotto), altrimenti come testo.
12. **9. Regole di business** — regole alerting (le 6), calcolo write-up, transizioni stato progetto.
13. **10. KPI e dashboard** — definizioni operative dei KPI, screen della dashboard se disponibile.
14. **11. Integrazioni & deploy** — diagramma deploy, dipendenze esterne (Azure SQL, Static Web App).
15. **12. Vincoli e assunzioni** — tempo (MVP 5h), single-tenant, dati mock, auth mock.
16. **13. Rischi e mitigazioni** — tabella `Rischio | Probabilità | Impatto | Mitigazione`.
17. **14. Roadmap post-MVP** — bullet list ordinata (timesheet, multi-tenant, Entra ID, audit log, export).
18. **Allegati** — link a file repo (`docs/...`).

## Convenzioni di formattazione

- Font corpo: `Calibri` 11 pt.
- Heading 1 (sezioni 1..14): `Calibri` 16 pt, grassetto, blu scuro (`#1F3864`).
- Heading 2: `Calibri` 13 pt, grassetto.
- Heading 3: `Calibri` 11 pt, grassetto.
- Tabelle: stile `Light Grid Accent 1`.
- Numerazione automatica delle sezioni (1, 1.1, 1.1.1).
- Header documento: "TeamFit — Analisi Funzionale".
- Footer: nome file + numero pagina.

## Diagrammi

- Se serve includere ER/architettura, **esporta i Mermaid** in PNG e inseriscili
  con `document.add_picture(...)`.
- Esportazione consigliata: `mmdc -i input.mmd -o output.png` (Mermaid CLI).
- Salva i PNG in `docs/analisi-funzionale/img/`.
- Se Mermaid CLI non disponibile, inserisci il testo Mermaid in un blocco
  monospaziato e annota "diagramma da rigenerare".

## Template Python di partenza

Crea uno script `docs/analisi-funzionale/_generate.py` (riutilizzabile) che
produce il `.docx`. Modello minimo:

```python
from datetime import date
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH

PROJECT = "TeamFit"
TITLE = "Piattaforma di gestione e ottimizzazione progetti"
VERSION = "0.1"
AUTHOR = "TeamFit Team"

doc = Document()

# --- stili base ---
style = doc.styles["Normal"]
style.font.name = "Calibri"
style.font.size = Pt(11)

def h1(text: str) -> None:
    p = doc.add_heading(text, level=1)
    for r in p.runs:
        r.font.color.rgb = RGBColor(0x1F, 0x38, 0x64)

def h2(text: str) -> None:
    doc.add_heading(text, level=2)

def table(headers: list[str], rows: list[list[str]]) -> None:
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Light Grid Accent 1"
    for i, h in enumerate(headers):
        t.rows[0].cells[i].text = h
    for row in rows:
        cells = t.add_row().cells
        for i, value in enumerate(row):
            cells[i].text = value

# --- copertina ---
cover = doc.add_paragraph()
cover.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = cover.add_run(PROJECT)
run.font.size = Pt(28)
run.bold = True
doc.add_paragraph(TITLE, style="Subtitle").alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph(f"Analisi Funzionale — v{VERSION} — {date.today():%Y-%m-%d}").alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.add_paragraph(f"Autore: {AUTHOR}").alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.add_page_break()

# --- cronologia revisioni ---
h1("Cronologia revisioni")
table(["Versione", "Data", "Autore", "Modifiche"],
      [[VERSION, f"{date.today():%Y-%m-%d}", AUTHOR, "Prima emissione"]])

# --- TODO: aggiungere sezioni 1..14 secondo la struttura standard della skill ---

doc.save(f"docs/analisi-funzionale/AF_TeamFit_MVP_{date.today():%Y-%m-%d}.docx")
print("OK")
```

Esegui con:
```pwsh
python docs/analisi-funzionale/_generate.py
```

## Workflow per generare il documento

1. Conferma con l'utente: scope del documento (intero MVP? una sola feature?).
2. Leggi i docs di contesto sopra elencati.
3. Identifica le sezioni applicabili (es. per una singola feature, salta §11 deploy globale).
4. Estendi/adatta `_generate.py` con le sezioni mancanti.
5. Esegui lo script, verifica che il file si apra senza errori.
6. Annota nel `docs/project-context.md` (sez. "Storia decisioni") la versione emessa.

## Anti-pattern

- Inventare requisiti non documentati.
- Copiare in italiano testo macchina (es. tag XML, JSON crudo) nelle sezioni business.
- Inserire screenshot fittizi: meglio nessuno screenshot di uno sbagliato.
- Generare PDF al posto di `.docx` (richiesta esplicita: Word).
- Mettere segreti, connection string o token nel documento.
- Saltare la cronologia revisioni: ogni emissione bumpa la versione (`0.1` → `0.2` → `1.0`).
