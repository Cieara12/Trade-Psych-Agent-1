-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DebriefSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tradedWhat" TEXT NOT NULL,
    "feltHow" TEXT NOT NULL,
    "redoMoment" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "checkedIntentionId" TEXT,
    "intentionKept" BOOLEAN,
    CONSTRAINT "DebriefSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DebriefSession_checkedIntentionId_fkey" FOREIGN KEY ("checkedIntentionId") REFERENCES "Intention" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Intention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,
    "originSessionId" TEXT NOT NULL,
    CONSTRAINT "Intention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Intention_originSessionId_fkey" FOREIGN KEY ("originSessionId") REFERENCES "DebriefSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SURFACED',
    "sourceQuote" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "surfacedInSessionId" TEXT NOT NULL,
    CONSTRAINT "Pattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pattern_surfacedInSessionId_fkey" FOREIGN KEY ("surfacedInSessionId") REFERENCES "DebriefSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Intention_originSessionId_key" ON "Intention"("originSessionId");
