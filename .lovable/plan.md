

## Move Website URL to Contact Information Card

A quick reorganization to move the website URL link from the Account Details card to the Contact Information card for better logical grouping.

---

### Current State

- **Contact Information Card**: Shows email and phone
- **Account Details Card**: Contains website URL along with account metadata

---

### Change

Move the website URL to Contact Information where it logically belongs (contact/reach methods together).

---

### File Change

**File:** `src/pages/dashboard/platform/AccountDetail.tsx`

1. **Add website URL to Contact Information card** (after phone, around line 284):
   ```tsx
   {organization.website_url && (
     <div className="flex items-center gap-3">
       <ExternalLink className="h-4 w-4 text-violet-400" />
       <a 
         href={organization.website_url.startsWith('http') ? organization.website_url : `https://${organization.website_url}`}
         target="_blank" 
         rel="noopener noreferrer"
         className="text-violet-400 hover:text-violet-300 hover:underline transition-colors"
       >
         {organization.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
       </a>
     </div>
   )}
   ```

2. **Update empty state condition** to include website URL check

3. **Remove website URL from Account Details card** (lines 346-358)

---

### Updated Contact Information Card

```text
CONTACT INFORMATION
├── [Email icon]    email@example.com
├── [Phone icon]    (555) 123-4567
└── [Link icon]     www.dropdeadsalon.com  ← Moved here
```

---

### Technical Note

Added URL protocol handling to ensure links work correctly even if users entered URLs without `https://`.

