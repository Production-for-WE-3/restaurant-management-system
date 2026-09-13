import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAssetsDto } from './dto/create-assets.dto';
import { Asset } from './entities/asset.entity';

@Injectable()
export class AssetsService {
  constructor(@InjectRepository(Asset) private readonly repository: Repository<Asset>) {}

  findAll(): Promise<Asset[]> {
    return this.repository.find({ order: { createdAt: 'DESC', id: 'DESC' } });
  }

  async createMany(dto: CreateAssetsDto): Promise<Asset[]> {
    const assets = dto.items.map((item) =>
      this.repository.create({
        serialNo: item.serialNo.trim(),
        name: item.name.trim(),
        quantity: item.quantity,
        rate: item.rate,
        total: Number((item.quantity * item.rate).toFixed(2)),
      }),
    );
    return this.repository.save(assets);
  }
}
