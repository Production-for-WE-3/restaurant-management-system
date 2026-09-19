import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Denormalizes table_session_id onto order_items. orders.table_session_id
 * is not 1:1 with a session — a session can accumulate several Order rows
 * over its visit (new round after a completed order, split bills, staff-
 * created orders against the same session; see OrdersService#createFromGuest
 * and #findOpenForTableSession). That makes "every item ordered during this
 * table's visit" a join across potentially several orders today. Storing the
 * session id directly on each item lets it be queried in one place, with the
 * item's own `status` column already carrying its ordered/preparing/ready/
 * served state — no separate items table needed.
 */
export class AddTableSessionIdToOrderItems1781200000000
  implements MigrationInterface
{
  name = 'AddTableSessionIdToOrderItems1781200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS table_session_id bigint NULL REFERENCES table_sessions(id) ON DELETE SET NULL`,
    );
    await queryRunner.query(`
      UPDATE order_items oi
      SET table_session_id = o.table_session_id
      FROM orders o
      WHERE o.id = oi.order_id AND o.table_session_id IS NOT NULL
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_order_items_table_session ON order_items (table_session_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_order_items_table_session`,
    );
    await queryRunner.query(
      `ALTER TABLE order_items DROP COLUMN IF EXISTS table_session_id`,
    );
  }
}
