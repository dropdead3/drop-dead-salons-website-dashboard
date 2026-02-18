

## Add MetricInfoTooltip to Each KPI Tile

### What Changes

Add a small circle-i info tooltip next to each KPI label inside the Client Experience card -- both the hero Experience Score tile and the four component tiles (Avg Tip, Tip Rate, Feedback Rate, Rebook Rate).

### Implementation

**File modified:** `src/components/dashboard/sales/ClientExperienceCard.tsx`

1. Define a `KPI_DESCRIPTIONS` map with plain-language explanations for each metric:
   - **Experience Score**: "Weighted composite of all four metrics below (Rebook 35%, Tip Rate 30%, Feedback 20%, Avg Tip 15%). Higher is better."
   - **Avg Tip**: "Average tip amount per completed appointment in the selected period."
   - **Tip Rate**: "Percentage of completed appointments that received any tip amount greater than zero."
   - **Feedback Rate**: "Percentage of appointments where a client feedback response was collected, based on staff assignment."
   - **Rebook Rate**: "Percentage of completed appointments where the client rebooked at checkout."

2. In the hero tile (Experience Score, ~line 256), wrap the label span and add a `MetricInfoTooltip` beside it:
   ```tsx
   <div className="flex items-center gap-1.5">
     <span className={tokens.kpi.label}>{heroKpi.label}</span>
     <MetricInfoTooltip description={KPI_DESCRIPTIONS.composite} />
   </div>
   ```

3. In the 2x2 grid tiles (~line 284), same pattern -- wrap each label with a flex row containing the tooltip:
   ```tsx
   <div className="flex items-center gap-1.5">
     <span className={tokens.kpi.label}>{kpi.label}</span>
     <MetricInfoTooltip description={KPI_DESCRIPTIONS[kpi.metric]} />
   </div>
   ```

No new files. No hook changes. `MetricInfoTooltip` is already imported in the file.

