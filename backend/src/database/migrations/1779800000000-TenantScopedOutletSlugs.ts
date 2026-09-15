import { MigrationInterface, QueryRunner } from 'typeorm';

export class TenantScopedOutletSlugs1779800000000 implements MigrationInterface {
  name = 'TenantScopedOutletSlugs1779800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS outlets_slug_unique`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS outlets_tenant_slug_unique ON outlets (tenant_id, slug)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS outlets_tenant_slug_unique`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS outlets_slug_unique ON outlets (slug)`);
  }
}
