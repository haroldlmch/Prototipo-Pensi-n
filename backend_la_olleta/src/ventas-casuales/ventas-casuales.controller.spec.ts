import { Test, TestingModule } from '@nestjs/testing';
import { VentasCasualesController } from './ventas-casuales.controller';
import { VentasCasualesService } from './ventas-casuales.service';

describe('VentasCasualesController', () => {
  let controller: VentasCasualesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VentasCasualesController],
      providers: [VentasCasualesService],
    }).compile();

    controller = module.get<VentasCasualesController>(VentasCasualesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
