import { Test, TestingModule } from '@nestjs/testing';
import { PensionesController } from './pensiones.controller';
import { PensionesService } from './pensiones.service';

describe('PensionesController', () => {
  let controller: PensionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PensionesController],
      providers: [PensionesService],
    }).compile();

    controller = module.get<PensionesController>(PensionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
