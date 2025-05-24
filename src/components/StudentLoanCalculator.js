import React, { useState } from 'react';
import { supabase, getCurrentUser } from '../supabaseClient';
// import { Pie } from 'react-chartjs-2'; // Uncomment if using Chart.js

const LENDER_OPTIONS = [
  { value: 'JPA', label: 'JPA' },
  { value: 'MARA', label: 'MARA' },
  { value: 'PTPTN', label: 'PTPTN' },
];

const LEVEL_OPTIONS = {
  JPA: [
    { value: 'certificate', label: 'Certificate' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'degree', label: 'Degree' },
    { value: 'medicine', label: 'Medicine' },
  ],
  MARA: [
    { value: 'certificate', label: 'Certificate' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'degree', label: 'Degree' },
    { value: 'medicine', label: 'Medicine' },
  ],
  PTPTN: [
    { value: 'certificate', label: 'Certificate' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'degree', label: 'Degree' },
    { value: 'medicine', label: 'Medicine' },
  ],
};

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'extended', label: 'Extended' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

function calculateRepayment({ lender, level, gpa, status, exemption, duration }) {
  let percent = 100;
  let explanation = '';
  gpa = parseFloat(gpa);

  if (lender === 'JPA') {
    if (status === 'failed' || status === 'withdrawn') {
      percent = 100;
      explanation = 'Failed/Withdrawn: 100% repayment required.';
    } else if (level === 'medicine' && status === 'completed') {
      percent = 25;
      explanation = 'Medicine (Pass): 25% repayment required.';
    } else if (status === 'extended' || (gpa >= 2.00 && gpa <= 2.49)) {
      percent = 50;
      explanation = 'CGPA 2.00–2.49 or Extended Study: 50% repayment required.';
    } else if (gpa >= 2.50 && gpa <= 2.99) {
      percent = 25;
      explanation = 'CGPA 2.50–2.99: 25% repayment required.';
    } else if (gpa >= 3.00 && gpa <= 3.49) {
      percent = 20;
      explanation = 'CGPA 3.00–3.49: 20% repayment required.';
    } else if (gpa >= 3.50 && gpa <= 4.00) {
      percent = 15;
      explanation = 'CGPA 3.50–4.00: 15% repayment required.';
    }
  } else if (lender === 'MARA') {
    if (gpa >= 3.50 && exemption) {
      percent = 0;
      explanation = 'CGPA ≥ 3.50 with exemption: 0% repayment required.';
    } else if (gpa >= 3.00 && gpa < 3.50) {
      percent = 10;
      explanation = 'CGPA 3.00–3.49: 10% repayment required.';
    } else if (gpa >= 2.75 && gpa < 3.00) {
      percent = 25;
      explanation = 'CGPA 2.75–2.99: 25% repayment required.';
    } else if (gpa >= 2.50 && gpa < 2.75) {
      percent = 50;
      explanation = 'CGPA 2.50–2.74: 50% repayment required.';
    } else if (gpa >= 2.00 && gpa < 2.50) {
      percent = 75;
      explanation = 'CGPA 2.00–2.49: 75% repayment required.';
    } else if (gpa < 2.00 || status === 'failed') {
      percent = 100;
      explanation = 'Below 2.00 / Fail: 100% repayment required.';
    }
  } else if (lender === 'PTPTN') {
    if (exemption) {
      percent = 0;
      explanation = 'First-Class Honors with exemption: 0% repayment required.';
    } else {
      percent = 100;
      explanation = 'No exemption: 100% repayment required.';
    }
  }
  return { percent, explanation };
}

const StudentLoanCalculator = () => {
  const [form, setForm] = useState({
    lender: '',
    level: '',
    gpa: '',
    status: '',
    exemption: false,
    duration: '',
    loan_amount: '',
    interest_rate: '',
    loan_term_months: '',
    monthly_income: '',
  });
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Helper to calculate monthly repayment, total interest, payoff date, affordability
  function calculateLoanDetails({ loan_amount, interest_rate, loan_term_months, monthly_income }) {
    const principal = parseFloat(loan_amount);
    const rate = parseFloat(interest_rate) / 100 / 12;
    const n = parseInt(loan_term_months);
    let monthly_repayment = 0;
    let total_interest = 0;
    let payoff_date = '';
    let affordability = null;
    if (principal > 0 && rate > 0 && n > 0) {
      monthly_repayment = principal * rate * Math.pow(1 + rate, n) / (Math.pow(1 + rate, n) - 1);
      total_interest = monthly_repayment * n - principal;
      const now = new Date();
      now.setMonth(now.getMonth() + n);
      payoff_date = now.toISOString().slice(0, 10);
      if (monthly_income) {
        affordability = (monthly_repayment / parseFloat(monthly_income)) * 100;
      }
    }
    return {
      monthly_repayment: monthly_repayment ? parseFloat(monthly_repayment.toFixed(2)) : 0,
      total_interest: total_interest ? parseFloat(total_interest.toFixed(2)) : 0,
      payoff_date,
      affordability: affordability ? parseFloat(affordability.toFixed(2)) : null,
    };
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const calc = calculateRepayment(form);
    const loanDetails = calculateLoanDetails(form);
    setResult({ ...calc, ...loanDetails });
    setSubmitted(true);
  };

  const handleRecalculate = () => {
    setSubmitted(false);
    setResult(null);
  };

  const lenderLevels = form.lender ? LEVEL_OPTIONS[form.lender] : [];

  const saveScenario = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const user = await getCurrentUser();
      if (!user) {
        setSaveMessage('You must be logged in to save scenarios.');
        setSaving(false);
        return;
      }
      const { error } = await supabase.from('loan_scenarios').insert([
        {
          user_id: user.id,
          lender: form.lender,
          level: form.level,
          gpa: form.gpa ? parseFloat(form.gpa) : null,
          status: form.status,
          exemption: form.exemption,
          duration: form.duration ? parseInt(form.duration) : null,
          repayment_percent: result.percent,
          explanation: result.explanation,
          created_at: new Date().toISOString(),
        }
      ]);
      if (error) throw error;
      setSaveMessage('Scenario saved!');
    } catch (err) {
      setSaveMessage('Failed to save scenario.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 bg-gradient-to-br from-[#0BCDAA] to-[#05A6D4] min-h-screen flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white bg-opacity-95 rounded-3xl shadow-2xl p-8 md:p-12 mt-8">
        <h1 className="text-3xl font-extrabold text-[#05A6D4] mb-8 text-center drop-shadow">Student Loan Calculator</h1>
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lender */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Lender</label>
              <select
                name="lender"
                value={form.lender}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                required
              >
                <option value="">Select lender</option>
                {LENDER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Level of Study / Course Type */}
            {form.lender && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Level of Study / Course Type</label>
                <select
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                  required
                >
                  <option value="">Select level</option>
                  {lenderLevels.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {/* GPA / Academic Achievement */}
            {form.lender && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">GPA / Academic Achievement</label>
                <input
                  type="number"
                  name="gpa"
                  value={form.gpa}
                  onChange={handleChange}
                  min={0}
                  max={4}
                  step={0.01}
                  placeholder="e.g. 3.25"
                  className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                  required
                />
              </div>
            )}
            {/* Study Status */}
            {form.lender && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Study Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                  required
                >
                  <option value="">Select status</option>
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {/* Exemption Applied? (for MARA/PTPTN only) */}
            {(form.lender === 'MARA' || form.lender === 'PTPTN') && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="exemption"
                  id="exemption"
                  checked={form.exemption}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#05A6D4] focus:ring-[#0BCDAA] border-gray-300 rounded"
                />
                <label htmlFor="exemption" className="ml-2 block text-sm text-gray-900 font-medium">
                  Exemption Applied?
                </label>
              </div>
            )}
            {/* Duration of Study (JPA only, for extended logic) */}
            {form.lender === 'JPA' && form.status === 'extended' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Duration of Study (years)</label>
                <input
                  type="number"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  min={0}
                  max={10}
                  step={1}
                  className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                />
              </div>
            )}
            {/* Loan Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loan Amount (RM)</label>
              <input
                type="number"
                name="loan_amount"
                value={form.loan_amount}
                onChange={handleChange}
                min={0}
                step={0.01}
                placeholder="e.g. 20000"
                className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                required
              />
            </div>
            {/* Interest Rate (%) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                name="interest_rate"
                value={form.interest_rate}
                onChange={handleChange}
                min={0}
                step={0.01}
                placeholder="e.g. 1.0"
                className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                required
              />
            </div>
            {/* Loan Term (Months) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Loan Term (Months)</label>
              <input
                type="number"
                name="loan_term_months"
                value={form.loan_term_months}
                onChange={handleChange}
                min={1}
                step={1}
                placeholder="e.g. 120"
                className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
                required
              />
            </div>
            {/* Monthly Income (optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Income (optional)</label>
              <input
                type="number"
                name="monthly_income"
                value={form.monthly_income}
                onChange={handleChange}
                min={0}
                step={0.01}
                placeholder="e.g. 2500"
                className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-[#05A6D4] focus:ring-[#0BCDAA] p-2"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#0BCDAA] to-[#05A6D4] text-white py-2 px-4 rounded-xl font-bold text-lg shadow-lg hover:from-[#05A6D4] hover:to-[#0BCDAA] focus:outline-none focus:ring-2 focus:ring-[#05A6D4] focus:ring-offset-2 transition-all"
            >
              Calculate
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6 text-center">
              <h2 className="text-2xl font-bold text-[#05A6D4] mb-2">Repayment: {result.percent}%</h2>
              <p className="text-gray-700 mb-2">{result.explanation}</p>
              {/* Pie chart placeholder */}
              {/* <Pie data={...} /> */}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRecalculate}
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
              >
                Recalculate
              </button>
              <button onClick={saveScenario} disabled={saving} className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-60">{saving ? 'Saving...' : 'Save Scenario'}</button>
            </div>
            {saveMessage && <div className="mt-2 text-center text-sm text-blue-700">{saveMessage}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLoanCalculator; 