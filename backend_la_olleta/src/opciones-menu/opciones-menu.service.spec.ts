import { Test, TestingModule } from '@nestjs/testing';
import { OpcionesMenuService } from './opciones-menu.service';

describe('OpcionesMenuService', () => {
  let service: OpcionesMenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpcionesMenuService],
    }).compile();

    service = module.get<OpcionesMenuService>(OpcionesMenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
