
DROP DATABASE IF EXISTS ru_teste;

CREATE DATABASE ru_teste
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ru_teste;
CREATE TABLE alunos (
    matricula           VARCHAR(20)  NOT NULL,
    nome                VARCHAR(120) NOT NULL,
    foto                VARCHAR(255) NOT NULL,
    foto_atualizada_em  DATETIME     NOT NULL,
    PRIMARY KEY (matricula)
) ENGINE=InnoDB;
CREATE TABLE saldos (
    matricula      VARCHAR(20)   NOT NULL,
    saldo          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    atualizado_em  DATETIME      NOT NULL,
    PRIMARY KEY (matricula),
    CONSTRAINT fk_saldos_alunos
        FOREIGN KEY (matricula) REFERENCES alunos (matricula)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE qrcodes (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    matricula  VARCHAR(20)  NOT NULL,
    codigo     VARCHAR(64)  NOT NULL,
    gerado_em  DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_qrcodes_codigo (codigo),
    KEY idx_qrcodes_matricula (matricula),
    CONSTRAINT fk_qrcodes_alunos
        FOREIGN KEY (matricula) REFERENCES alunos (matricula)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

ALTER USER 'ru_teste'@'localhost' IDENTIFIED BY 'ru_testePassword';
CREATE USER 'ru_teste'@'localhost' IDENTIFIED BY 'ru_testePassword';

GRANT SELECT, INSERT, UPDATE, DELETE ON ru_teste.* TO 'ru_teste'@'localhost';