# nexo · Saúde & Saneamento

> **Plataforma de correlação entre investimentos em saneamento básico e indicadores de saúde pública municipal**
> Projeto de Doutorado — Caruaru, Pernambuco, Brasil

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![PWA](https://img.shields.io/badge/PWA-enabled-5c6bc0)](https://web.dev/progressive-web-apps)

---

## Sobre o Projeto

**Nexo** é uma plataforma web acadêmica que responde a uma pergunta central de pesquisa:

> *"Existe correlação estatisticamente significativa entre o volume e a distribuição de investimentos em saneamento básico (água, esgoto, drenagem e resíduos sólidos) e a redução de agravos de saúde pública nos municípios brasileiros?"*

A plataforma integra dados de quatro sistemas governamentais públicos, aplica estatística inferencial (correlação de Pearson, regressão linear, teste t) e apresenta os resultados em dashboards interativos e mapas de calor com drill-down de Brasil → Estado → Município → Bairro.

### Município Piloto
**Caruaru — PE** (Código IBGE: 2611606), com expansão prevista para todos os municípios de Pernambuco e, posteriormente, Brasil.

---

## Fontes de Dados

### Indicadores de Saúde (DATASUS)

| Sistema | Descrição | Portal |
|---------|-----------|--------|
| **SINAN** | Sistema de Informação de Agravos de Notificação | [opendatasus.saude.gov.br](https://opendatasus.saude.gov.br) |
| **SIM** | Sistema de Informações sobre Mortalidade | [opendatasus.saude.gov.br](https://opendatasus.saude.gov.br) |
| **SINASC** | Sistema de Informações sobre Nascidos Vivos | [opendatasus.saude.gov.br](https://opendatasus.saude.gov.br) |

### Investimentos em Saneamento

| Sistema | Descrição | Portal |
|---------|-----------|--------|
| **SNIS** | Sistema Nacional de Informações sobre Saneamento (até 2023) | [gov.br/cidades/snis](https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/snis) |
| **SINISA** | Sistema Nacional de Informações em Saneamento Básico (2024+) | [gov.br/cidades/sinisa](https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/sinisa) |
| **Base dos Dados** | Dados tratados via BigQuery | [basedosdados.org](https://basedosdados.org) |

---

## Funcionalidades

- **🏠 Home** — Apresentação do projeto, métricas nacionais e contexto acadêmico
- **📊 Dashboard** — KPIs de correlação, gráficos temporais e composição de investimentos
- **🗺️ Mapa de Calor** — Drill-down interativo Brasil → PE → Caruaru → Bairros
- **📈 Análise de Correlação** — Scatter plots, regressão linear, R², p-valor e IC95%
- **🏙️ Detalhe do Município** — Perfil completo por município com histórico 10 anos
- **🔍 Filtros Globais** — Por estado, município, tipo de saneamento, período e indicador
- **📱 PWA** — Instalável como app no mobile e desktop
- **📲 Responsivo** — Layout adaptado para web e mobile

---

## Stack Técnica

```
Frontend         Next.js 14 (App Router) + TypeScript + Tailwind CSS
Mapas            React-Leaflet + GeoJSON (OpenStreetMap, gratuito)
Gráficos         Recharts + D3.js
Estatística      simple-statistics (Pearson r, regressão, t-test)
Backend          Next.js API Routes (Serverless Functions)
Banco de Dados   Supabase (PostgreSQL)
Cache            Upstash Redis
ETL de Dados     Python 3.11+ (pandas, pysus, requests)
PWA              next-pwa
Deploy           Vercel
CI/CD            GitHub Actions
```

---

## Início Rápido

### Pré-requisitos

- Node.js 18.17+
- npm 9+ ou pnpm 8+
- Python 3.11+ (para ETL de dados)
- Conta Supabase (gratuita)
- Conta Vercel (gratuita)

### Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/nexo-saude-saneamento.git
cd nexo-saude-saneamento

# 2. Instalar dependências Node
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 4. Aplicar migrações do banco
npx supabase db push

# 5. Semear dados mock (para desenvolvimento)
npx ts-node scripts/seed/seed_database.ts

# 6. Rodar em desenvolvimento
npm run dev
```

Acesse: **http://localhost:3000**

### ETL — Dados Reais (Opcional)

```bash
cd scripts/etl
pip install -r requirements.txt

# Busca dados de Caruaru de 2014 a 2024
python fetch_sinan.py --municipio 2611606 --inicio 2014 --fim 2024
python fetch_sim.py --municipio 2611606 --inicio 2014 --fim 2024
python fetch_sinasc.py --municipio 2611606 --inicio 2014 --fim 2024
python fetch_snis.py --municipio 2611606 --inicio 2014 --fim 2024
```

---

## Documentação Detalhada

| Documento | Descrição |
|-----------|-----------|
| [`CLAUDE.md`](./CLAUDE.md) | Instruções para Claude Code |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Arquitetura técnica completa |
| [`docs/DATA_SOURCES.md`](./docs/DATA_SOURCES.md) | Fontes de dados e variáveis |
| [`docs/SETUP.md`](./docs/SETUP.md) | Instalação e configuração detalhada |
| [`docs/PHASES.md`](./docs/PHASES.md) | Fases do projeto e cronograma |
| [`docs/API_INTEGRATION.md`](./docs/API_INTEGRATION.md) | Integração com APIs do governo |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Deploy no Vercel via GitHub |

---

## Estrutura do Banco de Dados

```sql
-- Tabelas principais
investimentos_saneamento   -- dados SNIS/SINISA por município/ano/componente
casos_sinan                -- notificações SINAN por município/ano/agravo
obitos_sim                 -- óbitos SIM por município/ano/causa
nascimentos_sinasc         -- nascimentos SINASC por município/ano
municipios                 -- tabela de referência geográfica
correlacoes_cache          -- correlações pré-calculadas (cache)
```

---

## Deploy

O projeto está configurado para deploy contínuo no Vercel:

1. Push para `main` → deploy automático em produção
2. Push para outras branches → preview deployments

Veja [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) para configuração completa.

---

## Contribuindo

Este é um projeto de doutorado. Para contribuições, abra uma issue descrevendo a proposta antes de um PR.

---

## Licença

Este projeto é desenvolvido para fins acadêmicos. Os dados utilizados são públicos, disponibilizados pelo Ministério da Saúde e Ministério das Cidades do Brasil, respeitando a Lei Geral de Proteção de Dados (LGPD) — todos os dados são anonimizados e agregados.

---

*Nexo · Saúde & Saneamento — Plataforma Acadêmica de Análise de Dados Públicos*
