import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BigIntTransformer } from '../../../common/transformers/bigint.transformer';
import { NumericTransformer } from '../../../common/transformers/numeric.transformer';
import { Food } from '../../foods/entities/food.entity';
import { TableSession } from '../../table-sessions/entities/table-session.entity';

/**
 * Read-only rollup — rows are written exclusively by the
 * sync_table_session_food_status_counts() trigger on order_items (see
 * migration 1781300000000). The app never inserts/updates/deletes this
 * directly; it's queried for "what does this table currently have in each
 * kitchen stage" views.
 */
@Entity({ name: 'table_session_food_status_counts' })
export class TableSessionFoodStatusCount {
  @PrimaryColumn({
    name: 'food_id',
    type: 'bigint',
    transformer: new BigIntTransformer(),
  })
  foodId: number;

  @ManyToOne(() => Food, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'food_id' })
  food: Food;

  @PrimaryColumn({
    name: 'table_session_id',
    type: 'bigint',
    transformer: new BigIntTransformer(),
  })
  tableSessionId: number;

  @ManyToOne(() => TableSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_session_id' })
  tableSession: TableSession;

  @Column({
    name: 'ordered_count',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  orderedCount: number;

  @Column({
    name: 'preparing_count',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  preparingCount: number;

  @Column({
    name: 'ready_count',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  readyCount: number;

  @Column({
    name: 'served_count',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  servedCount: number;

  @Column({
    name: 'cancelled_count',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: new NumericTransformer(),
  })
  cancelledCount: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
