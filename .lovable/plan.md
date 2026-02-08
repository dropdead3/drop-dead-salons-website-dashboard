
# Review Threshold & Smart Review Routing System

Build an intelligent review collection system that gates public reviews based on quality thresholds, and routes happy customers to leave reviews on Google and Apple Maps while capturing negative feedback privately for improvement.

---

## Key Concept: "Review Gating"

The flow works like this:

```text
Customer completes appointment
           ↓
Receives feedback survey link
           ↓
Submits ratings (NPS, overall, etc.)
           ↓
   ┌───────────────────────────┐
   │   RATING CHECK            │
   │   Overall ≥ threshold?    │
   └───────────────────────────┘
           ↓                ↓
      YES (Happy)       NO (Unhappy)
           ↓                ↓
   Show "Share" Screen    Show Thank You
   - Google Reviews         + Private
   - Apple Maps             follow-up
   - Copy to clipboard
```

---

## Implementation Plan

### 1. Database: Review Settings Storage

Add review threshold settings to `site_settings` table (follows existing pattern):

**Settings key:** `review_threshold_settings`

```typescript
interface ReviewThresholdSettings {
  // Threshold configuration
  minimumOverallRating: number;      // 1-5 stars (default: 4)
  minimumNPSScore: number;           // 0-10 (default: 8)
  requireBothToPass: boolean;        // AND vs OR logic (default: false = OR)
  
  // Review platform URLs
  googleReviewUrl: string;           // e.g., "https://g.page/r/CdGh..."
  appleReviewUrl: string;            // Apple Maps review link
  yelpReviewUrl: string;             // Optional Yelp link
  facebookReviewUrl: string;         // Optional Facebook link
  
  // Customization
  publicReviewPromptTitle: string;   // "We're so glad you loved your visit!"
  publicReviewPromptMessage: string; // "Would you mind sharing on..."
  privateFollowUpEnabled: boolean;   // Send manager alert for low scores
  privateFollowUpThreshold: number;  // Alert when score below this (default: 3)
}
```

### 2. Enhanced Feedback Response Table

Add new columns to track review routing:

```sql
ALTER TABLE client_feedback_responses ADD COLUMN IF NOT EXISTS
  passed_review_gate BOOLEAN,
  external_review_clicked TEXT,  -- 'google', 'apple', 'yelp', 'facebook', 'copied'
  external_review_clicked_at TIMESTAMPTZ,
  manager_notified BOOLEAN DEFAULT false,
  manager_notified_at TIMESTAMPTZ;
```

### 3. Review Gate Logic (Post-Submit Screen)

After submitting feedback, show one of two screens based on scores:

**Happy Customer Screen (Passed Threshold):**
```text
┌─────────────────────────────────────────────┐
│  ⭐ We're Thrilled You Loved Your Visit!   │
│                                             │
│  Your feedback means the world to us.       │
│  Would you mind taking a moment to share    │
│  your experience?                           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📋 Copy Your Review                 │   │
│  │ ────────────────────────────────────│   │
│  │ "Amazing experience! The staff..."  │   │
│  │                        [Copy Text]  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Now paste it on:                           │
│                                             │
│  [🔵 Google Reviews]  [🍎 Apple Maps]      │
│                                             │
│  [Skip - I'll do it later]                 │
└─────────────────────────────────────────────┘
```

**Unhappy Customer Screen (Below Threshold):**
```text
┌─────────────────────────────────────────────┐
│  💚 Thank You for Your Honest Feedback     │
│                                             │
│  We're sorry your visit wasn't perfect.     │
│  Your feedback has been shared with our     │
│  management team.                           │
│                                             │
│  We'd love to make it right. A manager      │
│  will reach out to you shortly.             │
│                                             │
│  [Return Home]                              │
└─────────────────────────────────────────────┘
```

### 4. Smart Copy-to-Clipboard Feature

Since one-click posting to Google/Apple isn't possible (no API), we use:

1. **Pre-fill clipboard** with their review text
2. **Open review platform** in new tab
3. **Show paste instructions** with visual guide

```typescript
const handleShareToGoogle = async () => {
  // Copy review text to clipboard
  await navigator.clipboard.writeText(comments);
  
  // Track the click
  await trackExternalReviewClick('google');
  
  // Open Google review page
  window.open(googleReviewUrl, '_blank');
  
  // Show toast with paste instructions
  toast.info('Review copied! Paste it on the Google page that just opened.');
};
```

### 5. Admin Settings UI

Add a "Review Settings" card to the Feedback Hub:

```text
┌─────────────────────────────────────────────────────┐
│  ⚙️ Review Gate Settings                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Threshold Configuration                            │
│  ─────────────────────────────────────────────     │
│  Minimum Rating to Show Public Review Prompt:       │
│  [★★★★☆ 4 stars ▼]                                 │
│                                                     │
│  Minimum NPS Score:  [8 ▼]                         │
│                                                     │
│  ☐ Require BOTH to pass (otherwise either is OK)   │
│                                                     │
│  Review Platform Links                              │
│  ─────────────────────────────────────────────     │
│  Google Reviews URL: [https://g.page/r/... ]       │
│  Apple Maps URL:     [https://maps.apple.com/... ] │
│  Yelp URL (optional):[                           ] │
│                                                     │
│  Low Score Alerts                                   │
│  ─────────────────────────────────────────────     │
│  ☑ Notify managers for scores below: [3 ▼]        │
│                                                     │
│  [Save Settings]                                    │
└─────────────────────────────────────────────────────┘
```

### 6. Manager Alerts for Low Scores

Edge function triggered when score is below threshold:

- Sends email to managers/admin
- Includes client info, ratings, and comments
- Links to full feedback record in dashboard

### 7. Analytics: Review Funnel Tracking

Add metrics to Feedback Hub:

| Metric | Description |
|--------|-------------|
| Gate Pass Rate | % of reviews that passed threshold |
| Google Click Rate | % who clicked Google review button |
| Apple Click Rate | % who clicked Apple Maps button |
| Copy Rate | % who copied their review text |
| Low Score Alerts | Count of manager notifications sent |

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/hooks/useReviewThreshold.ts` | New hook for threshold settings (CRUD) |
| `src/pages/ClientFeedback.tsx` | Add post-submit gate logic and share screen |
| `src/components/feedback/ReviewShareScreen.tsx` | New component for happy customer share flow |
| `src/components/feedback/ReviewThankYouScreen.tsx` | New component for private feedback thank you |
| `src/components/feedback/ReviewThresholdSettings.tsx` | Admin settings card |
| `src/pages/dashboard/admin/FeedbackHub.tsx` | Add settings tab with threshold config |
| `supabase/functions/notify-low-score/index.ts` | Edge function for manager alerts |
| **Migration** | Add columns to `client_feedback_responses` |

---

## Getting Review URLs

**Google Reviews:**
1. Search for your business on Google Maps
2. Click "Write a review" button
3. Copy the URL - it will look like `https://g.page/r/CdGhXyz123/review`

**Apple Maps:**
1. Open Apple Maps on iOS/Mac
2. Search for business → Share → Copy Link
3. Or use: `https://maps.apple.com/?address=...` with place ID

**Yelp:**
- `https://www.yelp.com/writeareview/biz/YOUR-BUSINESS-ID`

---

## Technical Notes

### Why Copy + Open vs Direct Post?
- Google and Apple don't offer public APIs for posting reviews
- This is intentional to prevent fake reviews
- The "copy text + open in new tab" pattern is industry standard
- Used by Podium, Birdeye, and other review management platforms

### Review Platform Detection
Optionally detect user's device/browser to prioritize:
- iOS/Safari users → Emphasize Apple Maps
- Android/Chrome users → Emphasize Google
- Desktop → Show both equally

### Compliance Note
Review gating is legal and common, but avoid:
- Explicitly asking only happy customers to review (we ask all, just route differently)
- Offering incentives for positive reviews
- Preventing unhappy customers from reviewing publicly if they choose to
