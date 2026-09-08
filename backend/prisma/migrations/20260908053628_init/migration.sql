-- CreateTable
CREATE TABLE "feed_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "stock_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_number" TEXT NOT NULL,
    "feed_item_id" TEXT NOT NULL,
    "expired_date" DATETIME NOT NULL,
    "initial_qty" INTEGER NOT NULL,
    "current_qty" INTEGER NOT NULL,
    "qr_payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "stock_batches_feed_item_id_fkey" FOREIGN KEY ("feed_item_id") REFERENCES "feed_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_mutations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batch_id" TEXT NOT NULL,
    "feed_item_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_mutations_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "stock_batches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stock_mutations_feed_item_id_fkey" FOREIGN KEY ("feed_item_id") REFERENCES "feed_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "feed_items_sku_key" ON "feed_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "stock_batches_batch_number_key" ON "stock_batches"("batch_number");

-- CreateIndex
CREATE UNIQUE INDEX "stock_batches_qr_payload_key" ON "stock_batches"("qr_payload");

-- CreateIndex
CREATE INDEX "stock_batches_feed_item_id_idx" ON "stock_batches"("feed_item_id");

-- CreateIndex
CREATE INDEX "stock_batches_status_idx" ON "stock_batches"("status");

-- CreateIndex
CREATE INDEX "stock_mutations_feed_item_id_idx" ON "stock_mutations"("feed_item_id");

-- CreateIndex
CREATE INDEX "stock_mutations_batch_id_idx" ON "stock_mutations"("batch_id");

-- CreateIndex
CREATE INDEX "stock_mutations_type_idx" ON "stock_mutations"("type");

-- CreateIndex
CREATE INDEX "stock_mutations_created_at_idx" ON "stock_mutations"("created_at");
