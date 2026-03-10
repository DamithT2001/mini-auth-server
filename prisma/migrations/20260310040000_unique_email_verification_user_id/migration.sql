-- DropIndex
DROP INDEX "email_verification_tokens_user_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_user_id_key" ON "email_verification_tokens"("user_id");
