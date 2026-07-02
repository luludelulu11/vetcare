-- --------------------------------------------------------
-- Host:                         localhost
-- Server version:               5.7.24 - MySQL Community Server (GPL)
-- Server OS:                    Win64
-- HeidiSQL Version:             10.2.0.5599
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Dumping database structure for vetcare
CREATE DATABASE IF NOT EXISTS `vetcare` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `vetcare`;

-- Dumping structure for table vetcare.appointments
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `pet_id` char(36) NOT NULL,
  `scheduled_at` datetime NOT NULL,
  `status` enum('SCHEDULED','CONFIRMED','CANCELLED','COMPLETED','NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
  `reason` varchar(200) DEFAULT NULL,
  `notes` text,
  `created_by` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appt_scheduled_at` (`scheduled_at`),
  KEY `idx_appt_pet_id` (`pet_id`),
  KEY `idx_appt_client_id` (`client_id`),
  KEY `idx_appt_deleted_at` (`deleted_at`),
  KEY `fk_appt_created_by` (`created_by`),
  CONSTRAINT `fk_appt_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `fk_appt_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appt_pet` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.appointments: ~0 rows (approximately)
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;

-- Dumping structure for table vetcare.clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id` char(36) NOT NULL,
  `first_name` varchar(80) NOT NULL,
  `last_name` varchar(80) NOT NULL,
  `national_id` char(13) NOT NULL,
  `email` varchar(120) DEFAULT NULL,
  `phone_primary` char(12) NOT NULL,
  `phone_secondary` char(12) DEFAULT NULL,
  `address_line1` varchar(120) DEFAULT NULL,
  `address_line2` varchar(120) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `province_state` varchar(80) DEFAULT NULL,
  `notes` text,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email` (`email`),
  KEY `idx_clients_national_id` (`national_id`),
  KEY `idx_clients_phone_primary` (`phone_primary`),
  KEY `idx_clients_email` (`email`),
  KEY `idx_clients_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.clients: ~11 rows (approximately)
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` (`id`, `first_name`, `last_name`, `national_id`, `email`, `phone_primary`, `phone_secondary`, `address_line1`, `address_line2`, `city`, `province_state`, `notes`, `deleted_at`, `created_at`, `updated_at`) VALUES
	('00ef06e5-207f-47fa-b7e3-d545f52033dd', 'Alicia', 'Perdomo', '88888555999', 'santa28mora@gmail.com', '849-502-5255', NULL, 'Las Bollas', NULL, NULL, NULL, NULL, NULL, '2026-04-13 15:41:20', '2026-04-13 15:41:20'),
	('1c3bca85-6940-4f8a-9af1-de7bfad3701e', 'Alexander', 'Zorilla', '7777742421', 'alezz76@gmail.com', '8099874133', NULL, 'La Riviera, calle principal', NULL, NULL, NULL, NULL, NULL, '2026-04-06 19:06:02', '2026-04-13 01:33:00'),
	('3931bed7-a78e-4545-943a-4c3af5f5b0cc', 'Esmeralda', 'Mora', '4025278855', 'esmeraldamora1105@gmail.com', '829256544', '552554225858', 'Calle Blanquito Horacio', NULL, NULL, NULL, NULL, NULL, '2026-03-09 13:26:40', '2026-04-13 01:30:35'),
	('6acd5ff6-7a16-4b74-8e6e-8722e7db6580', 'Lucero', 'Fernandez', '40245557689', 'luceritoyipis11@gmail.com', '8298584563', NULL, 'Altos de Hatico', NULL, NULL, NULL, NULL, NULL, '2026-04-12 21:04:08', '2026-04-13 01:27:37'),
	('77c113fa-dc99-4dc4-9729-ad4d7e58551c', 'Maria', 'Beriguete', '01358525854', 'syanemone55@gmail.com', '849-255-2586', NULL, 'Los Alcarrizos', NULL, NULL, NULL, NULL, NULL, '2026-04-13 15:38:06', '2026-04-13 15:38:06'),
	('b69282fe-0bfb-43a6-9275-7c462e490f34', 'Adrian', 'salazar', '1525358522', 'adri05@gmail.com', '85856852588', '554258525', 'Los pomos, calle 2', NULL, NULL, NULL, NULL, '2026-04-13 02:59:18', '2026-03-09 13:28:50', '2026-04-13 02:59:18'),
	('bd0d029b-5dce-4f5e-95a7-04cda319be3d', 'Maria ', 'Caraballo', '40252788862', 'cballom98@gmail.com', '8296987845', NULL, 'Las Carolinas, calle 13', NULL, NULL, NULL, NULL, NULL, '2026-04-05 19:00:36', '2026-04-13 01:31:28'),
	('c57da870-11b9-47ce-b94a-f78de3d68230', 'Angelica', 'Hernández', '4025278886', 'angeliah57@test.com', '8292855553', NULL, 'Geremias ', NULL, NULL, NULL, NULL, NULL, '2026-03-06 11:29:51', '2026-04-13 01:32:29'),
	('caf7d7b8-1dbd-4e2e-bd1e-f0701a06f9eb', 'Patricia', 'Nuñez', '40252788812', 'pnunez34@test.com', '8292885590', NULL, 'Las Maras', NULL, NULL, NULL, NULL, NULL, '2026-03-09 19:53:31', '2026-04-13 01:32:03'),
	('d49f550b-eb67-4e6f-a923-be8c9c78fc5e', 'Emmanuel', 'Reinoso', '04312399812', 'emmanuel@test.com', '8298785526', '1231231235', 'Ave. Mons. panal', NULL, NULL, NULL, NULL, NULL, '2026-03-16 11:12:31', '2026-04-13 01:30:09'),
	('ecccfc1a-1d15-4b57-96df-3c1a8b8a5c67', 'Lucas', 'Castro', '77777777777', 'lucas_2423@gmail.com', '8757745536', '4552225222', 'Avenida Imbert', NULL, NULL, NULL, NULL, NULL, '2026-03-09 15:10:21', '2026-04-13 01:30:56'),
	('f4294c1d-4698-4737-bbc8-db21a7db57d5', 'Adriana ', 'Hernández', '4525852885', 'adrian2324@gmail.com', '52533105689', '85285855', 'Residencial Hernández', NULL, NULL, NULL, NULL, '2026-04-13 02:59:36', '2026-03-09 13:27:30', '2026-04-13 02:59:36');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;

-- Dumping structure for table vetcare.clinical_attachments
CREATE TABLE IF NOT EXISTS `clinical_attachments` (
  `id` char(36) NOT NULL,
  `clinical_record_id` char(36) NOT NULL,
  `file_name` varchar(200) NOT NULL,
  `file_type` varchar(80) DEFAULT NULL,
  `file_url` text NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attach_record_id` (`clinical_record_id`),
  KEY `idx_attach_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_attach_record` FOREIGN KEY (`clinical_record_id`) REFERENCES `clinical_records` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.clinical_attachments: ~0 rows (approximately)
/*!40000 ALTER TABLE `clinical_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `clinical_attachments` ENABLE KEYS */;

-- Dumping structure for table vetcare.clinical_records
CREATE TABLE IF NOT EXISTS `clinical_records` (
  `id` char(36) NOT NULL,
  `pet_id` char(36) NOT NULL,
  `visit_at` datetime NOT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `diagnosis` text,
  `treatment` text,
  `notes` text,
  `created_by` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clin_pet_id` (`pet_id`),
  KEY `idx_clin_visit_at` (`visit_at`),
  KEY `idx_clin_deleted_at` (`deleted_at`),
  KEY `fk_clin_created_by` (`created_by`),
  CONSTRAINT `fk_clin_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_clin_pet` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.clinical_records: ~0 rows (approximately)
/*!40000 ALTER TABLE `clinical_records` DISABLE KEYS */;
INSERT INTO `clinical_records` (`id`, `pet_id`, `visit_at`, `reason`, `diagnosis`, `treatment`, `notes`, `created_by`, `deleted_at`, `created_at`, `updated_at`) VALUES
	('411df8c3-20dd-11f1-b447-84a9386a5782', '0841c1f3-f726-4e43-8131-d63289d34c31', '2026-03-15 22:10:07', 'Chequeo general', 'Paciente en buen estado de salud', 'Control anual y revisión dental', 'Mascota activa y sin síntomas', '78aeabdc-20b6-11f1-b447-84a9386a5782', NULL, '2026-03-15 22:10:07', '2026-03-15 22:10:07');
/*!40000 ALTER TABLE `clinical_records` ENABLE KEYS */;

-- Dumping structure for table vetcare.consultas
CREATE TABLE IF NOT EXISTS `consultas` (
  `id` char(36) NOT NULL,
  `pet_id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `doctor_id` char(36) NOT NULL,
  `fecha` datetime NOT NULL,
  `motivo` varchar(200) DEFAULT NULL,
  `diagnostico` text,
  `observaciones` text,
  `estado` varchar(50) DEFAULT NULL,
  `gravedad` varchar(50) DEFAULT NULL,
  `proxima_cita` date DEFAULT NULL,
  `motivo_seguimiento` varchar(255) DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT NULL,
  `temperatura` decimal(4,1) DEFAULT NULL,
  `frecuencia_cardiaca` int(11) DEFAULT NULL,
  `frecuencia_respiratoria` int(11) DEFAULT NULL,
  `presion_arterial` varchar(20) DEFAULT NULL,
  `saturacion_oxigeno` int(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `atraso_notificado_at` datetime DEFAULT NULL,
  `recordatorio_manana_enviado_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_consultas_pet_id` (`pet_id`),
  KEY `idx_consultas_client_id` (`client_id`),
  KEY `idx_consultas_doctor_id` (`doctor_id`),
  KEY `idx_consultas_fecha` (`fecha`),
  KEY `idx_consultas_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_consultas_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_consultas_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_consultas_pet` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.consultas: ~14 rows (approximately)
/*!40000 ALTER TABLE `consultas` DISABLE KEYS */;
INSERT INTO `consultas` (`id`, `pet_id`, `client_id`, `doctor_id`, `fecha`, `motivo`, `diagnostico`, `observaciones`, `estado`, `gravedad`, `proxima_cita`, `motivo_seguimiento`, `peso`, `temperatura`, `frecuencia_cardiaca`, `frecuencia_respiratoria`, `presion_arterial`, `saturacion_oxigeno`, `deleted_at`, `created_at`, `updated_at`, `atraso_notificado_at`, `recordatorio_manana_enviado_at`) VALUES
	('0bbfb6fe-fb33-4f3d-99e4-c8c37f1445e7', '0841c1f3-f726-4e43-8131-d63289d34c31', 'ecccfc1a-1d15-4b57-96df-3c1a8b8a5c67', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-04-11 23:17:00', 'Incapacidad para controlar esfínteres', 'Posible daño neuronal, hernia discal no descartada', NULL, 'Abierta', 'Crítica', '2026-04-13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-10 23:16:14', '2026-04-15 13:51:20', '2026-04-15 13:51:20', NULL),
	('14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'ef1c2111-9487-43e7-a5a0-9253f6db300c', '6acd5ff6-7a16-4b74-8e6e-8722e7db6580', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-04-13 04:21:00', 'Embarazo', 'Todo en orden', NULL, 'abierta', 'moderada', '2026-04-15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46', NULL, NULL),
	('49f5e3de-940b-4592-8729-7d25fcfff08d', '5aef6194-9d25-464e-9bf7-ba7bc0c31079', '00ef06e5-207f-47fa-b7e3-d545f52033dd', 'ea74ef2a-3771-11f1-9937-005056c00001', '2026-04-13 15:52:00', 'Seguimiento por Leucemia', 'Leucemia congénita', NULL, 'abierta', 'moderada', '2026-04-14', 'Revisión de hemoglobina', 5.00, 37.4, 120, 40, '120/80', 99, NULL, '2026-04-13 15:52:21', '2026-04-15 13:51:22', '2026-04-15 13:51:22', '2026-04-13 16:01:01'),
	('6f6a15d0-494f-41b7-8dbd-72a4e41ced6c', 'ef1c2111-9487-43e7-a5a0-9253f6db300c', '6acd5ff6-7a16-4b74-8e6e-8722e7db6580', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-04-13 04:15:00', 'Chequeo general', 'Todo en orden', NULL, 'abierta', 'moderada', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-13 04:15:56', '2026-04-13 15:00:52', NULL, '2026-04-13 04:20:04'),
	('804393d0-e94e-475c-9b79-2fe5adc14050', 'ef1c2111-9487-43e7-a5a0-9253f6db300c', '6acd5ff6-7a16-4b74-8e6e-8722e7db6580', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-04-12 21:06:00', 'Dolor estomacal ', 'obstruccion', NULL, 'abierta', 'moderada', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-12 21:06:42', '2026-04-13 15:00:35', NULL, NULL),
	('8a3a081f-3efe-42da-8a33-128a432b42bc', 'ce4a63b4-dfe7-4c8a-930a-45993c05c408', 'f4294c1d-4698-4737-bbc8-db21a7db57d5', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-04-13 04:28:00', 'Control', 'Todo en orden', NULL, 'abierta', 'moderada', '2026-04-23', 'Vacuna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-13 04:26:33', '2026-04-13 04:26:33', NULL, NULL),
	('8a82c885-fe8f-4d84-abe9-b90f6aa3477f', '9f073506-a143-4167-aace-835f2c450b5c', 'caf7d7b8-1dbd-4e2e-bd1e-f0701a06f9eb', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-04-12 12:40:00', 'Control rutinario', 'Todo en orden', NULL, 'Cerrada', 'Leve', '2027-01-14', 'Chequeo general', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-12 12:40:34', '2026-04-13 14:35:18', NULL, '2026-04-13 00:00:03'),
	('a5c31c7d-9c84-4567-8235-5593f076af2e', '0841c1f3-f726-4e43-8131-d63289d34c31', 'ecccfc1a-1d15-4b57-96df-3c1a8b8a5c67', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-04-13 04:26:00', 'Cuidado post-quirúrgico', 'Todo en orden', 'Comportamiento ideal', 'Seguimiento', 'Moderada', '2026-04-18', 'Parte del tratamiento', 2.00, 45.4, 74, 78, '445/222', 52, NULL, '2026-04-13 04:22:36', '2026-04-13 14:44:11', NULL, NULL),
	('ac502a1f-cb91-4324-b185-19b21cf20d96', '9f073506-a143-4167-aace-835f2c450b5c', 'caf7d7b8-1dbd-4e2e-bd1e-f0701a06f9eb', 'ea74e932-3771-11f1-9937-005056c00001', '2026-04-13 19:45:00', 'dolor', 'todo bien', NULL, 'abierta', 'moderada', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-13 19:45:08', '2026-04-13 19:45:08', NULL, NULL),
	('bc725b30-0bec-410e-87bc-f08fc21f9eb7', '0841c1f3-f726-4e43-8131-d63289d34c31', 'ecccfc1a-1d15-4b57-96df-3c1a8b8a5c67', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-03-16 13:33:00', 'Dolor en la pata trasera', 'Pequeña picadura de abeja', 'Hinchazón leve ', 'Cerrada', 'Leve', NULL, NULL, 5.00, 38.5, 80, 17, '120/80', 98, NULL, '2026-03-16 13:34:22', '2026-04-13 14:46:37', '2026-04-12 20:52:44', NULL),
	('bf605227-0c89-4e19-9198-2dab63b8f487', 'ef1c2111-9487-43e7-a5a0-9253f6db300c', '6acd5ff6-7a16-4b74-8e6e-8722e7db6580', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-04-13 04:15:00', 'Dolor de muelas', 'Posible gingivitis', NULL, 'Abierta', 'Moderada', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-13 04:15:14', '2026-04-13 15:09:08', NULL, NULL),
	('d403f4f1-8ca1-48be-b8f2-2fa37c268c90', 'ef1c2111-9487-43e7-a5a0-9253f6db300c', '6acd5ff6-7a16-4b74-8e6e-8722e7db6580', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-04-12 21:07:00', 'Aplicación de pipeta antiparasitaria', 'Pulgas', NULL, 'Cerrada', 'moderada', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-12 21:07:35', '2026-04-13 14:39:27', NULL, '2026-04-12 21:10:06'),
	('e7217c55-002c-46c9-b602-c5e9875facc3', 'ce4a63b4-dfe7-4c8a-930a-45993c05c408', 'f4294c1d-4698-4737-bbc8-db21a7db57d5', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-04-13 03:35:00', 'Operación de fractura de fémur', 'Fractura parcial del perineo y del ocito', 'Posible daño tendinal ', 'cerrada', 'leve', NULL, NULL, 4.00, 38.5, 80, 20, '120/80', 98, NULL, '2026-04-13 03:35:59', '2026-04-13 15:00:58', NULL, NULL),
	('f5cdb298-8409-4353-af0d-479255ca9c00', 'f38af6eb-e907-406a-83da-eaf3a89c1e6d', 'b69282fe-0bfb-43a6-9275-7c462e490f34', 'c0e0d2c5-20dc-11f1-b447-84a9386a5782', '2026-04-13 04:28:00', 'Control', 'Nada que agregar', NULL, 'abierta', 'moderada', '2026-04-12', 'Rutina', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-13 04:28:18', '2026-04-13 15:01:13', NULL, NULL);
/*!40000 ALTER TABLE `consultas` ENABLE KEYS */;

-- Dumping structure for table vetcare.consulta_adjuntos
CREATE TABLE IF NOT EXISTS `consulta_adjuntos` (
  `id` char(36) NOT NULL,
  `consulta_id` char(36) NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_archivo` varchar(500) NOT NULL,
  `tipo_archivo` varchar(100) DEFAULT NULL,
  `tamano_bytes` bigint(20) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consulta_adjuntos_consulta_id` (`consulta_id`),
  KEY `idx_consulta_adjuntos_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_consulta_adjuntos_consulta` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.consulta_adjuntos: ~0 rows (approximately)
/*!40000 ALTER TABLE `consulta_adjuntos` DISABLE KEYS */;
/*!40000 ALTER TABLE `consulta_adjuntos` ENABLE KEYS */;

-- Dumping structure for table vetcare.consulta_analisis
CREATE TABLE IF NOT EXISTS `consulta_analisis` (
  `id` char(36) NOT NULL,
  `consulta_id` char(36) NOT NULL,
  `analisis` varchar(255) NOT NULL,
  `resultado_observacion` text,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consulta_analisis_consulta_id` (`consulta_id`),
  KEY `idx_consulta_analisis_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_consulta_analisis_consulta` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.consulta_analisis: ~3 rows (approximately)
/*!40000 ALTER TABLE `consulta_analisis` DISABLE KEYS */;
INSERT INTO `consulta_analisis` (`id`, `consulta_id`, `analisis`, `resultado_observacion`, `deleted_at`, `created_at`, `updated_at`) VALUES
	('2a4e86d1-cd30-4797-949b-72139fd813a4', 'e7217c55-002c-46c9-b602-c5e9875facc3', 'Radiografía', 'Heritrocitos elevados ', NULL, '2026-04-13 03:35:59', '2026-04-13 03:35:59'),
	('349f9e91-5985-4171-b5fa-1bb4fc0bd138', 'bc725b30-0bec-410e-87bc-f08fc21f9eb7', '123123564756', NULL, NULL, '2026-03-16 13:34:22', '2026-03-16 13:34:22'),
	('4df87757-b566-4e88-b529-97a9f97e41f1', '49f5e3de-940b-4592-8729-7d25fcfff08d', 'Perfil sanguíneo', 'Hemoglobina baja', NULL, '2026-04-13 15:52:21', '2026-04-13 15:52:21'),
	('e6454294-2fce-4bb2-95e8-6519cf3f50df', 'e7217c55-002c-46c9-b602-c5e9875facc3', 'Hemograma', 'Heritrocitos elevados ', NULL, '2026-04-13 03:35:59', '2026-04-13 03:35:59');
/*!40000 ALTER TABLE `consulta_analisis` ENABLE KEYS */;

-- Dumping structure for table vetcare.consulta_embarazo
CREATE TABLE IF NOT EXISTS `consulta_embarazo` (
  `id` char(36) NOT NULL,
  `consulta_id` char(36) NOT NULL,
  `meses_gestacion` decimal(4,1) DEFAULT NULL,
  `cantidad_crias` int(11) DEFAULT NULL,
  `riesgo` enum('bajo','alto') NOT NULL DEFAULT 'bajo',
  `tipo_parto` enum('normal','cesarea') DEFAULT NULL,
  `fecha_probable_parto` date DEFAULT NULL,
  `observaciones_embarazo` text,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_consulta_embarazo_consulta` (`consulta_id`),
  CONSTRAINT `fk_consulta_embarazo_consulta` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.consulta_embarazo: ~0 rows (approximately)
/*!40000 ALTER TABLE `consulta_embarazo` DISABLE KEYS */;
INSERT INTO `consulta_embarazo` (`id`, `consulta_id`, `meses_gestacion`, `cantidad_crias`, `riesgo`, `tipo_parto`, `fecha_probable_parto`, `observaciones_embarazo`, `deleted_at`, `created_at`, `updated_at`) VALUES
	('f76495b3-e669-42eb-b38a-d5bd6890fecc', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 3.0, 7, 'bajo', 'cesarea', '2026-04-14', NULL, NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46');
/*!40000 ALTER TABLE `consulta_embarazo` ENABLE KEYS */;

-- Dumping structure for table vetcare.consulta_medicaciones
CREATE TABLE IF NOT EXISTS `consulta_medicaciones` (
  `id` char(36) NOT NULL,
  `consulta_id` char(36) NOT NULL,
  `medicamento` varchar(255) NOT NULL,
  `indicaciones` text,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consulta_medicaciones_consulta_id` (`consulta_id`),
  KEY `idx_consulta_medicaciones_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_consulta_medicaciones_consulta` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.consulta_medicaciones: ~4 rows (approximately)
/*!40000 ALTER TABLE `consulta_medicaciones` DISABLE KEYS */;
INSERT INTO `consulta_medicaciones` (`id`, `consulta_id`, `medicamento`, `indicaciones`, `deleted_at`, `created_at`, `updated_at`) VALUES
	('4db49762-eb23-4233-b3c5-a7f5b2ad8d2c', 'f5cdb298-8409-4353-af0d-479255ca9c00', 'Aciflux', '10ml c/12h', NULL, '2026-04-13 04:28:18', '2026-04-13 04:28:18'),
	('6638f1ba-5680-404f-9260-4ecd77ac2d0b', 'bc725b30-0bec-410e-87bc-f08fc21f9eb7', 'Meloxican', NULL, NULL, '2026-03-16 13:34:22', '2026-04-13 14:47:52'),
	('81d3bcac-f4a7-4e51-b34a-e3d0bda9b8bf', '8a3a081f-3efe-42da-8a33-128a432b42bc', 'Aciflux', '5ml cada 12 horas', NULL, '2026-04-13 04:26:33', '2026-04-13 04:26:33'),
	('e267e48a-23f0-47ac-ac46-422081568773', '49f5e3de-940b-4592-8729-7d25fcfff08d', 'Cilafx', '1 tableta c/12hrs', NULL, '2026-04-13 15:52:21', '2026-04-13 15:52:21'),
	('f34ca27e-b180-4e59-892c-090359c31792', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'Paroben', NULL, NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46');
/*!40000 ALTER TABLE `consulta_medicaciones` ENABLE KEYS */;

-- Dumping structure for table vetcare.consulta_recordatorios
CREATE TABLE IF NOT EXISTS `consulta_recordatorios` (
  `id` char(36) NOT NULL,
  `consulta_id` char(36) NOT NULL,
  `tipo` enum('cita_proxima','cita_hoy') NOT NULL,
  `enviado_a` varchar(255) NOT NULL,
  `enviado_en` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.consulta_recordatorios: ~0 rows (approximately)
/*!40000 ALTER TABLE `consulta_recordatorios` DISABLE KEYS */;
/*!40000 ALTER TABLE `consulta_recordatorios` ENABLE KEYS */;

-- Dumping structure for table vetcare.consulta_tipos
CREATE TABLE IF NOT EXISTS `consulta_tipos` (
  `id` char(36) NOT NULL,
  `consulta_id` char(36) NOT NULL,
  `tipo_consulta_id` char(36) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consulta_tipos_consulta_id` (`consulta_id`),
  KEY `idx_consulta_tipos_tipo_consulta_id` (`tipo_consulta_id`),
  KEY `idx_consulta_tipos_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_consulta_tipos_consulta` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_consulta_tipos_tipo` FOREIGN KEY (`tipo_consulta_id`) REFERENCES `tipos_consulta` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.consulta_tipos: ~22 rows (approximately)
/*!40000 ALTER TABLE `consulta_tipos` DISABLE KEYS */;
INSERT INTO `consulta_tipos` (`id`, `consulta_id`, `tipo_consulta_id`, `deleted_at`, `created_at`, `updated_at`) VALUES
	('0a07f60c-02cd-41ee-8893-c158ea6b5826', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'c906b90f-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46'),
	('0c7fce87-740a-4dc9-8231-a08801b47022', '804393d0-e94e-475c-9b79-2fe5adc14050', 'c906b94c-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-12 21:06:42', '2026-04-12 21:06:42'),
	('193bdb72-8b7a-4adb-bf47-00d71b234d50', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'c906b94c-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46'),
	('30348edf-6381-4f8a-863e-f2be57fde1e1', '49f5e3de-940b-4592-8729-7d25fcfff08d', 'c906b90f-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 15:52:21', '2026-04-13 15:52:21'),
	('35aff0da-fd30-4944-af39-1d4128a28e74', 'e7217c55-002c-46c9-b602-c5e9875facc3', 'c906b94c-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 03:35:59', '2026-04-13 03:35:59'),
	('397404b3-ea0a-4828-8cd2-8e8ab160fe86', 'ac502a1f-cb91-4324-b185-19b21cf20d96', 'c906b94c-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 19:45:08', '2026-04-13 19:45:08'),
	('3b75f116-5970-4057-8772-032c628dc513', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'a33ab3ca-265a-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46'),
	('552057a8-1e6f-4570-a670-1d7e448fd3f9', 'e7217c55-002c-46c9-b602-c5e9875facc3', 'c906ba01-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 03:35:59', '2026-04-13 03:35:59'),
	('6cdbf746-ac89-4f43-b6d3-d81f39b4f31d', 'bf605227-0c89-4e19-9198-2dab63b8f487', 'c906b9ca-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:15:14', '2026-04-13 04:15:14'),
	('6cfcc022-abe3-4966-9809-5c3bd4810e9b', 'f5cdb298-8409-4353-af0d-479255ca9c00', 'c906ba01-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:28:18', '2026-04-13 04:28:18'),
	('7cd6e2f0-4101-4971-89f5-803f78ca32fb', '6f6a15d0-494f-41b7-8dbd-72a4e41ced6c', 'c906ba01-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:15:56', '2026-04-13 04:15:56'),
	('7d98195f-074c-4252-8d5f-efbaa59e3fd9', '8a3a081f-3efe-42da-8a33-128a432b42bc', 'c906ba01-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:26:33', '2026-04-13 04:26:33'),
	('82d28d97-dab3-4aa4-a3e2-10cd8738b92e', 'a5c31c7d-9c84-4567-8235-5593f076af2e', 'c906b94c-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:22:36', '2026-04-13 04:22:36'),
	('8a9b673f-4d88-4c38-8a26-1f6db6689165', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'c906af20-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46'),
	('939aa282-86df-4118-8f67-2732bf69d21a', '8a82c885-fe8f-4d84-abe9-b90f6aa3477f', 'c906ba01-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-12 12:40:34', '2026-04-12 12:40:34'),
	('9cda2bf8-cd55-4b6c-a3a5-55646572e832', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'c906ba3b-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46'),
	('a686c620-71f9-41e4-ae05-d254f4f5902b', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'c906b9ca-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46'),
	('aa22c970-2e6d-4f5a-a8f3-1fa7843c83b4', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'c906b98c-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46'),
	('be1cc9fa-0dd0-4842-b057-a3f67654f2cc', 'd403f4f1-8ca1-48be-b8f2-2fa37c268c90', 'c906b9ca-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-12 21:07:35', '2026-04-12 21:07:35'),
	('c33b9d49-8c03-42cb-8656-da1f62f22422', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'c906ba01-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46'),
	('e5152cc9-48e7-4b71-bc4e-55c2201bc7b8', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'c906b877-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46'),
	('f1a4d998-dd27-473f-bd6c-303a68cde7c6', '0bbfb6fe-fb33-4f3d-99e4-c8c37f1445e7', 'c906ba01-2635-11f1-9ae4-84a9386a5782', NULL, '2026-04-10 23:16:14', '2026-04-10 23:16:14');
/*!40000 ALTER TABLE `consulta_tipos` ENABLE KEYS */;

-- Dumping structure for table vetcare.consulta_vacunas
CREATE TABLE IF NOT EXISTS `consulta_vacunas` (
  `id` char(36) NOT NULL,
  `consulta_id` char(36) NOT NULL,
  `vacuna` varchar(255) NOT NULL,
  `lote_observaciones` varchar(255) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consulta_vacunas_consulta_id` (`consulta_id`),
  KEY `idx_consulta_vacunas_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_consulta_vacunas_consulta` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.consulta_vacunas: ~3 rows (approximately)
/*!40000 ALTER TABLE `consulta_vacunas` DISABLE KEYS */;
INSERT INTO `consulta_vacunas` (`id`, `consulta_id`, `vacuna`, `lote_observaciones`, `deleted_at`, `created_at`, `updated_at`) VALUES
	('1e950b57-2002-45ae-b44d-01fc2607718c', 'bc725b30-0bec-410e-87bc-f08fc21f9eb7', 'rabia', NULL, NULL, '2026-03-16 13:34:22', '2026-03-16 13:34:22'),
	('36f0e136-c409-4086-b094-62e462eb2bc0', '14ec7c78-3824-48df-b8ec-3ae0b269a9c6', 'Rabia', NULL, NULL, '2026-04-13 04:19:46', '2026-04-13 04:19:46');
/*!40000 ALTER TABLE `consulta_vacunas` ENABLE KEYS */;

-- Dumping structure for table vetcare.contracts
CREATE TABLE IF NOT EXISTS `contracts` (
  `id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `pet_id` char(36) DEFAULT NULL,
  `contract_type` varchar(40) NOT NULL,
  `title` varchar(120) NOT NULL,
  `body_text` longtext NOT NULL,
  `signed_at` datetime DEFAULT NULL,
  `signed_by_name` varchar(160) DEFAULT NULL,
  `signature_data` longtext,
  `created_by` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contracts_client_id` (`client_id`),
  KEY `idx_contracts_pet_id` (`pet_id`),
  KEY `idx_contracts_deleted_at` (`deleted_at`),
  KEY `fk_contracts_created_by` (`created_by`),
  CONSTRAINT `fk_contracts_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `fk_contracts_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_contracts_pet` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.contracts: ~0 rows (approximately)
/*!40000 ALTER TABLE `contracts` DISABLE KEYS */;
/*!40000 ALTER TABLE `contracts` ENABLE KEYS */;

-- Dumping structure for table vetcare.doctors
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `specialty` varchar(100) DEFAULT NULL,
  `license_number` varchar(60) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doctors_user_id` (`user_id`),
  KEY `idx_doctors_full_name` (`full_name`),
  KEY `idx_doctors_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_doctors_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.doctors: ~3 rows (approximately)
/*!40000 ALTER TABLE `doctors` DISABLE KEYS */;
INSERT INTO `doctors` (`id`, `user_id`, `full_name`, `specialty`, `license_number`, `deleted_at`, `created_at`, `updated_at`) VALUES
	('c0e0d2c5-20dc-11f1-b447-84a9386a5782', '78aeabdc-20b6-11f1-b447-84a9386a5782', 'Dr. Juan Pérez', 'Medicina Veterinaria General', 'VET-001', NULL, '2026-03-15 22:06:32', '2026-03-15 22:06:32'),
	('ea74e932-3771-11f1-9937-005056c00001', '2e8defd5-9d28-42ff-ab6d-c2a2e4cb07bf', 'Dr. Carlos Ramírez', 'Dermatología Veterinaria', 'VET-003', NULL, '2026-04-13 15:49:42', '2026-04-13 15:49:42'),
	('ea74ef2a-3771-11f1-9937-005056c00001', 'dd916a39-89c5-4906-a0bb-d9c664249b8d', 'Dra. Ana Fernández', 'Medicina Interna Veterinaria', 'VET-004', NULL, '2026-04-13 15:49:42', '2026-04-13 15:49:42');
/*!40000 ALTER TABLE `doctors` ENABLE KEYS */;

-- Dumping structure for table vetcare.pets
CREATE TABLE IF NOT EXISTS `pets` (
  `id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `name` varchar(80) NOT NULL,
  `species` varchar(50) DEFAULT NULL,
  `breed` varchar(80) DEFAULT NULL,
  `sex` enum('MALE','FEMALE','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `birth_date` date DEFAULT NULL,
  `weight_kg` decimal(6,2) DEFAULT NULL,
  `health_status` varchar(50) DEFAULT NULL,
  `doctor_notes` text,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `age_years` decimal(10,0) DEFAULT NULL,
  `weight_text` varchar(50) DEFAULT NULL,
  `observations` text,
  PRIMARY KEY (`id`),
  KEY `idx_pets_client_id` (`client_id`),
  KEY `idx_pets_name` (`name`),
  KEY `idx_pets_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_pets_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.pets: ~9 rows (approximately)
/*!40000 ALTER TABLE `pets` DISABLE KEYS */;
INSERT INTO `pets` (`id`, `client_id`, `name`, `species`, `breed`, `sex`, `birth_date`, `weight_kg`, `health_status`, `doctor_notes`, `deleted_at`, `created_at`, `updated_at`, `age_years`, `weight_text`, `observations`) VALUES
	('0841c1f3-f726-4e43-8131-d63289d34c31', 'ecccfc1a-1d15-4b57-96df-3c1a8b8a5c67', 'Karla', NULL, 'Pastor Alemán', 'FEMALE', NULL, 5.12, NULL, NULL, NULL, '2026-03-09 15:21:53', '2026-04-13 01:48:13', 2, '5.12', NULL),
	('5aef6194-9d25-464e-9bf7-ba7bc0c31079', '00ef06e5-207f-47fa-b7e3-d545f52033dd', 'Prisma', NULL, 'Mestiza', 'MALE', NULL, 20.00, NULL, NULL, NULL, '2026-04-13 15:42:53', '2026-04-13 15:42:53', 7, '20', NULL),
	('9f073506-a143-4167-aace-835f2c450b5c', 'caf7d7b8-1dbd-4e2e-bd1e-f0701a06f9eb', 'Gala', NULL, 'Bulldog', 'FEMALE', NULL, 2.00, NULL, NULL, NULL, '2026-03-09 20:00:16', '2026-04-13 01:48:23', 2, '2', NULL),
	('b0326bde-c669-4225-a06c-9772aae10d23', 'ecccfc1a-1d15-4b57-96df-3c1a8b8a5c67', 'Kiara', NULL, 'Mainecoon', 'MALE', NULL, 5.80, NULL, NULL, NULL, '2026-03-09 15:31:36', '2026-04-13 01:48:34', 8, '5.8', NULL),
	('ca340348-0588-49fd-97f6-3023ca6a600b', 'f4294c1d-4698-4737-bbc8-db21a7db57d5', 'Sachi', NULL, 'Mestiza', 'MALE', NULL, 4.00, NULL, NULL, NULL, '2026-04-05 20:13:26', '2026-04-13 01:48:41', 2, '4', NULL),
	('ce4a63b4-dfe7-4c8a-930a-45993c05c408', 'f4294c1d-4698-4737-bbc8-db21a7db57d5', 'Sky', NULL, 'Mestiza', 'MALE', NULL, 4.00, NULL, NULL, NULL, '2026-04-05 20:12:59', '2026-04-13 01:48:45', 2, '4', NULL),
	('da6a3817-37b1-4f32-855e-0807dea43451', '3931bed7-a78e-4545-943a-4c3af5f5b0cc', 'Zeus', NULL, 'Shit zu', 'FEMALE', NULL, 2.00, NULL, NULL, NULL, '2026-03-16 00:37:43', '2026-04-13 15:07:00', 2, '2.00', NULL),
	('ef1c2111-9487-43e7-a5a0-9253f6db300c', '6acd5ff6-7a16-4b74-8e6e-8722e7db6580', 'Cian', NULL, 'Mestiza', 'FEMALE', NULL, 8.00, NULL, NULL, NULL, '2026-04-12 21:05:43', '2026-04-13 03:08:18', 1, '8.00', 'Alergia a las bananas'),
	('f38af6eb-e907-406a-83da-eaf3a89c1e6d', 'b69282fe-0bfb-43a6-9275-7c462e490f34', 'Loki', NULL, 'Mestiza', 'FEMALE', NULL, 5.00, NULL, NULL, '2026-04-13 19:45:33', '2026-03-09 14:37:31', '2026-04-13 19:45:33', 2, '5.00', NULL);
/*!40000 ALTER TABLE `pets` ENABLE KEYS */;

-- Dumping structure for table vetcare.pet_ownership_history
CREATE TABLE IF NOT EXISTS `pet_ownership_history` (
  `id` char(36) NOT NULL,
  `pet_id` char(36) NOT NULL,
  `client_id` char(36) NOT NULL,
  `from_date` date NOT NULL,
  `to_date` date DEFAULT NULL,
  `note` text,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_own_pet_id` (`pet_id`),
  KEY `idx_own_client_id` (`client_id`),
  KEY `idx_own_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_own_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`),
  CONSTRAINT `fk_own_pet` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.pet_ownership_history: ~0 rows (approximately)
/*!40000 ALTER TABLE `pet_ownership_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `pet_ownership_history` ENABLE KEYS */;

-- Dumping structure for table vetcare.tipos_consulta
CREATE TABLE IF NOT EXISTS `tipos_consulta` (
  `id` char(36) NOT NULL,
  `codigo` varchar(30) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipos_consulta_codigo` (`codigo`),
  KEY `idx_tipos_consulta_nombre` (`nombre`),
  KEY `idx_tipos_consulta_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.tipos_consulta: ~9 rows (approximately)
/*!40000 ALTER TABLE `tipos_consulta` DISABLE KEYS */;
INSERT INTO `tipos_consulta` (`id`, `codigo`, `nombre`, `deleted_at`, `created_at`, `updated_at`) VALUES
	('a33ab3ca-265a-11f1-9ae4-84a9386a5782', 'emb', 'Embarazo', NULL, '2026-03-22 21:50:15', '2026-03-22 21:50:15'),
	('c906af20-2635-11f1-9ae4-84a9386a5782', 'vac', 'Vacuna', NULL, '2026-03-22 17:26:27', '2026-03-22 17:26:27'),
	('c906b877-2635-11f1-9ae4-84a9386a5782', 'gen', 'Examen general', NULL, '2026-03-22 17:26:27', '2026-03-22 17:26:27'),
	('c906b90f-2635-11f1-9ae4-84a9386a5782', 'ill', 'Enfermedad', NULL, '2026-03-22 17:26:27', '2026-03-22 17:26:27'),
	('c906b94c-2635-11f1-9ae4-84a9386a5782', 'sur', 'Cirugía', NULL, '2026-03-22 17:26:27', '2026-03-22 17:26:27'),
	('c906b98c-2635-11f1-9ae4-84a9386a5782', 'med', 'Medicación', NULL, '2026-03-22 17:26:27', '2026-03-22 17:26:27'),
	('c906b9ca-2635-11f1-9ae4-84a9386a5782', 'den', 'Dental', NULL, '2026-03-22 17:26:27', '2026-03-22 17:26:27'),
	('c906ba01-2635-11f1-9ae4-84a9386a5782', 'rou', 'Control rutinario', NULL, '2026-03-22 17:26:27', '2026-03-22 17:26:27'),
	('c906ba3b-2635-11f1-9ae4-84a9386a5782', 'eme', 'Emergencia', NULL, '2026-03-22 17:26:27', '2026-03-22 17:26:27');
/*!40000 ALTER TABLE `tipos_consulta` ENABLE KEYS */;

-- Dumping structure for table vetcare.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) NOT NULL,
  `username` varchar(60) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMIN','DOCTOR','STAFF') NOT NULL DEFAULT 'DOCTOR',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  KEY `idx_users_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.users: ~7 rows (approximately)
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `deleted_at`, `created_at`, `updated_at`) VALUES
	('2e8defd5-9d28-42ff-ab6d-c2a2e4cb07bf', 'esmeraldamora1111@gmail.com', '$2b$10$qMP47bKq9hkeSao2ycXs0OSvsDj102jrNN8lIxzJMeuibdcNIwNX6', 'ADMIN', NULL, '2026-03-30 19:17:31', '2026-03-30 19:17:31'),
	('49163832-fdf5-42f1-bd5d-9265b456b218', 'esmeralda098@gmail.com', '$2b$10$2fASwU8MmbaFpsrPBwGfXeO56L9adP8KbhxPGjhaPvFjUoYs8kTRW', 'ADMIN', NULL, '2026-04-06 16:17:58', '2026-04-06 16:17:58'),
	('78aeabdc-20b6-11f1-b447-84a9386a5782', 'doctor1', '$2b$10$X/SU6O8H1Iviz3IDnPDZkuQKUvqJpJZlypCJYeUMS1l5BUFVACNXe', 'ADMIN', NULL, '2026-03-15 17:32:30', '2026-03-15 17:38:29'),
	('99ac9308-1177-4330-af5b-9245fbb2a294', 'admin', '$2b$10$oIjPTPjFrkjhQCJ0CrT0meiu3.NhTJ7RyLbUcGlmcuWOA395hyw/m', 'ADMIN', NULL, '2026-03-05 22:06:02', '2026-03-05 22:06:02'),
	('dd916a39-89c5-4906-a0bb-d9c664249b8d', 'jairolopez@gmail.com', '$2b$10$Sni2qBIwPkII9gwh.pnoEOBEJmzgycEuOWrF029IceXLtfagIG4iq', 'ADMIN', NULL, '2026-03-15 18:25:37', '2026-03-15 18:25:37'),
	('f4ffee12-88e9-4a43-8937-0a027b265519', 'maripari98@gmail.com', '$2b$10$TFgSa7/vvIFVW6xGFWMMIuWLMRH4sFzERMwiQF.nrX2bifjBxKJHK', 'ADMIN', NULL, '2026-04-13 13:55:38', '2026-04-13 13:56:33'),
	('f91a9392-3077-45f5-882d-7a7f956c8eca', 'doctor2', '$2b$10$F7w7fg8Gx.owMO1gpS8wo.zWvn08E3DBntrO2yAf17dWBa8z5iE4e', 'ADMIN', NULL, '2026-03-15 17:46:27', '2026-03-15 17:46:27');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;

-- Dumping structure for table vetcare.vaccinations
CREATE TABLE IF NOT EXISTS `vaccinations` (
  `id` char(36) NOT NULL,
  `pet_id` char(36) NOT NULL,
  `vaccine_name` varchar(120) NOT NULL,
  `applied_on` date DEFAULT NULL,
  `next_due_on` date DEFAULT NULL,
  `notes` text,
  `created_by` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vax_pet_id` (`pet_id`),
  KEY `idx_vax_next_due` (`next_due_on`),
  KEY `idx_vax_deleted_at` (`deleted_at`),
  KEY `fk_vax_created_by` (`created_by`),
  CONSTRAINT `fk_vax_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vax_pet` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table vetcare.vaccinations: ~0 rows (approximately)
/*!40000 ALTER TABLE `vaccinations` DISABLE KEYS */;
/*!40000 ALTER TABLE `vaccinations` ENABLE KEYS */;

-- Dumping structure for view vetcare.v_active_appointments
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `v_active_appointments` (
	`id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`client_id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`pet_id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`scheduled_at` DATETIME NOT NULL,
	`status` ENUM('SCHEDULED','CONFIRMED','CANCELLED','COMPLETED','NO_SHOW') NOT NULL COLLATE 'latin1_swedish_ci',
	`reason` VARCHAR(200) NULL COLLATE 'latin1_swedish_ci',
	`notes` TEXT NULL COLLATE 'latin1_swedish_ci',
	`created_by` CHAR(36) NULL COLLATE 'latin1_swedish_ci',
	`deleted_at` DATETIME NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view vetcare.v_active_clients
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `v_active_clients` (
	`id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`first_name` VARCHAR(80) NOT NULL COLLATE 'latin1_swedish_ci',
	`last_name` VARCHAR(80) NOT NULL COLLATE 'latin1_swedish_ci',
	`national_id` CHAR(13) NOT NULL COLLATE 'latin1_swedish_ci',
	`email` VARCHAR(120) NULL COLLATE 'latin1_swedish_ci',
	`phone_primary` CHAR(12) NOT NULL COLLATE 'latin1_swedish_ci',
	`phone_secondary` CHAR(12) NULL COLLATE 'latin1_swedish_ci',
	`address_line1` VARCHAR(120) NULL COLLATE 'latin1_swedish_ci',
	`address_line2` VARCHAR(120) NULL COLLATE 'latin1_swedish_ci',
	`city` VARCHAR(80) NULL COLLATE 'latin1_swedish_ci',
	`province_state` VARCHAR(80) NULL COLLATE 'latin1_swedish_ci',
	`notes` TEXT NULL COLLATE 'latin1_swedish_ci',
	`deleted_at` DATETIME NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view vetcare.v_active_clinical_records
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `v_active_clinical_records` (
	`id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`pet_id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`visit_at` DATETIME NOT NULL,
	`reason` VARCHAR(200) NULL COLLATE 'latin1_swedish_ci',
	`diagnosis` TEXT NULL COLLATE 'latin1_swedish_ci',
	`treatment` TEXT NULL COLLATE 'latin1_swedish_ci',
	`notes` TEXT NULL COLLATE 'latin1_swedish_ci',
	`created_by` CHAR(36) NULL COLLATE 'latin1_swedish_ci',
	`deleted_at` DATETIME NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view vetcare.v_active_contracts
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `v_active_contracts` (
	`id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`client_id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`pet_id` CHAR(36) NULL COLLATE 'latin1_swedish_ci',
	`contract_type` VARCHAR(40) NOT NULL COLLATE 'latin1_swedish_ci',
	`title` VARCHAR(120) NOT NULL COLLATE 'latin1_swedish_ci',
	`body_text` LONGTEXT NOT NULL COLLATE 'latin1_swedish_ci',
	`signed_at` DATETIME NULL,
	`signed_by_name` VARCHAR(160) NULL COLLATE 'latin1_swedish_ci',
	`signature_data` LONGTEXT NULL COLLATE 'latin1_swedish_ci',
	`created_by` CHAR(36) NULL COLLATE 'latin1_swedish_ci',
	`deleted_at` DATETIME NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view vetcare.v_active_pets
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `v_active_pets` (
	`id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`client_id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`name` VARCHAR(80) NOT NULL COLLATE 'latin1_swedish_ci',
	`species` VARCHAR(50) NULL COLLATE 'latin1_swedish_ci',
	`breed` VARCHAR(80) NULL COLLATE 'latin1_swedish_ci',
	`sex` ENUM('MALE','FEMALE','UNKNOWN') NOT NULL COLLATE 'latin1_swedish_ci',
	`birth_date` DATE NULL,
	`weight_kg` DECIMAL(6,2) NULL,
	`health_status` VARCHAR(50) NULL COLLATE 'latin1_swedish_ci',
	`doctor_notes` TEXT NULL COLLATE 'latin1_swedish_ci',
	`deleted_at` DATETIME NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL,
	`age_years` DECIMAL(10,0) NULL,
	`weight_text` VARCHAR(50) NULL COLLATE 'latin1_swedish_ci',
	`observations` TEXT NULL COLLATE 'latin1_swedish_ci'
) ENGINE=MyISAM;

-- Dumping structure for view vetcare.v_active_vaccinations
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `v_active_vaccinations` (
	`id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`pet_id` CHAR(36) NOT NULL COLLATE 'latin1_swedish_ci',
	`vaccine_name` VARCHAR(120) NOT NULL COLLATE 'latin1_swedish_ci',
	`applied_on` DATE NULL,
	`next_due_on` DATE NULL,
	`notes` TEXT NULL COLLATE 'latin1_swedish_ci',
	`created_by` CHAR(36) NULL COLLATE 'latin1_swedish_ci',
	`deleted_at` DATETIME NULL,
	`created_at` DATETIME NOT NULL,
	`updated_at` DATETIME NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for trigger vetcare.format_phone_before_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';
DELIMITER //
CREATE TRIGGER `format_phone_before_insert` BEFORE INSERT ON `clients` FOR EACH ROW SET NEW.phone_primary =
  CONCAT(
    SUBSTRING(NEW.phone_primary,1,3),'-',
    SUBSTRING(NEW.phone_primary,4,3),'-',
    SUBSTRING(NEW.phone_primary,7,4)
  )//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for view vetcare.v_active_appointments
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `v_active_appointments`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_active_appointments` AS SELECT * FROM appointments WHERE deleted_at IS NULL ;

-- Dumping structure for view vetcare.v_active_clients
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `v_active_clients`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_active_clients` AS SELECT * FROM clients WHERE deleted_at IS NULL ;

-- Dumping structure for view vetcare.v_active_clinical_records
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `v_active_clinical_records`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_active_clinical_records` AS SELECT * FROM clinical_records WHERE deleted_at IS NULL ;

-- Dumping structure for view vetcare.v_active_contracts
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `v_active_contracts`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_active_contracts` AS SELECT * FROM contracts WHERE deleted_at IS NULL ;

-- Dumping structure for view vetcare.v_active_pets
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `v_active_pets`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_active_pets` AS SELECT * FROM pets WHERE deleted_at IS NULL ;

-- Dumping structure for view vetcare.v_active_vaccinations
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `v_active_vaccinations`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_active_vaccinations` AS SELECT * FROM vaccinations WHERE deleted_at IS NULL ;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
