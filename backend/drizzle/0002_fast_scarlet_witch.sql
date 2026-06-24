ALTER TABLE "reportes" ALTER COLUMN "estado" SET DEFAULT 'pendiente';--> statement-breakpoint
ALTER TABLE "reportes" ALTER COLUMN "estado" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "gestiones_directiva" ADD CONSTRAINT "chk_gestiones_estado_asignado" CHECK ("gestiones_directiva"."estado_asignado" IN ('pendiente', 'en_gestion', 'solucionado'));--> statement-breakpoint
ALTER TABLE "reportes" ADD CONSTRAINT "chk_reportes_estado" CHECK ("reportes"."estado" IN ('pendiente', 'en_gestion', 'solucionado'));