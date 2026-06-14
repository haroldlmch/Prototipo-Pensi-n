import { Test, TestingModule } from '@nestjs/testing';
import { ConsumosService } from './consumos.service';

describe('ConsumosService', () => {
  let service: ConsumosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsumosService],
    }).compile();

    service = module.get<ConsumosService>(ConsumosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
