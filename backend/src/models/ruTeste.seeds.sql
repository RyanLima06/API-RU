-- =====================================================================
-- Dados de teste do RU (Restaurante Universitário)
-- Requer a tabela alunos com: foto MEDIUMBLOB NULL
--
-- Data base para os testes de sincronização: 2026-09-20 08:00:00
--
-- REGRAS DA SINCRONIZAÇÃO DA API:
-- 1. saldo, nome e DHAtualizacaoSaldo: vão SEMPRE (se existir saldo).
-- 2. foto: enviada só se (foto_atualizada_em > data); senão null.
-- 3. strQrCode: enviado o QR code MAIS RECENTE do aluno só se (gerado_em > data); senão null.
--
-- RESUMO DOS 20 CENÁRIOS DE TESTE:
-- matrícula    | foto? | saldo novo? | QR novo? | cenário de teste
-- 20251200001  | SIM   | SIM         | SIM      | Tudo mudou (exemplo da especificação)
-- 20251200002  | NÃO   | NÃO         | NÃO      | Nada mudou desde a última sync
-- 20251200003  | SIM   | NÃO         | NÃO      | Só a foto mudou
-- 20251200004  | NÃO   | SIM         | NÃO      | Só o saldo mudou
-- 20251200005  | NÃO   | NÃO         | SIM      | Só QR code mudou (1 antigo + 1 novo)
-- 20251200006  | SIM   | SIM         | NÃO      | Foto + Saldo mudaram
-- 20251200007  | SIM   | NÃO         | SIM      | Foto + QR code mudaram
-- 20251200008  | NÃO   | SIM         | SIM      | Saldo + QR code mudaram
-- 20251200009  | NÃO   | NULL        | SIM      | Aluno SEM linha na tabela saldos
-- 20251200010  | NÃO   | SIM         | NULL     | Aluno SEM QR codes no sistema
-- 20251200011  | SIM   | NULL        | NULL     | Recém-cadastrado: sem saldo e sem QR
-- 20251200012  | NÃO   | NÃO         | NÃO      | Limite EXATO: tudo em 08:00:00 (deve vir null)
-- 20251200013  | SIM   | SIM         | SIM      | Limite +1s: tudo em 08:00:01 (deve vir preenchido)
-- 20251200014  | NÃO   | NÃO         | NÃO      | Limite -1s: tudo em 07:59:59 (deve vir null)
-- 20251200015  | NÃO   | SIM         | NÃO      | Saldo zerado (0.00) atualizado recentemente
-- 20251200016  | NÃO   | SIM         | NÃO      | Saldo fracionado (0.30) precisão DECIMAL
-- 20251200017  | NÃO   | NÃO         | SIM      | Múltiplos QR codes inseridos fora de ordem
-- 20251200018  | NÃO   | NÃO         | NÃO      | Dados muito antigos (2025)
-- 20251200019  | SIM   | NÃO         | NÃO      | Codificação UTF-8 (acentos no nome) + Foto recente
-- 20251200020  | NÃO   | NÃO         | SIM      | Mesmo dia: QR 06:00 (antigo) e QR 18:30 (novo)
-- =====================================================================

USE ru_teste;
SET NAMES utf8mb4;

-- Limpeza das tabelas mantendo a integridade referencial
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE qrcodes;
TRUNCATE TABLE saldos;
TRUNCATE TABLE alunos;
SET FOREIGN_KEY_CHECKS = 1;

-- Binário VÁLIDO de imagem PNG em Base64 (1x1 pixel transparente)
SET @foto_padrao = FROM_BASE64(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
);

-- =====================================================================
-- 1. TABELA ALUNOS (20 registros)
-- =====================================================================
INSERT INTO alunos (matricula, nome, foto, foto_atualizada_em) VALUES
('20251200001', 'Ana Beatriz Lima Souza',        @foto_padrao, '2026-09-22 09:15:00'), -- SIM (> 08:00)
('20251200002', 'Bruno Henrique Carvalho Melo',  @foto_padrao, '2026-03-10 14:20:00'), -- NÃO (<= 08:00)
('20251200003', 'Camila Ferreira Andrade',       @foto_padrao, '2026-09-22 16:45:00'), -- SIM (> 08:00)
('20251200004', 'Diego Almeida Rocha',           @foto_padrao, '2026-02-05 10:00:00'), -- NÃO (<= 08:00)
('20251200005', 'Eduarda Nogueira Prado',        @foto_padrao, '2026-05-18 11:30:00'), -- NÃO (<= 08:00)
('20251200006', 'Felipe Augusto Barros',         @foto_padrao, '2026-09-21 08:10:00'), -- SIM (> 08:00)
('20251200007', 'Gabriela Torres Vasconcelos',   @foto_padrao, '2026-09-23 15:00:00'), -- SIM (> 08:00)
('20251200008', 'Heitor Monteiro Lacerda',       @foto_padrao, '2026-04-02 09:45:00'), -- NÃO (<= 08:00)
('20251200009', 'Isabela Duarte Cavalcante',     @foto_padrao, '2026-06-30 13:00:00'), -- NÃO (<= 08:00)
('20251200010', 'João Pedro Xavier Teles',       @foto_padrao, '2026-07-14 17:25:00'), -- NÃO (<= 08:00)
('20251200011', 'Karina Menezes Bezerra',        @foto_padrao, '2026-09-24 08:30:00'), -- SIM (> 08:00)
('20251200012', 'Lucas Gabriel Sampaio Neto',    @foto_padrao, '2026-09-20 08:00:00'), -- NÃO (EXATO == 08:00)
('20251200013', 'Mariana Peixoto Guedes',        @foto_padrao, '2026-09-20 08:00:01'), -- SIM (+1s > 08:00)
('20251200014', 'Natália Rangel Pinheiro',       @foto_padrao, '2026-09-20 07:59:59'), -- NÃO (-1s < 08:00)
('20251200015', 'Otávio Brandão Fontenele',      @foto_padrao, '2026-08-12 12:00:00'), -- NÃO (<= 08:00)
('20251200016', 'Paula Regina Coutinho Alves',   @foto_padrao, '2026-08-25 18:40:00'), -- NÃO (<= 08:00)
('20251200017', 'Rafael Sousa Benevides',        @foto_padrao, '2026-01-20 08:15:00'), -- NÃO (<= 08:00)
('20251200018', 'Sabrina Lopes Aragão',          @foto_padrao, '2025-02-17 10:00:00'), -- NÃO (2025)
('20251200019', 'Iara Conceição Araújo Pêgo',    @foto_padrao, '2026-09-24 08:00:00'), -- SIM (> 08:00)
('20251200020', 'Ulisses Cândido Marques',       @foto_padrao, '2026-05-05 09:00:00'); -- NÃO (<= 08:00)

-- =====================================================================
-- 2. TABELA SALDOS (DECIMAL(10,2))
-- Matrículas 20251200009 e 20251200011 sem saldo intencionalmente.
-- =====================================================================
INSERT INTO saldos (matricula, saldo, atualizado_em) VALUES
('20251200001',  35.50, '2026-09-22 12:10:00'), -- Atualizado pós sync
('20251200002',  18.00, '2026-09-10 12:05:00'), -- Antigo
('20251200003',  42.75, '2026-09-12 13:30:00'), -- Antigo
('20251200004',  27.30, '2026-09-23 12:40:00'), -- Atualizado pós sync
('20251200005',  60.00, '2026-09-14 11:50:00'), -- Antigo
('20251200006',   9.90, '2026-09-21 19:00:00'), -- Atualizado pós sync
('20251200007',  75.25, '2026-09-11 12:20:00'), -- Antigo
('20251200008',   5.40, '2026-09-24 09:05:00'), -- Atualizado pós sync
-- 20251200009: sem saldo
('20251200010', 120.00, '2026-09-22 08:00:00'), -- Atualizado pós sync
-- 20251200011: sem saldo
('20251200012',  22.00, '2026-09-20 08:00:00'), -- Limite exato
('20251200013',  22.00, '2026-09-20 08:00:01'), -- Limite +1s
('20251200014',  22.00, '2026-09-20 07:59:59'), -- Limite -1s
('20251200015',   0.00, '2026-09-23 12:00:00'), -- Saldo zero atualizado
('20251200016',   0.30, '2026-09-24 07:45:00'), -- Saldo fracionado atualizado
('20251200017',  88.80, '2026-09-05 12:10:00'), -- Antigo
('20251200018',   3.15, '2025-02-17 12:00:00'), -- Antigo
('20251200019',  14.60, '2026-09-01 12:00:00'), -- Antigo
('20251200020',  52.10, '2026-09-18 12:30:00'); -- Antigo

-- =====================================================================
-- 3. TABELA QRCODES
-- Matrículas 20251200010 e 20251200011 sem QR code intencionalmente.
-- =====================================================================
INSERT INTO qrcodes (matricula, codigo, gerado_em) VALUES
-- 001: 2 novos (mais recente: 02)
('20251200001', 'RU-20251200001-01', '2026-09-22 11:50:00'),
('20251200001', 'RU-20251200001-02', '2026-09-23 11:45:00'),

-- 002..004: antigos
('20251200002', 'RU-20251200002-01', '2026-09-15 11:40:00'),
('20251200003', 'RU-20251200003-01', '2026-09-16 11:45:00'),
('20251200004', 'RU-20251200004-01', '2026-09-17 11:50:00'),

-- 005: 1 antigo + 1 novo (mais recente: 02)
('20251200005', 'RU-20251200005-01', '2026-09-19 11:30:00'),
('20251200005', 'RU-20251200005-02', '2026-09-24 07:30:00'),

-- 006: antigo
('20251200006', 'RU-20251200006-01', '2026-09-18 11:55:00'),

-- 007..009: novos
('20251200007', 'RU-20251200007-01', '2026-09-22 12:00:00'),
('20251200008', 'RU-20251200008-01', '2026-09-23 11:40:00'),
('20251200009', 'RU-20251200009-01', '2026-09-21 11:35:00'),

-- 010 e 011: sem QR code no banco

-- 012..014: limites exatos
('20251200012', 'RU-20251200012-01', '2026-09-20 08:00:00'), -- EXATO
('20251200013', 'RU-20251200013-01', '2026-09-20 08:00:01'), -- +1s
('20251200014', 'RU-20251200014-01', '2026-09-20 07:59:59'), -- -1s

-- 015 e 016: antigos
('20251200015', 'RU-20251200015-01', '2026-09-09 11:30:00'),
('20251200016', 'RU-20251200016-01', '2026-09-08 11:30:00'),

-- 017: 5 códigos inseridos fora de ordem (mais recente: 05)
('20251200017', 'RU-20251200017-05', '2026-09-24 11:30:00'),
('20251200017', 'RU-20251200017-01', '2026-08-30 11:30:00'),
('20251200017', 'RU-20251200017-03', '2026-09-21 11:30:00'),
('20251200017', 'RU-20251200017-02', '2026-09-13 11:30:00'),
('20251200017', 'RU-20251200014-04', '2026-09-22 11:30:00'),

-- 018 e 019: antigos
('20251200018', 'RU-20251200018-01', '2025-02-17 11:45:00'),
('20251200019', 'RU-20251200019-01', '2026-09-02 11:50:00'),

-- 020: mesmo dia (01 é antigo e 02 é novo; o mais recente é o 02)
('20251200020', 'RU-20251200020-01', '2026-09-20 06:00:00'),
('20251200020', 'RU-20251200020-02', '2026-09-20 18:30:00');

-- =====================================================================
-- CONFERÊNCIA DE DADOS
-- =====================================================================
SELECT
    (SELECT COUNT(*) FROM alunos)  AS total_alunos,
    (SELECT COUNT(*) FROM saldos)  AS total_saldos,
    (SELECT COUNT(*) FROM qrcodes) AS total_qrcodes,
    (SELECT COUNT(*) FROM alunos WHERE matricula NOT REGEXP '^[0-9]{11}$') AS matriculas_invalidas,
    (SELECT COUNT(*) FROM alunos WHERE foto IS NULL OR LENGTH(foto) = 0)   AS fotos_vazias;
