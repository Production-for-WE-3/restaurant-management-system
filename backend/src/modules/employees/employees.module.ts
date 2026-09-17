import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OutletsModule } from '../outlets/outlets.module';
import { EmployeeDocument } from './entities/employee-document.entity';
import { Employee } from './entities/employee.entity';
import { Position } from './entities/position.entity';
import { PositionPermission } from './entities/position-permission.entity';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { EmployeesImporter } from './import/employees-importer';
import { User } from '../users/entities/user.entity';
import { EmployeeDepartmentAssignment } from './entities/employee-department-assignment.entity';
import { EmployeeOutletAssignment } from './entities/employee-outlet-assignment.entity';
import { Permission } from '../permissions/entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, Position, PositionPermission, Permission, EmployeeDocument, User, EmployeeDepartmentAssignment, EmployeeOutletAssignment]),
    AuthModule,
    OutletsModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, EmployeesImporter],
  exports: [TypeOrmModule, EmployeesService, EmployeesImporter],
})
export class EmployeesModule {}
