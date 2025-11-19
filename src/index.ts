import 'dotenv/config';
import EventEmitter from 'node:events';
import { v4 as uuidv4 } from 'uuid';
import { MCPClient } from './mcp/client';
import type { ChatConfig, ChatOptions, McpServersConfig } from './types';
import { loadPrompt } from './utils';

// TODO: 支持多种模型，目前仅支持 Azure 和 兼容 OpenAI 的模型
import { getChatCompletions } from './providers/openai';

export class Agent extends EventEmitter {
  protected session_id = uuidv4();
  private _mcpClient: MCPClient = new MCPClient();
  private _config: ChatConfig;
  private _options: ChatOptions & { sse: boolean };

  constructor(protected config: Partial<ChatConfig> = {}) {
    super();
    const { options = {}, ...conf } = config;
    this._config = {
      api_key: process.env.OPENAI_API_KEY || '',
      endpoint:
        process.env.AZURE_OPENAI_ENDPOINT ||
        process.env.OPENAI_BASE_URL ||
        'https://api.openai.com/v1',
      model_name: process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo',
      ...conf,
    };

    this._options = {
      temperature: 0.7,
      presence_penalty: 0,
      frequency_penalty: 0,
      stop: [],
      top_p: 1,
      max_tokens: 8192,
      sse: true,
      response_format: { type: 'json_object' },
      ...options,
    };
    // console.log(this._config, this._options);
  }

  async registerMcpServers(config: { mcpServers: McpServersConfig }) {
    const mcpClient = this._mcpClient;
    return mcpClient.registerServers(config);
  }

  async run(task: string): Promise<string | null> {
    const systemPrompt = loadPrompt('setup');
    const client = this._mcpClient;
    const toolMessages = client.getToolMessages();

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...toolMessages,
      {
        role: 'user',
        content: `## 目标任务\n\n${task}`,
      },
    ];

    const ret = await getChatCompletions(
      this,
      messages,
      this._config,
      this._options,
      this._mcpClient
    );

    return ret;
  }

  async destory() {
    return this._mcpClient.closeServers();
  }
}

export default Agent;
