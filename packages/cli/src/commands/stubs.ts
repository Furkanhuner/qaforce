// Phase 3 stubs — MCP server
import { Command } from 'commander';

export const mcpCommand = new Command('mcp')
  .description('[Phase 3] Start the qaforge MCP server for AI agent integration')
  .action(() => {
    console.log('MCP server is coming in Phase 3.');
  });
