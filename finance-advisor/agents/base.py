"""
Agent Base — Shared run_agent() function for all Gemini-powered agents.

Features:
- Tool-use loop with max_iterations guard
- Retry logic with exponential backoff for API rate limits
- Automatic conversion from Anthropic-style tool schemas to Gemini format
"""

import json
import time
import google.generativeai as genai
from google.protobuf.struct_pb2 import Struct
from config import settings, get_logger

logger = get_logger(__name__)

# Lazy-init flag
_configured = False


def _proto_to_python(obj):
    """
    Recursively convert protobuf/Gemini types to native Python.
    Handles MapComposite → dict, RepeatedComposite → list.
    """
    if obj is None:
        return obj
    if isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, dict):
        return {k: _proto_to_python(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_proto_to_python(item) for item in obj]
    # Handle protobuf MapComposite (dict-like)
    try:
        items = dict(obj)
        return {k: _proto_to_python(v) for k, v in items.items()}
    except (TypeError, ValueError):
        pass
    # Handle protobuf RepeatedComposite (list-like)
    try:
        return [_proto_to_python(item) for item in obj]
    except TypeError:
        pass
    return str(obj)


def _make_fn_response_part(name: str, result: dict) -> genai.protos.Part:
    """Create a function response Part for Gemini using protobuf Struct."""
    # Convert Python dict to protobuf Struct
    s = Struct()
    s.update(_proto_to_python(result) if isinstance(result, dict) else {"result": str(result)})
    return genai.protos.Part(
        function_response=genai.protos.FunctionResponse(name=name, response=s)
    )


def _configure():
    """Configure the Gemini API with the API key."""
    global _configured
    if not _configured:
        api_key = settings.GOOGLE_API_KEY
        if not api_key:
            raise ValueError(
                "GOOGLE_API_KEY not set. Copy .env.example to .env and add your key.\n"
                "Get a free key at: https://aistudio.google.com/apikey"
            )
        genai.configure(api_key=api_key)
        _configured = True


def _convert_anthropic_tools_to_gemini(tools: list[dict]) -> list[dict]:
    """
    Convert Anthropic-format tool definitions to Gemini function declarations.

    Anthropic format:
        {"name": "...", "description": "...", "input_schema": {"type": "object", "properties": {...}, "required": [...]}}

    Gemini format (dict-based):
        {"name": "...", "description": "...", "parameters": {"type": "object", "properties": {...}, "required": [...]}}
    """
    declarations = []
    for tool in tools:
        decl = {
            "name": tool["name"],
            "description": tool.get("description", ""),
        }
        if "input_schema" in tool:
            schema = tool["input_schema"].copy()
            # Clean up schema: remove 'default' from property level (Gemini doesn't like it)
            if "properties" in schema:
                cleaned_props = {}
                for prop_name, prop_def in schema["properties"].items():
                    cleaned = {k: v for k, v in prop_def.items() if k != "default"}
                    cleaned_props[prop_name] = cleaned
                schema["properties"] = cleaned_props
            decl["parameters"] = schema
        declarations.append(decl)
    return declarations


def run_agent(
    system: str,
    user_msg: str,
    tools: list[dict],
    tool_fn_map: dict,
    model: str | None = None,
    max_tokens: int = 2048,
    max_iterations: int = 10,
) -> str:
    """
    Run a Gemini agent with function-calling support.

    Args:
        system: System prompt describing the agent's role.
        user_msg: The user's message to process.
        tools: List of tool definitions (Anthropic format — auto-converted).
        tool_fn_map: Dict mapping tool names to callable functions.
        model: Model to use (defaults to config setting).
        max_tokens: Max response tokens.
        max_iterations: Safety guard against infinite tool-use loops.

    Returns:
        The agent's final text response.
    """
    _configure()
    model_name = model or settings.GEMINI_MODEL

    # Convert tool definitions
    gemini_tools = None
    if tools:
        declarations = _convert_anthropic_tools_to_gemini(tools)
        gemini_tools = [genai.types.Tool(function_declarations=declarations)]

    # Create model with system instruction
    gen_model = genai.GenerativeModel(
        model_name=model_name,
        system_instruction=system,
        tools=gemini_tools,
    )

    # Start chat
    chat = gen_model.start_chat()

    for iteration in range(max_iterations):
        logger.debug(f"Agent iteration {iteration + 1}/{max_iterations}")

        # Send message or continue loop
        if iteration == 0:
            response = _send_with_retry(chat, message=user_msg)
        # After first iteration, the loop continues via tool responses below

        # Process all parts in the response
        text_parts = []
        fn_responses = []

        for part in response.parts:
            if hasattr(part, "function_call") and part.function_call and part.function_call.name:
                fc = part.function_call
                fn_name = fc.name
                fn_args = _proto_to_python(fc.args) if fc.args else {}

                fn = tool_fn_map.get(fn_name)
                if not fn:
                    raise ValueError(f"Unknown tool called: {fn_name}")

                logger.info(f"Tool call: {fn_name}({json.dumps(fn_args, default=str)[:200]})")

                try:
                    result = fn(**fn_args)
                    if hasattr(result, "model_dump"):
                        result = result.model_dump()
                    # Convert to plain dict
                    if isinstance(result, dict):
                        result_dict = _proto_to_python(result)
                    elif isinstance(result, str):
                        try:
                            result_dict = json.loads(result)
                        except json.JSONDecodeError:
                            result_dict = {"result": result}
                    elif isinstance(result, list):
                        result_dict = {"items": _proto_to_python(result)}
                    else:
                        result_dict = {"result": str(result)}
                except Exception as e:
                    logger.error(f"Tool {fn_name} failed: {e}")
                    result_dict = {"error": str(e)}

                fn_responses.append(_make_fn_response_part(fn_name, result_dict))

            elif hasattr(part, "text") and part.text:
                text_parts.append(part.text)

        # If no function calls were made, return the text
        if not fn_responses:
            return "\n".join(text_parts) if text_parts else ""

        # Send function responses back to Gemini
        response = _send_with_retry(chat, tool_responses=fn_responses)

        # Check if Gemini wants more function calls or is done
        final_text = []
        more_fn_responses = []

        for part in response.parts:
            if hasattr(part, "function_call") and part.function_call and part.function_call.name:
                # Another round of function calls — loop will continue
                fc = part.function_call
                fn_name = fc.name
                fn_args = _proto_to_python(fc.args) if fc.args else {}
                fn = tool_fn_map.get(fn_name)
                if fn:
                    logger.info(f"Additional tool call: {fn_name}")
                    try:
                        result = fn(**fn_args)
                        if hasattr(result, "model_dump"):
                            result = result.model_dump()
                        result_dict = _proto_to_python(result) if isinstance(result, dict) else {"result": str(result)}
                    except Exception as e:
                        result_dict = {"error": str(e)}
                    more_fn_responses.append(_make_fn_response_part(fn_name, result_dict))
            elif hasattr(part, "text") and part.text:
                final_text.append(part.text)

        if more_fn_responses:
            response = _send_with_retry(chat, tool_responses=more_fn_responses)
            for p in response.parts:
                if hasattr(p, "text") and p.text:
                    final_text.append(p.text)

        if final_text:
            return "\n".join(final_text)

    raise RuntimeError(
        f"Agent exceeded max_iterations ({max_iterations}). "
        "Possible infinite tool-use loop."
    )


def _send_with_retry(
    chat,
    message: str | None = None,
    tool_responses: list | None = None,
    max_retries: int = 3,
):
    """Send a message or tool responses to Gemini with retry logic."""
    for attempt in range(max_retries):
        try:
            if tool_responses:
                return chat.send_message(tool_responses)
            elif message:
                return chat.send_message(message)
            else:
                raise ValueError("Either message or tool_responses must be provided")

        except Exception as e:
            error_str = str(e).lower()
            if "rate" in error_str or "quota" in error_str or "429" in error_str:
                wait = 2 ** attempt * 2
                logger.warning(f"Rate limited (attempt {attempt + 1}), retrying in {wait}s")
                time.sleep(wait)
            elif attempt < max_retries - 1:
                wait = 2 ** attempt
                logger.warning(f"API error (attempt {attempt + 1}), retrying in {wait}s: {e}")
                time.sleep(wait)
            else:
                raise

    raise RuntimeError(f"Failed after {max_retries} retries")
