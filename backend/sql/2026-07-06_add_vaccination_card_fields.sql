-- Migration: add vaccination-card fields to consulta_vacunas (MySQL / live DB)
-- Run against the live MySQL database used by backend/server.js.
-- All columns are nullable, so this is non-breaking for existing rows.

ALTER TABLE `consulta_vacunas`
  ADD COLUMN `fecha_aplicacion` DATE         NULL AFTER `vacuna`,
  ADD COLUMN `fecha_refuerzo`   DATE         NULL AFTER `fecha_aplicacion`,
  ADD COLUMN `lote`             VARCHAR(80)  NULL AFTER `fecha_refuerzo`,
  ADD COLUMN `laboratorio`      VARCHAR(120) NULL AFTER `lote`,
  ADD COLUMN `veterinario`      VARCHAR(160) NULL AFTER `laboratorio`;
