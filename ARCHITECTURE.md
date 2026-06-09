# ARCHITECTURE.md — Arquitetura Técnica do Nexo

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIO FINAL                           │
│              (Pesquisador / Gestor Municipal)                    │
└─────────────────────┬───────────────────────────────────────────┘
                       │  HTTPS
┌─────────────────────▼───────────────────────────────────────────┐
│                    VERCEL (CDN + Serverless)                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              NEXT.JS 14 (App Router)                    │    │
│  │                                                         │    │
│  │  ┌───────────────────┐  ┌───────────────────────────┐  │    │
│  │  │   Server          │  │   Client Components        │  │    │
│  │  │   Components      │  │   (React + Recharts +      │  │    │
│  │  │   (RSC)           │  │    React-Leaflet)           │  │    │
│  │  └─────────┬─────────┘  └───────────────────────────┘  │    │
│  │            │                                             │    │
│  │  ┌─────────▼──────────────────────────────────────┐    │    │
│  │  │          API ROUTES (Serverless Functions)      │    │    │
│  │  │  /api/sinan   /api/sim   /api/sinasc   /api/snis│    │    │
│  │  └─────────┬──────────────────────────────────────┘    │    │
│  └────────────┼────────────────────────────────────────────┘    │
└───────────────┼─────────────────────────────────────────────────┘
                │
    ┌───────────┴─────────────────────────────────┐
    │                                             │
┌───▼──────────────┐                 ┌────────────▼──────────────┐
│  SUPABASE        │                 │  UPSTASH REDIS            │
│  (PostgreSQL)    │                 │  (Cache Layer)            │
│                  │                 │                           │
│  • investimentos │                 │  • Respostas de API (1h)  │
│  • casos_sinan   │                 │  • Correlações (24h)      │
│  • obitos_sim    │                 │  • GeoJSON simplificado   │
│  • nascimentos   │                 │                           │
│  • municipios    │                 └───────────────────────────┘
│  • correlacoes   │
└──────────────────┘
                │ (ETL — Scripts Python, execução periódica)
┌───────────────▼───────────────────────────────────────────────┐
│                    FONTES DE DADOS PÚBLICOS                    │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │   DATASUS    │  │   SNIS/SINISA│  │  Base dos Dados    │  │
│  │   (FTP/API)  │  │   (Excel/    │  │  (BigQuery)        │  │
│  │              │  │    Portal)   │  │                    │  │
│  │  SINAN + SIM │  │  AG+ES+RS+DR │  │  Dados tratados    │  │
│  │  + SINASC    │  │              │  │                    │  │
│  └──────────────┘  └──────────────┘  └────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## Camadas da Aplicação

### 1. Camada de Apresentação (Frontend)

**Next.js 14 App Router** com dois tipos de componentes:

#### Server Components (padrão)
Usados para:
- Buscar dados iniciais no servidor
- Renderizar conteúdo estático
- Evitar waterfalls de dados no cliente

```typescript
// app/dashboard/page.tsx — Server Component
export default async function DashboardPage({ searchParams }) {
  const filtros = parseFiltros(searchParams)
  const dados = await getDashboardData(filtros)  // fetch server-side
  return <DashboardClient dadosIniciais={dados} filtros={filtros} />
}
```

#### Client Components (`'use client'`)
Usados para:
- Gráficos interativos (Recharts)
- Mapa Leaflet
- Filtros e estado local
- Animações

```typescript
// src/components/charts/TrendChart.tsx — Client Component
'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
```

---

### 2. Camada de API (Serverless Functions)

Cada rota de API no Next.js vira uma Serverless Function no Vercel:

```typescript
// app/api/sinan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { redis } from '@/lib/cache'
import { supabase } from '@/lib/supabase'

const querySchema = z.object({
  municipio: z.string().length(7),
  anoInicio: z.coerce.number().min(2000).max(2030),
  anoFim: z.coerce.number().min(2000).max(2030),
  agravo: z.string().optional(),
})

export async function GET(req: NextRequest) {
  // 1. Validar parâmetros
  const params = querySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams)
  )

  // 2. Tentar cache Redis
  const cacheKey = `sinan:${JSON.stringify(params)}`
  const cached = await redis.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  // 3. Buscar no Supabase
  const { data, error } = await supabase
    .from('casos_sinan')
    .select('*')
    .eq('municipio_ibge', params.municipio)
    .gte('ano', params.anoInicio)
    .lte('ano', params.anoFim)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 4. Salvar no cache (1 hora)
  await redis.set(cacheKey, data, { ex: 3600 })

  return NextResponse.json(data)
}
```

---

### 3. Camada de Dados (Supabase)

#### Schema do Banco de Dados

```sql
-- Tabela de referência geográfica
CREATE TABLE municipios (
  id SERIAL PRIMARY KEY,
  codigo_ibge VARCHAR(7) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  populacao INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investimentos em saneamento (SNIS/SINISA)
CREATE TABLE investimentos_saneamento (
  id SERIAL PRIMARY KEY,
  municipio_ibge VARCHAR(7) REFERENCES municipios(codigo_ibge),
  ano SMALLINT NOT NULL,
  componente VARCHAR(2) NOT NULL, -- AG, ES, RS, DR
  valor_reais DECIMAL(15,2) NOT NULL,
  valor_per_capita DECIMAL(10,2),
  fonte VARCHAR(10) DEFAULT 'SNIS', -- SNIS ou SINISA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(municipio_ibge, ano, componente)
);

-- Casos notificados SINAN
CREATE TABLE casos_sinan (
  id SERIAL PRIMARY KEY,
  municipio_ibge VARCHAR(7) REFERENCES municipios(codigo_ibge),
  ano SMALLINT NOT NULL,
  agravo VARCHAR(50) NOT NULL, -- diarreia, dengue, leptospirose, etc.
  total_casos INTEGER NOT NULL,
  taxa_incidencia DECIMAL(10,2), -- por 100.000 hab
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(municipio_ibge, ano, agravo)
);

-- Óbitos SIM
CREATE TABLE obitos_sim (
  id SERIAL PRIMARY KEY,
  municipio_ibge VARCHAR(7) REFERENCES municipios(codigo_ibge),
  ano SMALLINT NOT NULL,
  grupo_cid VARCHAR(10) NOT NULL, -- A00-A09, B15, A27, etc.
  total_obitos INTEGER NOT NULL,
  taxa_mortalidade DECIMAL(10,4), -- por 100.000 hab
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(municipio_ibge, ano, grupo_cid)
);

-- Nascimentos SINASC
CREATE TABLE nascimentos_sinasc (
  id SERIAL PRIMARY KEY,
  municipio_ibge VARCHAR(7) REFERENCES municipios(codigo_ibge),
  ano SMALLINT NOT NULL,
  total_nascidos INTEGER NOT NULL,
  obitos_infantis INTEGER, -- menores de 1 ano (do SIM)
  tx_mortalidade_infantil DECIMAL(10,4), -- por 1.000 NV
  pct_pre_natal_adequado DECIMAL(5,2), -- % com 7+ consultas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(municipio_ibge, ano)
);

-- Cache de correlações calculadas
CREATE TABLE correlacoes_cache (
  id SERIAL PRIMARY KEY,
  municipio_ibge VARCHAR(7),
  componente VARCHAR(2), -- AG, ES, RS, DR, ou NULL (todos)
  indicador VARCHAR(50), -- diarreia, mortalidade_infantil, etc.
  periodo_inicio SMALLINT,
  periodo_fim SMALLINT,
  pearson_r DECIMAL(5,4),
  r_quadrado DECIMAL(5,4),
  p_valor DECIMAL(8,6),
  n_amostras SMALLINT,
  calculado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(municipio_ibge, componente, indicador, periodo_inicio, periodo_fim)
);
```

---

### 4. Camada de Cache (Upstash Redis)

Estratégia de cache por tipo de dado:

| Tipo de Dado | Chave Redis | TTL |
|---|---|---|
| Dados históricos SINAN | `sinan:{municipio}:{inicio}:{fim}` | 1h |
| Dados históricos SIM | `sim:{municipio}:{inicio}:{fim}` | 1h |
| Dados históricos SNIS | `snis:{municipio}:{inicio}:{fim}` | 1h |
| Correlações calculadas | `corr:{municipio}:{comp}:{ind}` | 24h |
| GeoJSON estados | `geojson:estados` | 7d |
| GeoJSON PE municípios | `geojson:pe:municipios` | 7d |
| Lista de municípios | `municipios:{uf}` | 7d |

```typescript
// src/lib/cache.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCached<T>(
  key: string,
  fallback: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  try {
    const cached = await redis.get<T>(key)
    if (cached !== null) return cached
  } catch { /* ignore cache miss */ }

  const fresh = await fallback()
  await redis.set(key, fresh, { ex: ttlSeconds }).catch(() => {})
  return fresh
}
```

---

### 5. Camada ETL (Scripts Python)

Os scripts Python rodam de forma assíncrona, fora do Next.js:

```
scripts/etl/
├── fetch_sinan.py      Baixa dados SINAN via PySUS (FTP DATASUS)
├── fetch_sim.py        Baixa dados SIM via PySUS
├── fetch_sinasc.py     Baixa dados SINASC via PySUS
├── fetch_snis.py       Baixa dados SNIS/SINISA via Excel/BigQuery
└── utils/
    ├── database.py     Helper para inserir no Supabase
    ├── dbc_parser.py   Parseia arquivos .dbc do DATASUS
    └── transform.py    Transformações e cálculos de taxa
```

**Fluxo ETL:**
```
FTP DATASUS / Portal SINISA
        ↓
  Download .dbc / Excel
        ↓
  PySUS / Pandas parse
        ↓
  Filtra município + período
        ↓
  Calcula taxas e indicadores
        ↓
  Upsert no Supabase
        ↓
  Invalida cache Redis
        ↓
  Dashboard atualizado
```

---

## Rotas da Aplicação

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/` | Page | Home / Landing |
| `/dashboard` | Page | Dashboard principal |
| `/mapa` | Page | Mapa de calor |
| `/correlacao` | Page | Análise estatística |
| `/municipio/[id]` | Page | Detalhe do município |
| `/api/sinan` | API Route | Dados SINAN filtrados |
| `/api/sim` | API Route | Dados SIM filtrados |
| `/api/sinasc` | API Route | Dados SINASC filtrados |
| `/api/snis` | API Route | Dados SNIS/SINISA filtrados |
| `/api/correlacao` | API Route | Cálculo de correlação |
| `/api/municipios` | API Route | Lista de municípios |

---

## Fluxo de Dados no Frontend

```
URL SearchParams (filtros)
      ↓
FiltersContext (estado global)
      ↓
┌────────────────────────────────────┐
│  Componentes que consomem filtros  │
│                                    │
│  FilterBar ←→ FiltersContext       │
│  TrendChart → useQuery('/api/...')  │
│  HeatMap → useMapData()            │
│  CorrelationScatter → useCorr()    │
│  KPICards → useQuery('/api/...')   │
└────────────────────────────────────┘
      ↓
API Routes → Supabase → Redis cache
```

---

## Decisões de Arquitetura

### Por que Next.js App Router?
- Server Components para fetch inicial sem waterfall
- API Routes integradas (sem backend separado)
- Deploy Vercel nativo e otimizado
- Suporte a PWA via next-pwa

### Por que Supabase?
- PostgreSQL nativo (queries complexas para correlações)
- Row Level Security (futuro: multi-tenancy por município)
- API REST e Realtime prontos
- Tier gratuito generoso para projeto acadêmico

### Por que React-Leaflet + OpenStreetMap?
- Completamente gratuito (sem chave de API)
- GeoJSON local (sem custo de tiles extras)
- Controle total sobre a visualização
- Drill-down customizável

### Por que simple-statistics?
- Implementação confiável em JS (sem servidor Python para estatística)
- Pearson, regressão, t-test, IC95% disponíveis
- Cálculos no servidor (API Route) para não sobrecarregar o cliente

### Por que Redis (Upstash)?
- Dados históricos raramente mudam (SNIS é anual)
- Evita hits desnecessários no Supabase
- Respostas de correlação são custosas de recalcular
- Tier gratuito Upstash suficiente para MVP

---

*Nexo · Saúde & Saneamento — Arquitetura v1.0*
