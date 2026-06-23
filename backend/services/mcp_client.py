import os
import sys
import logging
from typing import Optional
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

logger = logging.getLogger("mcp_client")
logging.basicConfig(level=logging.INFO)

class MCPClientService:
    """
    Manages the lifecycle and connection to an MCP server.
    """
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        
    async def connect(self):
        """Connects to the local filesystem MCP server."""
        if self.session:
            return

        logger.info("Initializing MCP Filesystem server...")
        
        # Target the root project directory (chatbot/)
        target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")) 
        
        command = "npx.cmd" if sys.platform == "win32" else "npx"
        server_params = StdioServerParameters(
            command=command,
            args=["-y", "@modelcontextprotocol/server-filesystem", target_dir]
        )

        try:
            stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
            self.stdio, self.write = stdio_transport
            
            self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))
            await self.session.initialize()
            logger.info(f"Successfully connected to MCP Filesystem server. Target directory: {target_dir}")
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {str(e)}")
            await self.cleanup()
            raise e
            
    async def get_tools(self):
        """Retrieves available tools from the MCP server."""
        if not self.session:
            await self.connect()
        response = await self.session.list_tools()
        return response.tools
        
    async def execute_tool(self, tool_name: str, arguments: dict):
        """Executes a tool on the MCP server."""
        if not self.session:
            await self.connect()
        logger.info(f"Executing tool {tool_name} with args: {arguments}")
        result = await self.session.call_tool(tool_name, arguments=arguments)
        return result
        
    async def cleanup(self):
        """Clean up the MCP connection."""
        try:
            await self.exit_stack.aclose()
        except Exception as e:
            logger.warning(f"Error during MCP cleanup: {str(e)}")
        finally:
            self.session = None

# Global instance
mcp_client = MCPClientService()
