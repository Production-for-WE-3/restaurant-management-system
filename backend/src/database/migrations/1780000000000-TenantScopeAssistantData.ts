import { MigrationInterface, QueryRunner } from 'typeorm';

/** Keeps assistant-owned data inside the same tenant/RLS boundary as the restaurant data. */
export class TenantScopeAssistantData1780000000000 implements MigrationInterface {
  name = 'TenantScopeAssistantData1780000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['assistant_documents', 'document_chunks', 'daily_summaries']) {
      await queryRunner.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS tenant_id BIGINT`);
      await queryRunner.query(`
        UPDATE ${table} a
        SET tenant_id = o.tenant_id
        FROM outlets o
        WHERE o.id = a.outlet_id AND a.tenant_id IS NULL
      `);
      await queryRunner.query(`ALTER TABLE ${table} ALTER COLUMN tenant_id SET NOT NULL`);
      await queryRunner.query(`DO $$ BEGIN ALTER TABLE ${table} ADD CONSTRAINT ${table}_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS ${table}_tenant_id_idx ON ${table}(tenant_id)`);
      await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON ${table}`);
      await queryRunner.query(`
        CREATE POLICY tenant_isolation ON ${table}
        USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::bigint)
        WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::bigint)
      `);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['assistant_documents', 'document_chunks', 'daily_summaries']) {
      await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON ${table}`);
      await queryRunner.query(`ALTER TABLE ${table} NO FORCE ROW LEVEL SECURITY`);
      await queryRunner.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
      await queryRunner.query(`DROP INDEX IF EXISTS ${table}_tenant_id_idx`);
      await queryRunner.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${table}_tenant_fk`);
      await queryRunner.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS tenant_id`);
    }
  }
}
