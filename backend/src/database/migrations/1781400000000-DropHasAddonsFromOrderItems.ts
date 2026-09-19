import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Corrective follow-up to AddOrderItemMergeConstraint1781100000000.
 *
 * That migration's file was edited (has_addons dropped from the merge
 * condition) after it had already been applied against this database with
 * the has_addons-aware version — editing an applied migration's file never
 * retroactively changes the DB, TypeORM just sees the class name as already
 * run and skips it. The result: order_items kept its has_addons column and
 * idx_order_items_merge_key's old `... AND has_addons = false` predicate,
 * while the deployed OrdersService#addItem code sends an ON CONFLICT clause
 * with no has_addons condition at all — Postgres requires an exact
 * predicate match to use an index as a conflict target, so every insert hit
 * "there is no unique or exclusion constraint matching the ON CONFLICT
 * specification" (500 on POST /orders/:id/items and .../items/batch).
 *
 * This drops the stale index/column and recreates the index with the
 * predicate the deployed code actually expects.
 */
export class DropHasAddonsFromOrderItems1781400000000
  implements MigrationInterface
{
  name = 'DropHasAddonsFromOrderItems1781400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_merge_key`);
    await queryRunner.query(
      `ALTER TABLE order_items DROP COLUMN IF EXISTS has_addons`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_order_items_merge_key ON order_items (
        order_id, food_id, COALESCE(food_variant_id, -1), COALESCE(note, ''), packaging_type
      ) WHERE status = 'stock_reserved' AND is_held = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_merge_key`);
    await queryRunner.query(
      `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS has_addons boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_order_items_merge_key ON order_items (
        order_id, food_id, COALESCE(food_variant_id, -1), COALESCE(note, ''), packaging_type
      ) WHERE status = 'stock_reserved' AND is_held = false AND has_addons = false
    `);
  }
}
