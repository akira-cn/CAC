import path from 'path';
import { Agent } from '../src/index';

async function main() {
  const agent = new Agent({
    options: {
      tool_type: 'function_call',
    },
  });

  const mcpPath = path.resolve(
    __dirname,
    '../src/mcp/demo-servers/filesystem.server.ts'
  );

  await agent.registerMcpServers({
    mcpServers: {
      filesystem: {
        command: 'npx',
        args: ['-y', 'tsx', mcpPath],
      },
    },
  });

  agent.on('reasoning', data => {
    process.stdout.write(data.toString());
  });

  agent.on('message', data => {
    process.stdout.write(data.toString());
  });

  agent.on('toolCall', data => {
    console.log(
      `\n\n🛠️ -> ${JSON.stringify(data, null, 2)}\n\n⌛️ 正在运行工具，请等待\n`
    );
  });

  agent.on('toolResult', data => {
    console.log(`\n\n✅ -> ${JSON.stringify(data, null, 2)}\n\n`);
  });

  agent.on('finish', data => {
    process.stdout.write(data.toString());
  });

  agent.on('error', err => {
    console.error(err.message);
  });

  await agent.run('查一下当前目录下有哪些文件');

  await agent.destory();
}

main();
