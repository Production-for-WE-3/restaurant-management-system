import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `import_jobs.tenant_id` was only ever populated by the legacy
 * `set_default_demo_tenant_id` trigger, which silently leaves it NULL on any
 * environment without a tenant slugged 'demo' (i.e. real production
 * tenants). That left every real import job tenant-less, so
 * `import_job_rows`' `set_parent_tenant_id` trigger later hard-fails on
 * commit with "parent import_jobs <id> has no tenant". The app now sets
 * tenant_id explicitly at creation (see DataImportService#preview); this
 * backfills already-stuck jobs from their creator's tenant so they can be
 * resumed/committed instead of being permanently broken.
 */
export class BackfillImportJobsTenantId1780900000000
  implements MigrationInterface
{
  name = 'BackfillImportJobsTenantId1780900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE import_jobs job
      SET tenant_id = u.tenant_id
      FROM users u
      WHERE job.created_by_user_id = u.id
        AND job.tenant_id IS NULL
        AND u.tenant_id IS NOT NULL
    `);
  }

  public async down(): Promise<void> {
    // Backfill only — not reversible (and not worth reintroducing the bug).
  }
}
