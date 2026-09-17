import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropDefaultRoleFromPositions1780400000000 implements MigrationInterface {
  name = 'DropDefaultRoleFromPositions1780400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_positions_default_role`);
    await queryRunner.query(`ALTER TABLE positions DROP COLUMN IF EXISTS default_role_id`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS default_role_id BIGINT REFERENCES roles(id) ON DELETE SET NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_positions_default_role ON positions(default_role_id)`);
  }
}
