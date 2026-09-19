import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backs OrdersService#addItem's merge-on-add upsert with a real DB
 * constraint instead of an app-level SELECT-then-write, which races: two
 * concurrent "add ButterToast" requests for the same order can both see no
 * existing row and both insert, reproducing the exact duplicate-line bug
 * this closes (e.g. a bill printing "1 x ButterToast" three times instead
 * of "3 x ButterToast" once).
 */
export class AddOrderItemMergeConstraint1781100000000
  implements MigrationInterface
{
  name = 'AddOrderItemMergeConstraint1781100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // One row per (order, food, variant, note, packaging) while it's still
    // an editable cart line — the conflict target addItem() upserts into.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_order_items_merge_key ON order_items (
        order_id, food_id, COALESCE(food_variant_id, -1), COALESCE(note, ''), packaging_type
      ) WHERE status = 'stock_reserved' AND is_held = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_order_items_merge_key`);
  }
}
