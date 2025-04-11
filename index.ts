import { Anthropic } from "@anthropic-ai/sdk";
import {
  MessageParam,
  Tool,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import { readFileSync } from 'fs';
import dotenv from "dotenv";

dotenv.config();

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

const mcpServersConfig = JSON.parse(readFileSync('./config.json', 'utf-8'));

async function main() {
  
  const clients: Client[] = [];
  
  try {
    const anthropic = new Anthropic();  // APIキーは process.env.ANTHROPIC_API_KEY
    const anthropicTools: Tool[] = [];
    const toolNameToMCPClient: { [name: string]: Client } = {};
    
    for (const name in mcpServersConfig.mcpServers) {
      const config = mcpServersConfig.mcpServers[name];
      console.log(`Connecting to ${name} at ${config.command} ${config.args.join(" ")}`);

      const mcp = new Client({ name: name, version: "1.0.0" });
      clients.push(mcp);
      
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
      });
      await mcp.connect(transport);
      
      const toolsResult = await mcp.listTools();
      for (const tool of toolsResult.tools) {
        toolNameToMCPClient[tool.name] = mcp;
        anthropicTools.push({
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        });
      }
    }
  
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\nMCP Client Started!");
      console.log("Type your queries or 'quit' to exit.");

      while (true) {
        const query = await rl.question("\nQuery: ");
        if (query.toLowerCase() === "quit") {
          break;
        }

        const messages: MessageParam[] = [
          {
            role: "user",
            content: query,
          },
        ];

        async function processMessages(depth: number) {
          
          const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages,
            tools: anthropicTools,
          });
          messages.push({
            role: "assistant",
            content: response.content,
          });

          for (const content of response.content) {
            if (content.type === "text") {
              console.log(content.text);
            } else if (content.type === "tool_use") {
              await processTool(content, depth + 1);
            }
          }
        }
        
        async function processTool(content: ToolUseBlock, depth: number) {
          if (depth > 10) {
            throw new Error("Too many nested tool calls");
          }
          
          const toolName = content.name;
          const toolArgs = content.input as { [x: string]: unknown } | undefined;
          console.log(`[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`);

          const mcp = toolNameToMCPClient[toolName];
          if (!mcp) {
            throw new Error(`Tool ${content.name} is not registered`);
          }
          const result = await mcp.callTool({
            name: toolName,
            arguments: toolArgs,
          });

          console.log(`[Result of tool ${toolName}]: ${JSON.stringify(result.content, null, 2)}`);
          
          messages.push({
            role: "user",
            content: [{
                type: "tool_result",
                tool_use_id: content.id,
                content: result.content as string,
              },
            ]
          });

          await processMessages(depth);
        }

        await processMessages(0);
      }
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      rl.close();
    }
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    for (const client of clients) {
      client.close();
    }
    process.exit(0);
  }
}

main();
