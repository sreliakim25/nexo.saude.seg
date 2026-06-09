# CLAUDE.md — Nexo · Saúde & Saneamento

> Este arquivo instrui o Claude Code sobre o projeto, convenções e fluxo de trabalho.
> Leia completamente antes de qualquer ação.

---

## 🧠 Contexto do Projeto

**Nexo** é uma plataforma web de análise acadêmica (projeto de doutorado) que correlaciona investimentos em saneamento básico com indicadores de saúde pública nos municípios brasileiros.

- **Município piloto**: Caruaru, Pernambuco
- **Público-alvo**: Pesquisadores acadêmicos e gestores municipais de saúde
- **Finalidade**: Evidenciar correlações estatísticas entre investimento em saneamento e redução de doenças/mortalidade
- **Horizonte temporal**: 10 anos de dados

### Fontes de Dados
| Sistema | Tipo | Acesso |
|---------|------|--------|
| SINAN (DATASUS) | Agravos notificáveis | openDATASUS / API |
| SIM (DATASUS) | Mortalidade | openDATASUS / FTP |
| SINASC (DATASUS) | Nascidos vivos | openDATASUS / FTP |
| SNIS/SINISA | Investimentos em saneamento | gov.br + basedosdados.org |

---

## 🛠️ Stack Técnica

```
Frontend:   Next.js 14 (App Router) + TypeScript + Tailwind CSS
Mapas:      React-Leaflet + GeoJSON (sem API key externa)
Gráficos:   Recharts + D3.js
Estatística: simple-statistics (r de Pearson, regressão, p-valor)
Backend:    Next.js API Routes (Serverless)
Banco:      Supabase (PostgreSQL)
Cache:      Upstash Redis
ETL:        Python 3.11+ (pandas, pysus, requests)
PWA:        next-pwa
Deploy:     Vercel (via GitHub)
```

---

## 📁 Estrutura de Pastas

```
nexo-saude-saneamento/
├── CLAUDE.md               ← este arquivo
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
│
├── docs/                   ← documentação técnica
│   ├── ARCHITECTURE.md
│   ├── DATA_SOURCES.md
│   ├── SETUP.md
│   ├── PHASES.md
│   ├── API_INTEGRATION.md
│   └── DEPLOYMENT.md
│
├── public/
│   ├── manifest.json       ← PWA manifest
│   ├── icons/              ← PWA icons (192, 512)
│   └── geojson/
│       ├── brazil-states.geojson
│       ├── pernambuco-municipios.geojson
│       └── caruaru-bairros.geojson
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  ← Home/Landing
│   │   ├── dashboard/page.tsx        ← Dashboard principal
│   │   ├── mapa/page.tsx             ← Mapa de calor
│   │   ├── correlacao/page.tsx       ← Análise estatística
│   │   ├── municipio/[id]/page.tsx   ← Detalhe do município
│   │   └── api/
│   │       ├── sinan/route.ts
│   │       ├── sim/route.ts
│   │       ├── sinasc/route.ts
│   │       └── snis/route.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileHeader.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── charts/
│   │   │   ├── TrendChart.tsx
│   │   │   ├── CorrelationScatter.tsx
│   │   │   ├── InvestmentBar.tsx
│   │   │   └── GaugeChart.tsx
│   │   ├── map/
│   │   │   ├── HeatMap.tsx
│   │   │   ├── MapControls.tsx
│   │   │   └── MunicipalityPopup.tsx
│   │   ├── cards/
│   │   │   ├── KPICard.tsx
│   │   │   └── StatCard.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Select.tsx
│   │       ├── Badge.tsx
│   │       └── Skeleton.tsx
│   │
│   ├── lib/
│   │   ├── datasus.ts          ← cliente da API DATASUS
│   │   ├── snis.ts             ← cliente SNIS/SINISA
│   │   ├── statistics.ts       ← funções estatísticas (r, p, regressão)
│   │   ├── supabase.ts         ← cliente Supabase
│   │   └── cache.ts            ← helpers de cache Redis
│   │
│   ├── types/
│   │   ├── sinan.ts
│   │   ├── sim.ts
│   │   ├── sinasc.ts
│   │   ├── snis.ts
│   │   └── filters.ts
│   │
│   ├── hooks/
│   │   ├── useFilters.ts
│   │   ├── useMapData.ts
│   │   └── useCorrelation.ts
│   │
│   └── data/
│       └── mock/
│           ├── caruaru.json
│           └── pernambuco.json
│
├── scripts/
│   ├── etl/
│   │   ├── fetch_sinan.py
│   │   ├── fetch_sim.py
│   │   ├── fetch_sinasc.py
│   │   └── fetch_snis.py
│   └── seed/
│       └── seed_database.ts
│
└── supabase/
    └── migrations/
        ├── 001_create_tables.sql
        ├── 002_create_indexes.sql
        └── 003_seed_mock_data.sql
```

---

## ⚙️ Comandos Essenciais

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar ETL de dados (Python)
cd scripts/etl
pip install -r requirements.txt
python fetch_sinan.py --municipio 2611606 --anos 2014-2024
python fetch_sim.py --municipio 2611606 --anos 2014-2024
python fetch_sinasc.py --municipio 2611606 --anos 2014-2024
python fetch_snis.py --municipio 2611606 --anos 2014-2024

# Seed do banco com dados mock
npx ts-node scripts/seed/seed_database.ts

# Rodar migrações Supabase
npx supabase db push
```

---

## 🔑 Variáveis de Ambiente Necessárias

Crie um arquivo `.env.local` na raiz com:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Upstash Redis (cache)
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# DATASUS (quando disponível, requer cadastro de IP)
DATASUS_API_USER=seu_login
DATASUS_API_TOKEN=seu_token

# Ambiente
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗺️ Convenções de Código

### TypeScript
- Sempre tipar props de componentes com `interface`, não `type`
- Usar `async/await`, nunca `.then().catch()` em cadeia
- Exportar componentes como `export default function NomeComponente`
- Nunca usar `any` — use `unknown` e narrowing

### React / Next.js
- App Router obrigatório (não usar Pages Router)
- Componentes de servidor por padrão; `'use client'` apenas quando necessário
- Dados server-side via `async` components ou API Routes
- Loading states com `<Suspense>` + Skeleton components
- Erros com `error.tsx` por segmento de rota

### Tailwind CSS
- Não criar classes CSS custom se Tailwind resolver
- Design tokens em `tailwind.config.js` (cores, fontes)
- Mobile-first: `sm:`, `md:`, `lg:` para telas maiores
- Dark mode é o padrão (fundo escuro)

### Componentes de Mapa (React-Leaflet)
- Sempre importar dinamicamente com `dynamic()` e `ssr: false`
- GeoJSON local em `/public/geojson/`
- Evitar carregar GeoJSON inteiro do Brasil — usar somente o estado relevante

### API Routes
- Sempre validar inputs com `zod`
- Retornar erros padronizados: `{ error: string, code: number }`
- Cache de respostas pesadas com Redis (TTL: 1h para dados históricos)

---

## 📊 Lógica de Negócio Central

### Cálculo de Correlação
O coeficiente de Pearson entre investimento total em saneamento e indicador de saúde:

```typescript
// src/lib/statistics.ts
import { sampleCorrelation } from 'simple-statistics'

export function calcularCorrelacaoPearson(
  investimentos: number[],  // série temporal de investimentos
  indicadores: number[]     // série temporal do indicador de saúde
): { r: number; r2: number; pValor: number; interpretacao: string } {
  // séries devem ter mesmo comprimento
  const r = sampleCorrelation(investimentos, indicadores)
  const r2 = r ** 2
  // p-valor via t-test com n-2 graus de liberdade
  const n = investimentos.length
  const t = r * Math.sqrt((n - 2) / (1 - r * r))
  // ... usar distribuição t de Student
  return { r, r2, pValor, interpretacao }
}
```

### Indicadores Monitorados

| Indicador | Fonte | Relação com Saneamento |
|-----------|-------|----------------------|
| Taxa de incidência de diarreias | SINAN | Direta (água/esgoto) |
| Casos de leptospirose | SINAN | Direta (drenagem) |
| Hepatite A | SINAN | Direta (água/esgoto) |
| Mortalidade infantil (/1000 NV) | SIM + SINASC | Indireta |
| Mortalidade por doenças infecciosas | SIM | Direta |
| Nascidos de mães sem pré-natal | SINASC | Indiretor contextual |

### Componentes de Saneamento (SNIS/SINISA)
- `AG` → Água (abastecimento)
- `ES` → Esgoto (esgotamento sanitário)
- `RS` → Resíduos sólidos
- `DR` → Drenagem e águas pluviais

---

## 🧩 Comportamento de Dados

### Dados Mock vs. Reais
- O sistema inicia com **dados mock** em `/src/data/mock/`
- A flag `USE_REAL_DATA=true` no `.env.local` ativa as APIs reais
- Todos os hooks devem suportar ambos os modos transparentemente

```typescript
// Exemplo de hook com fallback para mock
export function useCorrelacaoDados(filtros: Filtros) {
  if (process.env.USE_REAL_DATA !== 'true') {
    return { data: mockData.caruaru, loading: false }
  }
  // fetch real...
}
```

### Granularidade Geográfica
O sistema suporta drill-down em 4 níveis:
1. `BRASIL` — visão nacional (estados)
2. `ESTADO` — ex: Pernambuco (municípios)
3. `MUNICÍPIO` — ex: Caruaru (indicadores consolidados)
4. `BAIRRO` — ex: Salgado, Rendeiras (quando dado disponível)

O filtro global `FiltersContext` controla o nível ativo e é lido por todos os componentes.

---

## 🚫 O que NÃO fazer

- Não usar `localStorage` para estado de filtros — usar URL params (`useSearchParams`)
- Não importar Leaflet direto no servidor — sempre `dynamic(() => import(...), { ssr: false })`
- Não fazer fetch de dados no cliente para dados grandes — usar API Routes com cache
- Não hardcodar código IBGE de municípios — usar tabela `municipios` no Supabase
- Não pular validação de entrada nas API Routes
- Não commitar o arquivo `.env.local`

---

## 📌 Referências Rápidas

- Código IBGE de Caruaru: `2611606`
- Código IBGE de Pernambuco: `26`
- DATASUS Tabnet: http://tabnet.datasus.gov.br
- openDATASUS: https://opendatasus.saude.gov.br
- SNIS Série Histórica: https://app4.mdr.gov.br/serieHistorica
- Base dos Dados (BigQuery): https://basedosdados.org
- Docs Next.js App Router: https://nextjs.org/docs/app
- Docs Supabase: https://supabase.com/docs

---

*Versão: 1.0 | Projeto de Doutorado — Nexo Saúde & Saneamento | Caruaru, PE*
