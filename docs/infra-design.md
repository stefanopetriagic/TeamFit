# Infrastructure Design — Man-Agent

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
Validare rapidamente l'architettura a costi contenuti. Il backend è pubblico in
ingresso ma protegge i data service via VNet Integration.

### Topologia

```
Internet
   │
   ├──► Azure Static Web App (frontend React, CDN globale)
   │         │  linked backend → proxying /api/* verso App Service
   │         │
   └──► App Service Linux S1 (backend .NET 10 API)
              │  Regional VNet Integration (outbound)
              │
           VNet  10.0.0.0/16
              │
              ├── snet-app-vnetint  10.0.1.0/24
              │     delegation: Microsoft.Web/serverFarms
              │     ↑ subnet usata dal VNet Integration dell'App Service
              │
              └── snet-pe  10.0.2.0/24
                    ├── Private Endpoint → Azure SQL
                    ├── Private Endpoint → Cosmos DB
                    ├── Private Endpoint → Storage Account
                    └── Private Endpoint → Key Vault

Log Analytics Workspace  ◄──  Application Insights  ◄──  App Service diagnostics
(pubblici, endpoint Azure-managed)
```

### Security boundary

| Risorsa | Accesso inbound | Note |
|---|---|---|
| Static Web App | Internet (CDN) | Standard tier, no private endpoint |
| App Service | Internet (porta 80/443) | Semi-privato: inbound pubblico, outbound VNet |
| Azure SQL | Solo private endpoint | `public_network_access_enabled = false` |
| Cosmos DB | Solo private endpoint | `public_network_access_enabled = false` |
| Storage Account | Solo private endpoint | network_rules default_action = Deny |
| Key Vault | Solo private endpoint | RBAC, `public_network_access_enabled = false` |
| Log Analytics | Pubblico (Azure-managed) | Endpoint di ingestione non espongono dati |
| Application Insights | Pubblico (Azure-managed) | Idem |

### Note tecniche importanti

1. **VNet Integration richiede S1+**. Basic (B1/B2/B3) non supporta Regional VNet
   Integration. Minimo: Standard S1 (~€73/mese).

2. **`vnet_route_all_enabled = true`**. Necessario per far passare anche il DNS
   attraverso il VNet e risolvere correttamente i private endpoint tramite le
   Private DNS Zone.

3. **Private DNS Zone per ogni servizio privato**. Senza zone collegate al VNet,
   la risoluzione DNS fallisce silenziosamente (l'App Service raggiunge l'endpoint
   pubblico anziché quello privato):

   | Servizio | Private DNS Zone |
   |---|---|
   | Azure SQL | `privatelink.database.windows.net` |
   | Cosmos DB | `privatelink.documents.azure.com` |
   | Storage Blob | `privatelink.blob.core.windows.net` |
   | Key Vault | `privatelink.vaultcore.azure.net` |

4. **Static Web App → App Service**: il "linked backend" di SWA proxizza `/api/*`
   verso l'App Service. L'App Service rimane pubblico, quindi il proxy funziona
   senza configurazioni VNet aggiuntive sul frontend.

5. **Identità gestita (System-Assigned)** sull'App Service per accedere a Key Vault
   via RBAC (ruolo `Key Vault Secrets User`). Evita segreti hard-coded.

### Costo stimato (westeurope, prezzi indicativi)

| Risorsa | SKU | €/mese ca. |
|---|---|---|
| App Service Plan | S1 Linux | 73 |
| Static Web App | Standard | 9 |
| Azure SQL | S0 (10 DTU) | 15 |
| Cosmos DB | Serverless | ~5–20 (uso POC) |
| Storage Account | Standard LRS | <5 |
| Key Vault | Standard | <5 |
| Log Analytics | PerGB2018 | ~2–10 |
| Application Insights | Workspace-based | incluso in LAW |
| **Totale stimato** | | **~115–140 €/mese** |

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

| Risorsa | SKU | €/mese ca. |
|---|---|---|
| App Gateway WAF_v2 | 2 capacity unit fisse | ~270 |
| App Service Plan frontend | P1v3 Linux | ~75 |
| App Service Plan backend | P1v3 Linux | ~75 |
| VM Agent | Standard_B2s | ~35 |
| Azure SQL | S2 (50 DTU, production) | ~75 |
| Cosmos DB | Provisioned 400 RU/s | ~25 |
| Storage Account | Standard LRS | <5 |
| Key Vault | Standard | <5 |
| Log Analytics | PerGB2018 | ~10–30 |
| Application Insights | Workspace-based | incluso in LAW |
| **Totale stimato** | | **~575–620 €/mese** |

> Il costo dominante è l'App Gateway WAF_v2 (fisso anche a zero traffico).
> Considerare autoscale con `min_capacity = 0` per ambienti non-prod.

---

## Differenze chiave POC vs Enterprise

| Aspetto | POC | Enterprise |
|---|---|---|
| Perimetro pubblico | App Service (inbound diretto) + SWA | Solo App Gateway WAF_v2 |
| Frontend hosting | Azure Static Web App (CDN) | App Service Linux + nginx |
| Backend esposto | Sì (pubblico, con VNet outbound) | No (private endpoint only) |
| WAF | Nessuno | OWASP 3.2 Prevention mode |
| CI/CD | Deployment diretto (App Service pubblico) | VM Agent in VNet |
| Costo mensile stimato | ~€115–140 | ~€575–620 |
| Tempo setup infra | Basso | Medio-alto |

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
