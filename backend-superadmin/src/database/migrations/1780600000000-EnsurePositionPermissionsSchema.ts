import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsurePositionPermissionsSchema1780600000000 implements MigrationInterface {
  name = 'EnsurePositionPermissionsSchema1780600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS position_permissions (
        position_id BIGINT NOT NULL,
        permission_id BIGINT NOT NULL,
        created_by BIGINT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY (position_id, permission_id),
        CONSTRAINT fk_position_permissions_position
          FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
        CONSTRAINT fk_position_permissions_permission
          FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `);

    const hasLegacyRoleBridge = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'positions'
          AND column_name = 'default_role_id'
      ) AS exists
    `) as Array<{ exists: boolean }>;
    const hasRolesTable = await queryRunner.query(`
      SELECT to_regclass('public.roles') IS NOT NULL AS exists
    `) as Array<{ exists: boolean }>;

    if (hasLegacyRoleBridge[0]?.exists && hasRolesTable[0]?.exists) {
      await queryRunner.query(`
        INSERT INTO position_permissions (position_id, permission_id)
        SELECT DISTINCT p.id, rp.permission_id
        FROM positions p
        INNER JOIN role_permissions rp ON rp.role_id = p.default_role_id
        INNER JOIN permissions permission ON permission.id = rp.permission_id
        WHERE permission.is_active = true
        ON CONFLICT (position_id, permission_id) DO NOTHING
      `);
      await queryRunner.query(`DROP INDEX IF EXISTS idx_positions_default_role`);
      await queryRunner.query(`ALTER TABLE positions DROP COLUMN IF EXISTS default_role_id`);
    }

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_position_permissions_permission ON position_permissions(permission_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS position_permissions`);
  }
}
