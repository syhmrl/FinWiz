-- Create loan_scenarios table for saving user loan calculation scenarios
CREATE TABLE IF NOT EXISTS public.loan_scenarios (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  loan_amount numeric(12,2) NOT NULL,
  interest_rate numeric(5,2) NOT NULL,
  loan_term_months integer NOT NULL,
  monthly_income numeric(12,2),
  monthly_repayment numeric(12,2) NOT NULL,
  total_interest numeric(12,2) NOT NULL,
  payoff_date text NOT NULL,
  affordability numeric(6,2),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
); 