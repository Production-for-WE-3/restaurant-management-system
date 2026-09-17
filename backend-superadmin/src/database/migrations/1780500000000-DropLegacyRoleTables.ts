import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropLegacyRoleTables1780500000000 implements MigrationInterface {
  name = 'DropLegacyRoleTables1780500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_role_assignments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles CASCADE`);
  }

  async down(_queryRunner: QueryRunner): Promise<void> {
    throw new Error('Legacy role tables cannot be safely reconstructed from position permissions');
  }
}
