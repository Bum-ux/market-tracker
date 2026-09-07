-- CreateTable
CREATE TABLE "NewsBookmark" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "newsId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketBookmark" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "marketId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" SERIAL NOT NULL,
    "coinId" TEXT NOT NULL,
    "name" TEXT,
    "symbol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsBookmark_userId_newsId_key" ON "NewsBookmark"("userId", "newsId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketBookmark_userId_marketId_key" ON "MarketBookmark"("userId", "marketId");

-- CreateIndex
CREATE UNIQUE INDEX "Market_coinId_key" ON "Market"("coinId");

-- AddForeignKey
ALTER TABLE "NewsBookmark" ADD CONSTRAINT "NewsBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsBookmark" ADD CONSTRAINT "NewsBookmark_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketBookmark" ADD CONSTRAINT "MarketBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketBookmark" ADD CONSTRAINT "MarketBookmark_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
