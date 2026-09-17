import { MigrationInterface, QueryRunner } from 'typeorm';

export class TenantScopeFoods1780200000000 implements MigrationInterface {
  name = 'TenantScopeFoods1780200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE foods
      SET tenant_id = COALESCE(
        tenant_id,
        (SELECT id FROM tenants WHERE slug = 'demo' LIMIT 1),
        (SELECT MIN(id) FROM tenants)
      )
      WHERE tenant_id IS NULL
    `);
    await queryRunner.query(`ALTER TABLE foods ALTER COLUMN tenant_id SET NOT NULL`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE foods ADD CONSTRAINT foods_tenant_id_fkey
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`ALTER TABLE foods DROP CONSTRAINT IF EXISTS foods_slug_key`);
    await queryRunner.query(`ALTER TABLE foods DROP CONSTRAINT IF EXISTS foods_slug_unique`);
    await queryRunner.query(`DROP INDEX IF EXISTS foods_slug_key`);
    await queryRunner.query(`DROP INDEX IF EXISTS foods_slug_unique`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS foods_tenant_slug_unique ON foods (tenant_id, slug)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS foods_tenant_id_idx ON foods (tenant_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS foods_tenant_slug_unique`);
    await queryRunner.query(`DROP INDEX IF EXISTS foods_tenant_id_idx`);
    await queryRunner.query(`ALTER TABLE foods DROP CONSTRAINT IF EXISTS foods_tenant_id_fkey`);
    await queryRunner.query(`ALTER TABLE foods ALTER COLUMN tenant_id DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE foods ADD CONSTRAINT foods_slug_key UNIQUE (slug)`);
  }
}