import OpenAI from 'openai';

import { AzureOpenAI } from 'openai';
import '@azure/openai/types';

import type { ChatConfig, ChatOptions } from '../types';

import { MCPClient } from '../mcp/client';
import EventEmitter from 'node:events';

const DEFAULT_CHAT_OPTIONS = {
  temperature: 0.9,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

export async function getChatCompletions(
  emitter: EventEmitter,
  messages: any[],
  config: ChatConfig,
  options?: ChatOptions,
  mcpClient?: MCPClient
) {
  try {
    options = { ...DEFAULT_CHAT_OPTIONS, ...options };
    options.max_tokens = options.max_tokens || 8192; // || 16384;

    let client: OpenAI | AzureOpenAI;
    let model = '';
    if (config.endpoint.endsWith('openai.azure.com')) {
      // const scope = 'https://cognitiveservices.azure.com/.default';
      const deployment = config.model_name;
      const apiVersion = config.api_version || '2024-07-01-preview';
      client = new AzureOpenAI({
        endpoint: config.endpoint,
        apiKey: config.api_key,
        // azureADTokenProvider,
        apiVersion,
        deployment,
      });
    } else {
      const { model_name, api_key, endpoint } = config as ChatConfig;
      model = model_name;
      client = new OpenAI({
        apiKey: api_key,
        baseURL: endpoint.replace(/\/chat\/completions$/, ''),
        dangerouslyAllowBrowser: true,
      });
    }

    let content = '';

    let tools: OpenAI.Chat.Completions.ChatCompletionTool[];
    const { tool_type, ...opts } = options;
    if (mcpClient) {
      tools = await mcpClient.listTools(tool_type || 'function_call');
    }

    const proceed = async (messages: any[]): Promise<void> => {
      const requestParams: any = {
        messages,
        ...opts,
        model,
        stream: true,
      };

      if (tools && tools.length > 0) {
        requestParams.tools = tools;
      }

      const events = (await client.chat.completions.create(
        requestParams
      )) as any;
      let hasToolCall = false;
      const toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] =
        [];

      for await (const event of events) {
        const choice = event.choices[0];
        // console.log(JSON.stringify(choice));
        if (choice && choice.delta) {
          const delta = choice.delta;
          if (delta.content) {
            content += delta.content;
            emitter.emit('message', delta.content);
          }
          // Note: reasoning property removed in OpenAI v5
          if ((delta as any).reasoning) {
            emitter.emit('reasoning', (delta as any).reasoning);
          }
          if (delta.tool_calls) {
            hasToolCall = true;
            for (const toolCall of delta.tool_calls) {
              if (toolCall.index !== undefined) {
                if (!toolCalls[toolCall.index]) {
                  toolCalls[toolCall.index] = {
                    id: toolCall.id || '',
                    type: 'function',
                    function: { name: '', arguments: '' },
                  };
                }

                if (
                  toolCall.function?.name &&
                  toolCalls[toolCall.index] &&
                  'function' in toolCalls[toolCall.index]!
                ) {
                  // join function name
                  (toolCalls[toolCall.index]! as any).function.name +=
                    toolCall.function.name;
                }
                if (
                  toolCall.function?.arguments &&
                  toolCalls[toolCall.index] &&
                  'function' in toolCalls[toolCall.index]!
                ) {
                  // join arguments
                  (toolCalls[toolCall.index]! as any).function.arguments +=
                    toolCall.function.arguments;
                }
              }
            }
          }
        }
      }

      if (hasToolCall && toolCalls.length > 0) {
        const toolResults = await Promise.all(
          toolCalls.map(async toolCall => {
            const toolCallAny = toolCall as any;
            emitter.emit('toolCall', toolCallAny.function);
            try {
              const result = await mcpClient!.callTool(
                toolCallAny.function.name,
                JSON.parse(toolCallAny.function.arguments || '{}')
              );
              emitter.emit('toolResult', {
                tool_call_id: toolCall.id,
                tool_call_name: toolCallAny.function.name,
                tool_call_result: result.content,
              });
              return {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: result.content,
              };
            } catch (ex: any) {
              console.error(ex);
              return {
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                content: 'Error: ' + ex.message,
              };
            }
          })
        );

        // Continue with tool results
        const assistantMessage: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam =
          {
            role: 'assistant',
            content: content || null,
            tool_calls: toolCalls,
          };

        return await proceed([...messages, assistantMessage, ...toolResults]);
      }
    };

    await proceed(messages);

    emitter.emit('finish', content);

    return content;
  } catch (ex) {
    emitter.emit('error', ex);
    return null;
  }
}
