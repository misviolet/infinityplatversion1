import React, { useState, useEffect } from 'react';
import { X, FileText, User, Flag, Calendar, Send } from 'lucide-react';
import { supabaseAuth } from '../services/supabaseAuth';

interface CreateWorkflowEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entryData: WorkflowEntryFormData) => Promise<void>;
  stageName: string;
}

export interface WorkflowEntryFormData {
  entry_name: string;
  entry_description?: string;
  assigned_to: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  due_date?: string;
}

export default function CreateWorkflowEntryModal({ isOpen, onClose, onSubmit, stageName }: CreateWorkflowEntryModalProps) {
  const [formData, setFormData] = useState<WorkflowEntryFormData>({
    entry_name: '',
    entry_description: '',
    assigned_to: '',
    priority: 'Medium',
    due_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const priorityOptions = [
    { value: 'Low', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'Medium', color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'High', color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'Critical', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchUserNames();
    }
  }, [isOpen]);

  const fetchUserNames = async () => {
    setIsLoadingUsers(true);
    try {
      const names = await supabaseAuth.getUserNames();
      setUserNames(names);
    } catch (error) {
      console.error('Error fetching user names:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleInputChange = (field: keyof WorkflowEntryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.entry_name.trim()) newErrors.entry_name = 'Entry name is required';
    if (!formData.assigned_to.trim()) newErrors.assigned_to = 'Assigned person is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        entry_name: formData.entry_name.trim(),
        entry_description: formData.entry_description?.trim() || undefined,
        assigned_to: formData.assigned_to.trim(),
        priority: formData.priority,
        due_date: formData.due_date || undefined
      });
      // Reset form on successful submission
      setFormData({
        entry_name: '',
        entry_description: '',
        assigned_to: '',
        priority: 'Medium',
        due_date: '',
      });
      onClose();
    } catch (error) {
      console.error('Error submitting workflow entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      entry_name: '',
      entry_description: '',
      assigned_to: '',
      priority: 'Medium',
      due_date: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Create Workflow Entry</h2>
                <p className="text-red-100">For stage: {stageName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Entry Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Entry Name *
            </label>
            <input
              type="text"
              value={formData.entry_name}
              onChange={(e) => handleInputChange('entry_name', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 ${
                errors.entry_name ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter entry name (e.g., Order #ORD-001)"
            />
            {errors.entry_name && (
              <p className="text-sm text-red-600 font-medium">{errors.entry_name}</p>
            )}
          </div>

          {/* Entry Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Entry Description
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="h-5 w-5 text-red-400" />
              </div>
              <textarea
                value={formData.entry_description}
                onChange={(e) => handleInputChange('entry_description', e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 resize-none"
                placeholder="Enter entry description (optional)..."
              />
            </div>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Assigned To *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-red-400" />
              </div>
              <select
                value={formData.assigned_to}
                onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 ${
                  errors.assigned_to ? 'border-red-500' : 'border-gray-200'
                }`}
                disabled={isLoadingUsers}
              >
                <option value="">Select person</option>
                {userNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            {errors.assigned_to && (
              <p className="text-sm text-red-600 font-medium">{errors.assigned_to}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Priority *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Flag className="h-5 w-5 text-red-400" />
              </div>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as any)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Due Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-red-400" />
              </div>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingUsers}
              className="flex items-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Create Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}