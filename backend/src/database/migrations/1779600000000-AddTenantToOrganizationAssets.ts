import { MigrationInterface, QueryRunner } from 'typeorm';

/** Repairs organization_assets created by the original non-tenant migration. */
export class AddTenantToOrganizationAssets1779600000000 implements MigrationInterface {
  name = 'AddTenantToOrganizationAssets1779600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_assets
      ADD COLUMN IF NOT EXISTS tenant_id BIGINT
    `);

    // Existing rows from the old global table can be assigned automatically
    // when the database has only one tenant. Rows in a multi-tenant database
    // remain NULL and are intentionally hidden by the RLS policy until an
    // operator assigns them explicitly.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF (SELECT COUNT(*) FROM tenants) = 1 THEN
          UPDATE organization_assets
             SET tenant_id = (SELECT id FROM tenants LIMIT 1)
           WHERE tenant_id IS NULL;
        END IF;
      END
      $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE organization_assets
        ADD CONSTRAINT organization_assets_tenant_fk
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_organization_assets_tenant ON organization_assets(tenant_id)`);
    await queryRunner.query(`ALTER TABLE organization_assets ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE organization_assets FORCE ROW LEVEL SECURITY`);
    await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON organization_assets`);
    await queryRunner.query(`
      CREATE POLICY tenant_isolation ON organization_assets
      USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::bigint)
      WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::bigint)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP POLICY IF EXISTS tenant_isolation ON organization_assets');
    await queryRunner.query('ALTER TABLE organization_assets NO FORCE ROW LEVEL SECURITY');
    await queryRunner.query('ALTER TABLE organization_assets DISABLE ROW LEVEL SECURITY');
    await queryRunner.query('ALTER TABLE organization_assets DROP CONSTRAINT IF EXISTS organization_assets_tenant_fk');
    await queryRunner.query('DROP INDEX IF EXISTS idx_organization_assets_tenant');
    await queryRunner.query('ALTER TABLE organization_assets DROP COLUMN IF EXISTS tenant_id');
  }
}
