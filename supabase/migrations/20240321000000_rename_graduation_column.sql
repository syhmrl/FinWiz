-- Rename expected_graduation_year to expected_graduation_month and change type to text
ALTER TABLE public.profiles 
  RENAME COLUMN expected_graduation_year TO expected_graduation_month;

ALTER TABLE public.profiles 
  ALTER COLUMN expected_graduation_month TYPE text; 