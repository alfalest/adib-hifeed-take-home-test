import { PrismaClient, BatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.stockMutation.deleteMany();
  await prisma.stockBatch.deleteMany();
  await prisma.feedItem.deleteMany();

  // ========== Feed Items (Master Pakan) ==========
  const feedItems = await Promise.all([
    prisma.feedItem.create({
      data: {
        sku: 'HF-BR-01',
        name: 'HiFeed Broiler Starter Super',
        category: 'POULTRY',
        unit: 'SAK (50KG)',
        min_stock: 20,
        current_stock: 0,
      },
    }),
    prisma.feedItem.create({
      data: {
        sku: 'HF-SIL-02',
        name: 'HiFeed Silase Jagung Fermentasi',
        category: 'RUMINANT',
        unit: 'DRUM (100KG)',
        min_stock: 10,
        current_stock: 0,
      },
    }),
    prisma.feedItem.create({
      data: {
        sku: 'HF-LY-03',
        name: 'HiFeed Layer Premium Gold',
        category: 'POULTRY',
        unit: 'SAK (50KG)',
        min_stock: 15,
        current_stock: 0,
      },
    }),
    prisma.feedItem.create({
      data: {
        sku: 'HF-CON-04',
        name: 'HiFeed Konsentrat Sapi Potong',
        category: 'RUMINANT',
        unit: 'SAK (25KG)',
        min_stock: 25,
        current_stock: 0,
      },
    }),
    prisma.feedItem.create({
      data: {
        sku: 'HF-FIN-05',
        name: 'HiFeed Broiler Finisher Pro',
        category: 'POULTRY',
        unit: 'SAK (50KG)',
        min_stock: 18,
        current_stock: 0,
      },
    }),
  ]);

  console.log(`✅ Created ${feedItems.length} feed items`);

  // ========== Stock Batches ==========
  const now = new Date();
  const batches = await Promise.all([
    // HF-BR-01 batches
    prisma.stockBatch.create({
      data: {
        batch_number: 'BATCH-BR01-2024-001',
        feed_item_id: feedItems[0].id,
        expired_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        initial_qty: 50,
        current_qty: 35,
        qr_payload: JSON.stringify({ batch_number: 'BATCH-BR01-2024-001', sku: 'HF-BR-01', feed_item_id: feedItems[0].id }),
        status: 'ACTIVE',
      },
    }),
    prisma.stockBatch.create({
      data: {
        batch_number: 'BATCH-BR01-2024-002',
        feed_item_id: feedItems[0].id,
        expired_date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days (near expiry)
        initial_qty: 30,
        current_qty: 8,
        qr_payload: JSON.stringify({ batch_number: 'BATCH-BR01-2024-002', sku: 'HF-BR-01', feed_item_id: feedItems[0].id }),
        status: 'ACTIVE',
      },
    }),

    // HF-SIL-02 batches
    prisma.stockBatch.create({
      data: {
        batch_number: 'BATCH-SIL02-2024-001',
        feed_item_id: feedItems[1].id,
        expired_date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days
        initial_qty: 20,
        current_qty: 5,
        qr_payload: JSON.stringify({ batch_number: 'BATCH-SIL02-2024-001', sku: 'HF-SIL-02', feed_item_id: feedItems[1].id }),
        status: 'ACTIVE',
      },
    }),

    // HF-LY-03 batches
    prisma.stockBatch.create({
      data: {
        batch_number: 'BATCH-LY03-2024-001',
        feed_item_id: feedItems[2].id,
        expired_date: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000), // 120 days
        initial_qty: 40,
        current_qty: 40,
        qr_payload: JSON.stringify({ batch_number: 'BATCH-LY03-2024-001', sku: 'HF-LY-03', feed_item_id: feedItems[2].id }),
        status: 'ACTIVE',
      },
    }),

    // HF-CON-04 batches - low stock
    prisma.stockBatch.create({
      data: {
        batch_number: 'BATCH-CON04-2024-001',
        feed_item_id: feedItems[3].id,
        expired_date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days
        initial_qty: 60,
        current_qty: 12,
        qr_payload: JSON.stringify({ batch_number: 'BATCH-CON04-2024-001', sku: 'HF-CON-04', feed_item_id: feedItems[3].id }),
        status: 'ACTIVE',
      },
    }),

    // HF-FIN-05 - depleted batch
    prisma.stockBatch.create({
      data: {
        batch_number: 'BATCH-FIN05-2024-001',
        feed_item_id: feedItems[4].id,
        expired_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (expired)
        initial_qty: 25,
        current_qty: 0,
        qr_payload: JSON.stringify({ batch_number: 'BATCH-FIN05-2024-001', sku: 'HF-FIN-05', feed_item_id: feedItems[4].id }),
        status: 'DEPLETED',
      },
    }),
    prisma.stockBatch.create({
      data: {
        batch_number: 'BATCH-FIN05-2024-002',
        feed_item_id: feedItems[4].id,
        expired_date: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000), // 75 days
        initial_qty: 30,
        current_qty: 22,
        qr_payload: JSON.stringify({ batch_number: 'BATCH-FIN05-2024-002', sku: 'HF-FIN-05', feed_item_id: feedItems[4].id }),
        status: 'ACTIVE',
      },
    }),
  ]);

  console.log(`✅ Created ${batches.length} stock batches`);

  // ========== Update Feed Item current_stock ==========
  // HF-BR-01: 35 + 8 = 43
  await prisma.feedItem.update({ where: { id: feedItems[0].id }, data: { current_stock: 43 } });
  // HF-SIL-02: 5
  await prisma.feedItem.update({ where: { id: feedItems[1].id }, data: { current_stock: 5 } });
  // HF-LY-03: 40
  await prisma.feedItem.update({ where: { id: feedItems[2].id }, data: { current_stock: 40 } });
  // HF-CON-04: 12
  await prisma.feedItem.update({ where: { id: feedItems[3].id }, data: { current_stock: 12 } });
  // HF-FIN-05: 0 + 22 = 22
  await prisma.feedItem.update({ where: { id: feedItems[4].id }, data: { current_stock: 22 } });

  console.log('✅ Updated feed item stock levels');

  // ========== Stock Mutations (Audit Log) ==========
  const mutations = await Promise.all([
    prisma.stockMutation.create({
      data: {
        batch_id: batches[0].id,
        feed_item_id: feedItems[0].id,
        type: 'INBOUND',
        quantity: 50,
        notes: 'Initial stock inbound from supplier',
        created_by: 'staff-01',
        created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.stockMutation.create({
      data: {
        batch_id: batches[0].id,
        feed_item_id: feedItems[0].id,
        type: 'DISPATCH',
        quantity: 15,
        notes: 'Dispatch to Peternakan Mitra Jaya',
        created_by: 'staff-02',
        created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.stockMutation.create({
      data: {
        batch_id: batches[1].id,
        feed_item_id: feedItems[0].id,
        type: 'INBOUND',
        quantity: 30,
        notes: 'Second batch inbound',
        created_by: 'staff-01',
        created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.stockMutation.create({
      data: {
        batch_id: batches[1].id,
        feed_item_id: feedItems[0].id,
        type: 'DISPATCH',
        quantity: 22,
        notes: 'Dispatch to Gudang Sentral Bekasi',
        created_by: 'staff-03',
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.stockMutation.create({
      data: {
        batch_id: batches[2].id,
        feed_item_id: feedItems[1].id,
        type: 'INBOUND',
        quantity: 20,
        notes: 'Silase batch from Pabrik Cirebon',
        created_by: 'staff-01',
        created_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.stockMutation.create({
      data: {
        batch_id: batches[2].id,
        feed_item_id: feedItems[1].id,
        type: 'DISPATCH',
        quantity: 15,
        notes: 'Dispatch to Peternakan Sapi Indramayu',
        created_by: 'staff-02',
        created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.stockMutation.create({
      data: {
        batch_id: batches[3].id,
        feed_item_id: feedItems[2].id,
        type: 'INBOUND',
        quantity: 40,
        notes: 'Layer premium gold from supplier',
        created_by: 'staff-01',
        created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.stockMutation.create({
      data: {
        batch_id: batches[4].id,
        feed_item_id: feedItems[3].id,
        type: 'INBOUND',
        quantity: 60,
        notes: 'Konsentrat sapi potong bulk order',
        created_by: 'staff-01',
        created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.stockMutation.create({
      data: {
        batch_id: batches[4].id,
        feed_item_id: feedItems[3].id,
        type: 'DISPATCH',
        quantity: 48,
        notes: 'Bulk dispatch to 3 mitra peternakan',
        created_by: 'staff-02',
        created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.stockMutation.create({
      data: {
        batch_id: batches[6].id,
        feed_item_id: feedItems[4].id,
        type: 'INBOUND',
        quantity: 30,
        notes: 'Finisher Pro restock',
        created_by: 'staff-01',
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.stockMutation.create({
      data: {
        batch_id: batches[6].id,
        feed_item_id: feedItems[4].id,
        type: 'DISPATCH',
        quantity: 8,
        notes: 'Dispatch to Peternakan Ayam Subang',
        created_by: 'staff-03',
        created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`✅ Created ${mutations.length} stock mutations`);
  console.log('');
  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('Summary:');
  console.log(`  Feed Items: ${feedItems.length}`);
  console.log(`  Stock Batches: ${batches.length}`);
  console.log(`  Mutations: ${mutations.length}`);
  console.log('');
  console.log('Low Stock Items:');
  console.log('  - HF-SIL-02 (Silase Jagung): 5 / min 10 ⚠️');
  console.log('  - HF-CON-04 (Konsentrat Sapi): 12 / min 25 ⚠️');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
