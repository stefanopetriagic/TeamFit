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

const { Text } = Typography;

// ─── Mock AI response engine ──────────────────────────────────────────────────

interface MockResponse {
  content: string;
  proposals?: AllocationProposal[];
}

const RESPONSE_MAP: Array<{ keywords: string[]; response: () => MockResponse }> = [
  {
    keywords: ['sovraccaric', 'overload', 'troppo carico', 'troppo lavoro'],
    response: () => ({
      content:
        '**Analisi carico risorse** — Aggiornato ora\n\nHo identificato 2 risorse in sovraccarico critico:\n\n🔴 **Francesco Greco** (Analyst) — 800h allocate su progetti attivi\n🔴 **Davide Ricci** (Senior Analyst) — 730h allocate\n\n5 risorse in zona warning (>450h):\n🟡 Sofia Mancini, Elena Conti, Giulia Lombardi, Matteo Pellegrini, Luca Romano\n\nVuoi che proponga una riallocazione ottimale?',
    }),
  },
  {
    keywords: ['proponi', 'riallocaz', 'suggerisci', 'sposta', 'riassegna', 'ottimizza'],
    response: () => ({
      content:
        'Eccomi! Ho elaborato una proposta per ridurre il carico di **Francesco Greco** (800h → 650h):',
      proposals: [
        {
          employeeId: 'e9',
          employeeName: 'Francesco Greco',
          fromProjectId: 'p1',
          fromProjectName: 'Digital Transformation Hub',
          toProjectId: 'p9',
          toProjectName: 'Loyalty Program Integration',
          oreToMove: 150,
        },
      ],
    }),
  },
  {
    keywords: ['rischio', 'alert', 'critico', 'problema', 'warning', 'pericolo'],
    response: () => ({
      content:
        '**Progetti a rischio attivi:**\n\n🔴 **Cloud Migration AWS** — Budget al 98%, stima finale supera il budget di €35k\n🔴 **E-commerce Platform v3** — Forecast €210k vs Budget €175k\n🟡 **Security Audit** — Margine 4.5% (soglia: 15%)\n🟡 **Compliance Framework** — Nessuna attività da 14 giorni\n\nVuoi un piano d\'azione per uno di questi?',
    }),
  },
  {
    keywords: ['budget', 'costo', 'margine', 'write', 'finanzia'],
    response: () => ({
      content:
        '**Analisi finanziaria portfolio:**\n\n💰 Write-up totale: €248.500\n📊 Margine medio portfolio: 42,3%\n⚠️ Costo eroso da Cloud Migration (€35k over) e E-commerce (€35k over)\n\nI due progetti critici stanno erodendo il margine complessivo di circa 6 punti percentuali.',
    }),
  },
  {
    keywords: ['risorsa', 'team', 'disponibil', 'chi può', 'libre', 'libero'],
    response: () => ({
      content:
        '**Risorse con basso carico (< 300h allocate):**\n\n🟢 **Sara Fontana** (Junior Analyst) — 200h\n🟢 **Paolo Marini** (Analyst) — 200h\n🟢 **Valentina Gallo** (Senior Analyst) — 0h (disponibile)\n\nPosso aggiungere una di queste risorse a un progetto specifico?',
    }),
  },
  {
    keywords: ['progett', 'portfolio', 'attiv', 'quanti'],
    response: () => ({
      content:
        '**Portfolio attuale:**\n\n📁 7 progetti attivi | 2 completati | 1 sospeso\n💰 Ricavo totale stimato: ~€1,24M\n📈 Margine medio: 42,3%\n⚠️ 4 alert attivi (2 critical, 2 warning)\n\nVuoi dettagli su un progetto specifico?',
    }),
  },
  {
    keywords: ['help', 'aiuto', 'cosa sai', 'cosa puoi', 'comandi'],
    response: () => ({
      content:
        'Posso aiutarti con:\n\n📊 **Carico risorse** — "chi è sovraccarico?"\n🔄 **Riallocazioni** — "proponi una riallocazione"\n⚠️ **Rischi** — "mostrami i progetti a rischio"\n💰 **Finanze** — "analisi del budget"\n👥 **Disponibilità** — "chi è disponibile?"\n📁 **Portfolio** — "stato dei progetti"\n\nSono connesso ad **Azure AI Foundry** e posso operare anche modifiche alle allocazioni.',
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
    content:
      'Ho ricevuto la tua richiesta. Non ho trovato una risposta specifica, ma posso aiutarti con il carico risorse, riallocazioni, rischi di progetto e analisi finanziarie.\n\nProva: "chi è sovraccarico?" o "mostrami i progetti a rischio".',
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

  return (
    <div className={styles.proposalCard}>
      <div className={styles.proposalTitle}>Proposta riallocazione</div>
      <div className={styles.proposalRow}>
        <Text strong>{proposal.employeeName}</Text>
        <Text type="secondary"> — sposta </Text>
        <Text strong>{proposal.oreToMove}h</Text>
      </div>
      <div className={styles.proposalDetail}>
        <span className={styles.proposalFrom}>da: {proposal.fromProjectName}</span>
        <span className={styles.proposalArrow}>→</span>
        <span className={styles.proposalTo}>a: {proposal.toProjectName}</span>
      </div>
      {accepted === null ? (
        <div className={styles.proposalActions}>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => setAccepted(true)}
            className={styles.acceptBtn}
          >
            Accetta
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
          {accepted ? '✓ Riallocazione applicata' : '✕ Rifiutata'}
        </Tag>
      )}
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

  function handleSend(): void {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');

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
      const botMsg: ChatMessage = {
        id: `b${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        proposals,
      };
      addMessage(botMsg);
      setTyping(false);
    }, delay);
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
