import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import { BoardsService } from './boards.service'
import { CreateBoardDto } from './dto/create-board.dto'
import { UpdateBoardDto } from './dto/update-board.dto'
import { AddMemberDto } from './dto/add-member.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateBoardDto) {
    return this.boardsService.create(req.user.id, dto)
  }

  @Get()
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('starred') starred?: string,
  ) {
    return this.boardsService.findAll(req.user.id, search, starred === 'true')
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.boardsService.findOne(req.user.id, id)
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateBoardDto) {
    return this.boardsService.update(req.user.id, id, dto)
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.boardsService.remove(req.user.id, id)
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.boardsService.getMembers(id)
  }

  @Post(':id/members')
  addMember(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.boardsService.addMember(req.user.id, id, dto)
  }

  @Delete(':id/members/:memberUserId')
  removeMember(
    @Request() req,
    @Param('id') id: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.boardsService.removeMember(req.user.id, id, memberUserId)
  }
}
