import { MigrationInterface, QueryRunner } from 'typeorm';

/** Makes business and appearance settings belong to the tenant serving the request. */
export class TenantScopeGlobalSettings1779900000000 implements MigrationInterface {
  name = 'TenantScopeGlobalSettings1779900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE global_settings ADD COLUMN IF NOT EXISTS tenant_id BIGINT`);
    await queryRunner.query(`ALTER TABLE global_settings DROP CONSTRAINT IF EXISTS global_settings_category_key`);
    await queryRunner.query(`UPDATE global_settings SET tenant_id = (SELECT MIN(id) FROM tenants) WHERE tenant_id IS NULL`);
    await queryRunner.query(`
      INSERT INTO global_settings (tenant_id, category, data, updated_by_user_id, created_at, updated_at)
      SELECT t.id, gs.category, gs.data, gs.updated_by_user_id, gs.created_at, gs.updated_at
      FROM global_settings gs
      CROSS JOIN tenants t
      WHERE t.id <> gs.tenant_id
        AND NOT EXISTS (
          SELECT 1 FROM global_settings existing
          WHERE existing.tenant_id = t.id AND existing.category = gs.category
        )
    `);
    await queryRunner.query(`ALTER TABLE global_settings ALTER COLUMN tenant_id SET NOT NULL`);
    await queryRunner.query(`DO $$ BEGIN ALTER TABLE global_settings ADD CONSTRAINT global_settings_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await queryRunner.query(`DO $$ BEGIN ALTER TABLE global_settings ADD CONSTRAINT global_settings_tenant_category_key UNIQUE (tenant_id, category); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_global_settings_tenant ON global_settings(tenant_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_global_settings_tenant`);
    await queryRunner.query(`ALTER TABLE global_settings DROP CONSTRAINT IF EXISTS global_settings_tenant_category_key`);
    await queryRunner.query(`ALTER TABLE global_settings DROP CONSTRAINT IF EXISTS global_settings_tenant_fk`);
    await queryRunner.query(`ALTER TABLE global_settings ADD CONSTRAINT global_settings_category_key UNIQUE (category)`);
    await queryRunner.query(`ALTER TABLE global_settings DROP COLUMN tenant_id`);
  }
}
