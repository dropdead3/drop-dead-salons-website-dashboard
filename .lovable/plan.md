

## Zura Configuration Hub -- Full Plan

### What We're Building

A centralized admin interface where salon owners can customize Zura's personality, inject business knowledge, set role-specific speaking rules, and define guardrails -- all stored in the database and dynamically loaded by every edge function at runtime.

---

### Database Schema (4 new tables)

**1. `zura_personality_config`** (one row per organization)
- `organization_id` (FK, unique)
- `display_name` (default: "Zura") -- allows salons to rename the AI
- `tone` (enum: professional, friendly, motivational, luxury, casual)
- `formality_level` (1-5 scale, 1 = very casual, 5 = very formal)
- `emoji_usage` (boolean, default false)
- `custom_greeting` (text, e.g., "Hey gorgeous!" or "Good morning, team")
- `custom_sign_off` (text, e.g., "Keep slaying!")
- `brand_voice_notes` (text, free-form instructions like "We never use the word 'cheap', always say 'affordable'")
- `prohibited_phrases` (text array, words/phrases Zura must never use)
- `encouraged_phrases` (text array, brand-aligned language to prefer)
- `response_length_preference` (enum: concise, moderate, detailed)
- `updated_at`, `updated_by`

**2. `zura_knowledge_entries`** (many per organization)
- `id` (uuid PK)
- `organization_id` (FK)
- `category` (enum: salon_policy, product_info, pricing, brand_guidelines, service_info, faq, custom)
- `title` (text, e.g., "Cancellation Policy")
- `content` (text, the actual knowledge, up to 2000 chars)
- `priority` (integer 1-10, higher = more likely to be included when context window is tight)
- `is_active` (boolean)
- `applies_to_functions` (text array, e.g., ["ai-assistant", "ai-agent-chat", "all"])
- `created_at`, `updated_at`, `created_by`

**3. `zura_role_rules`** (per-role speaking rules)
- `id` (uuid PK)
- `organization_id` (FK)
- `target_role` (app_role enum -- stylist, admin, manager, receptionist, booth_renter, super_admin)
- `tone_override` (nullable, overrides org-level tone for this role)
- `custom_instructions` (text, e.g., "Always be motivational and encouraging. Reference their personal goals. Never mention other stylists' numbers.")
- `data_boundaries` (text, e.g., "Never share organizational financials or other team members' performance")
- `suggested_cta_style` (text, e.g., "End with a challenge or goal" or "End with next steps")
- `is_active` (boolean)
- `created_at`, `updated_at`

**4. `zura_guardrails`** (safety and boundary rules)
- `id` (uuid PK)
- `organization_id` (FK)
- `rule_type` (enum: topic_block, data_boundary, behavior_rule, compliance)
- `rule_description` (text, e.g., "Never discuss employee salaries with non-admin roles")
- `severity` (enum: soft_warn, hard_block) -- soft_warn = Zura deflects politely; hard_block = absolute refusal
- `is_active` (boolean)
- `created_at`, `updated_at`

---

### Edge Function Changes (8 functions)

A shared utility pattern will be added. Each edge function will:

1. Query `zura_personality_config` for the org
2. Query `zura_knowledge_entries` filtered by `applies_to_functions` containing the function name (or "all"), ordered by `priority DESC`, limited to top 10-15 entries
3. Query `zura_role_rules` matching the user's current role (for role-aware functions like `ai-personal-insights`, `ai-agent-chat`)
4. Query `zura_guardrails` for active rules
5. Inject all of this into the system prompt dynamically

**Functions to update:**

| Function | Gets Personality | Gets Knowledge | Gets Role Rules | Gets Guardrails |
|---|---|---|---|---|
| `ai-assistant` (Help FAB) | Yes | Yes | Yes (user's role) | Yes |
| `ai-agent-chat` (Team Chat) | Yes | Yes | Yes (user's role) | Yes |
| `ai-business-insights` | Yes | Yes | No (leadership only) | Yes |
| `ai-personal-insights` | Yes | Yes | Yes (role tier) | Yes |
| `ai-card-analysis` | Yes | Yes | No | Yes |
| `ai-insight-guidance` | Yes | Yes | No | Yes |
| `ai-scheduling-copilot` | Yes | Yes (service info) | No | Yes |
| `generate-daily-huddle` | Yes | Yes | No | Yes |
| `detect-chat-action` | No (detection only) | No | No | No |
| `demo-assistant` | No (public-facing, separate brand) | No | No | No |

**Dynamic prompt injection pattern:**

```text
// Injected before the existing system prompt
PERSONALITY CONFIGURATION:
- Name: {display_name}
- Tone: {tone} (formality: {formality_level}/5)
- Greeting style: {custom_greeting}
- Sign-off style: {custom_sign_off}
- Response length: {response_length_preference}
- Brand voice: {brand_voice_notes}
- Never use these phrases: {prohibited_phrases}
- Prefer these phrases: {encouraged_phrases}
{emoji_usage ? "You may use emojis sparingly." : "Do NOT use emojis."}

BUSINESS KNOWLEDGE:
{knowledge_entries formatted as titled sections}

ROLE-SPECIFIC INSTRUCTIONS (for {role}):
{custom_instructions}
{data_boundaries}
{suggested_cta_style}

GUARDRAILS:
{formatted guardrail rules}

--- CORE INSTRUCTIONS ---
{existing hardcoded system prompt}
```

---

### Admin UI: Zura Configuration Hub

Located at: `/dashboard/admin/zura-config` (accessible from Management Hub or Settings)

**Tab 1: Personality**
- Form to edit tone, formality slider, greeting/sign-off, brand voice notes
- Prohibited/encouraged phrases as tag inputs
- Response length selector
- Live preview panel showing a sample Zura response with current settings

**Tab 2: Knowledge Base**
- Table listing all knowledge entries with category, title, priority, active status
- Create/edit modal with rich text input, category selector, priority slider, function scope selector
- Bulk import from text (paste policies, product lists, etc.)
- Character count indicator (2000 char limit per entry)
- Badge showing total knowledge entries and estimated token usage

**Tab 3: Role Rules**
- Grid/accordion showing each role with its custom instructions
- Inline editing for tone override, custom instructions, data boundaries, CTA style
- Toggle active/inactive per role
- "Test as Role" button that generates a sample Zura response using that role's config

**Tab 4: Guardrails**
- List of safety rules with type, description, severity
- Create/edit modal
- Pre-built templates (e.g., "Never discuss salaries with non-admins", "Never recommend competitors", "Always defer medical questions to professionals")
- Toggle active/inactive

---

### Edge Cases and Considerations

1. **Empty config fallback**: If no `zura_personality_config` exists for an org, all functions continue with their current hardcoded defaults. No breakage.
2. **Token budget management**: Knowledge entries are injected by priority and capped at approximately 1500 tokens total to avoid blowing the context window. A utility function estimates token count.
3. **Cache strategy**: Config is fetched once per function invocation (it's lightweight). No need for a separate cache table since these are small queries.
4. **Role resolution**: For functions that receive a `userId`, the role is resolved from `user_roles` table. For functions that already determine role tier (like `ai-personal-insights`), the existing tier maps to the closest `zura_role_rules` entry.
5. **Multi-tenant isolation**: All tables are scoped by `organization_id` with RLS policies ensuring org members can only read their own org's config, and only admins/super_admins can write.
6. **Audit trail**: `updated_by` and `created_by` columns track who changed what.
7. **Platform admin override**: Platform admins (Level 3+) can view and edit any org's Zura config when impersonating, consistent with existing platform admin patterns.
8. **Demo assistant excluded**: The public-facing demo assistant keeps its own separate personality since it represents the product brand, not a specific salon.
9. **Knowledge entry scoping**: The `applies_to_functions` array lets admins control which AI contexts get which knowledge. E.g., pricing info might only go to `ai-assistant` and `ai-agent-chat`, not to `ai-business-insights`.
10. **Guardrail enforcement**: Hard-block guardrails are injected as "ABSOLUTE RULES" at the top of the prompt. Soft-warn guardrails are injected as "GUIDELINES" that allow polite deflection.

---

### Files to Create/Modify

**New files:**
- `src/pages/dashboard/admin/ZuraConfigPage.tsx` -- main config hub page
- `src/components/zura-config/PersonalityTab.tsx`
- `src/components/zura-config/KnowledgeBaseTab.tsx`
- `src/components/zura-config/RoleRulesTab.tsx`
- `src/components/zura-config/GuardrailsTab.tsx`
- `src/hooks/useZuraConfig.ts` -- CRUD hooks for all 4 tables
- `supabase/functions/_shared/zura-config-loader.ts` -- shared utility to load and format config for system prompts

**Modified files (edge functions -- inject config loading):**
- `supabase/functions/ai-assistant/index.ts`
- `supabase/functions/ai-agent-chat/index.ts`
- `supabase/functions/ai-business-insights/index.ts`
- `supabase/functions/ai-personal-insights/index.ts`
- `supabase/functions/ai-card-analysis/index.ts`
- `supabase/functions/ai-insight-guidance/index.ts`
- `supabase/functions/ai-scheduling-copilot/index.ts`
- `supabase/functions/generate-daily-huddle/index.ts`

**Modified files (routing/navigation):**
- `src/App.tsx` or router config -- add route for `/dashboard/admin/zura-config`
- Management Hub or Settings -- add link/card to Zura Configuration

**Database migration:**
- 4 new tables with RLS policies
- Organization-scoped read for authenticated org members
- Write restricted to admin/super_admin/manager roles

