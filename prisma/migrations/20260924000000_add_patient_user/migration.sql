ALTER TABLE "patients" ADD COLUMN "user_id" INTEGER;

CREATE UNIQUE INDEX "patients_user_id_key" ON "patients"("user_id");

ALTER TABLE "patients"
ADD CONSTRAINT "patients_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
