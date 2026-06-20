---
name: project-presentation-ppt
description: Genera una presentazione PowerPoint (.pptx) per il progetto TeamFit o per pitch/demo/stato avanzamento. USE WHEN viene chiesto di creare una presentazione, pitch deck, slide di kickoff, slide demo, slide di stato avanzamento progetto, executive summary visivo. Triggers - presentazione, slide, PowerPoint, .pptx, pitch deck, kickoff, demo deck, executive summary, stato avanzamento, SAL, project review, pitch.
---

# Project Presentation PPT — TeamFit

Skill operativa per produrre una **presentazione PowerPoint** del progetto
TeamFit (pitch commerciale, demo MVP, kickoff, SAL).

## Output

- **Cartella**: `docs/presentazioni/`
- **Nome file**: `PPT_<tipo>_<argomento>_<YYYY-MM-DD>.pptx`
  - esempi: `PPT_PITCH_TeamFit_2026-06-20.pptx`, `PPT_DEMO_MVP_2026-06-20.pptx`, `PPT_SAL_W26_2026-06-20.pptx`
- **Lingua**: italiano.
- **Aspect ratio**: 16:9.

## Tooling

Usa **python-pptx** (cross-platform, no PowerPoint installato).

```pwsh
python -m pip install python-pptx
```

> Non generare HTML "tipo slide" o PDF al posto del `.pptx`.

## Fonti di verità

Prima di scrivere, leggi:

1. [`docs/project-context.md`](../../../docs/project-context.md) — scope, valore, KPI, ruoli, decisioni
2. [`docs/architecture.md`](../../../docs/architecture.md) — diagrammi
3. [`docs/domain-model.md`](../../../docs/domain-model.md) — entità per slide dati
4. [`AGENTS.md`](../../../AGENTS.md) — vincoli

## Tipologie di deck e slide order

Scegli il tipo all'inizio della conversazione e adatta. **Non superare 15 slide**
per nessuno dei tipi (demo deck = max 10).

### A. Pitch commerciale (vendita a un'azienda cliente)

1. Copertina
2. Il problema (perché i progetti vanno in write-off)
3. La soluzione (TeamFit in 1 frase + payoff)
4. Come funziona (diagramma alto livello)
5. Funzionalità chiave (4-6 bullet con icone)
6. Ruoli supportati (Admin / Manager / Presales / PM)
7. Esempio di alert e ROI atteso
8. Architettura tecnica (1 slide, riusare diagramma `architecture.md`)
9. Sicurezza & compliance (Azure SQL, single-tenant, predisposto Entra ID)
10. Roadmap (MVP → V1 → V2)
11. Modello di pricing (placeholder)
12. Team & contatti
13. Q&A / Call to action

### B. Demo deck (presentazione MVP)

1. Copertina
2. Recap scope MVP (5 bullet)
3. Glossario rapido (write-up/down, figura, allocazione)
4. Modello dati (mini-ER semplificato)
5. Demo flow (passi numerati che farai a schermo)
6. KPI dashboard (screenshot)
7. Motore di alerting (regole + esempio alert)
8. Stack tecnico & deploy target
9. Cosa è fuori scope MVP
10. Prossimi passi

### C. Stato avanzamento (SAL settimanale/mensile)

1. Copertina (settimana/mese)
2. Highlights della settimana (3 bullet)
3. Fasi completate (checkbox sulle 6 fasi del piano)
4. Metriche progetto (n° feature, copertura test, write-up MVP simulato)
5. Rischi e blocker
6. Decisioni richieste
7. Prossimi step

## Linee guida visive

- **Aspect ratio**: 16:9 (`prs.slide_width = Inches(13.333); prs.slide_height = Inches(7.5)`).
- **Palette** (coerente con il tema Ant Design di prodotto):
  - Primary: `#1677FF`
  - Dark: `#1F3864`
  - Accent warning: `#FAAD14`
  - Accent critical: `#FF4D4F`
  - Background: `#FFFFFF`
  - Testo: `#262626`
- **Font**: `Calibri` per body (18-22pt), `Calibri` heading (32-40pt). Mai font con licenza dubbia.
- **Massimo 6 bullet per slide**. Una idea per slide.
- **Niente wall of text**: se serve testo > 50 parole, dividi in 2 slide.
- **Diagrammi**: esporta i Mermaid in PNG (`mmdc -i x.mmd -o x.png`) e salvali in `docs/presentazioni/img/`.
- **Footer**: "TeamFit · v0.1 · <data>" + numero pagina.

## Template Python di partenza

Crea `docs/presentazioni/_generate.py` riusabile:

```python
from datetime import date
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dgm.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

PRIMARY = RGBColor(0x16, 0x77, 0xFF)
DARK = RGBColor(0x1F, 0x38, 0x64)
WARNING = RGBColor(0xFA, 0xAD, 0x14)
CRITICAL = RGBColor(0xFF, 0x4D, 0x4F)
TEXT = RGBColor(0x26, 0x26, 0x26)

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

BLANK = prs.slide_layouts[6]

def add_slide_with_title(title: str):
    slide = prs.slides.add_slide(BLANK)
    # title bar
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0),
                                  prs.slide_width, Inches(1.0))
    bar.fill.solid(); bar.fill.fore_color.rgb = DARK
    bar.line.fill.background()
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(0.2),
                                  prs.slide_width - Inches(1), Inches(0.7))
    tf = tb.text_frame
    tf.text = title
    p = tf.paragraphs[0]
    p.runs[0].font.size = Pt(32)
    p.runs[0].font.bold = True
    p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    return slide

def add_bullets(slide, bullets: list[str], left=Inches(0.7), top=Inches(1.5),
                width=Inches(12), height=Inches(5.5)):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    for i, text in enumerate(bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = f"•  {text}"
        p.font.size = Pt(20)
        p.font.color.rgb = TEXT
        p.space_after = Pt(8)

# --- Copertina ---
cover = prs.slides.add_slide(BLANK)
bg = cover.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0),
                             prs.slide_width, prs.slide_height)
bg.fill.solid(); bg.fill.fore_color.rgb = DARK
bg.line.fill.background()
tb = cover.shapes.add_textbox(Inches(1), Inches(2.5), Inches(11), Inches(3))
tf = tb.text_frame
tf.text = "TeamFit"
tf.paragraphs[0].runs[0].font.size = Pt(60)
tf.paragraphs[0].runs[0].font.bold = True
tf.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
p2 = tf.add_paragraph()
p2.text = "Gestione e ottimizzazione progetti enterprise"
p2.font.size = Pt(28); p2.font.color.rgb = RGBColor(0xCC, 0xDD, 0xFF)
p3 = tf.add_paragraph()
p3.text = f"v0.1 · {date.today():%d/%m/%Y}"
p3.font.size = Pt(16); p3.font.color.rgb = RGBColor(0xAA, 0xBB, 0xDD)

# --- Esempio slide contenuto ---
s = add_slide_with_title("Il problema")
add_bullets(s, [
    "Progetti che bruciano budget senza segnali tempestivi",
    "Visibilità frammentata tra PM, Manager e Presales",
    "Decisioni reattive: il write-off si scopre a consuntivo",
    "Difficoltà nel correlare costi figura ↔ tariffe vendita",
])

# --- TODO: aggiungere le altre slide secondo l'ordine del deck scelto ---

prs.save(f"docs/presentazioni/PPT_PITCH_TeamFit_{date.today():%Y-%m-%d}.pptx")
print("OK")
```

> Nota: in `python-pptx` reale il modulo colore è `pptx.dml.color` (non `dgm`):
> usa `from pptx.dml.color import RGBColor`. Correggi l'import quando crei lo
> script.

Esegui con:
```pwsh
python docs/presentazioni/_generate.py
```

## Workflow

1. Chiedi all'utente **tipo di deck** (A pitch / B demo / C SAL) e **destinatario** (cliente esterno / management interno / team tecnico). Adatta il livello di dettaglio.
2. Conferma l'**eventuale screenshot** disponibile (dashboard, progetto detail). Se mancano, salta le slide screenshot — meglio nessuna che fittizia.
3. Leggi i docs di contesto.
4. Genera/aggiorna `_generate.py` con le slide del tipo scelto.
5. Esegui, apri il file e controlla che le slide non sforino il canvas (overflow testo).
6. Annota nel `docs/project-context.md` (sez. "Storia decisioni") la versione emessa, se è un deck commerciale o di kickoff.

## Anti-pattern

- Più di 15 slide (10 per demo).
- Wall of text > 50 parole per slide.
- Animazioni / transizioni: zero.
- Screenshot inventati o segnaposto "lorem ipsum" lasciati nel file finale.
- Mettere segreti, connection string, URL interni nel deck commerciale.
- Logo/marchi di terze parti senza autorizzazione (Azure logo: solo se nel rispetto dei brand guideline Microsoft).
- Riutilizzare lo stesso file `.pptx` sovrascrivendo versioni precedenti: ogni emissione ha la propria data nel nome file.
