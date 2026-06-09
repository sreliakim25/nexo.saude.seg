# PHASES.md — Fases do Projeto Nexo

> Roteiro completo de desenvolvimento em 6 fases progressivas, do setup inicial ao deploy.

---

## Visão Geral das Fases

```
FASE 1  │  Setup & Base do Projeto          (Semana 1)
FASE 2  │  Banco de Dados & Dados Mock      (Semana 1–2)
FASE 3  │  Layout, Navegação & Home         (Semana 2)
FASE 4  │  Dashboard & Gráficos             (Semana 3)
FASE 5  │  Mapa de Calor Interativo         (Semana 3–4)
FASE 6  │  Análise Estatística              (Semana 4)
FASE 7  │  ETL — Dados Reais                (Semana 5)
FASE 8  │  PWA, Performance & Deploy        (Semana 5–6)
```

---

## FASE 1 — Setup & Base do Projeto

### Objetivo
Inicializar o repositório, configurar a stack e garantir que o ambiente de desenvolvimento está funcional.

### Tarefas

**1.1 Criar projeto Next.js**
```bash
npx create-next-app@latest nexo-saude-saneamento \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

**1.2 Instalar dependências**
```bash
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  react-leaflet \
  leaflet \
  @types/leaflet \
  recharts \
  d3 \
  @types/d3 \
  simple-statistics \
  @upstash/redis \
  @upstash/ratelimit \
  zod \
  clsx \
  tailwind-merge \
  lucide-react \
  next-pwa \
  date-fns \
  axios
```

**1.3 Configurar Tailwind com design tokens**

Editar `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#060F20',
          surface: '#0C1B35',
          card: '#0F2142',
          hover: '#162B55',
        },
        accent: {
          primary: '#00C9A7',
          secondary: '#3A7BF7',
          glow: 'rgba(0,201,167,0.15)',
        },
        status: {
          alert: '#FF6B35',
          warning: '#FFB940',
          success: '#4CAF82',
        },
        text: {
          primary: '#E4EEF8',
          secondary: '#89A8C2',
          muted: '#4A6480',
        },
        border: 'rgba(255,255,255,0.07)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
    },
  },
  plugins: [],
}
```

**1.4 Configurar next.config.js**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['openstreetmap.org'],
  },
}

module.exports = withPWA(nextConfig)
```

**1.5 Criar arquivos de tipos base**
- `src/types/sinan.ts`
- `src/types/sim.ts`
- `src/types/sinasc.ts`
- `src/types/snis.ts`
- `src/types/filters.ts`
- `src/types/municipio.ts`

**1.6 Criar FiltersContext**
```typescript
// src/contexts/FiltersContext.tsx
'use client'
import { createContext, useContext, useState } from 'react'

interface Filtros {
  estado: string          // ex: 'PE'
  municipio: string       // ex: '2611606'
  componente: string[]    // ex: ['AG', 'ES', 'RS', 'DR']
  indicador: string       // ex: 'casos_diarreia'
  anoInicio: number       // ex: 2014
  anoFim: number          // ex: 2024
  nivel: 'brasil' | 'estado' | 'municipio' | 'bairro'
}
```

**Entregáveis:**
- [ ] Repositório GitHub criado e configurado
- [ ] Next.js rodando em `localhost:3000`
- [ ] Tailwind com design tokens aplicados
- [ ] Estrutura de pastas criada
- [ ] Types base definidos

---

## FASE 2 — Banco de Dados & Dados Mock

### Objetivo
Configurar o Supabase, criar o schema do banco de dados, e popular com dados fictícios realistas de Caruaru para desenvolvimento.

### Tarefas

**2.1 Criar projeto no Supabase**
- Acessar https://supabase.com
- Criar projeto: `nexo-saude-saneamento`
- Copiar `SUPABASE_URL` e `ANON_KEY` para `.env.local`

**2.2 Executar migrações**
```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

As migrações estão em `supabase/migrations/`:
- `001_create_tables.sql` — schema completo
- `002_create_indexes.sql` — índices de performance
- `003_seed_mock_data.sql` — dados fictícios de Caruaru

**2.3 Criar cliente Supabase**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**2.4 Criar dados mock realistas**

Criar `src/data/mock/caruaru.json` com:
- Investimentos anuais 2014–2024 por componente (AG, ES, RS, DR)
- Casos SINAN anuais (diarreia, leptospirose, hepatite A, dengue)
- Óbitos SIM anuais por causa
- Nascimentos SINASC anuais
- Dados por bairro de Caruaru (6–8 bairros representativos)

**2.5 Criar seed script**
```bash
npx ts-node scripts/seed/seed_database.ts
```

**Entregáveis:**
- [ ] Schema Supabase criado
- [ ] Dados mock de Caruaru inseridos
- [ ] Cliente Supabase configurado
- [ ] API Routes retornando dados mock funcionais

---

## FASE 3 — Layout, Navegação & Home

### Objetivo
Construir o layout base do app (sidebar + mobile header), criar a tela Home/Landing e configurar a navegação entre telas.

### Tarefas

**3.1 Layout raiz (app/layout.tsx)**
- Sidebar fixa no desktop (240px)
- Mobile header com hamburger (oculta sidebar)
- FiltersContext envolvendo toda a aplicação
- Fontes Google: Space Grotesk, Inter, JetBrains Mono

**3.2 Sidebar (src/components/layout/Sidebar.tsx)**
Itens de navegação:
```
🏠  Início
📊  Dashboard
🗺️  Mapa de Calor
📈  Correlações
🏙️  Municípios
⚙️  Configurações
```

**3.3 Tela Home (app/page.tsx)**

Seções da Home:
1. **Hero** — Logo animado, tagline, CTA "Explorar Dados"
2. **Contadores animados** — Municípios analisados, anos de dados, indicadores monitorados
3. **Sobre o Projeto** — Texto acadêmico, hipótese central
4. **Fontes de Dados** — Cards com SINAN, SIM, SINASC, SNIS
5. **Preview do Dashboard** — Screenshot/mockup do dashboard
6. **Call to action** — Botão para entrar no sistema

**3.4 Boas-vindas ao sistema**
Mensagem na Home:
> *"Bem-vindo ao Nexo — a plataforma que conecta saneamento e saúde.*
> *Explore correlações entre investimentos em água, esgoto, drenagem e resíduos sólidos com os indicadores de saúde pública do seu município."*

**3.5 Mobile responsivo**
- Sidebar oculta em mobile (toggle com hamburger)
- Bottom navigation em mobile (Home, Dashboard, Mapa, Correlações)
- Todos os cards e gráficos adaptados para telas < 768px

**Entregáveis:**
- [ ] Sidebar funcional (desktop + mobile)
- [ ] Home completa com todas as seções
- [ ] Navegação entre telas funcionando
- [ ] Totalmente responsivo mobile

---

## FASE 4 — Dashboard Principal & Gráficos

### Objetivo
Construir o Dashboard principal com filtros globais, KPI cards e os 4 gráficos de análise temporal.

### Tarefas

**4.1 FilterBar (src/components/layout/FilterBar.tsx)**

Filtros disponíveis:
```
[Estado: Pernambuco ▼] [Município: Caruaru ▼] [Componente: Todos ▼]
[Indicador: Diarreias ▼] [Período: 2014–2024 ▼] [Nível: Município ▼]
```

- Todos os filtros controlam `FiltersContext`
- URL params sincronizados: `/dashboard?estado=PE&municipio=2611606&...`
- Dropdowns com busca para municípios

**4.2 KPI Cards (src/components/cards/KPICard.tsx)**

4 cards no topo:
1. **Total Investido** — R$ 340,8 M (10 anos)
2. **Redução de Casos** — -61,8% (casos SINAN)
3. **Correlação de Pearson** — r = -0,94 (forte negativa)
4. **Mortalidade Infantil** — 9,8 / 1000 NV (2024)

Cada card com: valor principal, variação vs. ano anterior, ícone, cor de status.

**4.3 Gráfico 1 — Tendência Temporal (TrendChart.tsx)**

Gráfico de linhas com dois eixos Y:
- Eixo esquerdo: Investimento total (R$ milhões) — linha verde
- Eixo direito: Casos de doenças — linha laranja
- Área sombreada de confiança
- Tooltip com todos os valores do ano

```typescript
// Dados esperados
interface TrendDataPoint {
  ano: number
  investimentoTotal: number
  investimentoAgua: number
  investimentoEsgoto: number
  investimentoDrenagem: number
  investimentoRS: number
  casosSinan: number
  obitosSim: number
  mortalidadeInfantil: number
}
```

**4.4 Gráfico 2 — Barras de Composição (InvestmentBar.tsx)**

Barras empilhadas por ano mostrando a composição do investimento:
- Água (azul)
- Esgoto (teal)
- Drenagem (amarelo)
- Resíduos Sólidos (verde)

**4.5 Gráfico 3 — Gauge de Correlação (GaugeChart.tsx)**

Velocímetro mostrando o coeficiente de Pearson atual:
- -1.0 a -0.7: Correlação forte negativa (verde = bom sinal)
- -0.7 a -0.4: Correlação moderada
- -0.4 a 0: Correlação fraca
- 0 a 1: Correlação positiva (vermelho = preocupante)

**4.6 Tabela de Indicadores**

Tabela por bairro de Caruaru com colunas:
- Bairro, Investimento/hab, Casos/1000 hab, Mortalidade, Índice Nexo

**Entregáveis:**
- [ ] FilterBar funcional com contexto global
- [ ] 4 KPI Cards animados
- [ ] TrendChart com dados 10 anos
- [ ] InvestmentBar empilhado
- [ ] GaugeChart de correlação
- [ ] Tabela de bairros

---

## FASE 5 — Mapa de Calor Interativo

### Objetivo
Construir o mapa de calor interativo com drill-down Brasil → Pernambuco → Caruaru → Bairros, usando React-Leaflet com GeoJSON local.

### Tarefas

**5.1 Baixar e preparar GeoJSON**

Fontes para os GeoJSON:
- Brasil (estados): https://github.com/codeforamerica/click_that_hood/tree/master/public/data
- Pernambuco (municípios): IBGE https://www.ibge.gov.br/geociencias/downloads
- Caruaru (bairros): OpenStreetMap / Prefeitura de Caruaru

Colocar em:
```
public/geojson/
├── brazil-states.geojson          (~500KB)
├── pernambuco-municipios.geojson  (~2MB)
└── caruaru-bairros.geojson        (~200KB)
```

**5.2 Componente HeatMap (src/components/map/HeatMap.tsx)**

```typescript
// Importação dinâmica OBRIGATÓRIA (sem SSR)
const HeatMap = dynamic(
  () => import('@/components/map/HeatMap'),
  { ssr: false, loading: () => <MapSkeleton /> }
)
```

Funcionalidades do mapa:
- Camada de fundo: OpenStreetMap (gratuito)
- Coloração por índice de risco (verde → amarelo → vermelho)
- Hover: tooltip com nome e índice
- Clique: drill-down para o próximo nível
- Controles: zoom, legenda, seletor de indicador
- Legenda explicativa com escala de cores

**5.3 Escala de cores do mapa**

```
Índice Nexo (0–100):
  0–20  → Verde escuro    (#006400) — melhor situação
  21–40 → Verde claro     (#4CAF82)
  41–60 → Amarelo         (#FFB940)
  61–80 → Laranja         (#FF6B35)
  81–100 → Vermelho       (#D32F2F) — pior situação
```

**5.4 Lógica de drill-down**

```
NÍVEL 1: Brasil
  → Exibe círculos nos estados
  → Clique em PE: vai para NÍVEL 2

NÍVEL 2: Pernambuco
  → Exibe polígonos dos municípios
  → Dados fictícios para todos os municípios PE
  → Caruaru em destaque
  → Clique em Caruaru: vai para NÍVEL 3

NÍVEL 3: Caruaru
  → Exibe polígonos dos bairros
  → Clique no bairro: abre painel lateral

PAINEL LATERAL: Detalhes
  → Investimento por componente
  → Casos por agravo
  → Evolução temporal mini-chart
```

**5.5 Painel lateral de detalhes (MunicipalityPopup.tsx)**

Ao clicar em um município/bairro, abre painel com:
- Nome e código IBGE
- Índice Nexo e classificação
- Mini-gráfico de tendência (sparkline)
- Investimento total e por componente
- Top 3 agravos

**Entregáveis:**
- [ ] GeoJSON dos 3 níveis baixados e otimizados
- [ ] Mapa Leaflet funcional
- [ ] Coloração por índice de risco
- [ ] Drill-down Brasil → PE → Caruaru → Bairro
- [ ] Painel lateral de detalhes
- [ ] Legendas e controles

---

## FASE 6 — Análise Estatística (Inferencial)

### Objetivo
Implementar a engine de análise estatística com correlação de Pearson, regressão linear simples e múltipla, teste t e visualizações de inferência.

### Tarefas

**6.1 Biblioteca de Estatística (src/lib/statistics.ts)**

Implementar usando `simple-statistics`:

```typescript
import {
  sampleCorrelation,
  linearRegression,
  linearRegressionLine,
  rSquared,
} from 'simple-statistics'

// Correlação de Pearson com p-valor
export function pearsonCorrelation(x: number[], y: number[]): CorrelationResult

// Regressão linear simples
export function simpleLinearRegression(x: number[], y: number[]): RegressionResult

// Regressão linear múltipla (por componente)
export function multipleRegression(X: number[][], y: number[]): MultipleRegressionResult

// Intervalo de confiança 95%
export function confidenceInterval95(r: number, n: number): [number, number]

// Interpretação textual do r de Pearson
export function interpretarCorrelacao(r: number): string
```

**6.2 Tela de Análise (app/correlacao/page.tsx)**

Seções:
1. **Resumo Estatístico** — r, R², p-valor, n amostras
2. **Scatter Plot Principal** — Investimento vs. Casos
3. **Linha de Regressão** — com IC95% sombreado
4. **Correlação por Componente** — heatmap 4x N (componente x agravo)
5. **Série Temporal de Resíduos** — verificação de homocedasticidade
6. **Interpretação Textual Automática** — explicação gerada automaticamente

**6.3 Scatter Plot com Regressão (CorrelationScatter.tsx)**

```typescript
// Dados esperados
interface ScatterPoint {
  ano: number
  investimento: number  // eixo X
  indicador: number     // eixo Y
  municipio: string
}
```

- Ponto por ano/município
- Linha de regressão ajustada (vermelho/laranja)
- Banda de IC 95% (área sombreada)
- R² exibido no gráfico
- Tooltip com detalhes do ponto

**6.4 Correlação por Componente (CorrelationHeatmap.tsx)**

Matriz de correlação:
```
              │ Diarreia │ Leptospirose │ Hepatite A │ Mortalidade Infantil
─────────────────────────────────────────────────────────────────────────
Água (AG)     │  -0.94   │    -0.82     │   -0.89    │      -0.91
Esgoto (ES)   │  -0.91   │    -0.88     │   -0.93    │      -0.87
Drenagem (DR) │  -0.72   │    -0.95     │   -0.61    │      -0.68
Resíduos (RS) │  -0.65   │    -0.71     │   -0.58    │      -0.72
```

Coloração: vermelho (r positivo) → branco (r≈0) → verde (r negativo)

**6.5 Interpretação Automática**

```typescript
function gerarInterpretacao(resultado: AnaliseCompleta): string {
  // Gera texto acadêmico automaticamente com:
  // - Força da correlação
  // - Significância estatística (p < 0.001)
  // - Comparação entre componentes
  // - Limitações do estudo
}
```

**Entregáveis:**
- [ ] statistics.ts com todas as funções
- [ ] Tela de correlação completa
- [ ] Scatter plot com regressão e IC95%
- [ ] Heatmap de correlações por componente
- [ ] Interpretação textual automática

---

## FASE 7 — ETL: Dados Reais do Governo

### Objetivo
Implementar os scripts Python de extração, transformação e carga dos dados reais das APIs/portais do governo.

### Tarefas

**7.1 Script SINAN (scripts/etl/fetch_sinan.py)**

```python
# Fontes de dados SINAN:
# 1. openDATASUS: https://opendatasus.saude.gov.br/dataset/sinan
# 2. FTP DATASUS: ftp://ftp.datasus.gov.br/dissemin/publicos/SINAN/
# 3. PySUS: biblioteca Python que acessa FTP DATASUS

import pysus
from pysus.online_data.SINAN import download

# Doenças monitoradas
AGRAVOS = {
  'DIARREIA': 'DIAR',
  'DENGUE': 'DENG',
  'LEPTOSPIROSE': 'LEPT',
  'HEPATITE_A': 'HEPA',
  'COLERA': 'COLE',
}

def fetch_sinan(municipio_ibge: str, ano_inicio: int, ano_fim: int):
    # Baixa dados do FTP DATASUS via PySUS
    # Filtra pelo município
    # Agrega por ano e agravo
    # Salva em CSV e insere no Supabase
    pass
```

**7.2 Script SIM (scripts/etl/fetch_sim.py)**

```python
# Fontes de dados SIM:
# FTP: ftp://ftp.datasus.gov.br/dissemin/publicos/SIM/
# Arquivo: DOUF{UF}{ANO}.dbc (ex: DOPE2023.dbc)

def fetch_sim(uf: str, municipio_ibge: str, anos: list):
    # Baixa .dbc via PySUS
    # Filtra por município e CIDs relacionados ao saneamento
    # CIDs: A00-A09 (doenças diarreicas), A27 (leptospirose), etc.
    # Agrega mortalidade infantil (menores de 1 ano)
    pass
```

**7.3 Script SINASC (scripts/etl/fetch_sinasc.py)**

```python
# Fontes de dados SINASC:
# FTP: ftp://ftp.datasus.gov.br/dissemin/publicos/SINASC/

def fetch_sinasc(uf: str, municipio_ibge: str, anos: list):
    # Baixa .dbc via PySUS
    # Calcula: total nascidos, % parto adequado, anomalias
    pass
```

**7.4 Script SNIS/SINISA (scripts/etl/fetch_snis.py)**

```python
# SNIS não tem API REST; dados disponíveis em:
# 1. app4.mdr.gov.br/serieHistorica (série histórica em Excel)
# 2. basedosdados.org (BigQuery - tratado)
# 3. SINISA (2024+): portal.sinisa.gov.br

def fetch_snis(municipio_ibge: str, anos: list):
    # Opção A: Download da série histórica Excel + parse pandas
    # Opção B: Base dos Dados via BigQuery API
    # Filtra por município
    # Extrai: investimentos AG, ES, RS, DR
    pass
```

**7.5 requirements.txt**
```
pysus>=0.9.0
pandas>=2.0.0
requests>=2.31.0
openpyxl>=3.1.0
google-cloud-bigquery>=3.0.0
python-dotenv>=1.0.0
supabase>=1.0.0
tqdm>=4.0.0
```

**7.6 Variáveis de ambiente Python**
```env
# .env (scripts/etl/)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...
BIGQUERY_PROJECT_ID=seu-projeto-gcp  # Para Base dos Dados
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

**Entregáveis:**
- [ ] fetch_sinan.py funcional
- [ ] fetch_sim.py funcional
- [ ] fetch_sinasc.py funcional
- [ ] fetch_snis.py funcional
- [ ] Dados reais de Caruaru 2014–2024 no Supabase
- [ ] Comparação mock vs. real validada

---

## FASE 8 — PWA, Performance & Deploy

### Objetivo
Configurar o app como PWA instalável, otimizar performance e fazer deploy no Vercel via GitHub.

### Tarefas

**8.1 Configurar PWA**

Criar `public/manifest.json`:
```json
{
  "name": "Nexo — Saúde & Saneamento",
  "short_name": "Nexo",
  "description": "Correlação entre saneamento e saúde pública",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#060F20",
  "theme_color": "#00C9A7",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**8.2 Service Worker (next-pwa)**
- Cache de dados históricos (TTL 24h)
- Modo offline: últimos dados carregados ficam disponíveis
- Push notifications: alertas de novos dados (futuro)

**8.3 Otimizações de Performance**
- Code splitting por rota (automático no Next.js)
- Lazy loading de gráficos (`React.lazy` + `Suspense`)
- GeoJSON simplificado para mobile (< 300KB)
- Imagens otimizadas com `next/image`
- Cache Redis para respostas pesadas (TTL 1h)
- `stale-while-revalidate` para dados de indicadores

**8.4 Deploy no Vercel**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy de preview
vercel

# Deploy de produção
vercel --prod
```

**8.5 Configurar GitHub Actions**

Criar `.github/workflows/deploy.yml`:
```yaml
name: Deploy Nexo

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  deploy:
    needs: lint
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Entregáveis:**
- [ ] PWA instalável (manifest + service worker)
- [ ] Lighthouse Score > 90 (Performance, Acessibilidade, PWA)
- [ ] Deploy automático no Vercel
- [ ] GitHub Actions com lint + deploy
- [ ] URL pública do projeto

---

## Checklist Final de Qualidade

### Funcional
- [ ] Todos os filtros funcionam e persistem na URL
- [ ] Drill-down do mapa funciona nos 3 níveis
- [ ] Gráficos renderizam corretamente no mobile
- [ ] Dados mock e dados reais são intercambiáveis
- [ ] App funciona offline (últimos dados carregados)

### Técnico
- [ ] Zero erros TypeScript (`npm run type-check`)
- [ ] Zero warnings ESLint (`npm run lint`)
- [ ] Build de produção sem erros (`npm run build`)
- [ ] Todas as API Routes validam entrada com Zod
- [ ] Cache Redis funcionando

### Acadêmico
- [ ] Correlação de Pearson calculada corretamente
- [ ] p-valor interpretado corretamente (< 0.05 = significativo)
- [ ] Limitações do estudo documentadas na tela de análise
- [ ] Fontes de dados citadas em cada visualização

---

*Nexo · Saúde & Saneamento — Roteiro de Desenvolvimento v1.0*
