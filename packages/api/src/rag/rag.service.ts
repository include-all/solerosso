import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatOpenAI } from '@langchain/openai'

@Injectable()
export class RagService {
  private qwenModel: ChatOpenAI

  constructor(private configService: ConfigService) {
    this.qwenModel = new ChatOpenAI({
      model: 'qwen-plus',
      apiKey: this.configService.get<string>('DASHSCOPE_API_KEY'),
      configuration: {
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      },
    })
  }

  async ragTest(question: string): Promise<string> {
    const result = await this.qwenModel.invoke(question)
    return result.content as string
  }
}
