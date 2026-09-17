import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from '../../modules/employees/entities/position.entity';
import { PositionPermission } from '../../modules/employees/entities/position-permission.entity';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { SeedModule } from './seed.module';

const logger = new Logger('Seed');
const MODULES = ['users', 'outlets', 'employees', 'orders', 'order-payments', 'settings', 'dashboard', 'reports'] as const;

async function run() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const permissions = app.get<Repository<Permission>>(getRepositoryToken(Permission));
  const positions = app.get<Repository<Position>>(getRepositoryToken(Position));
  const positionPermissions = app.get<Repository<PositionPermission>>(getRepositoryToken(PositionPermission));
  const position = await positions.findOne({ where: { slug: 'super-admin' } });

  for (const module of MODULES) {
    for (const action of ['view', 'manage']) {
      const slug = `${module}.${action}`;
      let permission = await permissions.findOne({ where: { slug } });
      if (!permission) permission = await permissions.save(permissions.create({ name: `${action} ${module}`, slug, module, action, level: 'global', isSystem: true, isActive: true, description: null }));
      if (position && !(await positionPermissions.findOne({ where: { positionId: position.id, permissionId: permission.id } }))) {
        await positionPermissions.save(positionPermissions.create({ positionId: position.id, permissionId: permission.id, createdBy: null }));
      }
    }
  }
  logger.log('Seed complete. Permissions are position-owned.');
  await app.close();
}

run().catch((error) => { logger.error(error); process.exit(1); });
