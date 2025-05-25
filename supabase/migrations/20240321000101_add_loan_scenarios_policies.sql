-- Enable RLS on loan_scenarios table
ALTER TABLE public.loan_scenarios ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own loan scenarios
CREATE POLICY "Users can view their own loan scenarios"
ON public.loan_scenarios
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own loan scenarios
CREATE POLICY "Users can insert their own loan scenarios"
ON public.loan_scenarios
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own loan scenarios
CREATE POLICY "Users can update their own loan scenarios"
ON public.loan_scenarios
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own loan scenarios
CREATE POLICY "Users can delete their own loan scenarios"
ON public.loan_scenarios
FOR DELETE
USING (auth.uid() = user_id); 