
-- Add recurrence and snooze columns to tasks
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS snoozed_until DATE;

-- Create task_checklist_items table
CREATE TABLE public.task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS: Users can manage checklist items for their own tasks
CREATE POLICY "Users can view their own task checklist items"
ON public.task_checklist_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_checklist_items.task_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert checklist items for their own tasks"
ON public.task_checklist_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_checklist_items.task_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own task checklist items"
ON public.task_checklist_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_checklist_items.task_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own task checklist items"
ON public.task_checklist_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_checklist_items.task_id
    AND t.user_id = auth.uid()
  )
);

-- Coaches/admins can view all checklist items
CREATE POLICY "Coaches can view all task checklist items"
ON public.task_checklist_items FOR SELECT
USING (public.is_coach_or_admin(auth.uid()));

-- Trigger: Auto-create next recurring task on completion
CREATE OR REPLACE FUNCTION public.auto_create_next_recurring_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when task is being marked completed and has a recurrence pattern
  IF NEW.is_completed = true AND OLD.is_completed = false AND NEW.recurrence_pattern IS NOT NULL THEN
    INSERT INTO public.tasks (
      user_id, title, description, priority, recurrence_pattern, recurrence_parent_id, due_date, source
    ) VALUES (
      NEW.user_id,
      NEW.title,
      NEW.description,
      NEW.priority,
      NEW.recurrence_pattern,
      COALESCE(NEW.recurrence_parent_id, NEW.id),
      CASE
        WHEN NEW.due_date IS NOT NULL AND NEW.recurrence_pattern = 'daily' THEN (NEW.due_date::date + interval '1 day')::date::text
        WHEN NEW.due_date IS NOT NULL AND NEW.recurrence_pattern = 'weekly' THEN (NEW.due_date::date + interval '7 days')::date::text
        WHEN NEW.due_date IS NOT NULL AND NEW.recurrence_pattern = 'monthly' THEN (NEW.due_date::date + interval '1 month')::date::text
        ELSE NULL
      END,
      'recurring'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_next_recurring_task
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_next_recurring_task();

-- Index for checklist items
CREATE INDEX idx_task_checklist_items_task_id ON public.task_checklist_items(task_id);
