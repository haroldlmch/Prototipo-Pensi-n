import { Test, TestingModule } from '@nestjs/testing';
import { VentasCasualesService } from './ventas-casuales.service';

describe('VentasCasualesService', () => {
  let service: VentasCasualesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VentasCasualesService],
    }).compile();

    service = module.get<VentasCasualesService>(VentasCasualesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
