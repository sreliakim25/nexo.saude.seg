# DEPLOYMENT.md — Deploy no Vercel via GitHub

---

## Visão Geral

```
Desenvolvedor
    │ git push origin main
    ▼
GitHub Repository
    │ Webhook automático
    ▼
GitHub Actions (CI)
    │ npm run lint
    │ npm run type-check
    │ npm run build
    ▼
Vercel (Deploy)
    │ Build + Edge Network
    ▼
https://nexo-saude-saneamento.vercel.app
```

---

## Passo 1 — Preparar o Repositório GitHub

```bash
# Inicializar git (se ainda não feito)
git init
git add .
git commit -m "chore: initial commit — Nexo Saúde & Saneamento"

# Criar repositório no GitHub
# Acessar https://github.com/new
# Nome: nexo-saude-saneamento
# Visibilidade: Private (recomendado para doutorado)

# Conectar ao GitHub
git remote add origin https://github.com/SEU_USUARIO/nexo-saude-saneamento.git
git branch -M main
git push -u origin main
```

### .gitignore obrigatório

```gitignore
# .gitignore
.env.local
.env*.local
node_modules/
.next/
out/
dist/
*.dbc
scripts/etl/venv/
scripts/etl/credentials.json
scripts/etl/.env
public/geojson/pernambuco-municipios.geojson  # arquivo grande
```

---

## Passo 2 — Configurar Vercel

### 2.1 Conectar GitHub ao Vercel

1. Acesse https://vercel.com e faça login com GitHub
2. Clique em **"Add New... → Project"**
3. Selecione o repositório `nexo-saude-saneamento`
4. Configure:
   - **Framework Preset**: `Next.js` (detectado automaticamente)
   - **Root Directory**: `.` (raiz)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (padrão)
   - **Install Command**: `npm install`

### 2.2 Adicionar Variáveis de Ambiente no Vercel

Em **Project Settings → Environment Variables**, adicionar:

```
NEXT_PUBLIC_SUPABASE_URL         = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    = eyJhbG...
SUPABASE_SERVICE_ROLE_KEY        = eyJhbG...
UPSTASH_REDIS_REST_URL           = https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN         = AXxx...
USE_REAL_DATA                    = false
NEXT_PUBLIC_APP_URL              = https://nexo-saude-saneamento.vercel.app
NEXT_PUBLIC_APP_NAME             = Nexo
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` deve ser marcado como **Sensitive** e disponível apenas em **Production** e **Preview**, nunca em ambientes client-side.

### 2.3 Fazer Deploy Inicial

```bash
# Via Vercel CLI (opcional)
npm i -g vercel
vercel login
vercel --prod
```

Ou simplesmente: push para `main` → Vercel detecta e faz deploy automaticamente.

---

## Passo 3 — GitHub Actions (CI/CD)

Criar `.github/workflows/ci.yml`:

```yaml
name: CI — Nexo Saúde & Saneamento

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  # ─── JOB 1: Lint + TypeCheck ──────────────────────────────
  quality:
    name: Code Quality
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npm run type-check

      - name: ESLint
        run: npm run lint

  # ─── JOB 2: Build ─────────────────────────────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: quality

    env:
      # Valores fake apenas para o build passar
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
      UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
      USE_REAL_DATA: 'false'
      NEXT_PUBLIC_APP_URL: 'https://nexo-saude-saneamento.vercel.app'
      NEXT_PUBLIC_APP_NAME: 'Nexo'

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Build Next.js
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: nextjs-build
          path: .next/
          retention-days: 1

  # ─── JOB 3: Deploy (apenas main) ──────────────────────────
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Secrets do GitHub

Em **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Como obter |
|--------|-----------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` após `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` após `vercel link` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `UPSTASH_REDIS_REST_URL` | Upstash → Database → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash → Database → REST API |

```bash
# Obter Vercel IDs
npm i -g vercel
vercel login
vercel link   # Cria .vercel/project.json
cat .vercel/project.json
# { "orgId": "team_xxx", "projectId": "prj_xxx" }
```

---

## Passo 4 — Configuração do Domínio (Opcional)

### Domínio customizado no Vercel

1. Em **Project Settings → Domains**
2. Adicionar domínio: ex. `nexo.rochadev.com.br`
3. Configurar DNS no seu provedor:
   ```
   Tipo: CNAME
   Nome: nexo
   Valor: cname.vercel-dns.com
   ```

---

## Passo 5 — Branches e Ambientes

```
main          → Production    → nexo-saude-saneamento.vercel.app
develop       → Preview       → nexo-develop.vercel.app
feature/*     → Preview       → nexo-feature-xxx.vercel.app
```

### Fluxo de trabalho recomendado

```bash
# Criar feature branch
git checkout -b feature/mapa-calor-pe

# Desenvolver...
git add .
git commit -m "feat: mapa de calor interativo Pernambuco"
git push origin feature/mapa-calor-pe

# Abrir Pull Request no GitHub → Preview deploy automático
# Review e aprovação
# Merge para main → Deploy de produção automático
```

---

## Passo 6 — Monitoramento Pós-Deploy

### Vercel Analytics (gratuito)

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

Instalar:
```bash
npm install @vercel/analytics @vercel/speed-insights
```

### Checklist pós-deploy

```
✓ URL acessível: https://nexo-saude-saneamento.vercel.app
✓ Home carregando corretamente
✓ Dashboard com dados mock visíveis
✓ Mapa de Pernambuco carregando
✓ Gráficos de correlação renderizando
✓ Responsivo mobile OK
✓ PWA instalável (Android: "Adicionar à tela inicial")
✓ Lighthouse Score > 90
✓ Variáveis de ambiente corretas (sem erros 500)
```

### Verificar Lighthouse

```bash
# Instalar Lighthouse CLI
npm install -g lighthouse

# Rodar auditoria
lighthouse https://nexo-saude-saneamento.vercel.app \
  --output=html \
  --output-path=./lighthouse-report.html \
  --chrome-flags="--headless"
```

---

## Scripts de Build

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write 'src/**/*.{ts,tsx}'",
    "analyze": "ANALYZE=true next build",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

---

## Atualizações Futuras

Para atualizar dados após o ETL Python:

```bash
# 1. Rodar ETL com novos dados
cd scripts/etl
python fetch_sinan.py --municipio 2611606 --inicio 2024 --fim 2024

# 2. Invalidar cache Redis (opcional — TTL expira em 1h)
npx ts-node scripts/invalidate-cache.ts

# 3. Não é necessário redeploy — dados vêm do Supabase em tempo real
```

---

*Nexo · Saúde & Saneamento — Deployment v1.0*
