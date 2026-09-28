ALTER TABLE "Market" ADD COLUMN "lastPrice" DOUBLE PRECISION;
ALTER TABLE "Notification" ADD COLUMN "eventKey" TEXT;
CREATE UNIQUE INDEX "Notification_userId_eventKey_key" ON "Notification"("userId", "eventKey");
