# Concierge AI Architecture

The Concierge AI in the "Grow Your Need" platform is designed as a hybrid system that combines local deterministic logic with the potential for external LLM integration.

## Architecture Overview

### 1. Frontend Integration (`useChat.ts`)
The `useChat` hook is the central nervous system for the chat interface.
- **State Management**: Handles message history, loading states, and errors.
- **Persistence**: Saves chat history to PocketBase (`chat_messages` collection) and local storage (for offline caching).
- **Routing**: Decides whether to send the query to an external AI service (if configured) or process it locally via `LocalIntelligence`.

### 2. Local Intelligence (`LocalIntelligence.ts`)
This service acts as the "Brain" when the external AI is offline or for specific data-driven queries.
- **Pattern Matching**: Analyzes user input for keywords (e.g., "revenue", "sleep", "attendance").
- **Service Integration**: Directly calls internal services (`crmService`, `wellnessService`, etc.) to fetch real-time data.
- **Context Awareness**: Adapts responses based on the active module (e.g., acting as a "Wellness Coach" vs. "System Admin").

### 3. Database (`chat_messages`)
- Stores the conversation history.
- Fields: `user`, `role` (user/assistant), `content`, `context`.

## Extending the AI

To add new capabilities to the AI:

1.  **Identify the Domain**: Determine which service handles the data (e.g., `projectService` for tasks).
2.  **Update `LocalIntelligence.ts`**:
    - Add a new condition in the `process` method.
    - Import the relevant service.
    - Fetch the data and format the response string.
3.  **Test**: Use the chat interface to ask questions related to the new domain.

## Example: Adding "Project Status"

```typescript
// In LocalIntelligence.ts
if (q.includes('project') && q.includes('status')) {
    const projects = await projectService.getProjects();
    const active = projects.filter(p => p.status === 'Active').length;
    return `You have ${active} active projects.`;
}
```

## Future Roadmap
- **Vector Search**: Integrate `chroma_db` (in `ai_service/`) for semantic search over documentation.
- **LLM Integration**: Connect to OpenAI/Anthropic via the Python backend (`ai_service/main.py`) for complex reasoning.
