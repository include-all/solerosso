import { Controller, Param, Get } from '@nestjs/common'
import { RagService } from './rag.service'

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Get('test/:question')
  ragTest(@Param('question') question: string) {
    return this.ragService.ragTest(question)
  }
}
