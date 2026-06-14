import { Test, TestingModule } from '@nestjs/testing';
import { PensionadosService } from './pensionados.service';

describe('PensionadosService', () => {
  let service: PensionadosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PensionadosService],
    }).compile();

    service = module.get<PensionadosService>(PensionadosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
