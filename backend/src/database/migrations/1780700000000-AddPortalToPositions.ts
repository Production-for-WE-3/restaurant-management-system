import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPortalToPositions1780700000000 implements MigrationInterface {
  name = 'AddPortalToPositions1780700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE positions ADD COLUMN IF NOT EXISTS portal VARCHAR(20) NOT NULL DEFAULT 'staff'`);
    await queryRunner.query(`ALTER TABLE positions ADD CONSTRAINT positions_portal_check CHECK (portal IN ('dashboard', 'staff', 'both'))`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_portal_check`);
    await queryRunner.query(`ALTER TABLE positions DROP COLUMN IF EXISTS portal`);
  }
}
