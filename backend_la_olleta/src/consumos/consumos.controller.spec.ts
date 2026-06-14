import { Test, TestingModule } from '@nestjs/testing';
import { ConsumosController } from './consumos.controller';
import { ConsumosService } from './consumos.service';

describe('ConsumosController', () => {
  let controller: ConsumosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsumosController],
      providers: [ConsumosService],
    }).compile();

    controller = module.get<ConsumosController>(ConsumosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
