# SETUP.md — Instalação e Configuração do Nexo

---

## Pré-requisitos

| Ferramenta | Versão mínima | Download |
|-----------|--------------|----------|
| Node.js | 18.17.0 | https://nodejs.org |
| npm | 9.0.0 | (vem com Node.js) |
| Git | 2.40+ | https://git-scm.com |
| Python | 3.11+ | https://python.org (ETL apenas) |
| VS Code | Qualquer | https://code.visualstudio.com |

### Extensões VS Code recomendadas
```
dbaeumer.vscode-eslint
esbenp.prettier-vscode
bradlc.vscode-tailwindcss
prisma.prisma
ms-python.python
```

---

## Passo 1 — Clonar e Instalar

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/nexo-saude-saneamento.git
cd nexo-saude-saneamento

# Instalar dependências Node.js
npm install

# Verificar instalação
npm run type-check   # deve passar sem erros
```

---

## Passo 2 — Configurar Supabase

### 2.1 Criar projeto

1. Acesse https://supabase.com e faça login
2. Clique em **"New Project"**
3. Configure:
   - **Name**: `nexo-saude-saneamento`
   - **Database Password**: escolha uma senha forte (anote!)
   - **Region**: `South America (São Paulo)` — `sa-east-1`
4. Aguarde ~2 minutos para o projeto ser criado

### 2.2 Obter credenciais

Em **Settings → API**:
- Copie `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
- Copie `anon public` key → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copie `service_role` key → será `SUPABASE_SERVICE_ROLE_KEY`

### 2.3 Aplicar o schema

**Opção A: Via Supabase Dashboard (mais simples)**
1. Acesse **SQL Editor** no painel Supabase
2. Cole e execute cada arquivo em ordem:
   - `supabase/migrations/001_create_tables.sql`
   - `supabase/migrations/002_create_indexes.sql`
   - `supabase/migrations/003_seed_mock_data.sql`

**Opção B: Via Supabase CLI**
```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Vincular ao projeto (obter PROJECT_REF em Settings → General)
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrações
supabase db push
```

---

## Passo 3 — Configurar Upstash Redis

### 3.1 Criar banco Redis

1. Acesse https://upstash.com e faça login (gratuito)
2. Clique em **"Create Database"**
3. Configure:
   - **Name**: `nexo-cache`
   - **Type**: Regional
   - **Region**: `São Paulo`
4. Clique em **"Create"**

### 3.2 Obter credenciais

Na página do banco criado:
- Copie `UPSTASH_REDIS_REST_URL`
- Copie `UPSTASH_REDIS_REST_TOKEN`

---

## Passo 4 — Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local
```

Editar `.env.local`:

```env
# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# UPSTASH REDIS (cache)
# ============================================
UPSTASH_REDIS_REST_URL=https://us1-xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...

# ============================================
# DADOS (true = APIs reais | false = dados mock)
# ============================================
USE_REAL_DATA=false

# ============================================
# DATASUS (somente se USE_REAL_DATA=true)
# Requer cadastro em datasus.saude.gov.br
# ============================================
# DATASUS_API_USER=seu_login
# DATASUS_API_TOKEN=seu_token

# ============================================
# APP
# ============================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Nexo
```

---

## Passo 5 — Semear Dados Mock

```bash
# Popular banco com dados fictícios realistas de Caruaru
npx ts-node scripts/seed/seed_database.ts

# Saída esperada:
# ✓ Inserindo município Caruaru (2611606)
# ✓ Inserindo 44 registros de investimento (2014-2024 × 4 componentes)
# ✓ Inserindo 77 registros SINAN (2014-2024 × 7 agravos)
# ✓ Inserindo 55 registros SIM (2014-2024 × 5 grupos CID)
# ✓ Inserindo 11 registros SINASC (2014-2024)
# ✓ Inserindo dados de municípios PE para o mapa (184 municípios)
# ✅ Seed completo!
```

---

## Passo 6 — Baixar GeoJSON

Os arquivos GeoJSON são grandes e não estão no repositório Git.

```bash
# Executar script de download
node scripts/download-geojson.js

# Ou baixar manualmente:

# Brasil (estados)
curl -L "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson" \
  -o public/geojson/brazil-states.geojson

# Pernambuco (municípios) - IBGE
# Acessar: https://www.ibge.gov.br/geociencias/downloads
# Malha Municipal Digital → PE → baixar shapefile → converter para GeoJSON
# Ou usar: https://servicodados.ibge.gov.br/api/v3/malhas/estados/26?resolucao=2&formato=application/vnd.geo+json
curl "https://servicodados.ibge.gov.br/api/v3/malhas/estados/26?resolucao=2&formato=application/vnd.geo+json" \
  -o public/geojson/pernambuco-municipios.geojson
```

---

## Passo 7 — Rodar em Desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

### Verificações

```
✓ Home carregando com título "Nexo · Saúde & Saneamento"
✓ Sidebar visível com itens de navegação
✓ Dashboard carregando dados mock de Caruaru
✓ Gráficos renderizando (TrendChart, InvestmentBar, GaugeChart)
✓ Mapa abrindo com Pernambuco centralizado
✓ Mobile responsivo (teste em < 768px)
```

---

## Passo 8 — ETL de Dados Reais (Opcional)

> Apenas necessário quando `USE_REAL_DATA=true`. Para desenvolvimento, use os dados mock.

```bash
# Criar ambiente virtual Python
cd scripts/etl
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis Python
cp .env.example .env
# Editar scripts/etl/.env

# Executar ETL completo para Caruaru (2014-2024)
python fetch_sinan.py --municipio 2611606 --inicio 2014 --fim 2024
python fetch_sim.py --uf PE --municipio 2611606 --inicio 2014 --fim 2024
python fetch_sinasc.py --uf PE --municipio 2611606 --inicio 2014 --fim 2024
python fetch_snis.py --municipio 2611606 --inicio 2014 --fim 2024
```

> ⚠️ O ETL pode demorar 30–60 minutos dependendo da conexão (arquivos .dbc são grandes).

---

## Comandos de Desenvolvimento

```bash
# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Rodar build de produção local
npm run start

# Verificar tipos TypeScript
npm run type-check

# Linting
npm run lint

# Formatar código
npm run format

# Testar
npm run test

# Ver bundle size
npm run analyze
```

---

## Solução de Problemas

### Erro: "Module not found: leaflet"
```bash
npm install leaflet react-leaflet @types/leaflet
```
Verificar se o componente do mapa usa `dynamic(() => ..., { ssr: false })`.

### Erro: "NEXT_PUBLIC_SUPABASE_URL is not defined"
Verificar se `.env.local` existe e contém as variáveis corretas.
Reiniciar `npm run dev` após editar `.env.local`.

### Mapa não carregando tiles
Verificar conexão de internet. OpenStreetMap é externo e gratuito.

### Dados mock não aparecendo
```bash
# Re-rodar seed
npx ts-node scripts/seed/seed_database.ts

# Verificar no Supabase Dashboard → Table Editor
# Tabela investimentos_saneamento deve ter 44 linhas
```

### Erro de build: "window is not defined"
Leaflet usa `window`. Verificar se está importado com `ssr: false`:
```typescript
const HeatMap = dynamic(() => import('@/components/map/HeatMap'), { ssr: false })
```

---

*Nexo · Saúde & Saneamento — Setup v1.0*
