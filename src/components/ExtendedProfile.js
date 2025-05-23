import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ExtendedProfile = ({ setProfileCompleted }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    is_student: false,
    institution_name: '',
    monthly_income_source: '',
    monthly_expenses_range: '',
    loan_amount: '',
    expected_graduation_month: '',
    loan_lender: '',
    currency_preference: 'MYR'
  });

  const loanLenders = [
    { id: 'PTPTN', name: 'PTPTN' },
    { id: 'JPA', name: 'JPA' },
    { id: 'MARA', name: 'MARA' },
    { id: 'Other', name: 'Other' },
  ];

  const expenseRanges = [
    { id: '0-500', name: 'RM 0 - RM 500' },
    { id: '501-1000', name: 'RM 501 - RM 1000' },
    { id: '1001-2000', name: 'RM 1001 - RM 2000' },
    { id: '2001-3000', name: 'RM 2001 - RM 3000' },
    { id: '3001+', name: 'RM 3001+' },
  ];

  const incomeSources = [
    { id: 'scholarship', name: 'Scholarship' },
    { id: 'partTime', name: 'Part-time Job' },
    { id: 'allowance', name: 'Allowance' },
    { id: 'other', name: 'Other' },
  ];

  const currencies = [
    { id: 'MYR', name: 'Malaysian Ringgit (MYR)' },
    { id: 'USD', name: 'US Dollar (USD)' },
    { id: 'SGD', name: 'Singapore Dollar (SGD)' },
    { id: 'GBP', name: 'British Pound (GBP)' },
  ];

  const institutionOptions = [
    'Universiti Malaya (UM)',
    'Universiti Kebangsaan Malaysia (UKM)',
    'Universiti Putra Malaysia (UPM)',
    'Universiti Sains Malaysia (USM)',
    'Universiti Teknologi Malaysia (UTM)',
    'Universiti Teknologi MARA (UiTM)',
    'Universiti Islam Antarabangsa Malaysia (IIUM / UIAM)',
    'Universiti Malaysia Sabah (UMS)',
    'Universiti Malaysia Sarawak (UNIMAS)',
    'Universiti Pendidikan Sultan Idris (UPSI)',
    'Universiti Utara Malaysia (UUM)',
    'Universiti Teknikal Malaysia Melaka (UTeM)',
    'Universiti Malaysia Terengganu (UMT)',
    'Universiti Malaysia Pahang Al-Sultan Abdullah (UMP)',
    'Universiti Malaysia Perlis (UniMAP)',
    'Universiti Sultan Zainal Abidin (UniSZA)',
    'Monash University Malaysia (Monash)',
    'University of Nottingham Malaysia (Nottingham)',
    'Taylor\'s University (Taylor\'s)',
    'Sunway University (Sunway)',
    'Multimedia University (MMU)',
    'Asia Pacific University (APU)',
    'INTI International University (INTI)',
    'SEGi University (SEGi)',
    'HELP University (HELP)',
    'UCSI University (UCSI)',
    'MAHSA University (MAHSA)',
    'Other'
  ];

  const providerOptions = [
    { id: 'PTPTN', name: 'PTPTN' },
    { id: 'JPA', name: 'JPA' },
    { id: 'MARA', name: 'MARA' },
    { id: 'ScholarshipCompany', name: 'Scholarship Company' },
    { id: 'Other', name: 'Other' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      console.log('Current user:', user);

      // Convert loan amount to decimal
      const loanAmount = formData.loan_amount ? parseFloat(formData.loan_amount) : null;
      
      // Convert graduation month to string (YYYY-MM)
      const graduationMonth = formData.expected_graduation_month ? 
        formData.expected_graduation_month : null;

      // Prepare the profile data with only the fields that exist in the schema
      const profileData = {
        is_student: formData.is_student,
        institution_name: formData.is_student ? formData.institution_name : null,
        monthly_income_source: formData.monthly_income_source || null,
        monthly_expenses_range: formData.monthly_expenses_range || null,
        loan_amount: loanAmount,
        expected_graduation_month: formData.is_student ? graduationMonth : null,
        loan_lender: formData.loan_amount > 0 ? formData.loan_lender : null,
        currency_preference: formData.currency_preference || null,
        profile_completed: true,
        updated_at: new Date().toISOString()
      };

      console.log('Prepared profile data:', profileData);

      // First, try to get the existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Existing profile check:', { existingProfile, fetchError });

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing profile:', fetchError);
        throw fetchError;
      }

      let result;
      // If no profile exists, create one
      if (!existingProfile) {
        console.log('Creating new profile');
        result = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              full_name: user.user_metadata?.full_name || '',
              email: user.email,
              created_at: new Date().toISOString(),
              ...profileData
            }
          ]);

        if (result.error) {
          console.error('Error creating profile:', result.error);
          throw result.error;
        }
      } else {
        // Update existing profile
        console.log('Updating existing profile');
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);

        if (result.error) {
          console.error('Error updating profile:', result.error);
          throw result.error;
        }
      }

      console.log('Profile operation successful:', result);
      if (setProfileCompleted) setProfileCompleted(true);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(`Error saving profile: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Help us personalize your experience by providing some additional information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow">
          {/* Student Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_student"
              name="is_student"
              checked={formData.is_student}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_student" className="ml-2 block text-sm text-gray-900">
              I am a student
            </label>
          </div>

          {/* Institution Name */}
          {formData.is_student && (
            <div>
              <label htmlFor="institution_name" className="block text-sm font-medium text-gray-700">
                Institution Name
              </label>
              <select
                name="institution_name"
                id="institution_name"
                value={formData.institution_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={formData.is_student}
              >
                <option value="">Select your institution</option>
                {institutionOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Monthly Income Source */}
          <div>
            <label htmlFor="monthly_income_source" className="block text-sm font-medium text-gray-700">
              Monthly Income Source
            </label>
            <select
              id="monthly_income_source"
              name="monthly_income_source"
              value={formData.monthly_income_source}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select income source</option>
              {incomeSources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Expenses Range */}
          <div>
            <label htmlFor="monthly_expenses_range" className="block text-sm font-medium text-gray-700">
              Monthly Expenses Range
            </label>
            <select
              id="monthly_expenses_range"
              name="monthly_expenses_range"
              value={formData.monthly_expenses_range}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select expense range</option>
              {expenseRanges.map(range => (
                <option key={range.id} value={range.id}>
                  {range.name}
                </option>
              ))}
            </select>
          </div>

          {/* Loan Amount */}
          <div>
            <label htmlFor="loan_amount" className="block text-sm font-medium text-gray-700">
              Loan Amount (if any)
            </label>
            <input
              type="number"
              name="loan_amount"
              id="loan_amount"
              value={formData.loan_amount}
              onChange={handleChange}
              placeholder="0.00"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Expected Graduation Month */}
          {formData.is_student && (
            <div>
              <label htmlFor="expected_graduation_month" className="block text-sm font-medium text-gray-700">
                Expected Graduation Month
              </label>
              <input
                type="month"
                name="expected_graduation_month"
                id="expected_graduation_month"
                value={formData.expected_graduation_month}
                onChange={handleChange}
                min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                max={`${new Date().getFullYear() + 10}-12`}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={formData.is_student}
              />
            </div>
          )}

          {/* Currency Preference */}
          <div>
            <label htmlFor="currency_preference" className="block text-sm font-medium text-gray-700">
              Currency Preference
            </label>
            <select
              id="currency_preference"
              name="currency_preference"
              value={formData.currency_preference}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select currency</option>
              {currencies.map(currency => (
                <option key={currency.id} value={currency.id}>{currency.name}</option>
              ))}
            </select>
          </div>

          {/* Loan Lender */}
          {formData.loan_amount > 0 && (
            <div>
              <label htmlFor="loan_lender" className="block text-sm font-medium text-gray-700">
                Loan Lender
              </label>
              <select
                id="loan_lender"
                name="loan_lender"
                value={formData.loan_lender}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select lender</option>
                {loanLenders.map(lender => (
                  <option key={lender.id} value={lender.id}>
                    {lender.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtendedProfile; 