import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `bill_number` is a guest-facing, per-outlet sequence generated from
 * `bill_number_counters` (scoped by outlet_id + period_key), so two
 * different outlets legitimately produce the same formatted string (e.g.
 * BILL-20260919-0001) on the same day. The old `orders_bill_number_key`
 * constraint was UNIQUE(bill_number) across the whole table — global across
 * every outlet and tenant — so two outlets issuing their first bill of the
 * day collided with a 23505 duplicate-key error. Rescopes uniqueness to
 * (outlet_id, bill_number) to match how the counter itself is scoped.
 */
export class RescopeBillNumberUniqueToOutlet1780800000000
  implements MigrationInterface
{
  name = 'RescopeBillNumberUniqueToOutlet1780800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT IF EXISTS "orders_bill_number_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE orders ADD CONSTRAINT "orders_outlet_bill_number_key" UNIQUE (outlet_id, bill_number)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT IF EXISTS "orders_outlet_bill_number_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE orders ADD CONSTRAINT "orders_bill_number_key" UNIQUE (bill_number)`,
    );
  }
}
