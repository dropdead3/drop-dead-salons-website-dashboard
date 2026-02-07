-- Add new values to the payroll_provider enum
ALTER TYPE payroll_provider ADD VALUE IF NOT EXISTS 'adp';
ALTER TYPE payroll_provider ADD VALUE IF NOT EXISTS 'paychex';
ALTER TYPE payroll_provider ADD VALUE IF NOT EXISTS 'square';
ALTER TYPE payroll_provider ADD VALUE IF NOT EXISTS 'onpay';
ALTER TYPE payroll_provider ADD VALUE IF NOT EXISTS 'homebase';
ALTER TYPE payroll_provider ADD VALUE IF NOT EXISTS 'rippling';
ALTER TYPE payroll_provider ADD VALUE IF NOT EXISTS 'wave';