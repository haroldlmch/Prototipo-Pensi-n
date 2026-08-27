import { Controller, Get, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Post('set-group')
  setGroup(@Body('groupId') groupId: string) {
    return this.whatsappService.setTargetGroup(groupId);
  }
}
