
# Build Text Messages Templates/Editor Card in Communications Section

## Overview

This plan adds a new "Text Messages" (SMS) settings card to the Communications section, following the same pattern established by the Email templates system. The implementation includes database tables, React hooks, and a simplified template editor optimized for SMS (160-character limit awareness, no HTML formatting).

## Database Schema

### 1. New Table: `sms_templates`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | gen_random_uuid() | Primary key |
| template_key | text | NOT NULL | Unique identifier (e.g., `appointment_reminder`) |
| name | text | NOT NULL | Display name |
| message_body | text | NOT NULL | SMS content with `{{variable}}` placeholders |
| description | text | NULL | Admin notes about when template is used |
| variables | text[] | '{}' | List of available variables |
| is_active | boolean | true | Enable/disable template |
| created_at | timestamptz | now() | Creation timestamp |
| updated_at | timestamptz | now() | Last modified timestamp |
| character_count | integer | generated | Auto-calculated from message_body |

### 2. RLS Policies

```sql
-- Enable RLS
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active templates
CREATE POLICY "Allow read for authenticated" ON sms_templates
  FOR SELECT TO authenticated USING (true);

-- Allow admins to manage templates
CREATE POLICY "Allow admin full access" ON sms_templates
  FOR ALL TO authenticated
  USING (public.is_coach_or_admin(auth.uid()));
```

### 3. Trigger for Updated Timestamp

```sql
CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON sms_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useSmsTemplates.ts` | Create | CRUD hooks for SMS templates |
| `src/components/dashboard/SmsTemplatesManager.tsx` | Create | Template list and management UI |
| `src/components/dashboard/SmsTemplateEditor.tsx` | Create | Simple text editor with character counter |
| `src/hooks/useSettingsLayout.ts` | Modify | Add 'sms' category to Communications section |
| `src/pages/dashboard/admin/Settings.tsx` | Modify | Add SMS card definition and content rendering |

## Implementation Details

### 1. SMS Templates Hook (`src/hooks/useSmsTemplates.ts`)

Follows the pattern of `useEmailTemplates.ts`:

```typescript
export interface SmsTemplate {
  id: string;
  template_key: string;
  name: string;
  message_body: string;
  description: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Exports:
// - useSmsTemplates() - Fetch all templates
// - useSmsTemplate(key) - Fetch single template
// - useUpdateSmsTemplate() - Update mutation
// - useCreateSmsTemplate() - Create mutation
// - useDeleteSmsTemplate() - Delete mutation
```

### 2. SMS Templates Manager (`src/components/dashboard/SmsTemplatesManager.tsx`)

Simplified version of EmailTemplatesManager:
- List of templates with active/inactive toggle
- Edit, duplicate, delete actions
- Character count display (shows segment count for >160 chars)
- Preview with variable highlighting
- Test SMS option (future - requires Twilio integration)

Key UI features:
- Real-time character counter with color coding:
  - Green: 0-160 (1 SMS segment)
  - Yellow: 161-320 (2 segments)
  - Orange: 321-480 (3 segments)
  - Red: 480+ (warning about costs)
- Variable insertion dropdown
- Template duplication

### 3. SMS Template Editor (`src/components/dashboard/SmsTemplateEditor.tsx`)

Simple textarea-based editor with:
- Character counter with SMS segment indicator
- Variable insertion menu (reuses email_variables)
- Preview mode showing variable placeholders vs. sample data
- Validation for required fields

```text
+------------------------------------------+
| Template Name: _________________________ |
|                                          |
| Message:                                 |
| +--------------------------------------+ |
| | Hi {{first_name}}, your appointment  | |
| | at Drop Dead Gorgeous is confirmed   | |
| | for {{appointment_date}} at          | |
| | {{appointment_time}}. Reply STOP to  | |
| | unsubscribe.                         | |
| +--------------------------------------+ |
| Characters: 142/160 (1 segment)   [Vars] |
|                                          |
| Description (optional):                  |
| +--------------------------------------+ |
| | Sent when appointment is booked      | |
| +--------------------------------------+ |
+------------------------------------------+
```

### 4. Settings Layout Update (`src/hooks/useSettingsLayout.ts`)

```typescript
// Add to DEFAULT_ICON_COLORS
sms: '#22C55E', // Green for text messages

// Update SECTION_GROUPS
{
  id: 'communications',
  label: 'Communications',
  categories: ['email', 'sms'],
}
```

### 5. Settings Page Update (`src/pages/dashboard/admin/Settings.tsx`)

Add to SettingsCategory type:
```typescript
type SettingsCategory = '...' | 'sms' | null;
```

Add to categoriesMap:
```typescript
sms: {
  id: 'sms',
  label: 'Text Messages',
  description: 'SMS templates & automation',
  icon: MessageSquare,
}
```

Add content rendering:
```typescript
{activeCategory === 'sms' && (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">SMS TEMPLATES</CardTitle>
        <CardDescription>Customize text message templates for automated notifications.</CardDescription>
      </CardHeader>
      <CardContent>
        <SmsTemplatesManager />
      </CardContent>
    </Card>
  </div>
)}
```

## Seed Data

Pre-populate common SMS templates:

| Key | Name | Message |
|-----|------|---------|
| appointment_reminder | Appointment Reminder | Hi {{first_name}}, reminder: your appointment at {{location_name}} is {{appointment_date}} at {{appointment_time}}. Reply STOP to opt out. |
| appointment_confirmation | Booking Confirmation | Hi {{first_name}}! Your appointment at Drop Dead Gorgeous is confirmed for {{appointment_date}} at {{appointment_time}}. See you soon! |
| appointment_cancelled | Cancellation Notice | Hi {{first_name}}, your appointment on {{appointment_date}} has been cancelled. Please call us to reschedule. |
| running_late | Running Late | Hi {{first_name}}, we're running a few minutes behind. Your stylist will be with you shortly. Thank you for your patience! |

## Character Count Logic

SMS messages are split into segments:
- Standard SMS: 160 characters per segment
- Unicode SMS: 70 characters per segment (when emojis/special chars are used)

The editor will:
1. Detect if message contains unicode characters
2. Calculate segment count accordingly
3. Display cost implications (more segments = higher cost)

## Technical Details

### Shared Variables

SMS templates can reuse variables from the `email_variables` table. The variable insertion dropdown will fetch from the same source, filtered to categories relevant for SMS (client, appointment, business).

### Future Integration Points

The database structure supports future Twilio integration:
- Test SMS functionality (similar to test email)
- Actual SMS sending via edge function
- Delivery status tracking (would require additional tables)

## Execution Order

1. **Database Migration**: Create `sms_templates` table with RLS policies
2. **Create Hooks**: `useSmsTemplates.ts` for data operations
3. **Create Editor**: `SmsTemplateEditor.tsx` for editing interface
4. **Create Manager**: `SmsTemplatesManager.tsx` for list/CRUD UI
5. **Update Settings Layout**: Add 'sms' to Communications section
6. **Update Settings Page**: Add card definition and content rendering
7. **Seed Data**: Insert default templates

