CREATE TYPE "public"."user_role" AS ENUM('lider', 'miembro', 'ciudadano');--> statement-breakpoint
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_rol_id_roles_id_fk";--> statement-breakpoint
ALTER TABLE "roles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "roles";--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "rol" "public"."user_role" DEFAULT 'ciudadano' NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" DROP COLUMN "rol_id";