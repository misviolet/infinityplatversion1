import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Users, Flag, FileText, Paperclip, Send } from 'lucide-react';
import { supabaseAuth } from '../services/supabaseAuth';

interface DelegateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskFormData) => Promise<void>;
}

export interface TaskFormData {
  stakeHolderName: string;
  doerName: string;
  priority: 'Low' | 'Medium' | 'High';
  task: string;
  expectedCompletionDate: string;
  supportDocumentRequired: boolean;
  taskDescription: string;
  supportingDocumentUrl?: string;
}

export default function DelegateTaskModal({ isOpen, onClose, onSubmit }: DelegateTaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    stakeHolderName: '',
    doerName: '',
    priority: 'Medium',
    task: '',
    expectedCompletionDate: '',
    supportDocumentRequired: true,
    taskDescription: '',
    supportingDocumentUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const priorityOptions = [
    { value: 'Low', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'Medium', color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'High', color: 'text-red-600', bg: 'bg-red-50' },
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

  const handleInputChange = (field: keyof TaskFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.stakeHolderName.trim()) newErrors.stakeHolderName = 'Stake Holder is required';
    if (!formData.doerName.trim()) newErrors.doerName = 'Doer Name is required';
    if (!formData.task.trim()) newErrors.task = 'Task is required';
    if (!formData.expectedCompletionDate) newErrors.expectedCompletionDate = 'Expected Completion Date is required';
    if (!formData.taskDescription.trim()) newErrors.taskDescription = 'Task Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on successful submission
      setFormData({
        stakeHolderName: '',
        doerName: '',
        priority: 'Medium',
        task: '',
        expectedCompletionDate: '',
        supportDocumentRequired: true,
        taskDescription: '',
        supportingDocumentUrl: '',
      });
      onClose();
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold">Delegate New Task</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Row 1: Stake Holders and Doer Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Stake Holder *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <select
                  value={formData.stakeHolderName}
                  onChange={(e) => handleInputChange('stakeHolderName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                    errors.stakeHolderName ? 'border-red-500' : 'border-gray-200'
                  }`}
                  disabled={isLoadingUsers}
                >
                  <option value="">Select Stake Holder</option>
                  {userNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.stakeHolderName && (
                <p className="text-sm text-red-600 font-medium">{errors.stakeHolderName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Doer Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <select
                  value={formData.doerName}
                  onChange={(e) => handleInputChange('doerName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                    errors.doerName ? 'border-red-500' : 'border-gray-200'
                  }`}
                  disabled={isLoadingUsers}
                >
                  <option value="">Select Doer</option>
                  {userNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.doerName && (
                <p className="text-sm text-red-600 font-medium">{errors.doerName}</p>
              )}
            </div>
          </div>

          {/* Row 2: Priority and Task */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Priority *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Flag className="h-5 w-5 text-blue-400" />
                </div>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as 'Low' | 'Medium' | 'High')}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Task *
              </label>
              <input
                type="text"
                value={formData.task}
                onChange={(e) => handleInputChange('task', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                  errors.task ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter task name"
              />
              {errors.task && (
                <p className="text-sm text-red-600 font-medium">{errors.task}</p>
              )}
            </div>
          </div>

          {/* Expected Completion Date */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Expected Completion Date *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <input
                type="date"
                value={formData.expectedCompletionDate}
                onChange={(e) => handleInputChange('expectedCompletionDate', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                  errors.expectedCompletionDate ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.expectedCompletionDate && (
              <p className="text-sm text-red-600 font-medium">{errors.expectedCompletionDate}</p>
            )}
          </div>

          {/* Support Document Required */}
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.supportDocumentRequired}
                onChange={(e) => handleInputChange('supportDocumentRequired', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-semibold text-gray-700">Support Document Required</span>
            </label>
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Task Description *
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <textarea
                value={formData.taskDescription}
                onChange={(e) => handleInputChange('taskDescription', e.target.value)}
                rows={4}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none ${
                  errors.taskDescription ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter detailed task description..."
              />
            </div>
            {errors.taskDescription && (
              <p className="text-sm text-red-600 font-medium">{errors.taskDescription}</p>
            )}
          </div>

          {/* Attach Supporting Document */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Attach Supporting Document (if any)
            </label>
            <input
              type="url"
              value={formData.supportingDocumentUrl || ''}
              onChange={(e) => handleInputChange('supportingDocumentUrl', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
              placeholder="Enter document URL (optional)"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingUsers}
              className="flex items-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Delegating...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Delegate Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}