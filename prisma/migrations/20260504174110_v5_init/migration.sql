-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'manager', 'user');

-- CreateEnum
CREATE TYPE "DashboardItemType" AS ENUM ('deadline', 'todo', 'action_item', 'meeting');

-- CreateEnum
CREATE TYPE "DashboardPriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "DashboardStatus" AS ENUM ('pending', 'in_progress', 'completed', 'overdue');

-- CreateEnum
CREATE TYPE "PostitContext" AS ENUM ('engine', 'engine_map', 'shop_visit_forecast', 'engine_forecast', 'general');

-- CreateEnum
CREATE TYPE "FeatureRequestStatus" AS ENUM ('submitted', 'under_review', 'in_progress', 'completed', 'declined');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "email" TEXT,
    "job_title" TEXT,
    "avatar_color" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_items" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "item_type" "DashboardItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMPTZ,
    "priority" "DashboardPriority" NOT NULL DEFAULT 'medium',
    "status" "DashboardStatus" NOT NULL DEFAULT 'pending',
    "related_esn" TEXT,
    "related_engine_type" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "dashboard_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postit_notes" (
    "id" SERIAL NOT NULL,
    "author_id" INTEGER NOT NULL,
    "context_type" "PostitContext" NOT NULL,
    "context_id" TEXT,
    "content" TEXT NOT NULL,
    "color" TEXT DEFAULT '#FBBF24',
    "position_x" DOUBLE PRECISION,
    "position_y" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "postit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postit_reads" (
    "postit_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postit_reads_pkey" PRIMARY KEY ("postit_id","user_id")
);

-- CreateTable
CREATE TABLE "feature_requests" (
    "id" SERIAL NOT NULL,
    "requester_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "FeatureRequestStatus" NOT NULL DEFAULT 'submitted',
    "admin_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "feature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_visits" (
    "id" SERIAL NOT NULL,
    "lessor" TEXT,
    "lessor_care_plus" TEXT,
    "operator" TEXT,
    "esn" TEXT,
    "msn" TEXT,
    "aircraft_type" TEXT,
    "registration" TEXT,
    "engine_type" TEXT,
    "wing_status" TEXT,
    "lease_expiry" TEXT,
    "transition_date" TEXT,
    "removal_date" TEXT,
    "transition_probability" DOUBLE PRECISION,
    "sv_probability" DOUBLE PRECISION,
    "total_sv_contribution" DOUBLE PRECISION,
    "fcs_remaining" TEXT,
    "am_contact" TEXT,
    "induction_gate" TEXT,
    "sv_type" TEXT,
    "sv_reason" TEXT,
    "date_sv_requested" TEXT,
    "required_output_date" TEXT,
    "status" TEXT,
    "mfa_operator_ref" TEXT,
    "mfa_induction_date" TEXT,
    "induction_status" TEXT,
    "shop" TEXT,
    "offlog_status" TEXT,
    "workscope_agreed" TEXT,
    "planned_to_test" TEXT,
    "planned_to_arc" TEXT,
    "risk_to_customer" TEXT,
    "contract_in_place" TEXT,
    "contract_type" TEXT,
    "contract_ref" TEXT,
    "fully_funded" TEXT,
    "payment_terms" TEXT,
    "mfa_induction_date_2" TEXT,
    "po_requested" TEXT,
    "customer_po_ref" TEXT,
    "network_paying" TEXT,
    "network_in_mfa" TEXT,
    "sv_price" TEXT,
    "profit" TEXT,
    "cash_out_eligible" TEXT,
    "cash_out_probability" DOUBLE PRECISION,
    "crcs_applicable" TEXT,
    "backing_data_received" TEXT,
    "backing_data_sent" TEXT,
    "invoice_payment" TEXT,
    "customer_master" TEXT,
    "address_for_crc" TEXT,
    "crc_contact" TEXT,
    "comments" TEXT,
    "task_owner" TEXT,
    "priority" TEXT,
    "open_actions" TEXT,
    "last_updated" TEXT,
    "next_steps" TEXT,
    "row_index" INTEGER,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecasts" (
    "id" SERIAL NOT NULL,
    "lessor" TEXT,
    "lessor_care_plus" TEXT,
    "operator" TEXT,
    "esn" TEXT,
    "engine_type" TEXT,
    "wing_status" TEXT,
    "removal_date" TEXT,
    "comment" TEXT,
    "sv_type_needed" TEXT,
    "sv_price" TEXT,
    "cash_out_eligible" TEXT,
    "profit_million" TEXT,
    "priority" TEXT,
    "notes" TEXT,
    "row_index" INTEGER,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "dashboard_items_user_id_item_type_idx" ON "dashboard_items"("user_id", "item_type");

-- CreateIndex
CREATE INDEX "dashboard_items_due_date_idx" ON "dashboard_items"("due_date");

-- CreateIndex
CREATE INDEX "dashboard_items_status_idx" ON "dashboard_items"("status");

-- CreateIndex
CREATE INDEX "messages_recipient_id_is_read_idx" ON "messages"("recipient_id", "is_read");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "postit_notes_context_type_context_id_idx" ON "postit_notes"("context_type", "context_id");

-- CreateIndex
CREATE INDEX "postit_notes_author_id_idx" ON "postit_notes"("author_id");

-- CreateIndex
CREATE INDEX "feature_requests_status_idx" ON "feature_requests"("status");

-- CreateIndex
CREATE INDEX "feature_requests_requester_id_idx" ON "feature_requests"("requester_id");

-- CreateIndex
CREATE INDEX "shop_visits_esn_idx" ON "shop_visits"("esn");

-- CreateIndex
CREATE INDEX "shop_visits_engine_type_idx" ON "shop_visits"("engine_type");

-- CreateIndex
CREATE INDEX "shop_visits_lessor_idx" ON "shop_visits"("lessor");

-- CreateIndex
CREATE INDEX "shop_visits_operator_idx" ON "shop_visits"("operator");

-- CreateIndex
CREATE INDEX "forecasts_esn_idx" ON "forecasts"("esn");

-- CreateIndex
CREATE INDEX "forecasts_engine_type_idx" ON "forecasts"("engine_type");

-- AddForeignKey
ALTER TABLE "dashboard_items" ADD CONSTRAINT "dashboard_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postit_notes" ADD CONSTRAINT "postit_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postit_reads" ADD CONSTRAINT "postit_reads_postit_id_fkey" FOREIGN KEY ("postit_id") REFERENCES "postit_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postit_reads" ADD CONSTRAINT "postit_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
