import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Indexes several FK/status columns hit on every add-item, send-to-kitchen,
 * order-completion and order-cancellation call that never got an explicit
 * index (Postgres doesn't auto-index FK columns, and these predate this
 * migrations folder / were added without one — see AddRealtimeQueryIndexes
 * for the sibling set that did get covered). All `IF NOT EXISTS` since the
 * underlying tables predate this migrations folder and may already carry an
 * equivalent index from the original schema.
 */
export class AddOrderFlowMissingIndexes1781000000000
  implements MigrationInterface
{
  name = 'AddOrderFlowMissingIndexes1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // OrdersService#findReservedForOrder / recalculateReservations / removeItem
    // / voidItem all filter reservations by (order_item_id[, status]).
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_order_item_ingredient_reservations_item_status ON order_item_ingredient_reservations (order_item_id, status)`,
    );
    // OrdersService#sendItemsToKitchen / attachItemRelations / toWaiterItems
    // filter addons by order_item_id (single id or IN-list).
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_order_item_addons_order_item ON order_item_addons (order_item_id)`,
    );
    // KitchenTicketsService#cancelAllForOrder and any findAll({ orderId })
    // filter kitchen_tickets by order_id — covered for
    // (outlet_id, status, created_at) but not order_id alone.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_order ON kitchen_tickets (order_id)`,
    );
    // OrdersService#listStatusHistory filters by order_id.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_order_status_histories_order ON order_status_histories (order_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_order_status_histories_order`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_kitchen_tickets_order`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_order_item_addons_order_item`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_order_item_ingredient_reservations_item_status`,
    );
  }
}
