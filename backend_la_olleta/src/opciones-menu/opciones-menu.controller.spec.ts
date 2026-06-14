import { Test, TestingModule } from '@nestjs/testing';
import { OpcionesMenuController } from './opciones-menu.controller';
import { OpcionesMenuService } from './opciones-menu.service';

describe('OpcionesMenuController', () => {
  let controller: OpcionesMenuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpcionesMenuController],
      providers: [OpcionesMenuService],
    }).compile();

    controller = module.get<OpcionesMenuController>(OpcionesMenuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
