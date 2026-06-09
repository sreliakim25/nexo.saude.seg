-- ============================================================
-- NEXO · SAÚDE & SANEAMENTO
-- Migration 002 — Índices de Performance
-- Execute APÓS 001_create_tables.sql
-- ============================================================

-- Municípios
CREATE INDEX IF NOT EXISTS idx_municipios_uf ON municipios(uf);
CREATE INDEX IF NOT EXISTS idx_municipios_nome ON municipios USING GIN(nome gin_trgm_ops);

-- Investimentos
CREATE INDEX IF NOT EXISTS idx_inv_municipio ON investimentos_saneamento(municipio_ibge);
CREATE INDEX IF NOT EXISTS idx_inv_ano ON investimentos_saneamento(ano);
CREATE INDEX IF NOT EXISTS idx_inv_componente ON investimentos_saneamento(componente);
CREATE INDEX IF NOT EXISTS idx_inv_municipio_ano ON investimentos_saneamento(municipio_ibge, ano);

-- SINAN
CREATE INDEX IF NOT EXISTS idx_sinan_municipio ON casos_sinan(municipio_ibge);
CREATE INDEX IF NOT EXISTS idx_sinan_ano ON casos_sinan(ano);
CREATE INDEX IF NOT EXISTS idx_sinan_agravo ON casos_sinan(agravo);
CREATE INDEX IF NOT EXISTS idx_sinan_municipio_ano ON casos_sinan(municipio_ibge, ano);

-- SIM
CREATE INDEX IF NOT EXISTS idx_sim_municipio ON obitos_sim(municipio_ibge);
CREATE INDEX IF NOT EXISTS idx_sim_ano ON obitos_sim(ano);
CREATE INDEX IF NOT EXISTS idx_sim_municipio_ano ON obitos_sim(municipio_ibge, ano);

-- SINASC
CREATE INDEX IF NOT EXISTS idx_sinasc_municipio ON nascimentos_sinasc(municipio_ibge);
CREATE INDEX IF NOT EXISTS idx_sinasc_ano ON nascimentos_sinasc(ano);

-- Correlações cache
CREATE INDEX IF NOT EXISTS idx_corr_municipio ON correlacoes_cache(municipio_ibge);
CREATE INDEX IF NOT EXISTS idx_corr_lookup ON correlacoes_cache(municipio_ibge, componente, indicador);
