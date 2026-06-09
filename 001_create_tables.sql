-- ============================================================
-- NEXO · SAÚDE & SANEAMENTO
-- Migration 001 — Criar Schema Completo
-- Execute no Supabase SQL Editor
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- busca por texto

-- ============================================================
-- TABELA: municipios
-- Referência geográfica de todos os municípios brasileiros
-- ============================================================
CREATE TABLE IF NOT EXISTS municipios (
  id              SERIAL PRIMARY KEY,
  codigo_ibge     VARCHAR(7)  UNIQUE NOT NULL,
  nome            VARCHAR(120) NOT NULL,
  uf              VARCHAR(2)  NOT NULL,
  nome_uf         VARCHAR(30),
  latitude        DECIMAL(9,6),
  longitude       DECIMAL(9,6),
  populacao_2022  INTEGER,
  area_km2        DECIMAL(12,4),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: investimentos_saneamento
-- Dados SNIS/SINISA por município, ano e componente
-- Componentes: AG (água), ES (esgoto), RS (resíduos), DR (drenagem)
-- ============================================================
CREATE TABLE IF NOT EXISTS investimentos_saneamento (
  id                  SERIAL PRIMARY KEY,
  municipio_ibge      VARCHAR(7)    NOT NULL REFERENCES municipios(codigo_ibge),
  ano                 SMALLINT      NOT NULL,
  componente          VARCHAR(2)    NOT NULL,  -- AG, ES, RS, DR
  valor_reais         DECIMAL(15,2) NOT NULL,  -- valor nominal
  valor_real_2024     DECIMAL(15,2),           -- deflacionado para R$ 2024
  valor_per_capita    DECIMAL(10,2),           -- R$ por habitante
  fonte               VARCHAR(20)   DEFAULT 'SNIS',
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT investimentos_unico UNIQUE (municipio_ibge, ano, componente),
  CONSTRAINT componente_valido CHECK (componente IN ('AG', 'ES', 'RS', 'DR'))
);

-- ============================================================
-- TABELA: casos_sinan
-- Casos notificados por agravo de notificação (SINAN)
-- ============================================================
CREATE TABLE IF NOT EXISTS casos_sinan (
  id                  SERIAL PRIMARY KEY,
  municipio_ibge      VARCHAR(7)    NOT NULL REFERENCES municipios(codigo_ibge),
  ano                 SMALLINT      NOT NULL,
  agravo              VARCHAR(50)   NOT NULL,
  total_casos         INTEGER       NOT NULL  DEFAULT 0,
  taxa_incidencia     DECIMAL(12,4),           -- por 100.000 hab
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT sinan_unico UNIQUE (municipio_ibge, ano, agravo),
  CONSTRAINT casos_nao_negativos CHECK (total_casos >= 0)
);

-- ============================================================
-- TABELA: obitos_sim
-- Óbitos registrados no SIM, filtrados por causas relacionadas
-- ao saneamento (diarreias, leptospirose, hepatite A, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS obitos_sim (
  id                  SERIAL PRIMARY KEY,
  municipio_ibge      VARCHAR(7)    NOT NULL REFERENCES municipios(codigo_ibge),
  ano                 SMALLINT      NOT NULL,
  grupo_cid           VARCHAR(20)   NOT NULL,  -- ex: A00-A09, A27, B15, INFANTIL
  total_obitos        INTEGER       NOT NULL  DEFAULT 0,
  taxa_mortalidade    DECIMAL(12,6),           -- por 100.000 hab (ou por 1.000 NV p/ infantil)
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT sim_unico UNIQUE (municipio_ibge, ano, grupo_cid),
  CONSTRAINT obitos_nao_negativos CHECK (total_obitos >= 0)
);

-- ============================================================
-- TABELA: nascimentos_sinasc
-- Nascimentos registrados no SINASC por município e ano
-- ============================================================
CREATE TABLE IF NOT EXISTS nascimentos_sinasc (
  id                          SERIAL PRIMARY KEY,
  municipio_ibge              VARCHAR(7)    NOT NULL REFERENCES municipios(codigo_ibge),
  ano                         SMALLINT      NOT NULL,
  total_nascidos              INTEGER       NOT NULL  DEFAULT 0,
  obitos_infantis             INTEGER       DEFAULT 0,  -- óbitos < 1 ano (cruzado com SIM)
  tx_mortalidade_infantil     DECIMAL(10,4),            -- por 1.000 NV
  pct_prenatal_adequado       DECIMAL(5,2),             -- % com 7+ consultas
  pct_baixo_peso              DECIMAL(5,2),             -- % < 2500g
  pct_parto_cesareo           DECIMAL(5,2),
  created_at                  TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT sinasc_unico UNIQUE (municipio_ibge, ano)
);

-- ============================================================
-- TABELA: correlacoes_cache
-- Resultados de correlação pré-calculados para performance
-- ============================================================
CREATE TABLE IF NOT EXISTS correlacoes_cache (
  id                  SERIAL PRIMARY KEY,
  municipio_ibge      VARCHAR(7)    NOT NULL,
  componente          VARCHAR(2),               -- NULL = todos os componentes
  indicador           VARCHAR(60)   NOT NULL,
  periodo_inicio      SMALLINT      NOT NULL,
  periodo_fim         SMALLINT      NOT NULL,
  pearson_r           DECIMAL(6,4),
  r_quadrado          DECIMAL(6,4),
  p_valor             DECIMAL(10,8),
  coef_angular        DECIMAL(15,6),
  intercepto          DECIMAL(15,4),
  ic95_inferior       DECIMAL(6,4),
  ic95_superior       DECIMAL(6,4),
  n_amostras          SMALLINT,
  significativo       BOOLEAN       DEFAULT FALSE,
  calculado_em        TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT correlacoes_unico UNIQUE (municipio_ibge, componente, indicador, periodo_inicio, periodo_fim)
);

-- ============================================================
-- TABELA: bairros_caruaru
-- Dados por bairro de Caruaru para granularidade detalhada
-- ============================================================
CREATE TABLE IF NOT EXISTS bairros_caruaru (
  id                  SERIAL PRIMARY KEY,
  nome                VARCHAR(100)  NOT NULL,
  populacao_estimada  INTEGER,
  latitude            DECIMAL(9,6),
  longitude           DECIMAL(9,6),
  indice_nexo         DECIMAL(5,2), -- 0-100, calculado
  nivel_risco         VARCHAR(20),  -- BAIXO, MODERADO, ALTO, CRITICO
  created_at          TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- TABELA: investimentos_bairro
-- Investimentos estimados por bairro de Caruaru
-- ============================================================
CREATE TABLE IF NOT EXISTS investimentos_bairro (
  id                  SERIAL PRIMARY KEY,
  bairro_id           INTEGER       NOT NULL REFERENCES bairros_caruaru(id),
  ano                 SMALLINT      NOT NULL,
  componente          VARCHAR(2)    NOT NULL,
  valor_reais         DECIMAL(12,2),
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT inv_bairro_unico UNIQUE (bairro_id, ano, componente)
);

-- ============================================================
-- TABELA: casos_sinan_bairro
-- Casos SINAN por bairro de Caruaru
-- ============================================================
CREATE TABLE IF NOT EXISTS casos_sinan_bairro (
  id                  SERIAL PRIMARY KEY,
  bairro_id           INTEGER       NOT NULL REFERENCES bairros_caruaru(id),
  ano                 SMALLINT      NOT NULL,
  agravo              VARCHAR(50)   NOT NULL,
  total_casos         INTEGER       DEFAULT 0,
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  CONSTRAINT sinan_bairro_unico UNIQUE (bairro_id, ano, agravo)
);

-- ============================================================
-- VIEWS úteis
-- ============================================================

-- View: resumo anual de investimentos por município
CREATE OR REPLACE VIEW vw_investimentos_anuais AS
SELECT
  municipio_ibge,
  ano,
  SUM(valor_reais) AS total_nominal,
  SUM(valor_real_2024) AS total_real_2024,
  SUM(CASE WHEN componente = 'AG' THEN valor_reais ELSE 0 END) AS agua,
  SUM(CASE WHEN componente = 'ES' THEN valor_reais ELSE 0 END) AS esgoto,
  SUM(CASE WHEN componente = 'RS' THEN valor_reais ELSE 0 END) AS residuos,
  SUM(CASE WHEN componente = 'DR' THEN valor_reais ELSE 0 END) AS drenagem,
  COUNT(DISTINCT componente) AS componentes_com_dados
FROM investimentos_saneamento
GROUP BY municipio_ibge, ano
ORDER BY municipio_ibge, ano;

-- View: painel consolidado Caruaru
CREATE OR REPLACE VIEW vw_painel_caruaru AS
SELECT
  i.ano,
  i.total_real_2024 AS investimento_total,
  i.agua,
  i.esgoto,
  i.residuos,
  i.drenagem,
  s.total_casos AS casos_diarreia,
  o.total_obitos AS obitos_saneamento,
  n.tx_mortalidade_infantil,
  n.pct_prenatal_adequado
FROM vw_investimentos_anuais i
LEFT JOIN casos_sinan s
  ON s.municipio_ibge = i.municipio_ibge AND s.ano = i.ano AND s.agravo = 'diarreia'
LEFT JOIN obitos_sim o
  ON o.municipio_ibge = i.municipio_ibge AND o.ano = i.ano AND o.grupo_cid = 'A00-A09'
LEFT JOIN nascimentos_sinasc n
  ON n.municipio_ibge = i.municipio_ibge AND n.ano = i.ano
WHERE i.municipio_ibge = '2611606'
ORDER BY i.ano;

-- ============================================================
-- Triggers: atualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_municipios_updated_at
  BEFORE UPDATE ON municipios
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- Leitura pública, escrita apenas com service_role
-- ============================================================
ALTER TABLE municipios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE investimentos_saneamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos_sinan            ENABLE ROW LEVEL SECURITY;
ALTER TABLE obitos_sim             ENABLE ROW LEVEL SECURITY;
ALTER TABLE nascimentos_sinasc     ENABLE ROW LEVEL SECURITY;
ALTER TABLE correlacoes_cache      ENABLE ROW LEVEL SECURITY;

-- Política: leitura pública para todas as tabelas
CREATE POLICY "leitura_publica" ON municipios            FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON investimentos_saneamento FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON casos_sinan           FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON obitos_sim            FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON nascimentos_sinasc    FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON correlacoes_cache     FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON bairros_caruaru       FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON investimentos_bairro  FOR SELECT USING (true);
CREATE POLICY "leitura_publica" ON casos_sinan_bairro    FOR SELECT USING (true);
