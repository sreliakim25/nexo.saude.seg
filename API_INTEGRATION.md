# API_INTEGRATION.md — Integração com APIs do Governo

---

## Visão Geral

O Nexo usa uma **estratégia híbrida** para acessar dados públicos:

```
ESTRATÉGIA PRIMÁRIA:    PySUS (Python) → Supabase    [ETL periódico]
ESTRATÉGIA SECUNDÁRIA:  openDATASUS REST API          [quando disponível]
ESTRATÉGIA FALLBACK:    Base dos Dados (BigQuery)     [dados tratados]
```

> **Para desenvolvimento e demo**: usar dados mock em `/src/data/mock/`
> **Para produção com dados reais**: executar ETL Python e setar `USE_REAL_DATA=true`

---

## 1. PySUS — Acesso ao FTP DATASUS

PySUS é a forma mais confiável de acessar dados SINAN, SIM e SINASC.

### Instalação

```bash
pip install pysus
```

### Como funciona

```
PySUS conecta ao FTP do DATASUS
  ftp://ftp.datasus.gov.br/dissemin/publicos/
  ├── SINAN/DADOS/FINAIS/    ← SINAN
  ├── SIM/CID10/DOFET/       ← SIM
  └── SINASC/NOV/DORES/      ← SINASC

Baixa arquivos .dbc (formato proprietário DATASUS)
Converte .dbc → pandas DataFrame
```

### Exemplo SINAN com PySUS

```python
# scripts/etl/fetch_sinan.py
import pandas as pd
from pysus.online_data.SINAN import download
import argparse
from utils.database import upsert_supabase
from utils.transform import calcular_taxa_incidencia

AGRAVOS_MAPEADOS = {
    'DIAR': 'diarreia',
    'DENG': 'dengue',
    'LEPT': 'leptospirose',
    'HEPA': 'hepatite_a',
    'FTIF': 'febre_tifoide',
}

def fetch_sinan(municipio_ibge: str, ano_inicio: int, ano_fim: int):
    resultados = []

    for ano in range(ano_inicio, ano_fim + 1):
        for codigo_agravo, nome_agravo in AGRAVOS_MAPEADOS.items():
            print(f"Baixando SINAN {nome_agravo} {ano}...")

            try:
                df = download(codigo_agravo, ano)

                # Converter código DATASUS (6 dig) para IBGE (7 dig)
                # DATASUS usa os 6 primeiros dígitos do IBGE
                codigo_datasus = municipio_ibge[:6]
                df_mun = df[df['ID_MUNICIP'] == codigo_datasus]

                total_casos = len(df_mun)
                if total_casos == 0:
                    continue

                # Calcular taxa de incidência (por 100.000 hab)
                populacao = obter_populacao(municipio_ibge, ano)
                taxa = (total_casos / populacao) * 100000 if populacao else None

                resultados.append({
                    'municipio_ibge': municipio_ibge,
                    'ano': ano,
                    'agravo': nome_agravo,
                    'total_casos': total_casos,
                    'taxa_incidencia': round(taxa, 2) if taxa else None,
                })

            except Exception as e:
                print(f"  ⚠️  Erro ao baixar {codigo_agravo} {ano}: {e}")
                continue

    # Inserir no Supabase
    upsert_supabase('casos_sinan', resultados)
    print(f"✅ SINAN: {len(resultados)} registros inseridos")
    return resultados


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--municipio', required=True, help='Código IBGE (7 dígitos)')
    parser.add_argument('--inicio', type=int, required=True)
    parser.add_argument('--fim', type=int, required=True)
    args = parser.parse_args()

    fetch_sinan(args.municipio, args.inicio, args.fim)
```

### Exemplo SIM com PySUS

```python
# scripts/etl/fetch_sim.py
from pysus.online_data.SIM import download
import pandas as pd

# CIDs relacionados ao saneamento
CIDS_SANEAMENTO = ['A00','A01','A02','A03','A04','A06','A07','A08','A09','A27','B15']

def fetch_sim(uf: str, municipio_ibge: str, ano_inicio: int, ano_fim: int):
    resultados = []

    for ano in range(ano_inicio, ano_fim + 1):
        print(f"Baixando SIM {uf} {ano}...")

        try:
            df = download(uf, ano)

            # Filtrar por município de residência
            codigo_datasus = municipio_ibge[:6]
            df_mun = df[df['CODMUNRES'] == codigo_datasus].copy()

            # Filtrar por CIDs de saneamento
            df_san = df_mun[df_mun['CAUSABAS'].str[:3].isin(CIDS_SANEAMENTO)]

            # Mortalidade infantil (< 1 ano)
            # Código DATASUS: 4xx = anos, 301-311 = meses, 201-230 = dias, 100-120 = horas
            df_infantil = df_mun[df_mun['IDADE'] < 400]

            # Agrupar por causa
            for cid in CIDS_SANEAMENTO:
                obitos_cid = len(df_san[df_san['CAUSABAS'].str[:3] == cid])
                if obitos_cid > 0:
                    resultados.append({
                        'municipio_ibge': municipio_ibge,
                        'ano': ano,
                        'grupo_cid': cid,
                        'total_obitos': obitos_cid,
                    })

            # Mortalidade infantil
            resultados.append({
                'municipio_ibge': municipio_ibge,
                'ano': ano,
                'grupo_cid': 'INFANTIL',
                'total_obitos': len(df_infantil),
            })

        except Exception as e:
            print(f"  ⚠️  Erro ao baixar SIM {uf} {ano}: {e}")

    upsert_supabase('obitos_sim', resultados)
    return resultados
```

---

## 2. openDATASUS REST API

O openDATASUS disponibiliza alguns datasets via API REST com CKAN.

### Endpoint Base
```
https://opendatasus.saude.gov.br/api/3/action/
```

### Exemplos de Uso

```python
import requests

# Listar datasets disponíveis
r = requests.get(
    "https://opendatasus.saude.gov.br/api/3/action/package_list"
)
datasets = r.json()['result']

# Buscar dataset do SIM
r = requests.get(
    "https://opendatasus.saude.gov.br/api/3/action/package_show",
    params={"id": "sim"}
)
info = r.json()['result']

# Baixar recurso CSV do SIM
# URL obtida do package_show → resources → url
csv_url = "https://opendatasus.saude.gov.br/dataset/.../resource/.../download/DO_BDD_2023.csv"
df = pd.read_csv(csv_url, encoding='latin1', sep=';')
```

> ⚠️ Nem todos os datasets têm API completa. O SINAN tem acesso via API apenas para dados de notificação COVID/e-SUS. Para demais agravos, usar PySUS (FTP).

---

## 3. SNIS / SINISA — Série Histórica

### Opção A: Download Excel (mais simples)

```python
# scripts/etl/fetch_snis.py
import requests
import pandas as pd
import io
from utils.database import upsert_supabase

def fetch_snis_excel(municipio_ibge: str, ano_inicio: int, ano_fim: int):
    """
    SNIS não tem API REST pública.
    Baixa a série histórica do portal.
    """
    resultados = []

    for ano in range(ano_inicio, min(ano_fim + 1, 2024)):  # SNIS vai até 2023
        url = f"https://app4.mdr.gov.br/serieHistorica/municipio/index"

        # Nota: SNIS exige navegação web / POST form
        # Alternativa: usar Base dos Dados via BigQuery
        # Alternativa: baixar Excel completo e filtrar localmente
        pass

    return resultados


def fetch_snis_base_dos_dados(municipio_ibge: str, ano_inicio: int, ano_fim: int):
    """
    Alternativa via Base dos Dados (requer conta GCP gratuita).
    Dados já tratados e padronizados.
    """
    import basedosdados as bd

    query = f"""
    SELECT
      ano,
      id_municipio,
      -- Água
      fn_ag                         AS inv_agua_total,
      fn_ag_capital                 AS inv_agua_capital,
      fn_ag_custeio                 AS inv_agua_custeio,
      in_populacao_urbana_atendida_agua AS pop_atendida_agua_pct,
      -- Esgoto
      fn_es                         AS inv_esgoto_total,
      fn_es_capital                 AS inv_esgoto_capital,
      in_coleta_esgoto              AS coleta_esgoto_pct,
      in_tratamento_esgoto          AS tratamento_esgoto_pct
    FROM `basedosdados.br_mdr_snis.agua_esgotos`
    WHERE id_municipio = '{municipio_ibge}'
      AND ano BETWEEN {ano_inicio} AND {ano_fim}
    ORDER BY ano
    """

    df = bd.read_sql(query, billing_project_id="seu-projeto-gcp")

    resultados = []
    for _, row in df.iterrows():
        for componente, valor_col in [('AG', 'inv_agua_total'), ('ES', 'inv_esgoto_total')]:
            if pd.notna(row[valor_col]) and row[valor_col] > 0:
                resultados.append({
                    'municipio_ibge': municipio_ibge,
                    'ano': int(row['ano']),
                    'componente': componente,
                    'valor_reais': float(row[valor_col]),
                    'fonte': 'SNIS',
                })

    upsert_supabase('investimentos_saneamento', resultados)
    return resultados
```

### Opção B: Portal da Transparência (Convênios)

```python
def fetch_transparencia_convenios(municipio_ibge: str, anos: list):
    """
    Complementa SNIS com dados de convênios federais.
    Útil especialmente para Drenagem (DR) que SNIS não cobre bem.
    """
    headers = {"chave-api": "SUA_CHAVE_API_TRANSPARENCIA"}

    # Funções programáticas de saneamento
    funcoes = {
        '17.512': 'saneamento_urbano',
        '17.544': 'agua',
        '17.543': 'esgoto',
        '18.541': 'residuos_solidos',
        '17.515': 'drenagem',
    }

    resultados = []
    for ano in anos:
        for funcao_cod, componente_nome in funcoes.items():
            url = "https://api.portaldatransparencia.gov.br/api-de-dados/convenios"
            params = {
                "codigoMunicipio": municipio_ibge[:6],
                "funcionalProgramatica": funcao_cod,
                "ano": str(ano),
                "pagina": 1,
                "tamanhoPagina": 200,
            }

            r = requests.get(url, params=params, headers=headers)
            data = r.json()

            total_valor = sum(item.get('valorConvenio', 0) for item in data)
            if total_valor > 0:
                resultados.append({
                    'municipio_ibge': municipio_ibge,
                    'ano': ano,
                    'componente': mapear_componente(funcao_cod),
                    'valor_reais': total_valor,
                    'fonte': 'TRANSPARENCIA',
                })

    return resultados
```

---

## 4. API IBGE — Municípios e População

### Malha Municipal (GeoJSON)

```python
# Pernambuco municípios
url = "https://servicodados.ibge.gov.br/api/v3/malhas/estados/26?resolucao=2&formato=application/vnd.geo+json"
response = requests.get(url)
geojson = response.json()
# Salvar em public/geojson/pernambuco-municipios.geojson
```

### Dados de população (Projeções)

```python
# Projeção populacional por município
url = f"https://servicodados.ibge.gov.br/api/v1/projecoes/populacao/{municipio_ibge}"
response = requests.get(url)
# Nota: disponível para estados; para municípios usar Censo 2022
```

### Censo 2022 via Base dos Dados

```python
query = """
SELECT id_municipio, populacao
FROM `basedosdados.br_ibge_censo_demografico.municipio_2022`
WHERE id_municipio = '2611606'
"""
```

---

## 5. Implementação das API Routes do Next.js

### `/api/sinan`

```typescript
// src/app/api/sinan/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getCached } from '@/lib/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const QuerySchema = z.object({
  municipio: z.string().length(7).regex(/^\d+$/, 'Código IBGE inválido'),
  anoInicio: z.coerce.number().int().min(2000).max(2030),
  anoFim: z.coerce.number().int().min(2000).max(2030),
  agravo: z.string().optional(),
})

export async function GET(req: NextRequest) {
  // 1. Validar parâmetros
  const parsed = QuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  )
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const { municipio, anoInicio, anoFim, agravo } = parsed.data
  const cacheKey = `api:sinan:${municipio}:${anoInicio}:${anoFim}:${agravo ?? 'all'}`

  // 2. Tentar cache
  const dados = await getCached(cacheKey, async () => {
    let query = supabase
      .from('casos_sinan')
      .select('*')
      .eq('municipio_ibge', municipio)
      .gte('ano', anoInicio)
      .lte('ano', anoFim)
      .order('ano', { ascending: true })

    if (agravo) {
      query = query.eq('agravo', agravo)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
  }, 3600) // TTL 1 hora

  return NextResponse.json(dados)
}
```

### `/api/correlacao`

```typescript
// src/app/api/correlacao/route.ts
import { calcularCorrelacaoPearson, calcularRegressao } from '@/lib/statistics'

export async function GET(req: NextRequest) {
  const { municipio, anoInicio, anoFim, componente, indicador } =
    QuerySchemaCorrelacao.parse(Object.fromEntries(req.nextUrl.searchParams))

  // Buscar séries temporais
  const [investimentos, indicadores] = await Promise.all([
    getInvestimentos(municipio, anoInicio, anoFim, componente),
    getIndicadores(municipio, anoInicio, anoFim, indicador),
  ])

  // Alinhar séries pelo ano
  const anosComuns = investimentos.map(i => i.ano).filter(
    ano => indicadores.some(d => d.ano === ano)
  )

  const x = anosComuns.map(ano => investimentos.find(i => i.ano === ano)!.valor)
  const y = anosComuns.map(ano => indicadores.find(d => d.ano === ano)!.valor)

  // Calcular correlação
  const correlacao = calcularCorrelacaoPearson(x, y)
  const regressao = calcularRegressao(x, y)

  return NextResponse.json({
    pearsonR: correlacao.r,
    rQuadrado: correlacao.r2,
    pValor: correlacao.pValor,
    significativo: correlacao.pValor < 0.05,
    interpretacao: correlacao.interpretacao,
    regressao: {
      coeficienteAngular: regressao.m,
      intercepto: regressao.b,
      ic95Inferior: regressao.ic95[0],
      ic95Superior: regressao.ic95[1],
    },
    series: {
      anos: anosComuns,
      investimentos: x,
      indicadores: y,
      fitted: anosComuns.map(ano => regressao.m * x[anosComuns.indexOf(ano)] + regressao.b),
    },
    n: anosComuns.length,
  })
}
```

---

## 6. Utilitário de Banco (Python ETL)

```python
# scripts/etl/utils/database.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.environ['SUPABASE_URL'],
            os.environ['SUPABASE_SERVICE_KEY']
        )
    return _client


def upsert_supabase(tabela: str, dados: list[dict]) -> None:
    """
    Insere ou atualiza registros no Supabase.
    Usa upsert para evitar duplicatas.
    """
    if not dados:
        print(f"  Nenhum dado para inserir em {tabela}")
        return

    client = get_supabase()

    # Upsert em lotes de 100
    for i in range(0, len(dados), 100):
        lote = dados[i:i+100]
        result = client.table(tabela).upsert(lote).execute()
        print(f"  ✓ {tabela}: {len(lote)} registros (lote {i//100 + 1})")
```

---

## 7. Configuração de Chaves e Tokens

### Chave da API Portal da Transparência (gratuita)

1. Acessar: https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email
2. Inserir e-mail
3. Receber chave por e-mail em instantes
4. Adicionar ao `.env`: `TRANSPARENCIA_API_KEY=sua_chave`

### Base dos Dados BigQuery (gratuita para pesquisa)

1. Criar projeto no GCP: https://console.cloud.google.com
2. Habilitar BigQuery API
3. Criar service account com role `BigQuery Data Viewer`
4. Baixar JSON de credenciais
5. Salvar em `scripts/etl/credentials.json`
6. Adicionar ao `.env`: `GOOGLE_APPLICATION_CREDENTIALS=./credentials.json`

---

*Nexo · Saúde & Saneamento — API Integration v1.0*
