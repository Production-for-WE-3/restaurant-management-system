import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A per-(food, table session) rollup of how many units currently sit in each
 * kitchen stage — ordered/preparing/ready/served/cancelled — kept in sync by
 * a trigger on order_items rather than scattered app-code writes, so it
 * can't drift no matter which of the many call sites (send-to-kitchen,
 * kitchen-ticket status sync, void, fire-held-items, addItem's merge
 * upsert, …) changes an item's status or quantity next.
 *
 * Cart-stage rows (status='stock_reserved') are deliberately excluded from
 * every bucket — nothing here counts until it's actually been sent to the
 * kitchen. Grab-and-go orders (no table_session_id) never produce a row,
 * since the whole point is per-table visibility. A row is deleted once all
 * five counts return to zero, so the table only ever holds food/session
 * pairs with live kitchen activity.
 */
export class CreateTableSessionFoodStatusCounts1781300000000
  implements MigrationInterface
{
  name = 'CreateTableSessionFoodStatusCounts1781300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE table_session_food_status_counts (
        food_id bigint NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
        table_session_id bigint NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
        ordered_count numeric(12,2) NOT NULL DEFAULT 0,
        preparing_count numeric(12,2) NOT NULL DEFAULT 0,
        ready_count numeric(12,2) NOT NULL DEFAULT 0,
        served_count numeric(12,2) NOT NULL DEFAULT 0,
        cancelled_count numeric(12,2) NOT NULL DEFAULT 0,
        updated_at timestamp NOT NULL DEFAULT now(),
        PRIMARY KEY (food_id, table_session_id)
      )
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sync_table_session_food_status_counts()
      RETURNS trigger AS $$
      DECLARE
        pair record;
      BEGIN
        FOR pair IN
          SELECT DISTINCT food_id, table_session_id FROM (
            SELECT NEW.food_id AS food_id, NEW.table_session_id AS table_session_id
            WHERE TG_OP IN ('INSERT', 'UPDATE')
            UNION ALL
            SELECT OLD.food_id, OLD.table_session_id
            WHERE TG_OP IN ('UPDATE', 'DELETE')
          ) pairs
          WHERE table_session_id IS NOT NULL
        LOOP
          INSERT INTO table_session_food_status_counts (
            food_id, table_session_id, ordered_count, preparing_count, ready_count, served_count, cancelled_count, updated_at
          )
          SELECT
            pair.food_id,
            pair.table_session_id,
            COALESCE(SUM(quantity) FILTER (WHERE status = 'sent_to_kitchen'), 0),
            COALESCE(SUM(quantity) FILTER (WHERE status = 'preparing'), 0),
            COALESCE(SUM(quantity) FILTER (WHERE status = 'ready'), 0),
            COALESCE(SUM(quantity) FILTER (WHERE status = 'served'), 0),
            COALESCE(SUM(quantity) FILTER (WHERE status = 'cancelled'), 0),
            now()
          FROM order_items
          WHERE food_id = pair.food_id AND table_session_id = pair.table_session_id
          ON CONFLICT (food_id, table_session_id) DO UPDATE SET
            ordered_count = EXCLUDED.ordered_count,
            preparing_count = EXCLUDED.preparing_count,
            ready_count = EXCLUDED.ready_count,
            served_count = EXCLUDED.served_count,
            cancelled_count = EXCLUDED.cancelled_count,
            updated_at = EXCLUDED.updated_at;

          DELETE FROM table_session_food_status_counts
          WHERE food_id = pair.food_id AND table_session_id = pair.table_session_id
            AND ordered_count = 0 AND preparing_count = 0 AND ready_count = 0
            AND served_count = 0 AND cancelled_count = 0;
        END LOOP;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_sync_table_session_food_status_counts
      AFTER INSERT OR UPDATE OR DELETE ON order_items
      FOR EACH ROW EXECUTE FUNCTION sync_table_session_food_status_counts()
    `);

    // Backfill from whatever's already sitting in order_items/table_sessions.
    await queryRunner.query(`
      INSERT INTO table_session_food_status_counts (
        food_id, table_session_id, ordered_count, preparing_count, ready_count, served_count, cancelled_count, updated_at
      )
      SELECT
        food_id,
        table_session_id,
        COALESCE(SUM(quantity) FILTER (WHERE status = 'sent_to_kitchen'), 0),
        COALESCE(SUM(quantity) FILTER (WHERE status = 'preparing'), 0),
        COALESCE(SUM(quantity) FILTER (WHERE status = 'ready'), 0),
        COALESCE(SUM(quantity) FILTER (WHERE status = 'served'), 0),
        COALESCE(SUM(quantity) FILTER (WHERE status = 'cancelled'), 0),
        now()
      FROM order_items
      WHERE table_session_id IS NOT NULL
      GROUP BY food_id, table_session_id
      HAVING COALESCE(SUM(quantity) FILTER (WHERE status IN ('sent_to_kitchen', 'preparing', 'ready', 'served', 'cancelled')), 0) > 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_sync_table_session_food_status_counts ON order_items`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS sync_table_session_food_status_counts()`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS table_session_food_status_counts`,
    );
  }
}
