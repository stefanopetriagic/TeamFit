# _generate.ps1
# Genera AF_TeamFit_ManAgent_MVP_2026-06-20.docx via Word COM (Office 16+)
# Eseguire da qualsiasi directory con:
#   powershell -ExecutionPolicy Bypass -File .\docs\analisi-funzionale\_generate.ps1

$ErrorActionPreference = "Stop"
$repoRoot   = "c:\Users\StefanoPetri\source\repos\Man-Agent"
$outPath    = "$repoRoot\docs\analisi-funzionale\AF_TeamFit_ManAgent_MVP_2026-06-20.docx"
$logoPath   = "$repoRoot\docs\TeamFit-Logo.png"

# ---- Colori (R + G*256 + B*65536) ----
$C_DARK_BLUE  = 6567967    # #1F3864
$C_BLACK      = 0
$C_GRAY       = 8421504    # #808080
$C_LGRAY      = 13882323   # #D4D4D4
$C_HDR_BG     = 15652797   # #BDD7EE  (Excel-style light-blue header)
$C_WARN_BG    = 10284031   # #FFEB9C  (light yellow)
$C_CRIT_BG    = 13551615   # #FFC7CE  (light red)

Write-Host "[1/4] Avvio Word..." -ForegroundColor Cyan
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

try {
    $doc = $word.Documents.Add()
    $sel = $word.Selection

    # ---- Page margins ----
    $doc.PageSetup.LeftMargin   = $word.InchesToPoints(1.10)
    $doc.PageSetup.RightMargin  = $word.InchesToPoints(1.10)
    $doc.PageSetup.TopMargin    = $word.InchesToPoints(0.98)
    $doc.PageSetup.BottomMargin = $word.InchesToPoints(0.98)

    # ---- Heading styles ----
    $doc.Styles["Heading 1"].Font.Name  = "Calibri"; $doc.Styles["Heading 1"].Font.Size = 16
    $doc.Styles["Heading 1"].Font.Bold  = $true;      $doc.Styles["Heading 1"].Font.Color = $C_DARK_BLUE
    $doc.Styles["Heading 2"].Font.Name  = "Calibri"; $doc.Styles["Heading 2"].Font.Size = 13
    $doc.Styles["Heading 2"].Font.Bold  = $true;      $doc.Styles["Heading 2"].Font.Color = $C_DARK_BLUE
    $doc.Styles["Heading 3"].Font.Name  = "Calibri"; $doc.Styles["Heading 3"].Font.Size = 11
    $doc.Styles["Heading 3"].Font.Bold  = $true;      $doc.Styles["Heading 3"].Font.Color = $C_DARK_BLUE
    $doc.Styles["Normal"].Font.Name     = "Calibri"; $doc.Styles["Normal"].Font.Size  = 11
    $doc.Styles["Normal"].Font.Color    = $C_BLACK

    # ---- Helpers ----
    function ResetNormal {
        $script:sel.Style     = "Normal"
        $script:sel.Font.Bold  = $false
        $script:sel.Font.Color = 0
        $script:sel.Font.Size  = 11
        $script:sel.ParagraphFormat.Alignment = 0
    }
    function H1($text) {
        $script:sel.Style = "Heading 1"; $script:sel.TypeText($text); $script:sel.TypeParagraph(); ResetNormal
    }
    function H2($text) {
        $script:sel.Style = "Heading 2"; $script:sel.TypeText($text); $script:sel.TypeParagraph(); ResetNormal
    }
    function H3($text) {
        $script:sel.Style = "Heading 3"; $script:sel.TypeText($text); $script:sel.TypeParagraph(); ResetNormal
    }
    function Para($text) {
        ResetNormal; $script:sel.TypeText($text); $script:sel.TypeParagraph()
    }
    function Bullet($text) {
        ResetNormal; $script:sel.TypeText([char]0x2022 + "  " + $text); $script:sel.TypeParagraph()
    }
    function Blank { $script:sel.TypeParagraph() }
    function PageBreak { $script:sel.InsertBreak(7) }  # wdPageBreak = 7
    function AfterTable($tbl) {
        $ep = $tbl.Range.End
        $script:doc.Range($ep, $ep).Select()
        $script:sel = $script:word.Selection
        ResetNormal
        $script:sel.TypeParagraph()
    }
    function HdrRow($tbl, $cols, [string[]]$labels) {
        for ($c = 1; $c -le $cols; $c++) {
            $cell = $tbl.Cell(1, $c)
            $cell.Range.Text = $labels[$c-1]
            $cell.Range.Font.Bold  = $true
            $cell.Range.Font.Color = $C_DARK_BLUE
            $cell.Range.Font.Size  = 9
        }
        $tbl.Rows(1).Shading.BackgroundPatternColor = $script:C_HDR_BG
    }
    function FillRow($tbl, $row, [string[]]$vals, $fontSize = 9) {
        for ($c = 1; $c -le $vals.Count; $c++) {
            $cell = $tbl.Cell($row, $c)
            $cell.Range.Text = $vals[$c-1]
            $cell.Range.Font.Size = $fontSize
        }
        $tbl.Cell($row, 1).Range.Font.Bold = $true
    }

    # ==================================================================
    # COVER PAGE
    # ==================================================================
    $sel.ParagraphFormat.Alignment = 1  # center

    if (Test-Path $logoPath) {
        $shape = $doc.InlineShapes.AddPicture($logoPath, $false, $true, $sel.Range)
        $w = $word.InchesToPoints(2.4)
        $shape.Width = $w
        $shape.Height = $shape.Height * ($w / $shape.Width)
        $sel.MoveRight(1, 1)  # move past inline shape
    } else {
        $sel.Font.Size = 10; $sel.Font.Color = $C_GRAY; $sel.TypeText("[LOGO TEAMFIT]")
    }
    $sel.TypeParagraph(); $sel.TypeParagraph()

    $sel.Font.Name = "Calibri"; $sel.Font.Size = 9; $sel.Font.Bold = $false; $sel.Font.Color = $C_GRAY
    $sel.TypeText("ANALISI FUNZIONALE  -  DOCUMENTO INTERNO"); $sel.TypeParagraph(); $sel.TypeParagraph()

    $sel.Font.Size = 36; $sel.Font.Bold = $true; $sel.Font.Color = $C_DARK_BLUE
    $sel.TypeText("Man-Agent"); $sel.TypeParagraph()
    $sel.Font.Size = 15; $sel.Font.Bold = $false; $sel.Font.Color = $C_GRAY
    $sel.TypeText("Piattaforma SaaS per la gestione e ottimizzazione"); $sel.TypeParagraph()
    $sel.TypeText("dei progetti aziendali"); $sel.TypeParagraph()
    1..7 | ForEach-Object { $sel.TypeParagraph() }

    # Metadata table (left-aligned)
    $sel.ParagraphFormat.Alignment = 0
    $cTblR = $sel.Range
    $cTbl  = $doc.Tables.Add($cTblR, 4, 2)
    $cTbl.Style = "Table Grid"
    $cTbl.Borders.OutsideLineStyle = 1; $cTbl.Borders.InsideLineStyle = 0
    @(
        @("Versione",        "0.1  -  Bozza"),
        @("Data emissione",  "20 giugno 2026"),
        @("Progetto",        "Man-Agent MVP"),
        @("Classificazione", "Uso interno  -  TeamFit Srl")
    ) | ForEach-Object -Begin { $r=1 } -Process {
        $cTbl.Cell($r,1).Range.Text = $_[0]; $cTbl.Cell($r,2).Range.Text = $_[1]
        $cTbl.Cell($r,1).Range.Font.Bold = $true; $cTbl.Cell($r,1).Range.Font.Color = $C_DARK_BLUE
        $cTbl.Cell($r,1).Range.Font.Size = 10;    $cTbl.Cell($r,2).Range.Font.Size = 10
        $r++
    }
    $cTbl.Columns(1).Width = $word.InchesToPoints(1.8)
    $cTbl.Columns(2).Width = $word.InchesToPoints(3.5)
    AfterTable $cTbl; PageBreak

    # ==================================================================
    # REVISIONI
    # ==================================================================
    H1 "Revisioni"
    $rvR = $sel.Range; $rvT = $doc.Tables.Add($rvR, 3, 4)
    $rvT.Style = "Table Grid"
    HdrRow $rvT 4 @("Versione","Data","Autore","Descrizione modifiche")
    FillRow $rvT 2 @("0.1","20/06/2026","TeamFit","Prima emissione  -  analisi funzionale MVP")
    $rvT.Columns(1).Width = $word.InchesToPoints(0.7); $rvT.Columns(2).Width = $word.InchesToPoints(1.0)
    $rvT.Columns(3).Width = $word.InchesToPoints(1.2); $rvT.Columns(4).Width = $word.InchesToPoints(3.6)
    AfterTable $rvT; PageBreak

    # ==================================================================
    # INDICE (TOC)
    # ==================================================================
    H1 "Indice"
    $tocRange = $sel.Range
    $toc = $doc.TablesOfContents.Add($tocRange, $true, 1, 3)
    $toc.Range.Collapse(0); $toc.Range.Select()
    $sel = $word.Selection; ResetNormal
    $sel.TypeParagraph(); PageBreak

    # ==================================================================
    # 1. EXECUTIVE SUMMARY
    # ==================================================================
    H1 "1. Executive Summary"
    Para "Man-Agent e' una piattaforma SaaS enterprise rivolta ad aziende di servizi professionali che gestiscono portafogli di progetti a budget per conto di clienti. Il problema centrale e' la ""scoperta tardiva"": Project Manager e Manager si accorgono del superamento di budget o del calo di margine quando l'intervento correttivo non e' piu' possibile."
    Blank
    Para "Man-Agent risponde con:"
    Bullet "Dashboard KPI real-time: consumo budget (%), Write-up/Write-off (EUR), Forecast EAC, Margine %  -  per progetto e aggregati per ruolo."
    Bullet "Alerting proattivo su 6 regole di rischio predefinite (budget warning/critical, forecast over, margine basso, overrun allocazione, inattivita' 14 gg) con recapito in-app."
    Bullet "Gestione strutturata delle risorse: pianificazione ore (allocazione) e consuntivazione  -  distinte per figura professionale (A->F)."
    Bullet "Controllo accessi a 4 livelli: ADMIN, MANAGER, PROJECT_MANAGER (propri progetti), PRESALES (propri progetti, read-only)."
    Blank
    Para "L'MVP e' implementato con architettura DDD su .NET 10 / C# (backend) e React 18 + TypeScript / Ant Design (frontend), con infrastruttura Azure gestita via Terraform."
    PageBreak

    # ==================================================================
    # 2. SCOPE
    # ==================================================================
    H1 "2. Scope"
    H2 "2.1  In Scope  -  MVP"
    foreach ($i in @(
        "Anagrafica clienti: CRUD completo per ADMIN/MANAGER (ragione sociale, codice, referente, email, telefono).",
        "Anagrafica figure professionali A->F con costo orario e tariffa di vendita.",
        "Gestione dipendenti e associazione a figura professionale.",
        "Gestione progetti con ciclo di vita: Draft -> Active -> OnHold -> Closed.",
        "Allocazione risorse: ore allocate per dipendente/figura su ogni progetto.",
        "Consuntivazione: OreConsuntivate modificabili inline (PM per propri progetti, ADMIN/MANAGER sempre).",
        "Calcolo KPI per progetto: Ricavo riconosciuto, Costo sostenuto, Write-up EUR, Budget consumato %, Forecast EAC, Margine %.",
        "Dashboard riepilogativa per ruolo con grafici a barre (budget) e lineari (margine).",
        "Motore alerting: 6 regole, valutazione on-demand, recapito in-app (badge header + pagina /alerts).",
        "Autenticazione mock: dropdown selezione utente + header X-User-Id (nessun JWT nell'MVP).",
        "Seed realistico: 3 clienti, 8 progetti (mix stati, >=2 con alert), 15 dipendenti, 5 utenti, 6 figure A->F.",
        "Infrastruttura IaC: Terraform per Azure Static Web App, App Service Linux, Azure SQL, Storage Account  -  solo validate + plan nell'MVP.",
        "Lingua interfaccia: Italiano."
    )) { Bullet $i }
    Blank
    H2 "2.2  Out of Scope  -  MVP"
    foreach ($i in @(
        "Timesheet giornaliero o settimanale per dipendente.",
        "Pipeline opportunita' Presales (fase pre-progetto).",
        "Export dati (Excel, PDF).",
        "Notifiche email, Microsoft Teams o push.",
        "Audit log e cronologia modifiche.",
        "Architettura multi-tenant.",
        "Deploy effettivo su Azure (Terraform apply).",
        "Autenticazione reale (Entra ID / ASP.NET Identity / JWT).",
        "Override del costo orario per singolo dipendente.",
        "Localizzazione multi-lingua."
    )) { Bullet $i }
    PageBreak

    # ==================================================================
    # 3. GLOSSARIO
    # ==================================================================
    H1 "3. Glossario"
    $gItems = @(
        @("Cliente",                "Azienda finale per cui si erogano uno o piu' progetti."),
        @("Progetto",               "Iniziativa erogata a un Cliente con budget EUR e ore, date inizio/fine, PM e Presales opzionale."),
        @("Figura professionale",   "Livello A->F con costo orario interno e tariffa di vendita oraria differenziata."),
        @("Dipendente",             "Collaboratore dell'azienda associato a una Figura professionale."),
        @("Allocazione",            "Riga che lega un Dipendente a un Progetto: contiene OreAllocate e OreConsuntivate."),
        @("Consuntivo",             "Le ore effettivamente lavorate registrate sull'Allocazione (aggiornamento incrementale)."),
        @("Ricavo riconosciuto",    "OreConsuntivate * TariffaVenditaOraria della Figura. Calcolato, non persistito."),
        @("Costo sostenuto",        "OreConsuntivate * CostoOrario della Figura. Calcolato, non persistito."),
        @("Write-up",               "RicavoRiconosciuto - CostoSostenuto > 0: margine positivo a oggi."),
        @("Write-off",              "RicavoRiconosciuto - CostoSostenuto < 0: margine negativo."),
        @("Forecast EAC",           "Stima del costo totale a fine progetto: CostoSos / OreConsTot * OreAllocTot (se OreConsTot > 0)."),
        @("Margine %",              "(RicavoRiconosciuto - CostoSostenuto) / RicavoRiconosciuto * 100."),
        @("Alert",                  "Notifica in-app generata dall'AlertEvaluator quando una regola di rischio e' soddisfatta."),
        @("EAC",                    "Estimate At Completion  -  sinonimo di Forecast a Finire.")
    )
    $gTblR = $sel.Range; $gTbl = $doc.Tables.Add($gTblR, $gItems.Count+1, 2)
    $gTbl.Style = "Table Grid"
    HdrRow $gTbl 2 @("Termine","Definizione")
    for ($i=0; $i -lt $gItems.Count; $i++) {
        FillRow $gTbl ($i+2) $gItems[$i]
    }
    $gTbl.Columns(1).Width = $word.InchesToPoints(2.0); $gTbl.Columns(2).Width = $word.InchesToPoints(4.5)
    AfterTable $gTbl; PageBreak

    # ==================================================================
    # 4. ATTORI E RUOLI
    # ==================================================================
    H1 "4. Attori e Ruoli"
    Para "Il sistema riconosce quattro ruoli utente. L'autenticazione e' mock nell'MVP (dropdown + header X-User-Id); in produzione verra' sostituita con Entra ID."
    Blank
    $rItems = @(
        @("ADMIN",           "Accesso totale. Gestisce figure professionali, dipendenti, utenti, clienti e tutti i progetti."),
        @("MANAGER",         "Stessa visibilita' e poteri di ADMIN su progetti e clienti. Profilo operativo principale."),
        @("PROJECT_MANAGER", "Vede solo i propri progetti (PmId == self.id). Puo' modificare OreConsuntivate delle allocazioni."),
        @("PRESALES",        "Vede solo i progetti dove PresalesId == self.id. Accesso in sola lettura.")
    )
    $rTblR = $sel.Range; $rTbl = $doc.Tables.Add($rTblR, $rItems.Count+1, 2)
    $rTbl.Style = "Table Grid"
    HdrRow $rTbl 2 @("Ruolo","Descrizione e permessi")
    for ($i=0; $i -lt $rItems.Count; $i++) { FillRow $rTbl ($i+2) $rItems[$i] }
    $rTbl.Columns(1).Width = $word.InchesToPoints(1.8); $rTbl.Columns(2).Width = $word.InchesToPoints(4.7)
    AfterTable $rTbl; Blank

    H2 "4.1  Matrice permessi"
    $pHdrs = @("Funzionalita'","ADMIN","MANAGER","PROJECT_MANAGER","PRESALES")
    $pRows = @(
        @("Vedi tutti i progetti",    "Si'","Si'","Solo propri","Solo propri"),
        @("Crea progetto",            "Si'","Si'","No","No"),
        @("Modifica dati progetto",   "Si'","Si'","No","No"),
        @("Registra consuntivo",      "Si'","Si'","Solo propri","No"),
        @("Gestione clienti",         "Si'","Si'","No","No"),
        @("Gestione dipendenti",      "Si'","Si'","No","No"),
        @("Gestione figure prof.",    "Si'","No","No","No"),
        @("Vedi alert",               "Si'","Si'","Solo propri","Solo propri"),
        @("Dashboard aggregata",      "Si'","Si'","Si' (scope)","Si' (scope)")
    )
    $pTblR = $sel.Range; $pTbl = $doc.Tables.Add($pTblR, $pRows.Count+1, 5)
    $pTbl.Style = "Table Grid"
    HdrRow $pTbl 5 $pHdrs
    for ($i=0; $i -lt $pRows.Count; $i++) {
        for ($c=1; $c -le 5; $c++) {
            $pTbl.Cell($i+2,$c).Range.Text = $pRows[$i][$c-1]
            $pTbl.Cell($i+2,$c).Range.Font.Size = 9
            if ($c -eq 1) { $pTbl.Cell($i+2,$c).Range.Font.Bold = $true }
        }
    }
    $pTbl.Columns(1).Width = $word.InchesToPoints(2.2)
    for ($c=2;$c -le 5;$c++) { $pTbl.Columns($c).Width = $word.InchesToPoints(1.0) }
    AfterTable $pTbl; PageBreak

    # ==================================================================
    # 5. REQUISITI FUNZIONALI
    # ==================================================================
    H1 "5. Requisiti Funzionali"
    Para "I seguenti requisiti descrivono il comportamento atteso del sistema nell'MVP."
    Blank
    $rfHdrs = @("ID","Categoria","Descrizione","Priorita'")
    $rfItems = @(
        @("RF-001","Autenticazione",  "Login mock via dropdown utente. Identita' propagata tramite header X-User-Id a ogni richiesta API.",                                                               "Alta"),
        @("RF-002","Clienti",         "ADMIN e MANAGER possono creare, leggere, modificare clienti (ragione sociale, codice, referente, email, telefono).",                                             "Alta"),
        @("RF-003","Clienti",         "Tutti i ruoli possono leggere la lista clienti.",                                                                                                                "Alta"),
        @("RF-004","Progetti",        "ADMIN e MANAGER creano progetti: nome, codice, cliente, PM, Presales (opz.), date, budget EUR, budget ore, tariffa media oraria.",                                "Alta"),
        @("RF-005","Progetti",        "Ciclo di vita: Draft -> Active -> OnHold -> Closed. Draft->Active richiede PM assegnato e almeno 1 Allocazione.",                                                "Alta"),
        @("RF-006","Progetti",        "Tutti i ruoli (scope filtrato) visualizzano dettaglio progetto con KPI calcolati in tempo reale.",                                                               "Alta"),
        @("RF-007","Allocazioni",     "ADMIN e MANAGER aggiungono/rimuovono allocazioni (dipendente, figura, ore allocate).",                                                                           "Alta"),
        @("RF-008","Consuntivi",      "PM (propri progetti), ADMIN e MANAGER aggiornano OreConsuntivate di un'allocazione inline.",                                                                     "Alta"),
        @("RF-009","KPI",             "Per ogni progetto: Ricavo Riconosciuto, Costo Sostenuto, Write-up (EUR), Budget Consumato %, Forecast EAC, Margine %.",                                         "Alta"),
        @("RF-010","KPI",             "KPI calcolati lato Application layer (use case dedicato), non persistiti su DB.",                                                                                "Alta"),
        @("RF-011","Dashboard",       "Dashboard filtrata per ruolo: ADMIN/MANAGER vedono tutto; PM e PRESALES solo propri progetti.",                                                                  "Alta"),
        @("RF-012","Dashboard",       "Dashboard include: lista progetti con semaforo alert, grafico a barre budget consumato, grafico lineare margine.",                                               "Media"),
        @("RF-013","Alerting",        "AlertEvaluator valuta 6 regole su tutti i progetti Active on-demand (a ogni apertura Dashboard e pagina /alerts).",                                             "Alta"),
        @("RF-014","Alerting",        "Regole: BUDGET_WARN (>=70%), BUDGET_CRIT (>=90%), FORECAST_OVER (EAC>budget), MARGIN_LOW (<15%), OVERRUN_ALLOC, NO_ACTIVITY (14 gg).",                         "Alta"),
        @("RF-015","Alerting",        "Alert recapitati in-app: badge count nell'header + pagina /alerts con elenco dettagliato per progetto e severity.",                                             "Alta"),
        @("RF-016","Dipendenti",      "ADMIN e MANAGER gestiscono anagrafica dipendenti (nome, cognome, figura professionale).",                                                                        "Media"),
        @("RF-017","Figure prof.",    "ADMIN gestisce il catalogo figure A->F con costo orario e tariffa di vendita.",                                                                                  "Media"),
        @("RF-018","Seed",            "Al primo avvio: 3 clienti, 8 progetti (mix stati, >=2 con alert), 15 dipendenti, 5 utenti (ADMIN, MANAGER, 2 PM, PRESALES), 6 figure.",                        "Alta"),
        @("RF-019","Filtri",          "Liste Progetti, Clienti e Alert supportano filtro per nome/codice e (per Progetti) per stato e cliente.",                                                        "Media"),
        @("RF-020","Autorizzazione",  "Il backend verifica server-side le restrizioni di ruolo (HTTP 403 se non autorizzato). I filtri non sono solo front-end.",                                      "Alta")
    )
    $rfTblR = $sel.Range; $rfTbl = $doc.Tables.Add($rfTblR, $rfItems.Count+1, 4)
    $rfTbl.Style = "Table Grid"
    HdrRow $rfTbl 4 $rfHdrs
    for ($i=0; $i -lt $rfItems.Count; $i++) {
        for ($c=1; $c -le 4; $c++) {
            $cell = $rfTbl.Cell($i+2,$c)
            $cell.Range.Text = $rfItems[$i][$c-1]; $cell.Range.Font.Size = 9
            if ($c -eq 1) { $cell.Range.Font.Bold = $true; $cell.Range.Font.Color = $C_DARK_BLUE }
            if ($c -eq 4) {
                if ($rfItems[$i][$c-1] -eq "Alta")  { $cell.Shading.BackgroundPatternColor = $C_HDR_BG }
                if ($rfItems[$i][$c-1] -eq "Media") { $cell.Shading.BackgroundPatternColor = $C_WARN_BG }
            }
        }
    }
    $rfTbl.Columns(1).Width = $word.InchesToPoints(0.7);  $rfTbl.Columns(2).Width = $word.InchesToPoints(1.1)
    $rfTbl.Columns(3).Width = $word.InchesToPoints(4.3);  $rfTbl.Columns(4).Width = $word.InchesToPoints(0.65)
    AfterTable $rfTbl; PageBreak

    # ==================================================================
    # 6. REQUISITI NON FUNZIONALI
    # ==================================================================
    H1 "6. Requisiti Non Funzionali"
    $rnfItems = @(
        @("RNF-001","Performance",    "API < 300 ms su LocalDB. Valutazione alerting (6 regole * N progetti) < 500 ms."),
        @("RNF-002","Sicurezza",      "Filtraggio dati per ruolo server-side. GUID non sequenziali. Nessun secret in chiaro (appsettings + User Secrets in dev, Key Vault in prod)."),
        @("RNF-003","Manutenibilita'","Architettura DDD 4-layer. Zero accoppiamento Domain<->Infrastructure. Coverage: 1+ test per invariante di dominio."),
        @("RNF-004","Scalabilita'",   "Backend stateless (App Service Linux). In produzione supporta auto-scaling orizzontale."),
        @("RNF-005","Usabilita'",     "Interfaccia in italiano. Messaggi di errore contestuali. Colori semaforo coerenti con le soglie alert (verde/giallo/rosso)."),
        @("RNF-006","Compatibilita'", "Testato su Chrome e Edge (versioni correnti). Risoluzione minima: 1366x768."),
        @("RNF-007","Disponibilita'", "Azure App Service SLA 99.95% (piano Standard in prod). Terraform IaC gestisce tutta l'infrastruttura."),
        @("RNF-008","Testabilita'",   "Astrazione IClock (no DateTime.Now diretti). DI su tutte le classi Application/Infrastructure. Mock facile in xUnit.")
    )
    $rnfTblR = $sel.Range; $rnfTbl = $doc.Tables.Add($rnfTblR, $rnfItems.Count+1, 3)
    $rnfTbl.Style = "Table Grid"
    HdrRow $rnfTbl 3 @("ID","Categoria","Requisito")
    for ($i=0; $i -lt $rnfItems.Count; $i++) { FillRow $rnfTbl ($i+2) $rnfItems[$i] }
    $rnfTbl.Columns(1).Width = $word.InchesToPoints(0.75); $rnfTbl.Columns(2).Width = $word.InchesToPoints(1.3)
    $rnfTbl.Columns(3).Width = $word.InchesToPoints(4.7)
    AfterTable $rnfTbl; PageBreak

    # ==================================================================
    # 7. CASI D'USO PRINCIPALI
    # ==================================================================
    H1 "7. Casi d'Uso Principali"
    $ucDefs = @(
        @{ Id="UC-001"; Title="Login (Mock)";
           Actors="Tutti i ruoli"; Precond="App avviata, seed completato."
           Flow="1. Utente seleziona profilo dal dropdown nell'header.`n2. Frontend imposta X-User-Id su ogni chiamata API.`n3. Sistema carica ruolo e scope.`n4. Dashboard filtrata per ruolo viene mostrata."
           Alt=" - "; Post="Utente mock autenticato, scope caricato." },
        @{ Id="UC-002"; Title="Crea Progetto";
           Actors="ADMIN, MANAGER"; Precond="Almeno un Cliente e un utente PM esistono."
           Flow="1. Utente apre /projects/new.`n2. Compila form (nome, codice, cliente, PM, date, budget EUR, ore, tariffa).`n3. Invia. Sistema valida invarianti (BudgetEuro>0, DataInizio<DataFine, Tariffa>0).`n4. Progetto creato in Draft."
           Alt="3a. Validazione fallisce: form mostra errori inline."; Post="Progetto in Draft visibile in lista." },
        @{ Id="UC-003"; Title="Attiva Progetto";
           Actors="ADMIN, MANAGER"; Precond="Progetto in Draft con PM assegnato."
           Flow="1. Utente aggiunge almeno 1 Allocazione.`n2. Clicca 'Attiva'.`n3. Sistema verifica precondizioni.`n4. Stato -> Active."
           Alt="3a. Nessuna Allocazione: errore bloccante."; Post="Progetto Active. Incluso nella valutazione alert." },
        @{ Id="UC-004"; Title="Registra Consuntivo";
           Actors="ADMIN, MANAGER, PROJECT_MANAGER (solo propri)"; Precond="Progetto Active, Allocazione esistente."
           Flow="1. Utente apre dettaglio progetto.`n2. Modifica inline OreConsuntivate nell'allocazione.`n3. Conferma. Sistema aggiorna OreConsuntivate e UltimaModificaConsuntivi.`n4. KPI si ricalcolano."
           Alt="2a. PM tenta di modificare progetto altrui: 403 Forbidden."; Post="OreConsuntivate aggiornate. KPI ricalcolati." },
        @{ Id="UC-005"; Title="Visualizza KPI Progetto";
           Actors="Tutti i ruoli (scope filtrato)"; Precond="Progetto con almeno 1 Allocazione."
           Flow="1. Utente apre /projects/:id.`n2. Sistema invoca GetProjectKpi use case.`n3. Mostra: Ricavo, Costo, Write-up, Budget %, Forecast EAC, Margine %.`n4. Valori critici evidenziati in rosso."
           Alt=" - "; Post="KPI visualizzati in tempo reale." },
        @{ Id="UC-006"; Title="Consulta Alert";
           Actors="Tutti i ruoli (scope filtrato)"; Precond="Almeno 1 progetto Active."
           Flow="1. Utente apre /alerts.`n2. AlertEvaluator valuta 6 regole sui progetti visibili.`n3. Alert mostrati per progetto (severity + descrizione).`n4. Badge header aggiornato."
           Alt="3a. Nessun alert: 'Nessuna anomalia rilevata'."; Post="Alert visualizzati (generati in-memory, non persistiti)." },
        @{ Id="UC-007"; Title="Dashboard Riepilogativa";
           Actors="Tutti i ruoli (scope filtrato)"; Precond="Almeno 1 progetto."
           Flow="1. Utente apre / (Dashboard).`n2. Sistema carica progetti nello scope.`n3. Mostra: card KPI aggregate, tabella progetti con semaforo, grafico barre budget, grafico lineare margine."
           Alt=" - "; Post="Dashboard aggiornata." },
        @{ Id="UC-008"; Title="Cambio Stato Progetto";
           Actors="ADMIN, MANAGER"; Precond="Progetto nello stato corretto per la transizione."
           Flow="1. Utente seleziona nuovo stato nel dettaglio.`n2. Sistema valida transizione (Draft->Active, Active->OnHold, Active->Closed, OnHold->Active, OnHold->Closed).`n3. Stato aggiornato."
           Alt="2a. Transizione invalida (es. Draft->Closed): errore 422."; Post="Stato aggiornato." }
    )
    foreach ($uc in $ucDefs) {
        H2 "$($uc.Id)  -  $($uc.Title)"
        $ucR = $sel.Range; $ucT = $doc.Tables.Add($ucR, 5, 2)
        $ucT.Style = "Table Grid"
        $ucFields = @("Attori","Pre-condizioni","Flusso principale","Flusso alternativo","Post-condizioni")
        $ucVals   = @($uc.Actors, $uc.Precond, $uc.Flow, $uc.Alt, $uc.Post)
        for ($row=1; $row -le 5; $row++) {
            $ucT.Cell($row,1).Range.Text = $ucFields[$row-1]
            $ucT.Cell($row,2).Range.Text = $ucVals[$row-1]
            $ucT.Cell($row,1).Range.Font.Bold  = $true
            $ucT.Cell($row,1).Range.Font.Color = $C_DARK_BLUE
            $ucT.Cell($row,1).Range.Font.Size  = 9
            $ucT.Cell($row,2).Range.Font.Size  = 9
            $ucT.Cell($row,1).Shading.BackgroundPatternColor = $C_HDR_BG
        }
        $ucT.Columns(1).Width = $word.InchesToPoints(1.5); $ucT.Columns(2).Width = $word.InchesToPoints(5.0)
        AfterTable $ucT; Blank
    }
    PageBreak

    # ==================================================================
    # 8. MODELLO DEI DATI
    # ==================================================================
    H1 "8. Modello dei Dati"
    Para "Il sistema e' single-tenant (nessun TenantId). Di seguito le entita' principali con attributi e invarianti. Il diagramma ER completo e' in docs/domain-model.md."
    Blank

    $entities = @(
        @{ Name="Project (Aggregate Root)"; Fields=@(
            @("Id","Guid PK"),@("Code","string  -  ProjectCode VO: alfanumerico max 20 char"),
            @("Name","string"),@("CustomerId","Guid FK -> Customer"),
            @("PmId","Guid FK -> User"),@("PresalesId","Guid? FK -> User  -  nullable"),
            @("Status","enum: Draft | Active | OnHold | Closed"),
            @("DataInizio","DateOnly  -  invariant: < DataFine"),
            @("DataFine","DateOnly"),
            @("BudgetEuro","decimal  -  invariant: > 0"),
            @("BudgetOre","decimal  -  invariant: > 0"),
            @("TariffaVenditaMediaOraria","decimal  -  invariant: > 0"),
            @("Note","string?"),
            @("UltimaModificaConsuntivi","DateTime  -  aggiornata da RegistraConsuntivo()")) },
        @{ Name="Allocation (child di Project)"; Fields=@(
            @("Id","Guid PK"),@("ProjectId","Guid FK"),@("EmployeeId","Guid FK"),
            @("FigureCode","char FK -> Figure"),
            @("OreAllocate","decimal >= 0"),
            @("OreConsuntivate","decimal >= 0 (puo' superare OreAllocate -> alert OVERRUN_ALLOC)")) },
        @{ Name="Customer"; Fields=@(
            @("Id","Guid PK"),@("Code","string  -  unico"),@("RagioneSociale","string"),
            @("Referente","string?"),@("Email","string?"),@("Telefono","string?")) },
        @{ Name="Employee"; Fields=@(
            @("Id","Guid PK"),@("Nome","string"),@("Cognome","string"),@("FigureCode","char FK -> Figure")) },
        @{ Name="Figure"; Fields=@(
            @("Code","char PK  -  'A'..'F'"),@("Nome","string"),
            @("CostoOrario","decimal"),@("TariffaVenditaOraria","decimal")) },
        @{ Name="User"; Fields=@(
            @("Id","Guid PK"),@("Nome","string"),@("Email","string"),
            @("Role","enum: Admin|Manager|ProjectManager|Presales"),
            @("EmployeeId","Guid?  -  collega User a Employee")) }
    )
    foreach ($ent in $entities) {
        H2 $ent.Name
        $eR = $sel.Range; $eT = $doc.Tables.Add($eR, $ent.Fields.Count+1, 2)
        $eT.Style = "Table Grid"
        HdrRow $eT 2 @("Attributo","Tipo / Note")
        for ($i=0; $i -lt $ent.Fields.Count; $i++) { FillRow $eT ($i+2) $ent.Fields[$i] }
        $eT.Columns(1).Width = $word.InchesToPoints(2.1); $eT.Columns(2).Width = $word.InchesToPoints(4.4)
        AfterTable $eT; Blank
    }
    PageBreak

    # ==================================================================
    # 9. REGOLE DI BUSINESS
    # ==================================================================
    H1 "9. Regole di Business"
    H2 "9.1  Invarianti di dominio"
    foreach ($inv in @(
        "Project.BudgetEuro > 0  AND  Project.BudgetOre > 0.",
        "Project.DataInizio < Project.DataFine.",
        "Project.TariffaVenditaMediaOraria > 0.",
        "Transizione Draft -> Active: PmId valorizzato AND count(Allocations) >= 1.",
        "Transizione a Closed: stato corrente in { Active, OnHold }.",
        "Allocation.OreConsuntivate >= 0 (puo' superare OreAllocate senza eccezione, genera OVERRUN_ALLOC).",
        "Allocation.OreAllocate > 0.",
        "Figure.Code in { A, B, C, D, E, F }."
    )) { Bullet $inv }
    Blank

    H2 "9.2  Formule KPI"
    $kpiItems = @(
        @("RicavoRiconosciuto", "SUM(OreConsuntivate[i] * Figure[i].TariffaVenditaOraria)  per tutte le Allocazioni"),
        @("CostoSostenuto",     "SUM(OreConsuntivate[i] * Figure[i].CostoOrario)  per tutte le Allocazioni"),
        @("WriteUp (EUR)",      "RicavoRiconosciuto - CostoSostenuto"),
        @("BudgetConsumatoPct", "CostoSostenuto / BudgetEuro * 100"),
        @("ForecastEAC",        "IF OreConsTot > 0  THEN  CostoSostenuto / OreConsTot * OreAllocTot  ELSE  0"),
        @("MarginePct",         "IF RicavoRiconosciuto > 0  THEN  WriteUp / RicavoRiconosciuto * 100  ELSE  N/A")
    )
    $kR = $sel.Range; $kT = $doc.Tables.Add($kR, $kpiItems.Count+1, 2)
    $kT.Style = "Table Grid"
    HdrRow $kT 2 @("KPI","Formula")
    for ($i=0; $i -lt $kpiItems.Count; $i++) { FillRow $kT ($i+2) $kpiItems[$i] }
    $kT.Columns(1).Width = $word.InchesToPoints(1.9); $kT.Columns(2).Width = $word.InchesToPoints(4.6)
    AfterTable $kT; Blank

    H2 "9.3  Regole di alerting"
    Para "Valutate su tutti i progetti Active. Ogni regola produce 0 o 1 AlertInstance per progetto. Recapito: in-app (badge + lista /alerts)."
    Blank
    $aItems = @(
        @("BUDGET_WARN",   "Warning",  "BudgetConsumatoPct >= 70% e < 90%",               "Budget in avvicinamento alla soglia critica."),
        @("BUDGET_CRIT",   "Critical", "BudgetConsumatoPct >= 90%",                        "Budget quasi esaurito."),
        @("FORECAST_OVER", "Critical", "ForecastEAC > BudgetEuro",                         "Forecast a finire superiore al budget totale."),
        @("MARGIN_LOW",    "Warning",  "MarginePct < 15%  (con RicavoRic. > 0)",           "Margine sotto soglia minima accettabile."),
        @("OVERRUN_ALLOC", "Warning",  "Esiste Allocazione con OreConsuntivate > OreAllocate", "Almeno una risorsa ha superato le ore pianificate."),
        @("NO_ACTIVITY",   "Warning",  "UltimaModificaConsuntivi > 14 gg fa",              "Nessun aggiornamento consuntivi negli ultimi 14 giorni.")
    )
    $aTblR = $sel.Range; $aTbl = $doc.Tables.Add($aTblR, $aItems.Count+1, 4)
    $aTbl.Style = "Table Grid"
    HdrRow $aTbl 4 @("Codice","Severity","Condizione trigger","Descrizione")
    for ($i=0; $i -lt $aItems.Count; $i++) {
        for ($c=1; $c -le 4; $c++) {
            $cell = $aTbl.Cell($i+2,$c); $cell.Range.Text = $aItems[$i][$c-1]; $cell.Range.Font.Size = 9
            if ($c -eq 1) { $cell.Range.Font.Bold = $true; $cell.Range.Font.Color = $C_DARK_BLUE }
            if ($c -eq 2 -and $aItems[$i][$c-1] -eq "Critical") { $cell.Shading.BackgroundPatternColor = $C_CRIT_BG }
            if ($c -eq 2 -and $aItems[$i][$c-1] -eq "Warning")  { $cell.Shading.BackgroundPatternColor = $C_WARN_BG }
        }
    }
    $aTbl.Columns(1).Width = $word.InchesToPoints(1.2); $aTbl.Columns(2).Width = $word.InchesToPoints(0.85)
    $aTbl.Columns(3).Width = $word.InchesToPoints(2.6); $aTbl.Columns(4).Width = $word.InchesToPoints(2.1)
    AfterTable $aTbl; PageBreak

    # ==================================================================
    # 10. ARCHITETTURA E INFRASTRUTTURA
    # ==================================================================
    H1 "10. Architettura e Infrastruttura"
    H2 "10.1  Stack tecnologico"
    $stItems = @(
        @("Backend",        ".NET 10, C#, DDD 4-layer (Domain / Application / Infrastructure / Api), Minimal API, EF Core 10.x"),
        @("Frontend",       "React 18 + TypeScript + Vite 5.x, Ant Design 5.x, CSS Modules, TanStack Query 5.x, Zustand 4.x, Recharts 2.x, Axios, React Router v6"),
        @("Database",       "Azure SQL (LocalDB/SQL Express in dev, Basic/Serverless in prod). EF Core Migrations + Seed."),
        @("Autenticazione", "Mock MVP: dropdown utenti + X-User-Id. Produzione: Entra ID (post-MVP)."),
        @("IaC",            "Terraform >= 1.7 + azurerm >= 3.100. Solo terraform validate + plan nell'MVP."),
        @("Monitoraggio",   "Azure Monitor / Application Insights (configurazione base in Terraform, attivazione post-MVP).")
    )
    $stR = $sel.Range; $stT = $doc.Tables.Add($stR, $stItems.Count+1, 2)
    $stT.Style = "Table Grid"
    HdrRow $stT 2 @("Layer","Tecnologia")
    for ($i=0; $i -lt $stItems.Count; $i++) { FillRow $stT ($i+2) $stItems[$i] }
    $stT.Columns(1).Width = $word.InchesToPoints(1.6); $stT.Columns(2).Width = $word.InchesToPoints(4.9)
    AfterTable $stT; Blank

    H2 "10.2  Componenti Azure (Terraform)"
    $azItems = @(
        @("Azure Static Web App",    "Hosting frontend React compilato. Tier Free/Standard. CDN globale integrata."),
        @("Azure App Service Linux", "Hosting backend .NET 10. Piano B1 (dev) / S1 (prod). Container Linux."),
        @("Azure SQL Database",      "Tier Basic (dev) / Serverless con auto-pause (prod)."),
        @("Azure Storage Account",   "Asset statici. LRS, Standard.")
    )
    $azR = $sel.Range; $azT = $doc.Tables.Add($azR, $azItems.Count+1, 2)
    $azT.Style = "Table Grid"
    HdrRow $azT 2 @("Servizio Azure","Ruolo e configurazione")
    for ($i=0; $i -lt $azItems.Count; $i++) { FillRow $azT ($i+2) $azItems[$i] }
    $azT.Columns(1).Width = $word.InchesToPoints(2.2); $azT.Columns(2).Width = $word.InchesToPoints(4.3)
    AfterTable $azT; PageBreak

    # ==================================================================
    # 11. VINCOLI E ASSUNZIONI
    # ==================================================================
    H1 "11. Vincoli e Assunzioni"
    H2 "11.1  Vincoli tecnici"
    foreach ($v in @(
        "Stack fisso: .NET 10 / React 18 / Azure. Nessuna deviazione nell'MVP.",
        "Nessun CSS inline nel frontend  -  Ant Design + CSS Modules obbligatori.",
        "Nessun setter pubblico sulle entita' di dominio: mutazioni solo via metodi intenzionali.",
        "Nessun DateTime.Now diretto: astrazione IClock iniettata per testabilita'.",
        "TypeScript strict: zero uso di 'any'. Props sempre tipizzate.",
        "EF Core: chiavi Guid generate dal dominio (non identity int).",
        "Terraform: no apply nell'MVP  -  solo validate + plan.",
        "Single-tenant: nessun TenantId sulle entita'."
    )) { Bullet $v }
    Blank
    H2 "11.2  Assunzioni operative"
    foreach ($a in @(
        "Sistema usato da un'unica azienda (single-tenant).",
        "Tariffe e costi orari definiti per Figura, non per singolo Dipendente.",
        "I consuntivi vengono inseriti manualmente dai PM (nessuna integrazione time-tracking).",
        "La soglia 'no activity' e' fissa a 14 giorni (configurabilita' post-MVP).",
        "Le Figure A->F sono di sola lettura nell'MVP per tutti i ruoli tranne ADMIN.",
        "L'alerting viene valutato on-demand, non con scheduling in background.",
        "Il frontend usa localhost:5000 come backend base URL in sviluppo (Vite proxy)."
    )) { Bullet $a }
    PageBreak

    # ==================================================================
    # 12. RISCHI E MITIGAZIONI
    # ==================================================================
    H1 "12. Rischi e Mitigazioni"
    $risks = @(
        @("R-001","Media","Alta",   "Complessita' logica KPI (edge case: divisione per zero, progetti senza consuntivi).",                         "Test xUnit su tutti gli edge case prima dell'integrazione frontend. KPI record null-safe."),
        @("R-002","Alta","Alta",    "Filtri per ruolo: PM e Presales non devono vedere progetti altrui (rischio dato esposto).",                  "Middleware autorizzazione centralizzato + test di integrazione per ogni ruolo."),
        @("R-003","Bassa","Media",  "Performance alerting con molti progetti Active (in-memory, N * 6 regole).",                                   "Accettabile nell'MVP (<100 progetti). Persistenza alert e caching pianificati post-MVP."),
        @("R-004","Media","Alta",   "Inconsistenza UI/API: KPI stale se il PM consuntiva senza refresh esplicito.",                                "TanStack Query invalida la cache al mutation. Refetch automatico al focus finestra."),
        @("R-005","Media","Alta",   "Vincolo temporale 5 ore: rischio di saltare test o DDD layers se si parte dal frontend.",                     "Ordine rigido: Domain -> Application -> Infrastructure -> Api -> Frontend.")
    )
    $riR = $sel.Range; $riT = $doc.Tables.Add($riR, $risks.Count+1, 5)
    $riT.Style = "Table Grid"
    HdrRow $riT 5 @("ID","Prob.","Impatto","Descrizione","Mitigazione")
    for ($i=0; $i -lt $risks.Count; $i++) {
        for ($c=1; $c -le 5; $c++) {
            $cell = $riT.Cell($i+2,$c); $cell.Range.Text = $risks[$i][$c-1]; $cell.Range.Font.Size = 9
            if ($c -eq 1) { $cell.Range.Font.Bold = $true; $cell.Range.Font.Color = $C_DARK_BLUE }
        }
    }
    $riT.Columns(1).Width = $word.InchesToPoints(0.5);  $riT.Columns(2).Width = $word.InchesToPoints(0.6)
    $riT.Columns(3).Width = $word.InchesToPoints(0.7);  $riT.Columns(4).Width = $word.InchesToPoints(2.9)
    $riT.Columns(5).Width = $word.InchesToPoints(2.6)
    AfterTable $riT; PageBreak

    # ==================================================================
    # 13. ROADMAP POST-MVP
    # ==================================================================
    H1 "13. Roadmap Post-MVP"
    Para "Le funzionalita' seguenti sono esplicitamente escluse dall'MVP e pianificate per release successive."
    Blank
    $rmItems = @(
        @("v1.1","Q3 2026","Timesheet",           "Registrazione ore giornaliera per dipendente con validazione settimanale."),
        @("v1.1","Q3 2026","Notifiche",            "Invio alert via email e Microsoft Teams Webhook."),
        @("v1.2","Q4 2026","Export dati",          "Export progetti e KPI in formato Excel e PDF branded."),
        @("v1.2","Q4 2026","Audit log",            "Cronologia modifiche alle entita' con utente e timestamp."),
        @("v2.0","Q1 2027","Multi-tenancy",        "Supporto multipli tenant con isolamento dati e provisioning on-boarding."),
        @("v2.0","Q1 2027","Auth reale",           "Integrazione Entra ID, MSAL, JWT, ruoli claim-based."),
        @("v2.1","Q2 2027","Pipeline Presales",    "Gestione opportunita' pre-progetto con stage, probabilita' e forecast revenue."),
        @("v2.1","Q2 2027","Override tariffe",     "Configurazione costo/tariffa per singolo dipendente (override della figura).")
    )
    $rmR = $sel.Range; $rmT = $doc.Tables.Add($rmR, $rmItems.Count+1, 4)
    $rmT.Style = "Table Grid"
    HdrRow $rmT 4 @("Versione","Target","Feature","Descrizione")
    for ($i=0; $i -lt $rmItems.Count; $i++) { FillRow $rmT ($i+2) $rmItems[$i] }
    $rmT.Columns(1).Width = $word.InchesToPoints(0.75); $rmT.Columns(2).Width = $word.InchesToPoints(0.8)
    $rmT.Columns(3).Width = $word.InchesToPoints(1.6);  $rmT.Columns(4).Width = $word.InchesToPoints(3.6)
    AfterTable $rmT

    # ==================================================================
    # AGGIORNA TOC E SALVA
    # ==================================================================
    Write-Host "[2/4] Aggiornamento indice..." -ForegroundColor Cyan
    try {
        if ($doc.TablesOfContents.Count -gt 0) {
            $doc.TablesOfContents.Item(1).Update()
        }
    } catch { Write-Host "(TOC update skipped: $_)" -ForegroundColor Yellow }

    Write-Host "[3/4] Salvataggio in: $outPath" -ForegroundColor Cyan
    $doc.SaveAs2($outPath, 16)   # 16 = wdFormatDocumentDefault (.docx)

    Write-Host "[4/4] Completato!" -ForegroundColor Green
} catch {
    Write-Host "ERRORE: $_" -ForegroundColor Red
    throw
} finally {
    if ($doc)  { $doc.Close($false)  }
    if ($word) { $word.Quit()        }
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}

