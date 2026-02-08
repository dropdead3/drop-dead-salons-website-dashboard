
# AI-Powered Product Demo Feature

## Overview

Create an interactive product demo experience where potential customers can describe their salon management challenges, and an AI assistant responds with personalized feature recommendations, explaining exactly how the software solves their specific problems.

## User Experience Flow

```text
┌────────────────────────────────────────────────────────────────┐
│                    PRODUCT DEMO PAGE                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  "What challenges are you facing in your salon?"         │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ "I'm struggling to track my team's commissions     │  │  │
│  │  │  and everyone has different pay structures..."     │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                        [Ask AI →]        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  💡 AI Response:                                         │  │
│  │  "Managing complex commission structures can be          │  │
│  │   overwhelming! Here's how we solve this..."             │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ FEATURED SOLUTION: Payroll Hub                     │  │  │
│  │  │ ┌────────┐                                         │  │  │
│  │  │ │ [img]  │  Create unlimited commission tiers,     │  │  │
│  │  │ │        │  track tips, and automate calculations  │  │  │
│  │  │ └────────┘  for each team member's unique pay...   │  │  │
│  │  │                          [See Interactive Demo →]  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  Related Features:                                       │  │
│  │  • Analytics Hub - Track revenue per stylist            │  │
│  │  • Team Management - Individual pay configurations      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## Technical Architecture

### 1. Feature Catalog Database

Create a structured catalog of all product features that the AI can reference:

**New table: `product_features`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| feature_key | text | Unique identifier (e.g., `payroll_hub`) |
| name | text | Display name |
| tagline | text | One-line value proposition |
| description | text | Detailed markdown description |
| problem_keywords | text[] | Keywords for matching (e.g., `['commission', 'tips', 'pay']`) |
| category | text | Feature category |
| screenshot_url | text | Screenshot/preview image |
| demo_video_url | text | Optional video walkthrough |
| related_features | text[] | Related feature keys |
| is_highlighted | boolean | Show in main demo carousel |
| display_order | integer | Sort order |

### 2. Edge Function: `demo-assistant`

A specialized AI assistant that:
1. Receives the user's problem description
2. Uses tool calling to search the feature catalog
3. Returns a conversational response with matched features
4. Highlights the most relevant solution with supporting features

```typescript
// System prompt excerpt
const SYSTEM_PROMPT = `You are a helpful product consultant for Drop Dead 
Salon Software. When users describe their challenges, you:
1. Acknowledge their specific pain point empathetically
2. Explain how our software solves this exact problem
3. Call the search_features tool to get relevant features
4. Present the top solution prominently with supporting features

Always be conversational, not salesy. Focus on genuine problem-solving.`;

// Tool definition for structured feature lookup
const tools = [{
  type: "function",
  function: {
    name: "search_features",
    description: "Search for product features that solve the user's problem",
    parameters: {
      type: "object",
      properties: {
        keywords: { 
          type: "array", 
          items: { type: "string" },
          description: "Keywords extracted from user's problem"
        },
        category: { 
          type: "string",
          description: "Category hint (payroll, scheduling, team, clients, etc.)"
        }
      },
      required: ["keywords"]
    }
  }
}];
```

### 3. Frontend Components

**New files to create:**

| File | Purpose |
|------|---------|
| `src/pages/ProductDemo.tsx` | Main demo page (public, no auth required) |
| `src/components/demo/DemoChat.tsx` | Chat interface for the AI conversation |
| `src/components/demo/FeatureCard.tsx` | Rich feature highlight card |
| `src/components/demo/FeatureCarousel.tsx` | Carousel of highlighted features |
| `src/components/demo/InteractivePreview.tsx` | Embedded screenshots/videos |
| `src/hooks/useProductDemo.ts` | Hook for AI streaming + feature fetching |
| `supabase/functions/demo-assistant/index.ts` | Edge function for AI responses |

### 4. Demo Chat Flow

```typescript
// Hook usage pattern
const { 
  response,        // Streaming AI response
  features,        // Matched features from tool call
  isLoading,
  sendQuestion 
} = useProductDemo();

// When user submits question:
// 1. AI processes with streaming response
// 2. Tool call returns matched features
// 3. UI renders response + feature cards together
```

### 5. Feature Matching Logic

The edge function will:

1. **Semantic matching**: AI extracts intent from natural language
2. **Keyword matching**: Cross-reference with `problem_keywords` in database
3. **Ranking**: Return top 1-3 most relevant features
4. **Related features**: Include related features for discovery

Example matching:
```
User: "I never know who's working tomorrow and keep getting scheduling conflicts"

AI Tool Call → search_features({ 
  keywords: ["schedule", "conflicts", "availability", "tomorrow"],
  category: "scheduling" 
})

Returns:
1. Schedule Hub (primary match)
2. Shift Management (related)
3. Team Availability (related)
```

### 6. Platform Admin Management

Add a new section in Platform Admin to manage the feature catalog:

- `/dashboard/platform/demo-features` - List/manage all features
- CRUD operations for features
- Upload screenshots
- Preview how features appear in demo
- Analytics on which features get shown most

## Page Routing

| Route | Component | Auth |
|-------|-----------|------|
| `/demo` | ProductDemo | Public |
| `/demo/feature/:featureKey` | FeatureDetail | Public |
| `/dashboard/platform/demo-features` | DemoFeaturesAdmin | Platform Admin |

## Implementation Phases

**Phase 1: Foundation**
- Create `product_features` table with initial data
- Build `demo-assistant` edge function
- Create basic `ProductDemo` page with chat

**Phase 2: Rich UI**
- Feature cards with screenshots
- Interactive previews/videos
- Related features sidebar
- Mobile-responsive design

**Phase 3: Analytics & Optimization**
- Track which problems users ask about
- Measure feature match accuracy
- A/B test different AI prompts
- Add quick-start templates ("I need help with...")

## Example User Journeys

**Journey 1: Payroll confusion**
> User: "I spend hours every week calculating everyone's pay manually"
> 
> AI: "Manual payroll calculations are exhausting and error-prone! Our **Payroll Hub** automates everything..."
> 
> [Shows Payroll Hub card with screenshot + link to detailed demo]

**Journey 2: Team communication**
> User: "My stylists never see important announcements"
> 
> AI: "Getting your whole team on the same page is crucial! **Team Chat** gives you..."
> 
> [Shows Team Chat + Announcements features]

**Journey 3: Vague exploration**
> User: "What can your software do?"
> 
> AI: "Great question! Let me show you our core capabilities..."
> 
> [Shows carousel of highlighted features with brief descriptions]

## Benefits

1. **Personalized experience**: Every prospect sees solutions to THEIR problems
2. **Self-service discovery**: Reduces sales burden, 24/7 availability
3. **Qualified leads**: Conversations reveal prospect needs before sales contact
4. **Feature awareness**: Highlights capabilities prospects might not know to ask about
5. **Scalable**: AI handles unlimited simultaneous conversations
