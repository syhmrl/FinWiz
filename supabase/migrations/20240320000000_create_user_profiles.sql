-- Create user_profiles table
create table if not exists public.user_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  is_student boolean default false,
  institution_name text,
  monthly_income_source text,
  monthly_expenses_range text,
  loan_amount decimal(10,2),
  expected_graduation_year integer,
  currency_preference text default 'MYR',
  loan_lender text,
  profile_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

-- Create function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger handle_updated_at
  before update on public.user_profiles
  for each row
  execute procedure public.handle_updated_at(); 