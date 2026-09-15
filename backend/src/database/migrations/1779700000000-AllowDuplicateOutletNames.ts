import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowDuplicateOutletNames1779700000000 implements MigrationInterface {
  name = 'AllowDuplicateOutletNames1779700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE outlets DROP CONSTRAINT IF EXISTS outlets_name_unique`);
    await queryRunner.query(`ALTER TABLE outlets DROP CONSTRAINT IF EXISTS outlets_name_key`);
    await queryRunner.query(`DROP INDEX IF EXISTS outlets_name_unique`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS outlets_name_unique ON outlets (name)`);
  }
}
