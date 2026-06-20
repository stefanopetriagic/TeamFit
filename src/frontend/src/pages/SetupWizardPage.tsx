import type { JSX } from 'react';
import { useState } from 'react';
import {
  Steps, Card, Button, Form, Input, Select, Table, Upload, Typography,
  Space, Row, Col, Tag, Divider, InputNumber, message as antMessage,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload';
import {
  PlusOutlined, DeleteOutlined, DownloadOutlined,
  CloudSyncOutlined, CheckCircleOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useOrgConfigStore } from '../store/orgConfigStore';
import type { OrgFigure, OrgResource, OrgType } from '../types/orgConfig';
import styles from './SetupWizardPage.module.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const ORG_TYPE_OPTIONS: { label: string; value: OrgType }[] = [
  { label: 'IT Consulting', value: 'IT_CONSULTING' },
  { label: 'Digital Agency', value: 'DIGITAL_AGENCY' },
  { label: 'System Integrator', value: 'SYSTEM_INTEGRATOR' },
  { label: 'Managed Services', value: 'MANAGED_SERVICES' },
  { label: 'Altro', value: 'ALTRO' },
];

const DEFAULT_FIGURES: OrgFigure[] = [
  { code: 'A', titolo: 'Junior Analyst', costoOrario: 25, tariffaVenditaOraria: 60 },
  { code: 'B', titolo: 'Analyst', costoOrario: 35, tariffaVenditaOraria: 80 },
  { code: 'C', titolo: 'Senior Analyst', costoOrario: 50, tariffaVenditaOraria: 110 },
  { code: 'D', titolo: 'Consultant', costoOrario: 65, tariffaVenditaOraria: 140 },
  { code: 'E', titolo: 'Senior Consultant', costoOrario: 85, tariffaVenditaOraria: 180 },
  { code: 'F', titolo: 'Principal Consultant', costoOrario: 110, tariffaVenditaOraria: 230 },
];

const DEFAULT_RESOURCES: OrgResource[] = [
  { id: 'r1', nome: 'Giulia', cognome: 'Ferretti', email: 'g.ferretti@manag.it', figureCode: 'F' },
  { id: 'r2', nome: 'Marco', cognome: 'Bianchi', email: 'm.bianchi@manag.it', figureCode: 'F' },
  { id: 'r3', nome: 'Luca', cognome: 'Romano', email: 'l.romano@manag.it', figureCode: 'E' },
  { id: 'r4', nome: 'Sofia', cognome: 'Mancini', email: 's.mancini@manag.it', figureCode: 'E' },
];

const MOCK_DEVOPS_RESULTS = {
  projects: [
    { key: 'dp1', name: 'Website Redesign 2025', customer: 'TechCorp S.r.l.' },
    { key: 'dp2', name: 'Mobile App v2', customer: 'TechCorp S.r.l.' },
    { key: 'dp3', name: 'Backend Refactoring', customer: 'DataFlow Inc.' },
    { key: 'dp4', name: 'Cloud Infrastructure Q1', customer: 'DataFlow Inc.' },
    { key: 'dp5', name: 'Security Assessment', customer: 'SecureBank AG' },
  ],
  users: [
    { key: 'du1', displayName: 'Marco Rossi', email: 'm.rossi@org.it', username: 'm.rossi' },
    { key: 'du2', displayName: 'Lucia Bianchi', email: 'l.bianchi@org.it', username: 'l.bianchi' },
    { key: 'du3', displayName: 'Andrea Costa', email: 'a.costa@org.it', username: 'a.costa' },
    { key: 'du4', displayName: 'Federica Neri', email: 'f.neri@org.it', username: 'f.neri' },
  ],
};

function downloadCsvTemplate(): void {
  const headers = ['nome', 'cognome', 'email', 'figura_code', 'devops_username'];
  const example = ['Mario', 'Rossi', 'm.rossi@azienda.it', 'C', 'm.rossi'];
  const csv = [headers.join(';'), example.join(';')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_risorse_man-agent.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function generateCode(index: number): string {
  return String.fromCharCode(65 + index);
}

export function SetupWizardPage(): JSX.Element {
  const navigate = useNavigate();
  const { saveConfig } = useOrgConfigStore();
  const [current, setCurrent] = useState(0);

  // Step 1 state
  const [orgNome, setOrgNome] = useState('');
  const [orgMissione, setOrgMissione] = useState('');
  const [orgTipo, setOrgTipo] = useState<OrgType>('IT_CONSULTING');

  // Step 2 state
  const [figure, setFigure] = useState<OrgFigure[]>(DEFAULT_FIGURES);
  const [newFigure, setNewFigure] = useState<Partial<OrgFigure>>({ costoOrario: 0, tariffaVenditaOraria: 0 });

  // Step 3 state
  const [risorse, setRisorse] = useState<OrgResource[]>(DEFAULT_RESOURCES);
  const [newRisorsa, setNewRisorsa] = useState<Partial<OrgResource>>({});

  // Step 4 state
  const [uploadedResources, setUploadedResources] = useState<OrgResource[] | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Step 5 state
  const [devopsUrl, setDevopsUrl] = useState('');
  const [devopsOrg, setDevopsOrg] = useState('');
  const [devopsSyncing, setDevopsSyncing] = useState(false);
  const [devopsSynced, setDevopsSynced] = useState(false);

  const steps = [
    { title: 'Organizzazione' },
    { title: 'Figure' },
    { title: 'Risorse' },
    { title: 'Importazione' },
    { title: 'DevOps Sync' },
  ];

  // ─── Step navigation ────────────────────────────────────────────────────────

  function handleNext(): void {
    if (current === 0 && !orgNome.trim()) {
      antMessage.warning('Inserisci il nome dell\'organizzazione.');
      return;
    }
    setCurrent((c) => c + 1);
  }

  function handleComplete(): void {
    const finalRisorse = uploadedResources ?? risorse;
    saveConfig({
      nome: orgNome || 'La mia organizzazione',
      missione: orgMissione,
      tipo: orgTipo,
      figure,
      risorse: finalRisorse,
      devops: devopsSynced ? { url: devopsUrl, organization: devopsOrg, enabled: true } : undefined,
    });
    antMessage.success('Configurazione completata!');
    navigate('/');
  }

  // ─── Figure management ─────────────────────────────────────────────────────

  function addFigura(): void {
    if (!newFigure.titolo?.trim()) { antMessage.warning('Inserisci il titolo della figura.'); return; }
    const code = generateCode(figure.length);
    setFigure([...figure, { code, titolo: newFigure.titolo, costoOrario: newFigure.costoOrario ?? 0, tariffaVenditaOraria: newFigure.tariffaVenditaOraria ?? 0 }]);
    setNewFigure({ costoOrario: 0, tariffaVenditaOraria: 0 });
  }

  function removeFigura(code: string): void {
    setFigure(figure.filter((f) => f.code !== code));
  }

  // ─── Resource management ───────────────────────────────────────────────────

  function addRisorsa(): void {
    if (!newRisorsa.nome?.trim() || !newRisorsa.cognome?.trim() || !newRisorsa.email?.trim() || !newRisorsa.figureCode) {
      antMessage.warning('Compila tutti i campi della risorsa.');
      return;
    }
    setRisorse([...risorse, { id: `r${Date.now()}`, nome: newRisorsa.nome, cognome: newRisorsa.cognome, email: newRisorsa.email, figureCode: newRisorsa.figureCode }]);
    setNewRisorsa({});
  }

  function removeRisorsa(id: string): void {
    setRisorse(risorse.filter((r) => r.id !== id));
  }

  // ─── DevOps sync ───────────────────────────────────────────────────────────

  function handleDevopsSync(): void {
    if (!devopsUrl.trim()) { antMessage.warning('Inserisci l\'URL Azure DevOps.'); return; }
    setDevopsSyncing(true);
    setTimeout(() => {
      setDevopsSyncing(false);
      setDevopsSynced(true);
      antMessage.success('Sincronizzazione completata: 5 progetti e 4 utenti importati.');
    }, 2200);
  }

  // ─── CSV upload ────────────────────────────────────────────────────────────

  function parseCsv(text: string): OrgResource[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    return lines.slice(1).map((line, i) => {
      const [nome = '', cognome = '', email = '', figureCode = '', devopsUsername = ''] = line.split(';');
      return { id: `csv-${i}`, nome: nome.trim(), cognome: cognome.trim(), email: email.trim(), figureCode: figureCode.trim(), devopsUsername: devopsUsername.trim() || undefined };
    }).filter((r) => r.nome && r.email);
  }

  // ─── Column definitions ────────────────────────────────────────────────────

  const figureColumns: ColumnsType<OrgFigure> = [
    { title: 'Cod.', dataIndex: 'code', width: 60, render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Titolo', dataIndex: 'titolo' },
    { title: 'Costo/h (€)', dataIndex: 'costoOrario', width: 110 },
    { title: 'Tariffa/h (€)', dataIndex: 'tariffaVenditaOraria', width: 120 },
    {
      title: '',
      width: 48,
      render: (_: unknown, record: OrgFigure) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeFigura(record.code)} />
      ),
    },
  ];

  const risorseColumns: ColumnsType<OrgResource> = [
    { title: 'Nome', dataIndex: 'nome' },
    { title: 'Cognome', dataIndex: 'cognome' },
    { title: 'Email', dataIndex: 'email' },
    {
      title: 'Figura',
      dataIndex: 'figureCode',
      render: (v: string) => {
        const fig = figure.find((f) => f.code === v);
        return <Tag>{v} — {fig?.titolo ?? v}</Tag>;
      },
    },
    {
      title: '',
      width: 48,
      render: (_: unknown, record: OrgResource) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeRisorsa(record.id)} />
      ),
    },
  ];

  // ─── Step content ──────────────────────────────────────────────────────────

  const stepContent: JSX.Element[] = [

    // Step 0 — Organizzazione
    <div key="s0" className={styles.stepContent}>
      <Title level={4}>Dati organizzazione</Title>
      <Paragraph type="secondary">Inserisci le informazioni di base della tua organizzazione.</Paragraph>
      <Form layout="vertical" className={styles.form}>
        <Form.Item label="Nome organizzazione" required>
          <Input
            placeholder="Es. Acme Consulting S.r.l."
            value={orgNome}
            onChange={(e) => setOrgNome(e.target.value)}
            size="large"
          />
        </Form.Item>
        <Form.Item label="Missione / descrizione">
          <TextArea
            rows={4}
            placeholder="Descrivi la missione e il focus principale dell'organizzazione…"
            value={orgMissione}
            onChange={(e) => setOrgMissione(e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Tipo di organizzazione">
          <Select
            size="large"
            value={orgTipo}
            onChange={(v) => setOrgTipo(v)}
            options={ORG_TYPE_OPTIONS}
          />
        </Form.Item>
      </Form>
    </div>,

    // Step 1 — Figure professionali
    <div key="s1" className={styles.stepContent}>
      <Title level={4}>Figure professionali</Title>
      <Paragraph type="secondary">
        Definisci le categorie di figure (da A in poi). Ogni figura ha un codice progressivo, un titolo e i costi orari.
      </Paragraph>
      <Table
        dataSource={figure}
        columns={figureColumns}
        rowKey="code"
        pagination={false}
        size="small"
        className={styles.table}
      />
      <Divider dashed />
      <Text strong>Aggiungi figura</Text>
      <Row gutter={8} className={styles.addRow}>
        <Col flex="auto">
          <Input
            placeholder="Titolo (es. Senior Developer)"
            value={newFigure.titolo ?? ''}
            onChange={(e) => setNewFigure({ ...newFigure, titolo: e.target.value })}
          />
        </Col>
        <Col>
          <InputNumber
            placeholder="Costo/h"
            min={0}
            value={newFigure.costoOrario}
            onChange={(v) => setNewFigure({ ...newFigure, costoOrario: v ?? 0 })}
            addonBefore="€"
          />
        </Col>
        <Col>
          <InputNumber
            placeholder="Tariffa/h"
            min={0}
            value={newFigure.tariffaVenditaOraria}
            onChange={(v) => setNewFigure({ ...newFigure, tariffaVenditaOraria: v ?? 0 })}
            addonBefore="€"
          />
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={addFigura}>Aggiungi</Button>
        </Col>
      </Row>
    </div>,

    // Step 2 — Risorse umane
    <div key="s2" className={styles.stepContent}>
      <Title level={4}>Risorse umane</Title>
      <Paragraph type="secondary">
        Aggiungi le risorse manualmente. Puoi anche importarle dal file Excel nel passo successivo.
      </Paragraph>
      <Table
        dataSource={risorse}
        columns={risorseColumns}
        rowKey="id"
        pagination={false}
        size="small"
        className={styles.table}
        scroll={{ y: 220 }}
      />
      <Divider dashed />
      <Text strong>Aggiungi risorsa</Text>
      <Row gutter={8} className={styles.addRow}>
        <Col span={4}><Input placeholder="Nome" value={newRisorsa.nome ?? ''} onChange={(e) => setNewRisorsa({ ...newRisorsa, nome: e.target.value })} /></Col>
        <Col span={5}><Input placeholder="Cognome" value={newRisorsa.cognome ?? ''} onChange={(e) => setNewRisorsa({ ...newRisorsa, cognome: e.target.value })} /></Col>
        <Col span={7}><Input placeholder="Email" value={newRisorsa.email ?? ''} onChange={(e) => setNewRisorsa({ ...newRisorsa, email: e.target.value })} /></Col>
        <Col span={5}>
          <Select
            placeholder="Figura"
            value={newRisorsa.figureCode}
            onChange={(v) => setNewRisorsa({ ...newRisorsa, figureCode: v })}
            options={figure.map((f) => ({ label: `${f.code} — ${f.titolo}`, value: f.code }))}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={3}><Button type="primary" icon={<PlusOutlined />} onClick={addRisorsa} block>Aggiungi</Button></Col>
      </Row>
    </div>,

    // Step 3 — Importazione Excel
    <div key="s3" className={styles.stepContent}>
      <Title level={4}>Importazione da file Excel</Title>
      <Paragraph type="secondary">
        Scarica il template, compilalo con i dati delle tue risorse e caricalo. Il file sovrascriverà le risorse inserite manualmente nel passo precedente.
      </Paragraph>
      <Space className={styles.downloadRow}>
        <Button icon={<DownloadOutlined />} onClick={downloadCsvTemplate} size="large">
          Scarica template Excel (.csv)
        </Button>
        <Text type="secondary">Template con colonne: nome, cognome, email, figura_code, devops_username</Text>
      </Space>
      <Divider dashed />
      <Dragger
        accept=".csv,.xlsx,.xls"
        fileList={fileList}
        maxCount={1}
        beforeUpload={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            const parsed = parseCsv(text);
            if (parsed.length > 0) {
              setUploadedResources(parsed);
              antMessage.success(`${parsed.length} risorse importate dal file.`);
            } else {
              antMessage.error('Nessuna risorsa trovata. Verifica il formato del file.');
            }
          };
          reader.readAsText(file);
          setFileList([file as unknown as UploadFile]);
          return false;
        }}
        onRemove={() => { setFileList([]); setUploadedResources(null); }}
        className={styles.dragger}
      >
        <p className={styles.draggerIcon}><DownloadOutlined style={{ fontSize: 32 }} /></p>
        <p>Trascina il file qui o <Text type="secondary">clicca per selezionare</Text></p>
        <p><Text type="secondary" style={{ fontSize: 12 }}>Supporta .csv, .xlsx, .xls — max 5 MB</Text></p>
      </Dragger>
      {uploadedResources && (
        <div className={styles.uploadPreview}>
          <Text strong>Anteprima: {uploadedResources.length} risorse importate</Text>
          <Table
            dataSource={uploadedResources.slice(0, 5)}
            columns={risorseColumns.slice(0, 4)}
            rowKey="id"
            pagination={false}
            size="small"
            className={styles.table}
          />
          {uploadedResources.length > 5 && <Text type="secondary">…e altre {uploadedResources.length - 5} righe</Text>}
        </div>
      )}
    </div>,

    // Step 4 — DevOps Sync
    <div key="s4" className={styles.stepContent}>
      <div className={styles.optionalHeader}>
        <Title level={4}>Sincronizzazione Azure DevOps</Title>
        <Tag color="blue">Opzionale</Tag>
      </div>
      <Paragraph type="secondary">
        Connetti la tua organizzazione Azure DevOps per importare automaticamente progetti, clienti e associare gli utenti tramite username o email.
      </Paragraph>
      {!devopsSynced ? (
        <Form layout="vertical" className={styles.form}>
          <Form.Item label="URL Azure DevOps">
            <Input
              placeholder="https://dev.azure.com/mia-organizzazione"
              value={devopsUrl}
              onChange={(e) => setDevopsUrl(e.target.value)}
              prefix={<CloudSyncOutlined />}
            />
          </Form.Item>
          <Form.Item label="Nome organizzazione DevOps">
            <Input
              placeholder="mia-organizzazione"
              value={devopsOrg}
              onChange={(e) => setDevopsOrg(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Personal Access Token (PAT)">
            <Input.Password placeholder="••••••••••••••••" />
          </Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<CloudSyncOutlined />}
              loading={devopsSyncing}
              onClick={handleDevopsSync}
            >
              {devopsSyncing ? 'Connessione in corso…' : 'Connetti e importa'}
            </Button>
          </Space>
        </Form>
      ) : (
        <div className={styles.syncResult}>
          <div className={styles.syncSuccess}>
            <CheckCircleOutlined className={styles.syncSuccessIcon} />
            <Text strong>Sincronizzazione completata</Text>
          </div>
          <Row gutter={16} className={styles.syncTables}>
            <Col span={12}>
              <Text strong>Progetti importati ({MOCK_DEVOPS_RESULTS.projects.length})</Text>
              <Table
                dataSource={MOCK_DEVOPS_RESULTS.projects}
                columns={[
                  { title: 'Progetto', dataIndex: 'name' },
                  { title: 'Cliente', dataIndex: 'customer' },
                ]}
                rowKey="key"
                pagination={false}
                size="small"
                className={styles.table}
              />
            </Col>
            <Col span={12}>
              <Text strong>Utenti associati ({MOCK_DEVOPS_RESULTS.users.length})</Text>
              <Table
                dataSource={MOCK_DEVOPS_RESULTS.users}
                columns={[
                  { title: 'Nome', dataIndex: 'displayName' },
                  { title: 'Username', dataIndex: 'username' },
                ]}
                rowKey="key"
                pagination={false}
                size="small"
                className={styles.table}
              />
            </Col>
          </Row>
        </div>
      )}
    </div>,
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logoMark}>
            <ThunderboltOutlined />
          </div>
          <div>
            <Title level={2} className={styles.title}>Configura Man-Agent</Title>
            <Text type="secondary">Completamento guidato in {steps.length} passaggi</Text>
          </div>
        </div>

        <Card className={styles.card}>
          <Steps
            current={current}
            items={steps}
            className={styles.steps}
            size="small"
          />

          <div className={styles.stepBody}>
            {stepContent[current]}
          </div>

          <div className={styles.footer}>
            {current > 0 && (
              <Button onClick={() => setCurrent((c) => c - 1)}>Indietro</Button>
            )}
            <div className={styles.footerRight}>
              {current === 4 && !devopsSynced && (
                <Button onClick={handleComplete} className={styles.skipBtn}>
                  Salta e completa
                </Button>
              )}
              {current < steps.length - 1 ? (
                <Button type="primary" onClick={handleNext}>
                  Avanti
                </Button>
              ) : (
                <Button type="primary" onClick={handleComplete} icon={<CheckCircleOutlined />}>
                  Completa configurazione
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
