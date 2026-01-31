-- Add RLS policies for employees to view their own payroll data

-- Allow employees to view their own payroll line items (pay stubs)
CREATE POLICY "Employees can view their own pay stubs"
ON public.payroll_line_items FOR SELECT
USING (employee_id = auth.uid());

-- Allow employees to view their own payroll settings
CREATE POLICY "Employees can view their own payroll settings"
ON public.employee_payroll_settings FOR SELECT
USING (employee_id = auth.uid());