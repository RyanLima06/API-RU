-- saldo, nome e DHAtualizacaoSaldo vão SEMPRE.
-- foto: enviada só se foto_atualizada_em > data (senão null).
-- strQrCode: QR code MAIS RECENTE do aluno, só se gerado_em > data (senão null).


-- matrícula     foto   saldo   qrcodes  cenário
-- 20251200001   sim    sim     2        tudo mudou (exemplo da especificação)
-- 20251200002   não    não     0        nada mudou
-- 20251200003   sim    não     0        só a foto mudou
-- 20251200004   não    sim     0        só o saldo mudou
-- 20251200005   não    não     1        só QR code mudou (1 antigo + 1 novo)
-- 20251200006   sim    sim     0        foto + saldo
-- 20251200007   sim    não     1        foto + QR code
-- 20251200008   não    sim     1        saldo + QR code
-- 20251200009   não    null    1        aluno SEM linha em saldos
-- 20251200010   não    sim     0        aluno SEM QR codes
-- 20251200011   sim    null    0        recém-cadastrado: sem saldo e sem QR
-- 20251200012   não    não     0        limite: tudo EXATAMENTE em 08:00:00
-- 20251200013   sim    sim     1        limite: tudo 1 segundo DEPOIS (08:00:01)
-- 20251200014   não    não     0        limite: tudo 1 segundo ANTES (07:59:59)
-- 20251200015   não    sim     0        saldo zerado (0.00) atualizado
-- 20251200016   não    sim     0        saldo 0.30 (precisão decimal)
-- 20251200017   não    não     3        vários QR codes (2 antigos + 3 novos)
-- 20251200018   não    não     0        tudo muito antigo (2025)
-- 20251200019   sim    não     0        acentos/utf8mb4 + foto de hoje
-- 20251200020   não    não     1        mesmo dia da sync: QR 06:00 (não) e 18:30 (sim)

USE ru_teste;
SET NAMES utf8mb4;

SET SQL_SAFE_UPDATES = 0;

DELETE FROM qrcodes;
DELETE FROM saldos;
DELETE FROM alunos;
ALTER TABLE qrcodes AUTO_INCREMENT = 1;

-- ---------------------------------------------------------------------
-- ALUNOS
-- ---------------------------------------------------------------------
INSERT INTO alunos (matricula, nome, foto, foto_atualizada_em) VALUES
('20251200001', 'Ana Beatriz Lima Souza',          'fotos/20251200001.jpg', '2026-09-22 09:15:00'),
('20251200002', 'Bruno Henrique Carvalho Melo',    'fotos/20251200002.jpg', '2026-03-10 14:20:00'),
('20251200003', 'Camila Ferreira Andrade',         'fotos/20251200003.jpg', '2026-09-22 16:45:00'),
('20251200004', 'Diego Almeida Rocha',             'fotos/20251200004.jpg', '2026-02-05 10:00:00'),
('20251200005', 'Eduarda Nogueira Prado',          'fotos/20251200005.jpg', '2026-05-18 11:30:00'),
('20251200006', 'Felipe Augusto Barros',           'fotos/20251200006.jpg', '2026-09-21 08:10:00'),
('20251200007', 'Gabriela Torres Vasconcelos',     'fotos/20251200007.jpg', '2026-09-23 15:00:00'),
('20251200008', 'Heitor Monteiro Lacerda',         'fotos/20251200008.jpg', '2026-04-02 09:45:00'),
('20251200009', 'Isabela Duarte Cavalcante',       'fotos/20251200009.jpg', '2026-06-30 13:00:00'),
('20251200010', 'João Pedro Xavier Teles',         'fotos/20251200010.jpg', '2026-07-14 17:25:00'),
('20251200011', 'Karina Menezes Bezerra',          'fotos/20251200011.jpg', '2026-09-24 08:30:00'),
('20251200012', 'Lucas Gabriel Sampaio Neto',      'fotos/20251200012.jpg', '2026-09-20 08:00:00'),
('20251200013', 'Mariana Peixoto Guedes',          'fotos/20251200013.jpg', '2026-09-20 08:00:01'),
('20251200014', 'Natália Rangel Pinheiro',         'fotos/20251200014.jpg', '2026-09-20 07:59:59'),
('20251200015', 'Otávio Brandão Fontenele',        'fotos/20251200015.jpg', '2026-08-12 12:00:00'),
('20251200016', 'Paula Regina Coutinho Alves',     'fotos/20251200016.jpg', '2026-08-25 18:40:00'),
('20251200017', 'Rafael Sousa Benevides',          'fotos/20251200017.jpg', '2026-01-20 08:15:00'),
('20251200018', 'Sabrina Lopes Aragão',            'fotos/20251200018.jpg', '2025-02-17 10:00:00'),
('20251200019', 'Iara Conceição Araújo Pêgo',      'fotos/20251200019.jpg', '2026-09-24 08:00:00'),
('20251200020', 'Ulisses Cândido Marques',         'fotos/20251200020.jpg', '2026-05-05 09:00:00');

-- ---------------------------------------------------------------------
-- SALDOS  (DECIMAL(10,2))
-- Sem linha para 20251200009 e 20251200011 de propósito.
-- ---------------------------------------------------------------------
INSERT INTO saldos (matricula, saldo, atualizado_em) VALUES
('20251200001',  35.50, '2026-09-22 12:10:00'),
('20251200002',  18.00, '2026-09-10 12:05:00'),
('20251200003',  42.75, '2026-09-12 13:30:00'),
('20251200004',  27.30, '2026-09-23 12:40:00'),
('20251200005',  60.00, '2026-09-14 11:50:00'),
('20251200006',   9.90, '2026-09-21 19:00:00'),
('20251200007',  75.25, '2026-09-11 12:20:00'),
('20251200008',   5.40, '2026-09-24 09:05:00'),
-- 20251200009: sem saldo
('20251200010', 120.00, '2026-09-22 08:00:00'),
-- 20251200011: sem saldo
('20251200012',  22.00, '2026-09-20 08:00:00'),
('20251200013',  22.00, '2026-09-20 08:00:01'),
('20251200014',  22.00, '2026-09-20 07:59:59'),
('20251200015',   0.00, '2026-09-23 12:00:00'),
('20251200016',   0.30, '2026-09-24 07:45:00'),
('20251200017',  88.80, '2026-09-05 12:10:00'),
('20251200018',   3.15, '2025-02-17 12:00:00'),
('20251200019',  14.60, '2026-09-01 12:00:00'),
('20251200020',  52.10, '2026-09-18 12:30:00');

-- ---------------------------------------------------------------------
-- Sem QR code para 20251200010 e 20251200011 de propósito.
-- ---------------------------------------------------------------------
INSERT INTO qrcodes (matricula, codigo, gerado_em) VALUES
-- 001: dois novos
('20251200001', 'RU-20251200001-01', '2026-09-22 11:50:00'),
('20251200001', 'RU-20251200001-02', '2026-09-23 11:45:00'),
-- 002..004: antigos
('20251200002', 'RU-20251200002-01', '2026-09-15 11:40:00'),
('20251200003', 'RU-20251200003-01', '2026-09-16 11:45:00'),
('20251200004', 'RU-20251200004-01', '2026-09-17 11:50:00'),
-- 005: um antigo e um novo
('20251200005', 'RU-20251200005-01', '2026-09-19 11:30:00'),
('20251200005', 'RU-20251200005-02', '2026-09-24 07:30:00'),
-- 006: antigo
('20251200006', 'RU-20251200006-01', '2026-09-18 11:55:00'),
-- 007..009: novos
('20251200007', 'RU-20251200007-01', '2026-09-22 12:00:00'),
('20251200008', 'RU-20251200008-01', '2026-09-23 11:40:00'),
('20251200009', 'RU-20251200009-01', '2026-09-21 11:35:00'),
-- 010 e 011: sem QR code
-- 012..014: limites exatos
('20251200012', 'RU-20251200012-01', '2026-09-20 08:00:00'),
('20251200013', 'RU-20251200013-01', '2026-09-20 08:00:01'),
('20251200014', 'RU-20251200014-01', '2026-09-20 07:59:59'),
-- 015 e 016: antigos
('20251200015', 'RU-20251200015-01', '2026-09-09 11:30:00'),
('20251200016', 'RU-20251200016-01', '2026-09-08 11:30:00'),
-- 017: cinco códigos, inseridos fora de ordem 
('20251200017', 'RU-20251200017-05', '2026-09-24 11:30:00'),
('20251200017', 'RU-20251200017-01', '2026-08-30 11:30:00'),
('20251200017', 'RU-20251200017-03', '2026-09-21 11:30:00'),
('20251200017', 'RU-20251200017-02', '2026-09-13 11:30:00'),
('20251200017', 'RU-20251200017-04', '2026-09-22 11:30:00'),
-- 018 e 019: antigos
('20251200018', 'RU-20251200018-01', '2025-02-17 11:45:00'),
('20251200019', 'RU-20251200019-01', '2026-09-02 11:50:00'),
-- 020: mesmo dia da sincronização, um antes e um depois das 08:00
('20251200020', 'RU-20251200020-01', '2026-09-20 06:00:00'),
('20251200020', 'RU-20251200020-02', '2026-09-20 18:30:00');

SET SQL_SAFE_UPDATES = 1;
SELECT
    (SELECT COUNT(*) FROM alunos)  AS alunos,
    (SELECT COUNT(*) FROM saldos)  AS saldos,
    (SELECT COUNT(*) FROM qrcodes) AS qrcodes,
    (SELECT COUNT(*) FROM alunos WHERE matricula NOT REGEXP '^[0-9]{11}$') AS matriculas_invalidas;