import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationAssets1779500000000 implements MigrationInterface {
  name = 'CreateOrganizationAssets1779500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE organization_assets (
        id BIGSERIAL PRIMARY KEY,
        serial_no VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        rate DOUBLE PRECISION NOT NULL CHECK (rate > 0),
        total DOUBLE PRECISION NOT NULL CHECK (total >= 0),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_organization_assets_serial_no ON organization_assets(serial_no)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS organization_assets');
  }
}
