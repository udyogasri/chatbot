import os
import json
import logging
from groq import AsyncGroq

# Import the MCP client we created
from services.mcp_client import mcp_client

# Set up logger
logger = logging.getLogger("groq_service")
logging.basicConfig(level=logging.INFO)

class GroqService:
    """
    Service to interact with the Groq API, now supporting MCP tool use and streaming.
    """

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")

        if not self.api_key or self.api_key == "your_groq_api_key_here":
            logger.warning(
                "GROQ_API_KEY is not set or is using the default placeholder value in .env. Responses will fail."
            )
            self.client = None
        else:
            self.client = AsyncGroq(api_key=self.api_key)
            self.model_name = "meta-llama/llama-4-scout-17b-16e-instruct"
            logger.info("GroqService successfully initialized.")

    async def generate_stream(self, message: str, image_base64: str = None):
        """
        Streams response from Groq, handling MCP tool calls dynamically.
        Yields JSON strings separated by newlines.
        """
        if not self.client:
            yield json.dumps({"type": "error", "content": "Groq API key is missing. Please configure .env"}) + "\n"
            return

        if not message.strip():
            yield json.dumps({"type": "error", "content": "Message content cannot be empty."}) + "\n"
            return

        content = [{"type": "text", "text": message}]
        if image_base64:
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}
            })

        messages = [
            {
                "role": "system",
                "content": "You are a helpful AI Chat Assistant. You have access to local file system tools via MCP. Use them if necessary to answer the user's request. Keep responses concise, useful, and formatted beautifully in markdown."
            },
            {"role": "user", "content": content}
        ]

        # 1. Fetch available tools from our MCP server
        mcp_tools = []
        try:
            tools_list = await mcp_client.get_tools()
            for t in tools_list:
                mcp_tools.append({
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description,
                        "parameters": t.inputSchema
                    }
                })
        except Exception as e:
            logger.warning(f"Could not get MCP tools (MCP server might not be running): {e}")

        kwargs = {
            "model": self.model_name,
            "messages": messages,
            "stream": True,
        }
        if mcp_tools:
            kwargs["tools"] = mcp_tools

        # 2. Stream loop handling tool calls and content
        while True:
            try:
                response = await self.client.chat.completions.create(**kwargs)
            except Exception as e:
                logger.error(f"Groq API Error: {str(e)}")
                yield json.dumps({"type": "error", "content": f"Groq API Error: {str(e)}"}) + "\n"
                break

            tool_calls = []
            
            async for chunk in response:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                
                # Collect tool calls
                if delta.tool_calls:
                    for tc in delta.tool_calls:
                        if len(tool_calls) <= tc.index:
                            tool_calls.append({
                                "id": tc.id, 
                                "type": "function", 
                                "function": {"name": tc.function.name, "arguments": ""}
                            })
                        if tc.function.arguments:
                            tool_calls[tc.index]["function"]["arguments"] += tc.function.arguments
                
                # Stream content to frontend
                elif delta.content:
                    yield json.dumps({"type": "content", "content": delta.content}) + "\n"

            # If no tools were called, the response is complete
            if not tool_calls:
                break
                
            # 3. If tools were called, append them to history and execute
            messages.append({"role": "assistant", "tool_calls": tool_calls})
            
            for tc in tool_calls:
                tool_name = tc["function"]["name"]
                try:
                    tool_args = json.loads(tc["function"]["arguments"])
                except json.JSONDecodeError:
                    tool_args = {}
                
                # Notify frontend that tool execution started
                yield json.dumps({"type": "tool_start", "tool_name": tool_name, "args": tool_args}) + "\n"
                
                try:
                    result = await mcp_client.execute_tool(tool_name, tool_args)
                    # Extract text content from the MCP result
                    if hasattr(result, 'content') and result.content:
                        content = "\n".join([c.text for c in result.content if hasattr(c, 'text')])
                    else:
                        content = str(result)
                except Exception as e:
                    content = f"Error executing tool {tool_name}: {str(e)}"
                    
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "name": tool_name,
                    "content": content
                })
                
                # Notify frontend tool execution ended
                yield json.dumps({"type": "tool_end", "tool_name": tool_name}) + "\n"
                
            # Update messages with tool results and let Groq generate the next response chunk
            kwargs["messages"] = messages
