import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ExtendedProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    isStudent: false,
    institutionName: '',
    monthlyIncomeSource: '',
    monthlyExpensesRange: '',
    loanAmount: '',
    expectedGraduationMonth: '',
    loanLender: '',
    providerType: '',
    providerName: '',
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

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...formData,
          profile_completed: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
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
              id="isStudent"
              name="isStudent"
              checked={formData.isStudent}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isStudent" className="ml-2 block text-sm text-gray-900">
              I am a student
            </label>
          </div>

          {/* Institution Name */}
          {formData.isStudent && (
            <div>
              <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700">
                Institution Name
              </label>
              <select
                name="institutionName"
                id="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
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
            <label htmlFor="monthlyIncomeSource" className="block text-sm font-medium text-gray-700">
              Monthly Income Source
            </label>
            <select
              id="monthlyIncomeSource"
              name="monthlyIncomeSource"
              value={formData.monthlyIncomeSource}
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
            <label htmlFor="monthlyExpensesRange" className="block text-sm font-medium text-gray-700">
              Monthly Expenses Range
            </label>
            <select
              id="monthlyExpensesRange"
              name="monthlyExpensesRange"
              value={formData.monthlyExpensesRange}
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
            <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700">
              Loan Amount (if any)
            </label>
            <input
              type="number"
              name="loanAmount"
              id="loanAmount"
              value={formData.loanAmount}
              onChange={handleChange}
              placeholder="0.00"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Expected Graduation Year (MM/YYYY) */}
          {formData.isStudent && (
            <div>
              <label htmlFor="expectedGraduationMonth" className="block text-sm font-medium text-gray-700">
                Expected Graduation (MM/YYYY)
              </label>
              <input
                type="month"
                name="expectedGraduationMonth"
                id="expectedGraduationMonth"
                value={formData.expectedGraduationMonth}
                onChange={handleChange}
                min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                max={`${new Date().getFullYear() + 10}-12`}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* Loan/Scholarship Provider */}
          <div>
            <label htmlFor="providerType" className="block text-sm font-medium text-gray-700">
              Loan/Scholarship Provider
            </label>
            <select
              id="providerType"
              name="providerType"
              value={formData.providerType}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select provider</option>
              {providerOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            {(formData.providerType === 'ScholarshipCompany' || formData.providerType === 'Other') && (
              <input
                type="text"
                name="providerName"
                value={formData.providerName}
                onChange={handleChange}
                placeholder="Enter company/organisation name"
                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            )}
          </div>

          {/* Loan Lender */}
          {formData.loanAmount > 0 && (
            <div>
              <label htmlFor="loanLender" className="block text-sm font-medium text-gray-700">
                Loan Lender
              </label>
              <select
                id="loanLender"
                name="loanLender"
                value={formData.loanLender}
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