import { Test, TestingModule } from '@nestjs/testing';
import { PensionadosController } from './pensionados.controller';
import { PensionadosService } from './pensionados.service';

describe('PensionadosController', () => {
  let controller: PensionadosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PensionadosController],
      providers: [PensionadosService],
    }).compile();

    controller = module.get<PensionadosController>(PensionadosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
