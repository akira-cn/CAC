# Common Agent Core

一个基于 TypeScript 的 NodeJS 智能代理核心库，集成了 OpenAI API 和 MCP (Model Context Protocol) 支持。

## 🚀 特性

- **TypeScript 支持**：完整的类型定义和严格的类型检查
- **OpenAI 集成**：支持 OpenAI 和 Azure OpenAI 服务
- **MCP 协议**：支持 Model Context Protocol 服务器集成
- **事件驱动**：基于 EventEmitter 的异步事件处理
- **工具调用**：支持函数调用和工具执行
- **环境配置**：支持 dotenv 环境变量管理
- **代码规范**：集成 ESLint + Prettier 代码格式化

## 📦 安装

```bash
# 克隆项目
git clone <repository-url>
cd common-agent-core

# 安装依赖（使用 pnpm）
pnpm install

# 构建项目
pnpm build
```

## 🔧 配置

创建 `.env` 文件并配置必要的环境变量：

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL_NAME=gpt-4
```

## 📖 使用方法

### 基础使用

```typescript
import { Agent } from './src/index';

async function main() {
  const agent = new Agent({
    options: {
      tool_type: 'function_call',
    },
  });

  // 注册 MCP 服务器
  await agent.registerMcpServers({
    mcpServers: {
      'filesystem': {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/directory'],
        env: {},
      },
    },
  });

  // 监听事件
  agent.on('reasoning', data => {
    console.log('推理过程:', data.toString());
  });

  agent.on('message', data => {
    console.log('消息:', data.toString());
  });

  agent.on('toolCall', data => {
    console.log('工具调用:', JSON.stringify(data, null, 2));
  });

  agent.on('toolResult', data => {
    console.log('工具结果:', JSON.stringify(data, null, 2));
  });

  // 运行对话
  await agent.run('请帮我分析当前目录下的文件');

  // 清理资源
  await agent.destory();
}

main().catch(console.error);
```

### MCP 服务器配置

支持多种 MCP 服务器：

```typescript
// 文件系统服务器
{
  'filesystem': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/directory'],
    env: {},
  }
}

// 自定义服务器
{
  'custom-server': {
    command: 'node',
    args: ['./path/to/server.js'],
    env: { NODE_ENV: 'production' },
  }
}
```

## 🛠️ 开发

### 可用脚本

```bash
# 开发模式
pnpm dev

# 构建项目
pnpm build

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 自动修复代码格式
pnpm lint:fix

# 格式化代码
pnpm format

# 检查代码格式
pnpm format:check

# 清理构建文件
pnpm clean
```

### 项目结构

```
src/
├── index.ts              # 主入口文件
├── mcp/
│   ├── client.ts         # MCP 客户端
│   └── demo-servers/     # 示例服务器
├── providers/
│   └── openai.ts         # OpenAI 提供者
├── prompts/
│   └── setup.md          # 系统提示词
├── types.ts              # 类型定义
└── utils.ts              # 工具函数
```

## 📋 技术栈

- **Node.js**: >= 18.0.0
- **TypeScript**: 5.9.2
- **OpenAI SDK**: 5.19.1
- **MCP SDK**: @modelcontextprotocol/sdk
- **包管理**: pnpm >= 8.0.0

## 🔍 API 文档

### Agent 类

#### 构造函数
```typescript
new Agent(config?: ChatConfig)
```

#### 方法

- `registerMcpServers(config: { mcpServers: McpServersConfig })`: 注册 MCP 服务器
- `run(message: string, options?: ChatOptions)`: 运行对话
- `destory()`: 清理资源

#### 事件

- `reasoning`: 推理过程数据
- `message`: 消息数据
- `toolCall`: 工具调用信息
- `toolResult`: 工具执行结果
- `finish`: 对话完成
- `error`: 错误信息

## 🤝 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [OpenAI API 文档](https://platform.openai.com/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TypeScript 文档](https://www.typescriptlang.org/docs/)