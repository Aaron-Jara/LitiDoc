from core.claude_client import ClaudeClient

client = ClaudeClient()
response = client.generate("Say 'API works'")
print(response)
