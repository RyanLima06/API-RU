
DROP DATABASE IF EXISTS ru_teste;

CREATE DATABASE ru_teste
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ru_teste;
CREATE TABLE alunos (
  matricula VARCHAR(11) NOT NULL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  foto MEDIUMBLOB NULL,
  foto_atualizada_em DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabela de saldos (Decimal para evitar erros de arredondamento)
CREATE TABLE saldos (
  matricula VARCHAR(11) NOT NULL PRIMARY KEY,
  saldo DECIMAL(10,2) NOT NULL,
  atualizado_em DATETIME NOT NULL,
  CONSTRAINT fk_saldos_alunos FOREIGN KEY (matricula) REFERENCES alunos(matricula) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela de QR codes
CREATE TABLE qrcodes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matricula VARCHAR(11) NOT NULL,
  codigo VARCHAR(255) NOT NULL,
  gerado_em DATETIME NOT NULL,
  CONSTRAINT fk_qrcodes_alunos FOREIGN KEY (matricula) REFERENCES alunos(matricula) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE logs_alteracoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matricula VARCHAR(11) NOT NULL,
  operador VARCHAR(100) NOT NULL,
  tipo_alteracao ENUM('recarga', 'consumo') NOT NULL,
  dados_anteriores DECIMAL(10,2) NOT NULL,
  dados_novos DECIMAL(10,2) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  realizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_alteracoes_alunos FOREIGN KEY (matricula) REFERENCES alunos(matricula) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ru_user'@'localhost' IDENTIFIED BY 'ru_testePassword';
GRANT SELECT, INSERT, UPDATE, DELETE ON ru_teste.* TO 'ru_user'@'localhost';

CREATE USER IF NOT EXISTS 'UserPadrao'@'localhost' IDENTIFIED BY 'UserPadraoPassword';
GRANT SELECT, INSERT ON ru_teste.* TO 'UserPadrao'@'localhost';

FLUSH PRIVILEGES;