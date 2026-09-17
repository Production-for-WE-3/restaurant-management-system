import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveRolePermissionsToPositions1780300000000 implements MigrationInterface {
  name = 'MoveRolePermissionsToPositions1780300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE position_permissions (
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
    await queryRunner.query(`
      INSERT INTO position_permissions (position_id, permission_id)
      SELECT DISTINCT p.id, rp.permission_id
      FROM positions p
      INNER JOIN role_permissions rp ON rp.role_id = p.default_role_id
      INNER JOIN permissions permission ON permission.id = rp.permission_id
      WHERE permission.is_active = true
    `);
    await queryRunner.query(`CREATE INDEX idx_position_permissions_permission ON position_permissions(permission_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS position_permissions`);
  }
}