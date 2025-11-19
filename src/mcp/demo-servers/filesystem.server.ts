import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { exec } from 'child_process';

// Create an MCP server
const server = new McpServer({
  name: 'filesystem',
  version: '1.0.0',
});

// listFiles
server.tool(
  'listFiles',
  '列出指定目录下的文件',
  { path: z.string() },
  async ({ path }) => {
    return new Promise((resolve, _reject) => {
      exec(`ls -la ${path}`, async (error, stdout, stderr) => {
        if (error) {
          console.error(`执行命令出错: ${error}`);
          resolve({
            content: [{ type: 'text', text: `执行命令出错: ${error}` }],
          });
          return;
        }
        if (stderr) {
          console.error(`命令stderr: ${stderr}`);
        }
        resolve({
          content: [
            {
              type: 'text',
              text: `已获取到目录 ${path} 文件列表:\n\`\`\`\n${stdout}\`\`\`\n`,
            },
          ],
        });
      });
    });
  }
);

server.registerPrompt(
  'filesystem-guideline',
  {
    title: '文件操作',
    description: '专业的文件操作工具',
  },
  async () => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: '你是专业的文件操作助手，注意执行危险操作请先与用户确认。',
          },
        },
      ],
    };
  }
);

async function run() {
  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('Server started');
}
run();
