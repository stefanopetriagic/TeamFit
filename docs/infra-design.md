# Infrastructure Design — TeamFit

> Documento vivo. Due topologie: **POC** (validazione rapida) ed **Enterprise** (produzione).
> Nessun `terraform apply` nell'MVP; usare solo `validate` + `plan`.

---

## Risorse condivise (entrambe le topologie)

| Risorsa | Scopo |
|---|---|
| Azure SQL | Dati relazionali di dominio (Progetti, Clienti, Workforce, Alert) via EF Core |
| Cosmos DB (NoSQL/SQL API) | Dati AI agent: stato, cronologia conversazioni, metadati |
| Storage Account | Blob allegati futuri; artefatti CI/CD |
| Key Vault | Segreti applicativi (connection string, chiavi API) |
| Log Analytics Workspace | Backend centralizzato per metriche e log |
| Application Insights | APM, tracing HTTP, eccezioni — collegato al LAW |

---

## POC Infra

### Obiettivo
Validare rapidamente l'app con costo basso, ma mantenendo tutti i requisiti di
networking necessari per una POC credibile: VNet Integration, Private Endpoint,
Private DNS Zone e blocco degli endpoint pubblici sui data service. Il backend
resta pubblico in ingresso per ridurre costo/complessità; il traffico outbound
verso dati e segreti passa dalla VNet.

### Topologia

```
Internet
   │
   ├──► Azure Static Web App Free (frontend React, CDN globale)
   │         │  linked backend → proxying /api/* verso App Service
   │         │
   └──► App Service Linux B1 (backend .NET 10 API, public inbound)
              │  Regional VNet Integration (outbound)
              │
           VNet  10.0.0.0/16
              │
              ├── snet-app-vnetint  10.0.1.0/24
              │     delegation: Microsoft.Web/serverFarms
              │     ↑ subnet usata dal VNet Integration dell'App Service
              │
              └── snet-pe  10.0.2.0/24
                    ├── Private Endpoint → Azure SQL Free / Basic B
                    ├── Private Endpoint → Cosmos DB Serverless
                    ├── Private Endpoint → Storage Account Standard LRS
                    └── Private Endpoint → Key Vault Standard

Log Analytics Workspace  ◄──  Application Insights  ◄──  App Service diagnostics
(pubblici, endpoint Azure-managed)
```

### Security boundary

| Risorsa | Accesso inbound | Note |
|---|---|---|
| Static Web App | Internet (CDN) | Free tier |
| App Service | Internet (porta 80/443) | B1 Linux minimo low-cost per Regional VNet Integration |
| Azure SQL | Solo private endpoint | `public_network_access_enabled = false` |
| Cosmos DB | Solo private endpoint | `public_network_access_enabled = false` |
| Storage Account | Solo private endpoint | network_rules default_action = Deny |
| Key Vault | Solo private endpoint | RBAC, `public_network_access_enabled = false` |
| Log Analytics | Pubblico (Azure-managed) | Endpoint di ingestione non espongono dati |
| Application Insights | Pubblico (Azure-managed) | Idem |

### Note tecniche importanti

1. **VNet Integration richiede tier dedicato Basic+**. F1/Shared non supportano i
   requisiti networking. Per una POC low-cost con data service privati il minimo
   è Basic B1 Linux.

2. **`vnet_route_all_enabled = true`**. Necessario per far passare anche il DNS
   attraverso il VNet e risolvere correttamente i private endpoint tramite le
   Private DNS Zone.

3. **Private DNS Zone per ogni servizio privato**. Terraform deve creare e linkare
   queste zone al VNet:

   | Servizio | Private DNS Zone |
   |---|---|
   | Azure SQL | `privatelink.database.windows.net` |
   | Cosmos DB | `privatelink.documents.azure.com` |
   | Storage Blob | `privatelink.blob.core.windows.net` |
   | Key Vault | `privatelink.vaultcore.azure.net` |

4. **Static Web App → App Service**: il "linked backend" di SWA proxizza `/api/*`
   verso l'App Service. L'App Service rimane pubblico, quindi il proxy funziona
   senza configurazioni VNet aggiuntive sul frontend. Free tier basta per POC; se
   il linked backend richiede Standard nel tenant, usare Standard come fallback.

5. **Identità gestita (System-Assigned)** sull'App Service per accedere a Key Vault
   via RBAC (ruolo `Key Vault Secrets User`). Evita segreti hard-coded.

### Requisiti networking Terraform (POC)

| Risorsa networking | Requisito |
|---|---|
| VNet | `10.0.0.0/16` dedicata alla POC |
| Subnet App Service | `snet-app-vnetint` `10.0.1.0/24`, delegata a `Microsoft.Web/serverFarms` |
| Subnet Private Endpoint | `snet-pe` `10.0.2.0/24`, usata da SQL, Cosmos DB, Storage Blob, Key Vault |
| App Service VNet Integration | Regional VNet Integration verso `snet-app-vnetint` |
| Route all | `vnet_route_all_enabled = true` / `WEBSITE_VNET_ROUTE_ALL = 1` |
| DNS App Service | usare DNS Azure della VNet (`168.63.129.16`) se necessario via `WEBSITE_DNS_SERVER` |
| Private DNS Zone | `privatelink.database.windows.net`, `privatelink.documents.azure.com`, `privatelink.blob.core.windows.net`, `privatelink.vaultcore.azure.net` |
| VNet links DNS | Ogni Private DNS Zone linkata alla VNet POC |
| DNS zone group | Ogni Private Endpoint associato alla relativa Private DNS Zone |
| Data service public access | disabilitato dove supportato (`public_network_access_enabled = false`) |
| NSG | opzionale in POC; se presente, non bloccare DNS, Azure platform probes e traffico verso Private Endpoint |

Non previsti nel POC low-cost: NAT Gateway, Azure Firewall, Bastion, Application
Gateway, private endpoint inbound per App Service. Questi restano nella topologia
Enterprise o post-MVP.

### Costo stimato (westeurope, prezzi indicativi)

Stima retail pay-as-you-go, IVA esclusa. Usa SKU minimi dove possibile, ma conserva
i requisiti networking: VNet, subnet, Private Endpoint, Private DNS Zone e VNet
Integration. Verificare sempre con Azure Pricing Calculator prima dell'acquisto.

| Risorsa | SKU | €/mese ca. |
|---|---|---|
| App Service Plan | B1 Linux | ~11–12 |
| Static Web App | Free | 0 |
| Azure SQL | Free se disponibile; fallback Basic B | 0–5 |
| Cosmos DB | Serverless | ~0–5 (uso POC leggero) |
| Storage Account | Standard LRS | <1 |
| Key Vault | Standard | <1 |
| Networking margin | VNet, 2 subnet, 4 Private Endpoint, Private DNS Zone, traffico leggero | ~30–45 |
| Log Analytics | PerGB2018 | ~0–5 |
| Application Insights | Workspace-based | incluso in LAW |
| **Totale stimato** | | **~45–75 €/mese** |

Nota: F1/Shared porterebbero la POC sotto ~€25/mese, ma non supportano Regional
VNet Integration; quindi non soddisfano i requisiti networking.

---

## Enterprise Infra

### Obiettivo
Produzione hardened: tutto privato, WAF sul perimetro, CI/CD via VM agent in VNet,
zero esposizione diretta dei backend.

### Topologia

```
Internet
   │ HTTPS
   ▼
Public IP (Standard, Static)
   │
Application Gateway WAF_v2
   │  WAF Policy: OWASP 3.2, Prevention mode
   │
   └──► Frontend App Service (private endpoint, solo VNet)
              │  serves React SPA (static build)
              │  proxies /api/* → Backend App Service (VNet interno)
              │  Regional VNet Integration (outbound)
              │
              │  [chiamata interna via VNet]
              ▼
         Backend App Service (private endpoint, solo VNet)
              │  .NET 10 API — non esposto via App Gateway
              │  Regional VNet Integration (outbound)
              │
           VNet  10.0.0.0/16
              │
              ├── snet-appgw        10.0.0.0/26   (App Gateway WAF_v2, /26 minimo)
              │
              ├── snet-fe-vnetint   10.0.1.0/24   (delegation: Microsoft.Web/serverFarms)
              │     ↑ VNet Integration outbound del Frontend App Service
              │
              ├── snet-be-vnetint   10.0.2.0/24   (delegation: Microsoft.Web/serverFarms)
              │     ↑ VNet Integration outbound del Backend App Service
              │
              ├── snet-vm           10.0.3.0/24
              │     └── VM Agent (Standard_B2s burstable, Linux)
              │           CI/CD self-hosted (Azure DevOps / GitHub Actions)
              │           Raggiunge i SCM endpoint degli App Service via private endpoint
              │
              └── snet-pe           10.0.4.0/24
                    ├── Private Endpoint → Frontend App Service
                    ├── Private Endpoint → Backend App Service
                    ├── Private Endpoint → Azure SQL
                    ├── Private Endpoint → Cosmos DB
                    ├── Private Endpoint → Storage Account
                    └── Private Endpoint → Key Vault

Log Analytics Workspace  ◄──  Application Insights  ◄──  entrambi gli App Service
(pubblici, endpoint Azure-managed)
```

### Security boundary

| Risorsa | Accesso inbound | Note |
|---|---|---|
| App Gateway | Internet (80/443) | Unico punto d'ingresso pubblico |
| Frontend App Service | Solo private endpoint | `public_network_access_enabled = false` |
| Backend App Service | Solo private endpoint | Non esposto via App Gateway |
| Azure SQL | Solo private endpoint | `public_network_access_enabled = false` |
| Cosmos DB | Solo private endpoint | `public_network_access_enabled = false` |
| Storage Account | Solo private endpoint | network_rules default_action = Deny |
| Key Vault | Solo private endpoint | RBAC, `public_network_access_enabled = false` |
| VM Agent | Nessun inbound pubblico | Solo poll outbound verso Azure DevOps/GitHub |
| Log Analytics | Pubblico (Azure-managed) | — |
| Application Insights | Pubblico (Azure-managed) | — |

### Private DNS Zone (Enterprise)

Estende il set del POC con la zona per gli App Service:

| Servizio | Private DNS Zone |
|---|---|
| App Service (frontend + backend + SCM) | `privatelink.azurewebsites.net` |
| Azure SQL | `privatelink.database.windows.net` |
| Cosmos DB | `privatelink.documents.azure.com` |
| Storage Blob | `privatelink.blob.core.windows.net` |
| Key Vault | `privatelink.vaultcore.azure.net` |

La zona `privatelink.azurewebsites.net` copre automaticamente anche i sottosottodominî
SCM (`<app>.scm.azurewebsites.net`), permettendo al VM Agent di deployare via Kudu
senza esporre endpoint pubblici.

### NSG requirements

**snet-appgw** (obbligatorio per WAF_v2):

| Priorità | Direzione | Porta | Sorgente | Descrizione |
|---|---|---|---|---|
| 100 | Inbound | 65200–65535 | GatewayManager | Health probe Azure infra |
| 110 | Inbound | * | AzureLoadBalancer | Load balancer probe |
| 120 | Inbound | 80, 443 | Internet | Traffico utente |
| 4096 | Inbound | * | * | Deny all |

**snet-vm** (VM Agent):

| Priorità | Direzione | Porta | Note |
|---|---|---|---|
| — | Outbound | * | Allow (poll CI/CD, package install) |
| 4096 | Inbound | * | Deny all (nessun accesso diretto; Bastion se necessario) |

### Note tecniche importanti

1. **Reverse proxy obbligatorio sul Frontend App Service**.
   La React SPA è JavaScript eseguito nel browser: le chiamate `/api/*` vengono
   originate dal client e devono passare per App Gateway → Frontend App Service.
   Il Frontend App Service **deve** agire da reverse proxy verso il Backend App Service.
   Opzioni di deployment:
   - Docker image con **nginx** che serve la build React e proxizza `/api/*`
     verso `https://<backend>.azurewebsites.net` (risolve via private endpoint nel VNet)
   - Node.js BFF (Express/Fastify) che serve i file statici e proxizza le chiamate API
   
   Terraform esporrà `BACKEND_URL` come app setting; la configurazione nginx/BFF
   è responsabilità del CI/CD pipeline.

2. **App Gateway backend HTTP settings**.
   Protocol: HTTPS, Port: 443.
   `pick_host_name_from_backend_address = true` → l'App Gateway inoltra il corretto
   Host header al Frontend App Service (necessario perché App Service valida l'SNI).

3. **App Service Plan: P1v3** (minimo per private endpoint inbound + VNet Integration
   outbound in Enterprise). I tier Basic non supportano né l'uno né l'altro.

4. **VM Agent burstable (Standard_B2s)**.
   Adatto per carichi CI/CD discontinui. Non usare per workload sostenuti.
   Il software dell'agent (Azure DevOps/GitHub Actions runner) viene installato
   via cloud-init o Custom Script Extension al primo boot; non è responsabilità Terraform.

5. **WAF_v2 richiede subnet /26 minima** per snet-appgw.
   Con autoscaling il gateway sale a più istanze; il /26 (64 IP) è il minimo
   documentato da Azure per WAF_v2.

6. **HTTPS end-to-end**.
   App Gateway → Frontend App Service: HTTPS con certificato `*.azurewebsites.net`
   (Microsoft-issued, trusted da App Gateway con `use_well_known_ca_certificate = true`
   nell'health probe).
   Per il listener pubblico (Internet → App Gateway) è necessario un certificato
   custom caricato in Key Vault; configurazione HTTPS fuori scope MVP ma
   predisposta nell'architettura.

### Costo stimato (westeurope, prezzi indicativi)

Stima retail pay-as-you-go, IVA esclusa. Include un margine networking per Private
Endpoint, Private DNS Zone, Public IP Standard, traffico e data processing basso.
Il costo dominante resta Application Gateway WAF_v2.

| Risorsa | SKU | €/mese ca. |
|---|---|---|
| App Gateway WAF_v2 | fixed cost + 2 capacity unit | ~310–320 |
| App Service Plan frontend | P1v3 Linux | ~110–115 |
| App Service Plan backend | P1v3 Linux | ~110–115 |
| VM Agent | Standard_B2s + OS disk | ~35–45 |
| Azure SQL | S2 (50 DTU, production) | ~60–75 |
| Cosmos DB | Provisioned 400 RU/s | ~25 |
| Storage Account | Standard LRS | <5 |
| Key Vault | Standard | <5 |
| Networking margin | 6 Private Endpoint, Private DNS, Public IP, traffico leggero | ~45–70 |
| Log Analytics | PerGB2018 | ~10–30 |
| Application Insights | Workspace-based | incluso in LAW |
| **Totale stimato** | | **~700–790 €/mese** |

> Il costo dominante è l'App Gateway WAF_v2 (fisso anche a zero traffico).
> Considerare autoscale con `min_capacity = 0` per ambienti non-prod.

### Tempo implementazione Terraform — Enterprise app

Stima per **AGIC Figura F** (sviluppatore mid), partendo da `infra/terraform`
vuoto e limitando il perimetro alla topologia Enterprise applicativa descritta
sopra. La stima è compressa a circa il **60%** rispetto alla prima baseline,
assumendo riuso di moduli Terraform standard, naming già deciso e assenza di
policy Azure bloccanti.

| Attività | Baseline precedente | AGIC Figura F — stima aggiornata |
|---|---:|---:|
| Moduli base Terraform (RG, VNet, subnet, NSG, DNS privato) | 1.5–2 giorni | 1 giorno |
| Data services privati (Azure SQL, Cosmos DB, Storage, Key Vault, Private Endpoint) | 1.5–2 giorni | 1 giorno |
| App Service Enterprise (2 plan/app, identity, settings, private endpoint, VNet Integration) | 1.5–2 giorni | 1 giorno |
| Application Gateway WAF_v2 + health probe + routing HTTPS verso frontend | 1–1.5 giorni | 0.75–1 giorno |
| VM Agent subnet + VM + hardening baseline | 0.5–1 giorno | 0.25–0.5 giorno |
| `terraform fmt/validate/plan`, variabili, output, README operativo | 0.5 giorno | 0.25–0.5 giorno |
| **Totale validate/plan** | **6–8 giorni** | **4–5 giorni** |
| Apply, debug DNS/private endpoint, smoke test rete/app | **+2–3 giorni** | **+1–2 giorni** |

Fuori da questa stima: container/nginx reverse proxy o BFF, bootstrap runner
CI/CD, certificato TLS custom, dominio DNS pubblico, policy Azure enterprise già
esistenti.

---

## Differenze chiave POC vs Enterprise

| Aspetto | POC | Enterprise |
|---|---|---|
| Perimetro pubblico | App Service (inbound diretto) + SWA | Solo App Gateway WAF_v2 |
| Frontend hosting | Azure Static Web App (CDN) | App Service Linux + nginx |
| Backend esposto | Sì (pubblico, data service via private endpoint) | No (private endpoint only) |
| WAF | Nessuno | OWASP 3.2 Prevention mode |
| CI/CD | Deployment diretto (App Service pubblico) | VM Agent in VNet |
| Costo mensile stimato | ~€45–75 | ~€700–790 |
| Tempo implementazione Terraform | Non stimato qui | Enterprise app: AGIC Figura F, 4–5 giorni validate/plan, +1–2 giorni apply/smoke test |

---

## Decisioni aperte / post-MVP

| Tema | Nota |
|---|---|
| Certificato TLS custom su App Gateway | Richiede Azure DNS + cert in Key Vault |
| Azure Bastion per accesso VM Agent | Sostituisce SSH diretto; costo ~€130/mese |
| Autoscaling App Service Plans | P1v3 supporta auto-scale; regole da definire |
| Cosmos DB multi-region | Solo per Enterprise; aggiunge geo-replica |
| Entra ID (autenticazione reale) | Fuori scope MVP; integrazione via Easy Auth o custom middleware |
| Firewall Azure (Hub-Spoke) | Alternativa/complemento a NSG per Enterprise avanzato |
