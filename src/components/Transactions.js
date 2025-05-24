import React, { useState, useEffect, useCallback } from 'react';
import { supabase, getCurrentUser } from '../supabaseClient';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const Transactions = () => {
  console.log('Rendering Transactions component');
  // States for the form
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); // Default to expense
  const [notes, setNotes] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1); // Current month (1-12)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear()); // Current year
  const [editingId, setEditingId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [customCategories, setCustomCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Predefined categories
  const categories = [
    'Food', 'Rent', 'Transport', 'Entertainment', 'Utilities', 
    'Shopping', 'Healthcare', 'Education', 'Travel', 'Other'
  ];

  // Get current user on component mount
  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
        } else {
          setError('User not authenticated. Please log in.');
        }
      } catch (err) {
        console.error('Error getting user:', err);
        setError('Authentication error. Please try logging in again.');
      }
    };
    
    getUser();
  }, []);

  // Fetch custom categories on component mount
  useEffect(() => {
    const fetchCustomCategories = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        setCustomCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCustomCategories();
  }, [userId]);

  // Update fetchEntries to include search and category filter
  const fetchEntries = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Create date range for filtering
      const startDate = `${filterYear}-${filterMonth.toString().padStart(2, '0')}-01`;
      let endDate;
      
      if (filterMonth === 12) {
        endDate = `${filterYear + 1}-01-01`;
      } else {
        endDate = `${filterYear}-${(filterMonth + 1).toString().padStart(2, '0')}-01`;
      }

      // Build the query
      let query = supabase
        .from('budget_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lt('date', endDate);

      // Add category filter if selected
      if (filterCategory) {
        query = query.eq('category', filterCategory);
      }

      // Add search filter if query exists
      if (searchQuery) {
        query = query.ilike('notes', `%${searchQuery}%`);
      }

      // Add ordering
      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setError('Failed to fetch entries. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear, userId, filterCategory, searchQuery]);

  // Fetch entries from Supabase on component mount and when filters change
  useEffect(() => {
    fetchEntries();
  }, [filterMonth, filterYear, fetchEntries]);

  // Add new category to database
  const addNewCategory = async (categoryName) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            user_id: userId,
            name: categoryName,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;
      
      setCustomCategories(prev => [...prev, data[0]]);
      setCategory(categoryName);
      setShowNewCategory(false);
      setNewCategory('');
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Failed to add new category. Please try again.');
    }
  };

  // Modify handleSubmit to handle new categories
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setError('User not authenticated. Please log in.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const finalCategory = showNewCategory ? newCategory : category;
      
      if (!finalCategory) {
        setError('Please select or enter a category.');
        return;
      }

      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount.');
        return;
      }

      // If it's a new category, add it to the database first
      if (showNewCategory && newCategory) {
        await addNewCategory(newCategory);
      }

      const entry = {
        user_id: userId,
        date,
        category: finalCategory,
        amount: parseFloat(amount),
        type,
        notes
      };

      let result;

      if (editingId) {
        // Update existing entry
        result = await supabase
          .from('budget_entries')
          .update(entry)
          .eq('id', editingId)
          .eq('user_id', userId);
      } else {
        // Insert new entry
        result = await supabase
          .from('budget_entries')
          .insert([entry]);
      }

      if (result.error) {
        throw result.error;
      }

      // Reset form
      setDate(new Date().toISOString().substr(0, 10));
      setCategory('');
      setNewCategory('');
      setAmount('');
      setType('expense');
      setNotes('');
      setShowNewCategory(false);
      setEditingId(null);
      
      // Refresh entries list
      fetchEntries();
      
    } catch (error) {
      console.error('Error saving entry:', error);
      setError('Failed to save entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!userId) {
      setError('User not authenticated. Please log in.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        setLoading(true);
        
        const { error } = await supabase
          .from('budget_entries')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          throw error;
        }

        // Refresh entries list
        fetchEntries();
        
      } catch (error) {
        console.error('Error deleting entry:', error);
        setError('Failed to delete entry. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (entry) => {
    setDate(entry.date);
    setCategory(entry.category);
    setAmount(entry.amount.toString());
    setType(entry.type);
    setNotes(entry.notes || '');
    setEditingId(entry.id);
    if (!categories.includes(entry.category)) {
      setShowNewCategory(true);
      setNewCategory(entry.category);
    } else {
      setShowNewCategory(false);
    }
    setIsModalOpen(true);
  };

  const cancelEdit = () => {
    setDate(new Date().toISOString().substr(0, 10));
    setCategory('');
    setNewCategory('');
    setAmount('');
    setType('expense');
    setNotes('');
    setShowNewCategory(false);
    setEditingId(null);
    setIsModalOpen(false);
  };

  // Calculate totals
  const totalIncome = entries
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const totalExpenses = entries
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const totalSavings = entries
    .filter(entry => entry.type === 'savings')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const totalSadaqah = entries
    .filter(entry => entry.type === 'sadaqah')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const balance = totalIncome - totalExpenses;

  // Generate array of months for the filter
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate array of years (last 5 years and next 2 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setIsModalOpen(true)}
          >
            Add Transaction
          </button>
        </div>
        
        {/* Modal for Add/Edit Transaction */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={cancelEdit}
          contentLabel={editingId ? 'Edit Transaction' : 'Add New Transaction'}
          className="max-w-2xl mx-auto mt-20 bg-white p-6 rounded-lg shadow-lg outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            {editingId ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 pl-7 border border-gray-300 rounded"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={type === 'income'}
                      onChange={() => setType('income')}
                      className="text-blue-600"
                    />
                    <span className="ml-2">Income</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={type === 'expense'}
                      onChange={() => setType('expense')}
                      className="text-blue-600"
                    />
                    <span className="ml-2">Expense</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="savings"
                      checked={type === 'savings'}
                      onChange={() => setType('savings')}
                      className="text-blue-600"
                    />
                    <span className="ml-2">Savings</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="sadaqah"
                      checked={type === 'sadaqah'}
                      onChange={() => setType('sadaqah')}
                      className="text-blue-600"
                    />
                    <span className="ml-2">Sadaqah</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="flex gap-2 items-center">
                  {!showNewCategory ? (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      required={!showNewCategory}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      {customCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Enter new category"
                      required={showNewCategory}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (showNewCategory && newCategory) {
                        addNewCategory(newCategory);
                      } else {
                        setShowNewCategory(!showNewCategory);
                      }
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    {showNewCategory ? 'Add' : 'New'}
                  </button>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows="2"
                  placeholder="Add any additional notes here"
                />
              </div>
            </div>
            
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading 
                  ? 'Processing...' 
                  : editingId 
                    ? 'Update Transaction' 
                    : 'Add Transaction'
                }
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
        
        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500 mb-1">Total Income</h3>
            <p className="text-xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500 mb-1">Total Expenses</h3>
            <p className="text-xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500 mb-1">Total Savings</h3>
            <p className="text-xl font-bold text-blue-600">${totalSavings.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm text-gray-500 mb-1">Total Sadaqah</h3>
            <p className="text-xl font-bold text-purple-600">${totalSadaqah.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Filter Card */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Notes
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in notes..."
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {customCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchEntries}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
        
        {/* Entries Table or Empty State */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No transactions yet. Add your first transaction above!
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <h2 className="text-lg font-semibold p-4 border-b text-gray-700">
              {months[filterMonth - 1]} {filterYear} Transactions
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Type</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Notes</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.category}</td>
                      <td className="px-4 py-3 text-sm">
                        <span 
                          className={entry.type === 'income' 
                            ? 'text-green-600 font-medium' 
                            : entry.type === 'savings' 
                              ? 'text-blue-600 font-medium'
                              : 'text-red-600 font-medium'
                          }
                        >
                          ${entry.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span 
                          className={`px-2 py-1 rounded text-xs ${
                            entry.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : entry.type === 'savings' 
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.notes || '-'}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions; 