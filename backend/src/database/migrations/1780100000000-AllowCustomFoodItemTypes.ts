import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowCustomFoodItemTypes1780100000000 implements MigrationInterface {
  name = 'AllowCustomFoodItemTypes1780100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE foods DROP CONSTRAINT IF EXISTS foods_item_type_check`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE foods SET item_type = 'ready_made' WHERE item_type NOT IN ('kitchen', 'ready_made')`);
    await queryRunner.query(`ALTER TABLE foods ADD CONSTRAINT foods_item_type_check CHECK (item_type IN ('kitchen', 'ready_made'))`);
  }
}
