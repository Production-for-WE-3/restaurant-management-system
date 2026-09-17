import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../common/transformers/bigint.transformer';
import { Permission } from '../../permissions/entities/permission.entity';
import { Position } from './position.entity';

@Entity({ name: 'position_permissions' })
export class PositionPermission {
  @PrimaryColumn({ name: 'position_id', type: 'bigint', transformer: new BigIntTransformer() })
  positionId: number;

  @PrimaryColumn({ name: 'permission_id', type: 'bigint', transformer: new BigIntTransformer() })
  permissionId: number;

  @ManyToOne(() => Position, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'position_id' })
  position: Position;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @Column({ name: 'created_by', type: 'bigint', transformer: new BigIntTransformer(), nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
