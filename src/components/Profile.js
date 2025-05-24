import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [avatarUrl, setAvatarUrl] = useState(null);
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          is_student: data.is_student || false,
          institution_name: data.institution_name || '',
          monthly_income_source: data.monthly_income_source || '',
          monthly_expenses_range: data.monthly_expenses_range || '',
          loan_amount: data.loan_amount || '',
          expected_graduation_month: data.expected_graduation_month || '',
          loan_lender: data.loan_lender || '',
          currency_preference: data.currency_preference || 'MYR'
        });
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      setMessage({ type: '', text: '' });

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create a unique file path using user ID
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      // Upload the file to the avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: 'Failed to upload profile picture' });
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          is_student: formData.is_student,
          institution_name: formData.is_student ? formData.institution_name : null,
          monthly_income_source: formData.monthly_income_source || null,
          monthly_expenses_range: formData.monthly_expenses_range || null,
          loan_amount: formData.loan_amount ? parseFloat(formData.loan_amount) : null,
          expected_graduation_month: formData.is_student ? formData.expected_graduation_month : null,
          loan_lender: formData.loan_amount > 0 ? formData.loan_lender : null,
          currency_preference: formData.currency_preference,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0BCDAA] to-[#05A6D4]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#05A6D4]"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-gradient-to-br from-[#0BCDAA] to-[#05A6D4] min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white bg-opacity-95 rounded-3xl shadow-2xl p-8 md:p-12">
          <h1 className="text-3xl font-extrabold text-[#05A6D4] mb-8 text-center drop-shadow">Profile Settings</h1>

          {message.text && (
            <div className={`p-4 mb-6 rounded-md text-center font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#0BCDAA] shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-[#0BCDAA] shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-2 right-2 bg-gradient-to-r from-[#0BCDAA] to-[#05A6D4] text-white p-2 rounded-full cursor-pointer hover:from-[#05A6D4] hover:to-[#0BCDAA] transition-colors shadow-lg border-2 border-white group-hover:scale-110"
                  title="Upload profile picture"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                {uploading ? 'Uploading...' : 'Click the camera icon to upload a profile picture'}
              </p>
            </div>

            {/* Student & Financial Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center md:col-span-2">
                <input
                  type="checkbox"
                  id="is_student"
                  name="is_student"
                  checked={formData.is_student}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#05A6D4] focus:ring-[#0BCDAA] border-gray-300 rounded"
                />
                <label htmlFor="is_student" className="ml-2 block text-sm text-gray-900 font-medium">
                  I am a student
                </label>
              </div>
              {formData.is_student && (
                <div className="md:col-span-2">
                  <label htmlFor="institution_name" className="block text-sm font-semibold text-gray-700 mb-1">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    name="institution_name"
                    id="institution_name"
                    value={formData.institution_name}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                    required={formData.is_student}
                  />
                </div>
              )}
              <div>
                <label htmlFor="monthly_income_source" className="block text-sm font-semibold text-gray-700 mb-1">
                  Monthly Income Source
                </label>
                <select
                  id="monthly_income_source"
                  name="monthly_income_source"
                  value={formData.monthly_income_source}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                >
                  <option value="">Select income source</option>
                  {incomeSources.map(source => (
                    <option key={source.id} value={source.id}>{source.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="monthly_expenses_range" className="block text-sm font-semibold text-gray-700 mb-1">
                  Monthly Expenses Range
                </label>
                <select
                  id="monthly_expenses_range"
                  name="monthly_expenses_range"
                  value={formData.monthly_expenses_range}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                >
                  <option value="">Select expense range</option>
                  {expenseRanges.map(range => (
                    <option key={range.id} value={range.id}>{range.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="loan_amount" className="block text-sm font-semibold text-gray-700 mb-1">
                  Loan Amount (if any)
                </label>
                <input
                  type="number"
                  name="loan_amount"
                  id="loan_amount"
                  value={formData.loan_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                />
              </div>
              {formData.is_student && (
                <div>
                  <label htmlFor="expected_graduation_month" className="block text-sm font-semibold text-gray-700 mb-1">
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
                    className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                    required={formData.is_student}
                  />
                </div>
              )}
              <div>
                <label htmlFor="currency_preference" className="block text-sm font-semibold text-gray-700 mb-1">
                  Currency Preference
                </label>
                <select
                  id="currency_preference"
                  name="currency_preference"
                  value={formData.currency_preference}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                  required
                >
                  {currencies.map(currency => (
                    <option key={currency.id} value={currency.id}>{currency.name}</option>
                  ))}
                </select>
              </div>
              {formData.loan_amount > 0 && (
                <div>
                  <label htmlFor="loan_lender" className="block text-sm font-semibold text-gray-700 mb-1">
                    Loan Lender
                  </label>
                  <select
                    id="loan_lender"
                    name="loan_lender"
                    value={formData.loan_lender}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                  >
                    <option value="">Select lender</option>
                    {loanLenders.map(lender => (
                      <option key={lender.id} value={lender.id}>{lender.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-[#0BCDAA] to-[#05A6D4] text-white py-2 px-4 rounded-xl font-bold text-lg shadow-lg hover:from-[#05A6D4] hover:to-[#0BCDAA] focus:outline-none focus:ring-2 focus:ring-[#05A6D4] focus:ring-offset-2 disabled:opacity-50 transition-all"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile; 