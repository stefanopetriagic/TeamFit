import type { JSX } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Input, Button, Typography, Spin, Avatar, Tag, theme } from 'antd';
import {
  SendOutlined,
  CloseOutlined,
  RobotOutlined,
  UserOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { useChatStore } from '../store/chatStore';
import type { AllocationProposal, ChatMessage } from '../store/chatStore';
import styles from './AIChatbot.module.css';
import { PROJECTS, EMPLOYEES, employeeById, figureByCode, calcKpi } from '../mocks/data';
import type { Project } from '../types/project';

const { Text } = Typography;

// ─── Smart AI Engine ─────────────────────────────────────────────────────────

interface MockResponse {
  content: string;
  proposals?: AllocationProposal[];
}

const TODAY = new Date('2026-06-20');

function timelinePct(p: Project): number {
  const s = new Date(p.dataInizio).getTime();
  const e = new Date(p.dataFine).getTime();
  return Math.min(1, Math.max(0, (TODAY.getTime() - s) / (e - s)));
}

function workPct(p: Project): number {
  const tot = p.allocations.reduce((sum, a) => sum + a.oreAllocate, 0);
  const done = p.allocations.reduce((sum, a) => sum + a.oreConsuntivate, 0);
  return tot > 0 ? done / tot : 0;
}

function activeHoursMap(): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of PROJECTS) {
    if (p.status !== 'Active') continue;
    for (const a of p.allocations) {
      map.set(a.employeeId, (map.get(a.employeeId) ?? 0) + a.oreAllocate);
    }
  }
  return map;
}

interface DeadlineRisk {
  project: Project;
  tPct: number;
  wPct: number;
  gap: number;
  daysLeft: number;
  remainHours: number;
}

interface WriteOffRisk {
  project: Project;
  overEuro: number;
  marginePct: number;
}

function getDeadlineRisks(): DeadlineRisk[] {
  return PROJECTS
    .filter(p => p.status === 'Active')
    .map(p => {
      const tP = timelinePct(p);
      const wP = workPct(p);
      const daysLeft = Math.max(0, Math.round((new Date(p.dataFine).getTime() - TODAY.getTime()) / 86400000));
      const remainHours = p.allocations.reduce((s, a) => s + Math.max(0, a.oreAllocate - a.oreConsuntivate), 0);
      return { project: p, tPct: tP, wPct: wP, gap: tP - wP, daysLeft, remainHours };
    })
    .filter(r => r.gap > 0.12)
    .sort((a, b) => b.gap - a.gap);
}

function getWriteOffRisks(): WriteOffRisk[] {
  return PROJECTS
    .filter(p => p.status === 'Active')
    .map(p => {
      const kpi = calcKpi(p);
      return { project: p, overEuro: kpi.forecastAFinire - p.budgetEuro, marginePct: kpi.marginePct };
    })
    .filter(r => r.overEuro > 0 || r.marginePct < 15)
    .sort((a, b) => b.overEuro - a.overEuro);
}

function buildAddProposals(project: Project, maxCount = 2): AllocationProposal[] {
  const wlMap = activeHoursMap();
  const onProject = new Set(project.allocations.map(a => a.employeeId));
  const candidates = EMPLOYEES
    .filter(e => !onProject.has(e.id) && (wlMap.get(e.id) ?? 0) < 350)
    .sort((a, b) => (wlMap.get(a.id) ?? 0) - (wlMap.get(b.id) ?? 0))
    .slice(0, maxCount);
  return candidates.map(emp => {
    const currentLoad = wlMap.get(emp.id) ?? 0;
    const oreToAdd = Math.min(200, 400 - currentLoad);
    const fig = figureByCode[emp.figureCode];
    const gapPct = Math.round((timelinePct(project) - workPct(project)) * 100);
    return {
      type: 'add' as const,
      employeeId: emp.id,
      employeeName: `${emp.nome} ${emp.cognome}`,
      employeeRole: fig?.nome ?? emp.figureCode,
      toProjectId: project.id,
      toProjectName: project.nome,
      oreToMove: oreToAdd,
      motivation: `Carico attuale: ${currentLoad}h su progetti attivi. Aggiungendo ${oreToAdd}h al progetto si contribuisce a colmare il gap del ${gapPct}% rispetto alla timeline pianificata.`,
    };
  });
}

function buildRemoveProposals(project: Project): AllocationProposal[] {
  const candidates = project.allocations
    .map(a => ({
      a,
      remaining: Math.max(0, a.oreAllocate - a.oreConsuntivate),
      emp: employeeById[a.employeeId],
    }))
    .filter(c => c.remaining > 50)
    .sort((x, y) => y.remaining - x.remaining)
    .slice(0, 1);
  return candidates.map(c => {
    const fig = figureByCode[c.emp.figureCode];
    const oreToFree = Math.round(c.remaining * 0.5);
    const savingsEuro = oreToFree * (fig?.costoOrario ?? 50);
    return {
      type: 'remove' as const,
      employeeId: c.emp.id,
      employeeName: `${c.emp.nome} ${c.emp.cognome}`,
      employeeRole: fig?.nome ?? c.emp.figureCode,
      fromProjectId: project.id,
      fromProjectName: project.nome,
      oreToMove: oreToFree,
      motivation: `Il progetto supera il budget. Ridurre di ${oreToFree}h le ore pianificate libera circa \u20ac${savingsEuro.toLocaleString('it-IT')} di costo interno, aiutando a contenere l\u2019erosione del margine.`,
    };
  });
}

const RESPONSE_MAP: Array<{ keywords: string[]; response: () => MockResponse }> = [
  {
    keywords: ['scadenza', 'deadline', 'ritardo', 'in tempo', 'consegna', 'quando finisce'],
    response: () => {
      const risks = getDeadlineRisks();
      if (risks.length === 0) {
        return { content: '\u2705 **Nessun rischio di scadenza rilevato.**\n\nTutti i progetti attivi sono in linea con la timeline pianificata.' };
      }
      const lines = risks.map(r => {
        const icon = r.gap > 0.3 ? '\ud83d\udd34' : '\ud83d\udfe1';
        return `${icon} **${r.project.nome}** \u2014 avanzamento ${Math.round(r.wPct * 100)}% vs timeline ${Math.round(r.tPct * 100)}% (gap: ${Math.round(r.gap * 100)}pp) \u00b7 ${r.daysLeft} gg alla scadenza \u00b7 ${r.remainHours}h rimanenti`;
      });
      const worst = risks[0];
      const proposals = buildAddProposals(worst.project);
      return {
        content: `\u26a0\ufe0f **${risks.length} progett${risks.length === 1 ? 'o' : 'i'} a rischio scadenza:**\n\n${lines.join('\n')}\n\nHo preparato una proposta di rinforzo team per il progetto pi\u00f9 critico (**${worst.project.nome}**):`,
        proposals,
      };
    },
  },
  {
    keywords: ['write-off', 'writeoff', 'perdita', 'in rosso', 'in perdita', 'deficit', 'budget sforato', 'supera budget'],
    response: () => {
      const risks = getWriteOffRisks();
      if (risks.length === 0) {
        return { content: '\u2705 **Nessun rischio di write-off rilevato.**\n\nTutti i progetti hanno un forecast entro il budget approvato.' };
      }
      const lines = risks.map(r => {
        const icon = r.overEuro > 0 ? '\ud83d\udd34' : '\ud83d\udfe1';
        const overStr = r.overEuro > 0
          ? `+\u20ac${r.overEuro.toLocaleString('it-IT')} over budget`
          : `margine ${r.marginePct.toFixed(1)}% (sotto soglia 15%)`;
        return `${icon} **${r.project.nome}** \u2014 ${overStr}`;
      });
      const worst = risks[0];
      const proposals = buildRemoveProposals(worst.project);
      return {
        content: `\ud83d\udea8 **${risks.length} progett${risks.length === 1 ? 'o' : 'i'} a rischio write-off:**\n\n${lines.join('\n')}\n\nPer il progetto pi\u00f9 critico (**${worst.project.nome}**) propongo di ottimizzare le allocazioni:`,
        proposals,
      };
    },
  },
  {
    keywords: ['analisi completa', 'diagnostica', 'analizza tutto', 'situazione', 'panoramica', 'report'],
    response: () => {
      const deadlines = getDeadlineRisks();
      const writeOffs = getWriteOffRisks();
      const wlMap = activeHoursMap();
      const overloaded = EMPLOYEES.filter(e => (wlMap.get(e.id) ?? 0) >= 650).length;
      const attn = EMPLOYEES.filter(e => { const h = wlMap.get(e.id) ?? 0; return h >= 450 && h < 650; }).length;
      const free = EMPLOYEES.filter(e => (wlMap.get(e.id) ?? 0) < 300).length;
      let content = `\ud83d\udcca **Analisi completa portfolio \u2014 ${TODAY.toLocaleDateString('it-IT')}**\n\n`;
      content += `**Scadenze a rischio:** ${deadlines.length > 0 ? deadlines.map(r => r.project.nome).join(', ') : 'nessuno \u2705'}\n`;
      content += `**Rischio write-off:** ${writeOffs.length > 0 ? writeOffs.map(r => r.project.nome).join(', ') : 'nessuno \u2705'}\n`;
      content += `**Risorse:** \ud83d\udd34 ${overloaded} critici \u00b7 \ud83d\udfe1 ${attn} in warning \u00b7 \ud83d\udfe2 ${free} disponibili\n\n`;
      const proposals: AllocationProposal[] = [];
      if (deadlines.length > 0) {
        content += `**Proposta rinforzo:** ${deadlines[0].project.nome}\n`;
        proposals.push(...buildAddProposals(deadlines[0].project, 1));
      }
      if (writeOffs.length > 0 && writeOffs[0].overEuro > 0) {
        content += `**Proposta ottimizzazione:** ${writeOffs[0].project.nome}`;
        proposals.push(...buildRemoveProposals(writeOffs[0].project));
      }
      return { content, proposals };
    },
  },
  {
    keywords: ['alloca', 'aggiungi risorsa', 'rinforza', 'potenzia', 'aggiungi al progetto'],
    response: () => {
      const risks = getDeadlineRisks();
      const target = risks.length > 0 ? risks[0].project : (PROJECTS.find(p => p.status === 'Active') ?? PROJECTS[0]);
      const proposals = buildAddProposals(target);
      if (proposals.length === 0) {
        return { content: '\u26a0\ufe0f Nessuna risorsa disponibile con carico sufficiente per una nuova allocazione in questo momento.' };
      }
      return {
        content: `\u2795 **Auto-allocazione per \u201c${target.nome}\u201d**\n\nHo identificato ${proposals.length} risorsa${proposals.length > 1 ? '' : ''} con disponibilit\u00e0 adeguata:`,
        proposals,
      };
    },
  },
  {
    keywords: ['rimuovi risorsa', 'dealloca', 'libera risorsa', 'togli dal progetto', 'riduci team'],
    response: () => {
      const risks = getWriteOffRisks();
      const target = risks.length > 0 ? risks[0].project : (PROJECTS.find(p => p.status === 'Active') ?? PROJECTS[0]);
      const proposals = buildRemoveProposals(target);
      if (proposals.length === 0) {
        return { content: '\u26a0\ufe0f Nessuna allocazione riducibile trovata per i progetti a rischio.' };
      }
      return {
        content: `\u2702\ufe0f **Ottimizzazione costi per \u201c${target.nome}\u201d**\n\nRiduzione ore pianificate per contenere il budget:`,
        proposals,
      };
    },
  },
  {
    keywords: ['proponi', 'riallocaz', 'suggerisci', 'sposta', 'riassegna', 'ottimizza'],
    response: () => {
      const wlMap = activeHoursMap();
      const mostLoaded = [...EMPLOYEES].sort((a, b) => (wlMap.get(b.id) ?? 0) - (wlMap.get(a.id) ?? 0))[0];
      if (!mostLoaded) return { content: 'Nessuna risorsa trovata.' };
      const fromProject = PROJECTS.find(p => p.status === 'Active' && p.allocations.some(a => a.employeeId === mostLoaded.id));
      const toProject = PROJECTS.find(p => p.status === 'Active' && !p.allocations.some(a => a.employeeId === mostLoaded.id));
      if (!fromProject || !toProject) return { content: 'Impossibile trovare un progetto alternativo per la riallocazione.' };
      const fig = figureByCode[mostLoaded.figureCode];
      const oreToMove = 150;
      return {
        content: `\ud83d\udd04 **Proposta riallocazione \u2014 ${mostLoaded.nome} ${mostLoaded.cognome}**\n\nCarico attuale: ${wlMap.get(mostLoaded.id)}h. Propongo di bilanciare le ore:`,
        proposals: [{
          type: 'move' as const,
          employeeId: mostLoaded.id,
          employeeName: `${mostLoaded.nome} ${mostLoaded.cognome}`,
          employeeRole: fig?.nome ?? mostLoaded.figureCode,
          fromProjectId: fromProject.id,
          fromProjectName: fromProject.nome,
          toProjectId: toProject.id,
          toProjectName: toProject.nome,
          oreToMove,
          motivation: `Spostando ${oreToMove}h da \u201c${fromProject.nome}\u201d (gi\u00e0 avanzato) a \u201c${toProject.nome}\u201d si bilancia il rischio e si riduce il carico complessivo di ${mostLoaded.nome}.`,
        }],
      };
    },
  },
  {
    keywords: ['sovraccaric', 'overload', 'troppo carico', 'troppo lavoro', 'carico risorse'],
    response: () => {
      const wlMap = activeHoursMap();
      const critical = EMPLOYEES
        .filter(e => (wlMap.get(e.id) ?? 0) >= 650)
        .map(e => `\ud83d\udd34 **${e.nome} ${e.cognome}** (${figureByCode[e.figureCode]?.nome ?? e.figureCode}) \u2014 ${wlMap.get(e.id)}h`);
      const attn = EMPLOYEES
        .filter(e => { const h = wlMap.get(e.id) ?? 0; return h >= 450 && h < 650; })
        .map(e => `\ud83d\udfe1 ${e.nome} ${e.cognome} \u2014 ${wlMap.get(e.id)}h`);
      return {
        content: `**Carico risorse \u2014 ${TODAY.toLocaleDateString('it-IT')}**\n\n${critical.join('\n')}\n\n**In attenzione (450\u2013650h):**\n${attn.join('\n')}\n\nDigita \u201cproponi riallocazione\u201d per ottimizzare il carico.`,
      };
    },
  },
  {
    keywords: ['rischio', 'alert', 'critico', 'problema', 'warning', 'pericolo'],
    response: () => {
      const d = getDeadlineRisks().length;
      const w = getWriteOffRisks().length;
      return {
        content: `**Riepilogo alert attivi:**\n\n\u23f0 ${d} progett${d === 1 ? 'o' : 'i'} a rischio scadenza\n\ud83d\udea8 ${w} progett${w === 1 ? 'o' : 'i'} a rischio write-off\n\nDigita \u201canalisi completa\u201d per il report dettagliato con proposte operative.`,
      };
    },
  },
  {
    keywords: ['budget', 'costo', 'margine', 'finanzia', 'kpi', 'write'],
    response: () => {
      const active = PROJECTS.filter(p => p.status === 'Active');
      let totRicavo = 0; let totCosto = 0;
      for (const p of active) {
        const kpi = calcKpi(p);
        totRicavo += kpi.ricavoRiconosciuto;
        totCosto += kpi.costoSostenuto;
      }
      const margine = totRicavo > 0 ? ((totRicavo - totCosto) / totRicavo * 100).toFixed(1) : '0';
      return {
        content: `**Analisi finanziaria portfolio attivo:**\n\nRicavo riconosciuto: \u20ac${totRicavo.toLocaleString('it-IT')}\nCosto sostenuto: \u20ac${totCosto.toLocaleString('it-IT')}\nMargine medio: ${margine}%\nProgetti a rischio write-off: ${getWriteOffRisks().length}\n\nDigita \u201cwrite-off\u201d per vedere i progetti a rischio con proposte di intervento.`,
      };
    },
  },
  {
    keywords: ['risorsa', 'team', 'disponibil', 'chi pu\u00f2', 'libero', 'chi \u00e8 libero', 'risorse libere'],
    response: () => {
      const wlMap = activeHoursMap();
      const freeList = EMPLOYEES
        .filter(e => (wlMap.get(e.id) ?? 0) < 300)
        .map(e => `\ud83d\udfe2 **${e.nome} ${e.cognome}** (${figureByCode[e.figureCode]?.nome ?? e.figureCode}) \u2014 ${wlMap.get(e.id) ?? 0}h`)
        .join('\n');
      return {
        content: `**Risorse con basso carico (< 300h):**\n\n${freeList || 'Nessuna risorsa con carico basso.'}\n\nDigita \u201calloca risorsa\u201d per aggiungere una di queste a un progetto in difficolt\u00e0.`,
      };
    },
  },
  {
    keywords: ['progett', 'portfolio', 'attiv', 'quanti'],
    response: () => {
      const active = PROJECTS.filter(p => p.status === 'Active');
      const completed = PROJECTS.filter(p => p.status === 'Completed').length;
      const suspended = PROJECTS.filter(p => p.status === 'Suspended').length;
      const budgetTot = active.reduce((s, p) => s + p.budgetEuro, 0);
      return {
        content: `**Portfolio attuale:**\n\n\ud83d\uddc2\ufe0f ${active.length} attivi \u00b7 ${completed} completati \u00b7 ${suspended} sospesi\n\ud83d\udcb0 Budget totale attivi: \u20ac${budgetTot.toLocaleString('it-IT')}\n\u26a0\ufe0f ${getWriteOffRisks().length} a rischio write-off \u00b7 ${getDeadlineRisks().length} a rischio scadenza\n\nDigita \u201canalisi completa\u201d per un report con proposte operative.`,
      };
    },
  },
  {
    keywords: ['help', 'aiuto', 'cosa sai', 'cosa puoi', 'comandi', 'guida'],
    response: () => ({
      content: 'Posso aiutarti con:\n\n\u23f0 **Scadenze** \u2014 \u201cprogetti a rischio scadenza\u201d\n\ud83d\udea8 **Write-off** \u2014 \u201cquali progetti vanno in perdita\u201d\n\ud83d\udcca **Analisi completa** \u2014 report con proposte operative\n\ud83d\udd04 **Riallocazione** \u2014 \u201cproponi riallocazione\u201d\n\u2795 **Aggiungi risorsa** \u2014 \u201calloca risorsa\u201d\n\u2702\ufe0f **Rimuovi risorsa** \u2014 \u201crimuovi risorsa\u201d\n\ud83d\udc65 **Disponibilit\u00e0** \u2014 \u201cchi \u00e8 libero\u201d\n\ud83d\udcb0 **Budget/KPI** \u2014 \u201canalisi budget\u201d',
    }),
  },
];

function getMockResponse(input: string): MockResponse {
  const lower = input.toLowerCase();
  for (const item of RESPONSE_MAP) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      return item.response();
    }
  }
  return {
    content: 'Non ho trovato una risposta specifica.\n\nProva:\n\u2022 \u201cprogetti a rischio scadenza\u201d\n\u2022 \u201cwrite-off\u201d\n\u2022 \u201canalisi completa\u201d\n\u2022 \u201caiuto\u201d per tutti i comandi',
  };
}

// ─── Simple markdown renderer ─────────────────────────────────────────────────

function renderMarkdown(text: string): JSX.Element {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return <span key={j}>{part}</span>;
        });
        return (
          <span key={i} className={styles.msgLine}>
            {rendered}
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

// ─── Proposal card ────────────────────────────────────────────────────────────

function ProposalCard({ proposal }: { proposal: AllocationProposal }): JSX.Element {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  const typeLabel =
    proposal.type === 'add' ? 'Aggiunta risorsa al progetto' :
    proposal.type === 'remove' ? 'Rimozione risorsa dal progetto' :
    'Spostamento ore';

  const typeIcon =
    proposal.type === 'add' ? '➕' :
    proposal.type === 'remove' ? '✂️' :
    '🔄';

  function buildDetail(): JSX.Element {
    if (proposal.type === 'add') {
      return (
        <div className={styles.proposalDetail}>
          <span className={styles.proposalTo}>Progetto: <strong>{proposal.toProjectName}</strong></span>
          {proposal.oreToMove !== undefined && (
            <span className={styles.proposalHours}>{proposal.oreToMove}h pianificate</span>
          )}
        </div>
      );
    }
    if (proposal.type === 'remove') {
      return (
        <div className={styles.proposalDetail}>
          <span className={styles.proposalFrom}>Progetto: <strong>{proposal.fromProjectName}</strong></span>
          {proposal.oreToMove !== undefined && (
            <span className={styles.proposalHours}>-{proposal.oreToMove}h da ridurre</span>
          )}
        </div>
      );
    }
    return (
      <div className={styles.proposalDetail}>
        <span className={styles.proposalFrom}>da: {proposal.fromProjectName}</span>
        <span className={styles.proposalArrow}>→</span>
        <span className={styles.proposalTo}>a: {proposal.toProjectName}</span>
        {proposal.oreToMove !== undefined && (
          <span className={styles.proposalHours}>{proposal.oreToMove}h</span>
        )}
      </div>
    );
  }

  return (
    <div className={styles.proposalCard}>
      <div className={styles.proposalTitle}>{typeIcon} {typeLabel}</div>
      <div className={styles.proposalRow}>
        <Text strong>{proposal.employeeName}</Text>
        <Text type="secondary"> · {proposal.employeeRole}</Text>
      </div>
      {buildDetail()}
      <div className={styles.proposalMotivation}>{proposal.motivation}</div>
      {accepted === null ? (
        <div className={styles.proposalActions}>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => setAccepted(true)}
            className={styles.acceptBtn}
          >
            Applica
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => setAccepted(false)}
          >
            Rifiuta
          </Button>
        </div>
      ) : (
        <Tag color={accepted ? 'success' : 'error'} className={styles.proposalTag}>
          {accepted ? '✓ Operazione applicata' : '✕ Rifiutata'}
        </Tag>
      )}
    </div>
  );
}

// ─── Quick action chips ──────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: '⏰ Rischi scadenza', msg: 'progetti a rischio scadenza' },
  { label: '🚨 Rischio write-off', msg: 'write-off' },
  { label: '📊 Analisi completa', msg: 'analisi completa' },
  { label: '➕ Alloca risorsa', msg: 'alloca risorsa' },
  { label: '✂️ Rimuovi risorsa', msg: 'rimuovi risorsa' },
  { label: '👥 Risorse libere', msg: 'chi è libero' },
] as const;

function QuickChips({ onSelect }: { onSelect: (msg: string) => void }): JSX.Element {
  return (
    <div className={styles.quickChips}>
      {QUICK_ACTIONS.map(qa => (
        <button key={qa.msg} className={styles.quickChip} onClick={() => onSelect(qa.msg)}>
          {qa.label}
        </button>
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }): JSX.Element {
  const { token } = theme.useToken();
  const isUser = msg.role === 'user';

  return (
    <div className={`${styles.msgWrapper} ${isUser ? styles.msgUser : styles.msgAssistant}`}>
      {!isUser && (
        <Avatar
          size={28}
          icon={<RobotOutlined />}
          className={styles.botAvatar}
          style={{ background: token.colorPrimary }}
        />
      )}
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
        {renderMarkdown(msg.content)}
        {msg.proposals?.map((p) => <ProposalCard key={p.employeeId} proposal={p} />)}
      </div>
      {isUser && (
        <Avatar size={28} icon={<UserOutlined />} className={styles.userAvatar} />
      )}
    </div>
  );
}

// ─── Main chatbot component ───────────────────────────────────────────────────

export function AIChatbot(): JSX.Element {
  const { messages, isTyping, isOpen, addMessage, setTyping, toggleOpen } = useChatStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  function dispatchMessage(text: string): void {
    const userMsg: ChatMessage = {
      id: `u${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setTyping(true);
    const delay = 800 + Math.random() * 800;
    setTimeout(() => {
      const { content, proposals } = getMockResponse(text);
      addMessage({ id: `b${Date.now()}`, role: 'assistant', content, timestamp: new Date(), proposals });
      setTyping(false);
    }, delay);
  }

  function handleSend(): void {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    dispatchMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        className={`${styles.toggleBtn} ${isOpen ? styles.toggleBtnActive : ''}`}
        onClick={toggleOpen}
        aria-label="Apri assistente AI"
      >
        <RobotOutlined className={styles.toggleIcon} />
        <span className={styles.toggleLabel}>AI Agent</span>
        {!isOpen && messages.length > 1 && (
          <span className={styles.toggleBadge}>{messages.filter((m) => m.role === 'assistant').length - 1}</span>
        )}
      </button>

      {/* Chat panel */}
      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}>
        <div className={styles.panelHeader}>
          <div className={styles.panelHeaderLeft}>
            <ThunderboltFilled className={styles.foundryIcon} />
            <div>
              <div className={styles.panelTitle}>TeamFit AI</div>
              <div className={styles.panelSubtitle}>Azure AI Foundry · GPT-4o</div>
            </div>
          </div>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={toggleOpen}
            className={styles.closeBtn}
          />
        </div>

        <div className={styles.messages}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {messages.length === 1 && !isTyping && (
            <QuickChips onSelect={(msg) => dispatchMessage(msg)} />
          )}
          {isTyping && (
            <div className={`${styles.msgWrapper} ${styles.msgAssistant}`}>
              <div className={styles.typingBubble}>
                <Spin size="small" />
                <span className={styles.typingText}>Sto elaborando…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Chiedi all'agente AI…"
            className={styles.input}
            disabled={isTyping}
            suffix={
              <Button
                type="text"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={isTyping || !inputValue.trim()}
                className={styles.sendBtn}
              />
            }
          />
        </div>
      </div>
    </>
  );
}
