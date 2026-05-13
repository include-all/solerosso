import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ElementsService } from './elements.service';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('boards/:boardId/elements')
@UseGuards(JwtAuthGuard)
export class ElementsController {
  constructor(private elementsService: ElementsService) {}

  @Post()
  create(
    @Param('boardId') boardId: string,
    @Request() req,
    @Body() dto: CreateElementDto,
  ) {
    return this.elementsService.create(boardId, req.user.id, dto);
  }

  @Get()
  findAll(@Param('boardId') boardId: string) {
    return this.elementsService.findAll(boardId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateElementDto) {
    return this.elementsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.elementsService.remove(id);
  }
}
