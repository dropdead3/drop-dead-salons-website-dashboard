
# Transactions, Refunds, and Store Credit System

## Overview
Build a comprehensive transactions management system that allows admins and front desk staff to view all transactions, process refunds (via original payment method, gift card, or salon credits), and manage store credit/gift card balances. Transaction history will also be integrated into client profile cards.

## System Architecture

### Database Schema

#### 1. Client Balances Table
Tracks salon credits and gift card balances per client.
```sql
CREATE TABLE client_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES phorest_clients(id),
  salon_credit_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  gift_card_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. Balance Transactions Table
Audit log for all credit/gift card balance changes.
```sql
CREATE TABLE balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID NOT NULL REFERENCES phorest_clients(id),
  transaction_type TEXT NOT NULL, -- 'credit_issue', 'credit_redemption', 'giftcard_issue', 'giftcard_redemption', 'refund_to_credit', 'refund_to_giftcard'
  amount DECIMAL(10,2) NOT NULL,
  balance_type TEXT NOT NULL, -- 'salon_credit' or 'gift_card'
  reference_transaction_id TEXT, -- Links to original phorest_transaction_items.transaction_id
  notes TEXT,
  issued_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. Refund Records Table
Tracks all refund requests and their status.
```sql
CREATE TABLE refund_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID REFERENCES phorest_clients(id),
  original_transaction_id TEXT NOT NULL,
  original_transaction_date DATE NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_type TEXT NOT NULL, -- 'original_payment', 'salon_credit', 'gift_card'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'completed', 'rejected'
  reason TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4. Gift Cards Table
For tracking issued gift cards.
```sql
CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT NOT NULL UNIQUE,
  initial_amount DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  assigned_client_id UUID REFERENCES phorest_clients(id),
  purchaser_name TEXT,
  purchaser_email TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### New Permissions
Add to the existing `permissions` table:
- `view_transactions` - View transaction history and client purchase records
- `process_client_refunds` - Issue refunds to clients (different from platform-level `process_refunds`)
- `manage_store_credits` - Issue and adjust salon credits
- `manage_gift_cards` - Create and manage gift cards

### File Structure

```text
src/
├── pages/dashboard/
│   └── Transactions.tsx                    # Main transactions page
├── components/dashboard/transactions/
│   ├── TransactionList.tsx                 # Sortable/filterable transaction table
│   ├── TransactionFilters.tsx              # Date, location, type, staff filters
│   ├── TransactionDetailSheet.tsx          # Side panel with full transaction details
│   ├── RefundDialog.tsx                    # Modal for processing refunds
│   ├── IssueCreditsDialog.tsx              # Modal for issuing salon credits
│   ├── GiftCardManager.tsx                 # Gift card creation and management
│   └── ClientBalanceCard.tsx               # Shows client's credit/gift card balance
├── components/dashboard/
│   └── ClientTransactionHistory.tsx        # Component for client profile sheets
├── hooks/
│   ├── useTransactions.ts                  # Fetch paginated transactions
│   ├── useClientBalances.ts                # Fetch/update client balances
│   ├── useRefunds.ts                       # Process and track refunds
│   └── useGiftCards.ts                     # Gift card CRUD operations
```

---

## Implementation Phases

### Phase 1: Database & Permissions
1. Create database migration with all new tables and RLS policies
2. Add new permissions to the `permissions` table
3. Assign default permissions to admin/receptionist roles

### Phase 2: Transactions Page
1. Create `/dashboard/transactions` route with permission check (`view_transactions`)
2. Build `TransactionList` component displaying data from `phorest_transaction_items`:
   - Columns: Date, Client, Item, Type, Amount, Staff, Location, Actions
   - Sortable headers (reuse pattern from AggregateSalesCard)
   - Date range filter, location filter, search by client name
3. Add "View Details" action opening `TransactionDetailSheet`
4. Add "Refund" button (visible to users with `process_client_refunds` permission)

### Phase 3: Refund System
1. Build `RefundDialog` with options:
   - **Original Payment Method**: Flags for manual processing via PhorestPay terminal
   - **Salon Credit**: Instantly adds to client's `salon_credit_balance`
   - **Gift Card**: Either adds to existing balance or creates new gift card
2. Create `useRefunds` hook with:
   - `processRefund(transactionId, type, amount, reason)`
   - Records in `refund_records` table
   - Updates `client_balances` or `gift_cards` accordingly
3. Add refund status badges to transaction list

### Phase 4: Store Credits & Gift Cards
1. Build `IssueCreditsDialog` for manual credit issuance:
   - Select client, enter amount, add notes
   - Requires `manage_store_credits` permission
2. Build `GiftCardManager` section:
   - Create new gift cards (generates unique code)
   - View active gift cards
   - Check balance by code
   - Assign to client
3. Create `useClientBalances` hook:
   - Fetches `salon_credit_balance` and `gift_card_balance`
   - Used in client profiles and checkout flow

### Phase 5: Client Profile Integration
1. Add "Transactions" tab to `ClientDetailSheet`:
   - Uses existing `useClientTransactionHistory` hook
   - Displays itemized purchase history with refund status
2. Add `ClientBalanceCard` component showing:
   - Salon credit balance
   - Gift card balance
   - Quick action to issue credits (if permitted)
3. Update `ClientProfileView` (booking flow) with same transaction visibility

---

## UI Mockups

### Transactions Page Layout
```text
+------------------------------------------------------------------+
| TRANSACTIONS                                    [Issue Credits ▼] |
| View and manage client transaction history                        |
+------------------------------------------------------------------+
| [Location ▼] [Date Range ▼] [Type ▼] [🔍 Search client...]       |
+------------------------------------------------------------------+
| DATE ↓      CLIENT        ITEM           TYPE      AMOUNT  ACTION |
|----------------------------------------------------------------------
| 01/30/26    Jane Smith    Balayage       Service   $185    [···]  |
| 01/30/26    Jane Smith    Olaplex No.3   Product   $32     [···]  |
| 01/29/26    Mike Brown    Men's Cut      Service   $45     [···]  |
+------------------------------------------------------------------+
```

### Refund Dialog
```text
+----------------------------------------+
| Process Refund                    [X]  |
+----------------------------------------+
| Original Transaction:                  |
| Balayage - $185.00                     |
| Client: Jane Smith                     |
| Date: January 30, 2026                 |
+----------------------------------------+
| Refund Amount: [$185.00        ]       |
|                                        |
| Refund Method:                         |
| ( ) Original Payment Method            |
|     → Flag for PhorestPay terminal     |
| (•) Salon Credit                       |
|     → Added instantly to account       |
| ( ) Gift Card                          |
|     → Create new or add to existing    |
|                                        |
| Reason: [Product damaged         ▼]    |
| Notes:  [________________________]     |
|                                        |
| [Cancel]              [Process Refund] |
+----------------------------------------+
```

### Client Profile - Transactions Tab
```text
+----------------------------------------+
| [History] [Notes] [Transactions]       |
+----------------------------------------+
| Credit Balance: $25.00                 |
| Gift Card Balance: $0.00               |
+----------------------------------------+
| Jan 30, 2026                           |
| • Balayage          $185.00  REFUNDED  |
| • Olaplex No.3      $32.00             |
|                                        |
| Jan 15, 2026                           |
| • Highlights        $165.00            |
| • K18 Treatment     $45.00             |
+----------------------------------------+
```

---

## Technical Details

### RLS Policies
```sql
-- client_balances: Admin/receptionist can view and update
CREATE POLICY "Staff can view client balances" ON client_balances
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'receptionist')
  );

-- refund_records: Same access pattern
-- balance_transactions: Insert for authorized users, select for admin
-- gift_cards: Full CRUD for manage_gift_cards permission holders
```

### Route Addition
```typescript
// In App.tsx
<Route 
  path="/dashboard/transactions" 
  element={
    <ProtectedRoute requiredPermission="view_transactions">
      <Transactions />
    </ProtectedRoute>
  } 
/>
```

### Hook Patterns (following existing codebase conventions)
```typescript
// useTransactions.ts
export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('phorest_transaction_items')
        .select(`
          *,
          refund:refund_records(status, refund_type, refund_amount)
        `)
        .order('transaction_date', { ascending: false });
      
      // Apply filters...
      return query;
    }
  });
}
```

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `supabase/migrations/xxx_transactions_system.sql` | Database tables, RLS, permissions |
| Create | `src/pages/dashboard/Transactions.tsx` | Main transactions page |
| Create | `src/components/dashboard/transactions/TransactionList.tsx` | Data table component |
| Create | `src/components/dashboard/transactions/TransactionFilters.tsx` | Filter controls |
| Create | `src/components/dashboard/transactions/TransactionDetailSheet.tsx` | Detail side panel |
| Create | `src/components/dashboard/transactions/RefundDialog.tsx` | Refund processing modal |
| Create | `src/components/dashboard/transactions/IssueCreditsDialog.tsx` | Credit issuance modal |
| Create | `src/components/dashboard/transactions/GiftCardManager.tsx` | Gift card management |
| Create | `src/components/dashboard/transactions/ClientBalanceCard.tsx` | Balance display card |
| Create | `src/components/dashboard/ClientTransactionHistory.tsx` | Profile tab component |
| Create | `src/hooks/useTransactions.ts` | Transaction data hook |
| Create | `src/hooks/useClientBalances.ts` | Balance management hook |
| Create | `src/hooks/useRefunds.ts` | Refund processing hook |
| Create | `src/hooks/useGiftCards.ts` | Gift card CRUD hook |
| Modify | `src/App.tsx` | Add `/dashboard/transactions` route |
| Modify | `src/components/dashboard/ClientDetailSheet.tsx` | Add Transactions tab |
| Modify | `src/components/dashboard/schedule/booking/ClientProfileView.tsx` | Add balance display |

---

## Edge Cases Handled
- **Partial refunds**: Allow refunding less than the full transaction amount
- **Multiple refunds**: Track refund history per transaction, prevent over-refunding
- **Gift card expiration**: Optional expiry date with visibility warnings
- **Balance validation**: Prevent negative balances
- **Audit trail**: All balance changes logged in `balance_transactions`
- **Permission layering**: Viewing transactions vs processing refunds vs issuing credits are separate permissions
