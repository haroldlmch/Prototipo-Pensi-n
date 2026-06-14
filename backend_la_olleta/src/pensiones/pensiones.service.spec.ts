import { Test, TestingModule } from '@nestjs/testing';
import { PensionesService } from './pensiones.service';

describe('PensionesService', () => {
  let service: PensionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PensionesService],
    }).compile();

    service = module.get<PensionesService>(PensionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
