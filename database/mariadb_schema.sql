-- =============================================================================
-- BASE DE DADOS DO SISTEMA DE GOVERNANÇA DE REUNIÕES (GRUPO AGEMAR)
-- SGBD Recomendado: MariaDB 10.5+ / MySQL 8.0+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS agemar_governanca_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agemar_governanca_db;

-- Desativar verificação de chaves temporariamente para criação limpa das tabelas
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. TABELA: configuracao_ldaps
-- Armazena os parâmetros de endereço e autenticação do Active Directory / LDAPS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS configuracao_ldaps;
CREATE TABLE configuracao_ldaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    host VARCHAR(255) NOT NULL DEFAULT 'ldaps://ldap.agemar.com.br',
    port INT NOT NULL DEFAULT 636,
    `ssl` BOOLEAN NOT NULL DEFAULT TRUE,
    base_dn VARCHAR(255) NOT NULL DEFAULT 'dc=agemar,dc=com,dc=br',
    bind_dn VARCHAR(255) NOT NULL DEFAULT 'cn=admin,dc=agemar,dc=com,dc=br',
    bind_password VARCHAR(255) NOT NULL,
    user_filter VARCHAR(255) NOT NULL DEFAULT '(sAMAccountName={{username}})',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 2. TABELA: usuarios
-- Cadastro de usuários permitidos no painel e suas respectivas funções de governança
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
    id VARCHAR(50) PRIMARY KEY,
    network_login VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role ENUM('Administrador', 'Editor', 'Visualizador') NOT NULL DEFAULT 'Visualizador',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_login (network_login),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 3. TABELA: unidades_negocio
-- Cadastro das Unidades de Negócio do Grupo Agemar
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS unidades_negocio;
CREATE TABLE unidades_negocio (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    responsible_director VARCHAR(150) NOT NULL,
    status ENUM('Ativa', 'Inativa') NOT NULL DEFAULT 'Ativa',
    observations TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bu_status (status)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. TABELA: reunioes
-- Registro Geral de Reuniões Planejadas e Realizadas com as atas e deliberações
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS reunioes;
CREATE TABLE reunioes (
    id VARCHAR(50) PRIMARY KEY,
    meeting_type ENUM('Reunião de resultados mensais', 'Reunião Quadrimestral - Reforecast', 'FUPs com Equipes', 'Outros') NOT NULL,
    responsible_director VARCHAR(150) NOT NULL,
    business_unit_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL, -- Formato 'HH:MM'
    location VARCHAR(200) NOT NULL,
    participants TEXT NOT NULL, -- Lista de participantes por extenso
    evidence_link VARCHAR(500) NULL, -- Link externo para evidências complementares
    observations_decisions MEDIUMTEXT NULL, -- Atas, diretrizes e deliberações registradas
    status ENUM('PLANEJADA', 'REALIZADA', 'CANCELADA') NOT NULL DEFAULT 'PLANEJADA',
    source ENUM('PLANNING', 'DIRECT_REGISTRATION') NOT NULL DEFAULT 'DIRECT_REGISTRATION',
    planned_meeting_id VARCHAR(50) NULL, -- Auto-relacionamento caso venha de um planejamento prévio
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    
    -- Chaves Estrangeiras
    CONSTRAINT fk_reunioes_bu FOREIGN KEY (business_unit_id) 
        REFERENCES unidades_negocio(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_reunioes_planejamento FOREIGN KEY (planned_meeting_id) 
        REFERENCES reunioes(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
        
    -- Índices para Otimização de Consultas de Painel/Dashboard
    INDEX idx_reuniao_data (date),
    INDEX idx_reuniao_status (status),
    INDEX idx_reuniao_tipo (meeting_type),
    INDEX idx_reuniao_bu (business_unit_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. TABELA: anexos
-- Arquivos e atas digitalizadas vinculados a cada reunião
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS anexos;
CREATE TABLE anexos (
    id VARCHAR(50) PRIMARY KEY,
    meeting_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url LONGTEXT NOT NULL, -- Pode armazenar links de armazenamento ou representações binárias codificadas em Base64
    file_type VARCHAR(100) NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_anexos_reuniao FOREIGN KEY (meeting_id) 
        REFERENCES reunioes(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    INDEX idx_anexo_reuniao (meeting_id)
) ENGINE=InnoDB;

-- Reativar verificação de chaves primárias
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- INSERÇÃO DE DADOS INICIAIS E DEMOSTRATIVOS (SEED SEEDING DATA)
-- =============================================================================

-- Usuários Demonstrativos Padronizados
INSERT INTO usuarios (id, network_login, name, email, role) VALUES
('usr_admin', 'admin.agemar', 'Administrador de Governança', 'admin@agemar.com.br', 'Administrador'),
('usr_app_agemar', 'aplicativos.agemar', 'Equipe de Aplicativos Agemar', 'aplicativos@agemar.com.br', 'Administrador'),
('usr_editor', 'editor.agemar', 'Gestor de Contratos', 'editor@agemar.com.br', 'Editor');

-- Configuração LDAPS Padrão
INSERT INTO configuracao_ldaps (host, port, `ssl`, base_dn, bind_dn, bind_password, user_filter) VALUES
('ldaps://ldap.agemar.com.br', 636, 1, 'dc=agemar,dc=com,dc=br', 'cn=admin,dc=agemar,dc=com,dc=br', 'password123', '(sAMAccountName={{username}})');

-- Unidades de Negócio Iniciais
INSERT INTO unidades_negocio (id, name, code, responsible_director, status, observations) VALUES
('bu_1', 'Agemar Porto', 'AGEPORTO', 'Jorge Cabral', 'Ativa', 'Operações do Terminal Portuário Organizado de Recife'),
('bu_2', 'Agemar Infraestrutura', 'AGEINFRA', 'Jorge Cabral', 'Ativa', 'Administração predial, pátio e galpões comerciais'),
('bu_3', 'Agemar Logística', 'AGELOG', 'Jorge Cabral', 'Ativa', 'Frota pesada de transportes intermodais e cargas integradas');

-- Reuniões Iniciais para a inicialização do Dashboard
INSERT INTO reunioes (id, meeting_type, responsible_director, business_unit_id, date, time, location, participants, evidence_link, observations_decisions, status, source, created_by) VALUES
('meet_1', 'Reunião de resultados mensais', 'Jorge Cabral', 'bu_1', '2026-06-10', '09:00', 'Sala de Reuniões Principal', 'Jorge Cabral, Mariana Silva, Roberto Dias', 'https://drive.google.com/drive/folders/agemar-porto', 'Revisão dos indicadores de throughput de carga de contêineres e faturamento de armazenagem portuária.', 'REALIZADA', 'DIRECT_REGISTRATION', 'admin.agemar'),
('meet_2', 'Reunião Quadrimestral - Reforecast', 'Jorge Cabral', 'bu_2', '2026-07-20', '14:30', 'Auditório Virtual', 'Diretoria Executiva, Controladoria, Gerentes de Unidade', NULL, 'Planejamento e alocação orçamentária para a expansão dos novos galpões modulares da Infraestrutura.', 'PLANEJADA', 'PLANNING', 'admin.agemar');
