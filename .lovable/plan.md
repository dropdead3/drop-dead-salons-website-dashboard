

# Move Birthday and Client Since to "Important Dates" Card

## What Changes

Extract the birthday and client_since date fields from the "Contact Information" card into a new standalone "Important Dates" card, placed directly below Contact Information.

## File Modified

**`src/components/dashboard/ClientDetailSheet.tsx`**

1. Remove the birthday and client_since display rows (lines 355-375) from the Contact Information card's read-only view
2. Remove the birthday and client_since edit inputs (lines 320-327) from the Contact Information card's edit mode
3. Add a new "Important Dates" card between Contact Information and Marketing Preferences with:
   - Card header: "Important Dates" with a Calendar icon
   - Birthdate row (Cake icon) showing formatted birthday
   - Client Since row (Award icon) showing formatted date and duration
   - Edit button in the header (same permission check as contact info) that toggles inline date inputs
   - The edit state for dates will be independent from the contact info edit state

The new card will follow the same visual pattern as existing cards (Card/CardHeader/CardContent with icon + label rows). Birthday and Client Since editing moves into this card so the edit experience stays contextual.

