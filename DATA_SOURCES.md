# DATA_SOURCES.md — Fontes de Dados do Nexo

> Mapeamento completo de todas as bases de dados utilizadas: acesso, variáveis, limitações e como integrar.

---

## 1. SINAN — Sistema de Informação de Agravos de Notificação

### Descrição
Registra doenças e agravos de notificação compulsória no Brasil. Principal fonte para doenças relacionadas ao saneamento inadequado.

### Doenças Monitoradas pelo Nexo

| Agravo | Código | Relação com Saneamento |
|--------|--------|----------------------|
| Doenças diarreicas agudas | DIAR | Água contaminada, esgoto |
| Dengue | DENG | Drenagem, águas paradas |
| Leptospirose | LEPT | Drenagem, inundações |
| Hepatite A | HEPA | Água, esgoto |
| Cólera | COLE | Água, esgoto |
| Febre tifoide | FTIF | Água, esgoto |
| Amebíase | — | Água, esgoto |

### Acesso aos Dados

**Opção 1: openDATASUS (recomendado)**
```
URL: https://opendatasus.saude.gov.br
Dataset SINAN: https://opendatasus.saude.gov.br/dataset/sinan
Formato: CSV, JSON (alguns agravos)
Granularidade: Municipal, anual
```

**Opção 2: FTP DATASUS (microdados)**
```
URL: ftp://ftp.datasus.gov.br/dissemin/publicos/SINAN/DADOS/FINAIS/
Formato: .dbc (requer PySUS para ler)
Arquivo: NIND{ANO}.dbc (nacional) ou por estado
```

**Opção 3: PySUS (biblioteca Python)**
```python
from pysus.online_data.SINAN import download

# Lista de agravos disponíveis
from pysus.online_data import SINAN

# Download por agravo e ano
df = download('DENG', 2023)   # Dengue 2023
df = download('DIAR', 2022)   # Diarreia 2022
```

**Opção 4: DATASUS Tabnet (consulta web)**
```
URL: http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sinannet/cnv/denguebr.def
Tabulação manual por estado/município/ano
Exportação em .csv ou .xlsx
```

### Variáveis Relevantes

```python
# Após ler com PySUS, as colunas principais são:
sinan_df.columns:
  'DT_NOTIFIC'    # Data de notificação
  'SG_UF_NOT'     # UF de notificação
  'ID_MUNICIP'    # Código IBGE município (6 dígitos DATASUS, 7 dígitos IBGE)
  'DT_SIN_PRI'    # Data dos primeiros sintomas
  'NU_ANO'        # Ano
  'CS_SEXO'       # Sexo (M/F/I)
  'NU_IDADE_N'    # Idade
  'CS_RACA'       # Raça/cor
  'ID_DISTRIT'    # Distrito/Bairro (quando disponível)
```

### Atenção ao Código IBGE
> ⚠️ DATASUS usa código de **6 dígitos**. IBGE usa **7 dígitos**. Para Caruaru: DATASUS = `261160`, IBGE = `2611606`.

```python
# Converter código DATASUS para IBGE
def datasus_para_ibge(cod_datasus: str) -> str:
    # DATASUS usa código sem o dígito verificador
    # Mapeamento por município necessário ou lookup na tabela
    pass
```

### Limitações
- Dados de diarreia nem sempre são compulsórios em todos os municípios
- Subnotificação estimada em 30–70% para doenças entéricas
- Dados de bairro disponíveis apenas em alguns municípios e anos

---

## 2. SIM — Sistema de Informações sobre Mortalidade

### Descrição
Registra todos os óbitos do Brasil por meio das Declarações de Óbito (DO). Principal fonte para mortalidade geral e infantil.

### Acesso

**openDATASUS:**
```
URL: https://opendatasus.saude.gov.br/dataset/sim
Arquivo: DO_BDD_{ANO}.csv (dados de disseminação)
Granularidade: Municipal, anual
```

**FTP DATASUS (microdados completos):**
```
URL: ftp://ftp.datasus.gov.br/dissemin/publicos/SIM/CID10/DOFET/
Arquivo: DO{UF}{ANO}.dbc (ex: DOPE2023.dbc para PE 2023)
```

**PySUS:**
```python
from pysus.online_data.SIM import download

df = download('PE', 2023)   # Óbitos de PE em 2023
```

### Variáveis Relevantes

```python
sim_df.columns:
  'DTOBITO'       # Data do óbito
  'CODMUNRES'     # Código município de residência (6 dig DATASUS)
  'CODMUNOCI'     # Código município de ocorrência
  'CAUSABAS'      # Causa básica do óbito (CID-10)
  'CAUSABAS_O'    # Causa básica original
  'IDADE'         # Idade codificada
  'SEXO'          # Sexo
  'RACACOR'       # Raça/cor
  'BAIRES'        # Bairro de residência (quando disponível)
```

### CIDs Relacionados ao Saneamento

```python
CIDS_SANEAMENTO = {
  # Doenças diarreicas (A00-A09)
  'A00': 'Cólera',
  'A01': 'Febre tifoide e paratifoide',
  'A02': 'Outras infecções por Salmonella',
  'A03': 'Shigelose',
  'A04': 'Outras infecções intestinais bacterianas',
  'A06': 'Amebíase',
  'A07': 'Outras doenças intestinais por protozoários',
  'A08': 'Infecções intestinais virais',
  'A09': 'Gastroenterite de origem infecciosa presumível',

  # Doenças infecciosas relacionadas
  'A15': 'Tuberculose respiratória',
  'A27': 'Leptospirose',
  'B15': 'Hepatite A aguda',

  # Mortalidade infantil (filtrar IDADE < 1 ano)
  # Código de idade DATASUS: 4xx = anos, 3xx = meses, 2xx = dias
  # Menor de 1 ano: IDADE < 400 OU (IDADE >= 300 AND IDADE < 400) OR ...
}
```

### Cálculo de Mortalidade Infantil

```python
def calcular_mortalidade_infantil(sim_df, sinasc_df, municipio, ano):
    """
    Taxa de Mortalidade Infantil = (óbitos < 1 ano / nascidos vivos) × 1000
    """
    # Óbitos < 1 ano no SIM
    obitos = sim_df[
        (sim_df['CODMUNRES'] == municipio) &
        (sim_df['ano'] == ano) &
        (sim_df['IDADE'] < 400)  # código DATASUS para < 1 ano
    ].shape[0]

    # Nascidos vivos no SINASC
    nascidos = sinasc_df[
        (sinasc_df['CODMUNNASC'] == municipio) &
        (sinasc_df['ano'] == ano)
    ].shape[0]

    if nascidos == 0:
        return None
    return (obitos / nascidos) * 1000
```

---

## 3. SINASC — Sistema de Informações sobre Nascidos Vivos

### Descrição
Registra todos os nascimentos no Brasil por meio das Declarações de Nascido Vivo (DN). Usado para calcular denominadores e indicadores de saúde materno-infantil.

### Acesso

**FTP DATASUS:**
```
URL: ftp://ftp.datasus.gov.br/dissemin/publicos/SINASC/NOV/DORES/
Arquivo: DN{UF}{ANO}.dbc (ex: DNPE2023.dbc)
```

**PySUS:**
```python
from pysus.online_data.SINASC import download

df = download('PE', 2023)
```

### Variáveis Relevantes

```python
sinasc_df.columns:
  'DTNASC'        # Data de nascimento
  'CODMUNNASC'    # Código município de nascimento
  'CODMUNRES'     # Código município de residência da mãe
  'IDADEMAE'      # Idade da mãe
  'ESTCIVMAE'     # Estado civil da mãe
  'ESCMAE'        # Escolaridade da mãe
  'QTDFILVIVO'    # Filhos vivos anteriores
  'GESTACAO'      # Semanas de gestação
  'GRAVIDEZ'      # Tipo de gravidez (única/múltipla)
  'PARTO'         # Tipo de parto (vaginal/cesáreo)
  'CONSULTAS'     # Número de consultas pré-natal
  'PESO'          # Peso ao nascer
  'APGAR1'        # Apgar no 1º minuto
  'APGAR5'        # Apgar no 5º minuto
  'IDANOMAL'      # Anomalia congênita
  'BAIRES'        # Bairro de residência da mãe
```

### Indicadores Calculados pelo Nexo

```python
# 1. % de mães com pré-natal adequado (7+ consultas)
pct_prenatal = (df['CONSULTAS'] >= 7).mean() * 100

# 2. % de nascidos com baixo peso (< 2500g)
pct_baixo_peso = (df['PESO'] < 2500).mean() * 100

# 3. % de partos cesáreos
pct_cesareo = (df['PARTO'] == 2).mean() * 100

# 4. Taxa de nascimentos vivos (base para mortalidade infantil)
total_nascidos = len(df)
```

---

## 4. SNIS — Sistema Nacional de Informações sobre Saneamento

### Descrição
Principal base de dados de investimentos em saneamento básico no Brasil (1995–2023). Substituído pelo SINISA a partir de 2024.

### Acesso

**Opção 1: Série Histórica Web (recomendado)**
```
URL: https://app4.mdr.gov.br/serieHistorica/municipio/index
Formato: Excel (.xlsx) por componente e ano
Código Caruaru: 2611606-6 (com dígito verificador)
```

**Opção 2: Base dos Dados (BigQuery)**
```
Dataset: br_mdr_snis
Tabelas: agua_esgotos, residuos_solidos, drenagem_aguas_pluviais
URL: https://basedosdados.org/dataset/2a543ad8-3cdb-4047-9498-efe7fb8ed697
```

```python
# Via Base dos Dados
from basedosdados import read_sql

query = """
SELECT
  ano,
  id_municipio,
  in_investimento_total_agua as inv_agua,
  in_investimento_total_esgoto as inv_esgoto,
  fn_ag as investimento_total_ag
FROM `basedosdados.br_mdr_snis.agua_esgotos`
WHERE id_municipio = '2611606'
  AND ano BETWEEN 2014 AND 2024
ORDER BY ano
"""
df = read_sql(query, billing_project_id='seu-projeto-gcp')
```

**Opção 3: Download direto Excel (sem conta Google)**
```python
import requests
import pandas as pd

# URL da série histórica (verificar disponibilidade)
url = "https://app4.mdr.gov.br/serieHistorica/..."
response = requests.get(url)
df = pd.read_excel(response.content)
# Filtrar por município
df_caruaru = df[df['Código do Município'] == '2611606']
```

### Componentes do SNIS

| Código | Componente | Indicadores-chave |
|--------|-----------|-------------------|
| `AG` | Abastecimento de Água | `IN_INVESTIMENTO_TOTAL_AGUA`, `IN_EXTENSAO_REDE_AGUA`, `IN_LIGACOES_ATIVAS_AGUA` |
| `ES` | Esgotamento Sanitário | `IN_INVESTIMENTO_TOTAL_ESGOTO`, `IN_EXTENSAO_REDE_ESGOTO`, `IN_EFLUENTE_TRATADO` |
| `RS` | Resíduos Sólidos | `QT_MASSA_COLETADA`, `QT_MUNICIPIOS_ATENDIDOS`, `QT_CAÇAMBAS` |
| `DR` | Drenagem | `QT_MUNICIPIOS_COM_PLANO`, `QT_PMGIRS` |

### Variáveis de Investimento

```python
# Variáveis SNIS para investimento (por componente)
VARIAVEIS_INVESTIMENTO = {
  'AG': [
    'FN_AG',          # Total de investimentos em água
    'FN_AG_FEDERAL',  # Recursos federais
    'FN_AG_ESTADO',   # Recursos estaduais
    'FN_AG_MUNICIPAL',# Recursos municipais
    'FN_AG_EMPRESA',  # Recursos próprios da prestadora
  ],
  'ES': [
    'FN_ES',
    'FN_ES_FEDERAL',
    'FN_ES_ESTADO',
    'FN_ES_MUNICIPAL',
    'FN_ES_EMPRESA',
  ],
  'RS': [
    'QT_RECURSOS_FINANCEIROS',  # Recursos financeiros em RS
  ],
  'DR': [
    # Drenagem tem menos dados de investimento no SNIS
    # Usar dados do Portal da Transparência (emendas)
  ]
}
```

### Limitações do SNIS
- Dados de **drenagem são escassos** no SNIS (voluntário pós 2015)
- Subnotificação de pequenos municípios
- Valores em R$ correntes (requer deflacionamento pelo IPCA para comparação)
- Série histórica disponível de 1995 a 2023; SINISA começa 2024

---

## 5. SINISA — Sistema Nacional de Informações em Saneamento Básico (2024+)

### Descrição
Substituto do SNIS a partir de 2024, com mais componentes, maior abrangência e qualidade de dados melhorada.

### Acesso
```
URL: https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/sinisa
Portal de coleta: https://sinisa.gov.br (em implantação)
```

> ⚠️ Em 2024 o SINISA ainda está em fase de implantação. Para dados históricos, usar SNIS.

---

## 6. Portal da Transparência — Emendas e Convênios

### Descrição
Complementa o SNIS para dados de **drenagem** e recursos federais por emenda parlamentar.

### Acesso via API REST (sem autenticação)

```
Base URL: https://api.portaldatransparencia.gov.br/api-de-dados/
Docs: https://portaldatransparencia.gov.br/api-de-dados
```

```python
import requests

# Convênios de saneamento no município de Caruaru
url = "https://api.portaldatransparencia.gov.br/api-de-dados/convenios"
params = {
    "codigoMunicipio": "2611606",  # Caruaru
    "funcionalProgramatica": "17.512",  # Saneamento urbano
    "ano": "2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024",
    "pagina": 1
}
headers = {"chave-api": "SUA_CHAVE_API"}  # Registro gratuito
response = requests.get(url, params=params, headers=headers)
```

> **Chave API gratuita:** https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email

### Funcionalidades Programáticas de Saneamento
```
17.512 — Saneamento urbano
17.544 — Abastecimento de água
17.543 — Esgotamento sanitário
18.541 — Resíduos sólidos
17.515 — Drenagem urbana
```

---

## 7. Base dos Dados (basedosdados.org)

### Descrição
Organização sem fins lucrativos que trata e disponibiliza dados públicos brasileiros em BigQuery. Excelente para SNIS histórico tratado.

### Datasets Relevantes

```python
# Tabelas disponíveis para o Nexo
datasets = {
  'br_mdr_snis.agua_esgotos':       '1995-2023, por município',
  'br_mdr_snis.residuos_solidos':   '2002-2023, por município',
  'br_ms_sinan.dengue':             '2001-2022, por município',
  'br_ms_sim.microdados':           '1979-2021, por óbito',
  'br_ibge_censo.municipios':       'Censo 2010 e 2022',
  'br_bd_diretorios.municipios':    'Código IBGE + nome',
}
```

### Setup BigQuery

```bash
# Instalar dependências
pip install basedosdados google-cloud-bigquery pandas

# Configurar autenticação Google Cloud
gcloud auth application-default login

# Ou usar service account
export GOOGLE_APPLICATION_CREDENTIALS="./credentials.json"
```

```python
import basedosdados as bd

# Exemplo: SNIS água e esgotos para Caruaru
bd.read_sql("""
    SELECT ano, id_municipio,
           in_investimento_total_agua,
           in_investimento_total_esgoto,
           in_populacao_urbana_atendida_agua,
           in_populacao_atendida_esgoto
    FROM `basedosdados.br_mdr_snis.agua_esgotos`
    WHERE id_municipio = '2611606'
    ORDER BY ano
""", billing_project_id="seu-projeto")
```

---

## Mapeamento de Variáveis para o Nexo

### Schema Final no Supabase

```
ENTRADA (APIs externas) → TRANSFORMAÇÃO (Python ETL) → SAÍDA (Supabase)

SINAN casos_diarreia_anuais
  DT_NOTIFIC + ID_MUNICIP + agravo
  → agregar por ano + município + agravo
  → casos_sinan (municipio_ibge, ano, agravo, total_casos, taxa_incidencia)

SIM obitos_diarreia_anuais
  DTOBITO + CODMUNRES + CAUSABAS
  → filtrar CIDs de saneamento + agregar
  → obitos_sim (municipio_ibge, ano, grupo_cid, total_obitos, taxa_mortalidade)

SIM + SINASC → mortalidade_infantil
  → nascimentos_sinasc (tx_mortalidade_infantil)

SNIS investimentos_anuais
  FN_AG + FN_ES + QT_RECURSOS_RS + (DR estimado)
  → deflacionar pelo IPCA
  → investimentos_saneamento (municipio_ibge, ano, componente, valor_reais)
```

---

## Deflacionamento pelo IPCA

> ⚠️ **Obrigatório** para comparações temporais de investimento. Valores nominais do SNIS são em R$ correntes.

```python
# IPCA acumulado por ano (base 2024 = 100)
IPCA_DEFLATOR = {
  2014: 185.3,
  2015: 175.2,
  2016: 156.3,
  2017: 148.1,
  2018: 142.8,
  2019: 137.4,
  2020: 133.2,
  2021: 122.6,
  2022: 109.4,
  2023: 103.1,
  2024: 100.0,
}

def deflacionar(valor_nominal: float, ano: int, ano_base: int = 2024) -> float:
    """Converte valor nominal para valor real na base especificada."""
    return valor_nominal * (IPCA_DEFLATOR[ano_base] / IPCA_DEFLATOR[ano])
```

---

## Limitações Gerais e Notas Metodológicas

1. **Subnotificação**: SINAN subestima casos reais; análise deve citar este viés
2. **Heterogeneidade**: Qualidade dos dados varia por município e ano
3. **Causalidade**: Correlação não implica causalidade — limitação central do estudo
4. **Lag temporal**: Efeitos do investimento em saneamento podem demorar 3–5 anos para aparecer nos indicadores de saúde
5. **Confundidores**: Renda, educação, densidade habitacional afetam tanto o investimento quanto a saúde
6. **Completude SNIS**: Alguns municípios não reportam ao SNIS todos os anos

---

*Nexo · Saúde & Saneamento — Fontes de Dados v1.0*
