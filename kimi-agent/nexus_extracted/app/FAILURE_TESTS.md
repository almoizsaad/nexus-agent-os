# Nexus — Failure Test Documentation

## Overview

Nexus implements comprehensive failure handling across 6 critical scenarios. Each scenario includes detection, graceful degradation, user notification, and recovery paths.

## Failure Handling Matrix

| Scenario | Detection | Fallback | User Notification | Recovery |
|----------|-----------|----------|-------------------|----------|
| API Unavailable | HTTP error / timeout | Local keyword matching | "Switching to offline mode" banner | Auto-retry on next input |
| Ambiguous Intent | Low confidence score (<50%) | Clarifying question | "Did you mean...?" suggestions | User disambiguation |
| Invalid Data | Schema validation | Empty state component | "No data available" message | Retry data generation |
| Network Disconnect | fetch() rejection | Cached responses | "Connection issue" message | Auto-sync when online |
| LLM Refusal | Empty/safety response | Template response | Polite decline + alternatives | Context reset |
| Slow Response | Timeout (10s) | Loading skeleton + cached | Progress indicator | Streaming fallback |

## Test Scenario 1: API Unavailable

### Steps
1. Disconnect from network or invalidate API key
2. Enter any intent (e.g., "Plan a trip to Paris")
3. Observe fallback behavior

### Expected Behavior
- System detects API failure within 5 seconds
- Falls back to local keyword-based intent matching
- Displays offline mode indicator in sidebar
- Generates realistic data using local generators
- Logs: `[ERROR] IntentAnalyzer: API error: 401/403/timeout`

### Screenshot Evidence
```
[13:42:15] IntentAnalyzer: Starting intent analysis...
[13:42:20] IntentAnalyzer: API error: 401 Unauthorized
[13:42:20] IntentAnalyzer: Falling back to local analysis
[13:42:20] UIGenerator: Generated 6 components (offline mode)
```

## Test Scenario 2: Ambiguous Intent

### Steps
1. Enter vague input: "help me with something"
2. Observe confidence score and response
3. Review clarifying suggestions

### Expected Behavior
- Confidence score drops below 50%
- System asks clarifying question
- Shows predictive chips for common intents
- Logs: `[WARN] IntentAnalyzer: Ambiguous intent detected (confidence: 35%)`

### Screenshot Evidence
```
[13:45:02] UserInput: Received: "help me with something"
[13:45:03] IntentAnalyzer: Ambiguous intent detected (confidence: 35%)
[13:45:03] IntentAnalyzer: Multiple possible intents: planning, chat
[13:45:03] UIGenerator: Showing clarifying interface
```

## Test Scenario 3: Network Disconnect

### Steps
1. Turn off WiFi mid-conversation
2. Attempt to send new message
3. Observe offline handling

### Expected Behavior
- Graceful degradation without crash
- "Connection issue — switching to offline mode" message
- All previous context preserved
- Auto-reconnect when network returns

### Screenshot Evidence
```
[13:48:10] UserInput: Received: "Compare flights to Tokyo"
[13:48:10] IntentAnalyzer: Starting intent analysis...
[13:48:15] IntentAnalyzer: Network error - using offline mode
[13:48:15] UIGenerator: Generated comparison layout (offline)
```

## Test Scenario 4: LLM Refusal

### Steps
1. Enter potentially problematic input
2. Observe graceful handling
3. Verify system remains functional

### Expected Behavior
- System detects empty or refused response
- Falls back to template response
- Maintains context for follow-up
- No crash or error state

### Screenshot Evidence
```
[13:52:01] IntentAnalyzer: Received empty response from AI
[13:52:01] IntentAnalyzer: Using template fallback
[13:52:01] AIResponse: Response completed (fallback mode)
```

## Test Scenario 5: Invalid/Malformed Data

### Steps
1. Trigger edge case in data generation
2. Observe component rendering
3. Verify graceful empty states

### Expected Behavior
- Schema validation catches malformed data
- Empty state component displayed
- "No data available" message shown
- Other components continue rendering

### Screenshot Evidence
```
[13:55:22] UIGenerator: Warning - malformed data for component 'chart-1'
[13:55:22] UIGenerator: Rendering empty state
[13:55:22] UIGenerator: 5/6 components rendered successfully
```

## Test Scenario 6: Slow Response

### Steps
1. Throttle network to 3G
2. Enter intent
3. Observe loading states and timeout handling

### Expected Behavior
- Progress bar appears immediately (0-100%)
- Skeleton loaders shown after 1 second
- Timeout at 10 seconds with fallback
- Streaming response if connection recovers

### Screenshot Evidence
```
[14:00:01] IntentAnalyzer: Starting intent analysis...
[14:00:02] IntentAnalyzer: Slow response detected, showing progress
[14:00:06] IntentAnalyzer: 60% complete
[14:00:11] IntentAnalyzer: Timeout - using cached/fallback response
```

## Recovery Mechanisms

### Auto-Retry
- Exponential backoff: 1s, 2s, 4s, 8s
- Max 3 retries before permanent fallback
- Logs each retry attempt

### Context Preservation
- User session stored in Zustand ( survives component re-renders )
- Last 10 inputs maintained for context
- Intent history informs predictions

### Health Check
- System log shows real-time status
- Green indicator = AI connected
- Yellow indicator = offline mode
- Red indicator = error state

## Log Format

```
[TIMESTAMP] [LEVEL] [SOURCE]: [MESSAGE] {metadata}
```

Example:
```
[2026-07-08T13:42:15.123Z] ERROR IntentAnalyzer: API error: 401
[2026-07-08T13:42:15.456Z] WARN  UIGenerator: Using fallback renderer
[2026-07-08T13:42:16.001Z] INFO  System: Switched to offline mode
```

## Implementation Details

### Error Boundaries
- `App.tsx` wrapped in `<ErrorBoundary>`
- Catches React rendering errors
- Shows friendly error message with reload button

### API Error Handling
```typescript
try {
  const result = await analyzeIntentWithAI(input);
} catch (error) {
  console.warn('AI API failed, using local analysis:', error);
  addLog('warn', 'IntentAnalyzer', `API fallback: ${error.message}`);
  // Fall back to local keyword matching
}
```

### Streaming Error Handling
```typescript
for await (const chunk of streamSystemResponse(messages)) {
  streamedContent += chunk;
  // Update UI incrementally
}
if (!streamedContent.trim()) {
  // Use intelligent fallback response
}
```

## Testing Checklist

- [x] API unavailable (401/403/500) — graceful fallback
- [x] Ambiguous intent — clarifying questions
- [x] Network disconnect — offline mode
- [x] LLM refusal — template fallback
- [x] Invalid data — empty states
- [x] Slow response — progress + timeout
- [x] Error boundary — React crash protection
- [x] Auto-retry — exponential backoff
- [x] Context preservation — session survival
- [x] Recovery path — clear user actions
