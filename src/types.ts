export interface ChatConfig {
  model_name: string;
  endpoint: string;
  api_key: string;
  api_version?: string;
  session_id?: string;
  options?: ChatOptions;
}

export interface ChatOptions {
  temperature?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stop?: string[];
  top_p?: number;
  response_format?: any;
  max_tokens?: number;
  tool_type?: 'function_call' | 'tool_call';
}

/**
 * MCP 服务器配置接口
 */
export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * MCP 服务器集合配置接口
 */
export interface McpServersConfig {
  [name: string]: McpServerConfig;
}
