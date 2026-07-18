from tavily import TavilyClient
import os
# Make sure your TAVILY_API_KEY is loaded via load_dotenv()!
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

# Run a quick search
try:
    response = tavily_client.search(query="optical vs mechanical keyboard switches key feel", max_results=2)
    print("\n--- Tavily Test Response ---")
    for result in response['results']:
        print(f"Title: {result['title']}")
        print(f"URL: {result['url']}")
        print(f"Snippet: {result['content'][:150]}...")
        print("-" * 30)
except Exception as e:
    print(f"Tavily Error: {e}")