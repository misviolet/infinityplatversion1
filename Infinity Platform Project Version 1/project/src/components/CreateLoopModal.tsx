import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Users, Flag, FileText, Paperclip, Send, Building, Repeat, Tag } from 'lucide-react';
import { supabaseAuth } from '../services/supabaseAuth';
import { loopTaskService } from '../services/loopTaskService';

interface CreateLoopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: LoopTaskFormData) => Promise<void>;
}

export interface LoopTaskFormData {
  taskName: string;
  priority: 'Critical' | 'Non Critical';
  taskOwner: string;
  doerName: string;
  department: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  taskDescription: string;
  guidelineUrl?: string;
  category: 'Compliances Task - Internal' | 'Compliances Task - Client' | 'Internal Task - Non Client' | 'Client Task' | 'Product';
  startDate: string;
}

export default function CreateLoopModal({ isOpen, onClose, onSubmit }: CreateLoopModalProps) {
  const [formData, setFormData] = useState<LoopTaskFormData>({
    taskName: '',
    priority: 'Non Critical',
    taskOwner: '',
    doerName: '',
    department: '',
    frequency: 'Monthly',
    taskDescription: '',
    guidelineUrl: '',
    category: 'Internal Task - Non Client',
    startDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const priorityOptions = [
    { value: 'Critical', color: 'text-red-600', bg: 'bg-red-50' },
    { value: 'Non Critical', color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const frequencyOptions = [
    { value: 'Daily', color: 'text-red-600', bg: 'bg-red-50' },
    { value: 'Weekly', color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'Monthly', color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'Quarterly', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'Yearly', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const categoryOptions = [
    'Compliances Task - Internal',
    'Compliances Task - Client',
    'Internal Task - Non Client',
    'Client Task',
    'Product'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchUserNames();
      setDepartments(loopTaskService.getDepartments());
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

  const handleInputChange = (field: keyof LoopTaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.taskName.trim()) newErrors.taskName = 'Task Name is required';
    if (!formData.taskOwner.trim()) newErrors.taskOwner = 'Task Owner is required';
    if (!formData.doerName.trim()) newErrors.doerName = 'Doer Name is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.taskDescription.trim()) newErrors.taskDescription = 'Task Description is required';
    if (!formData.startDate) newErrors.startDate = 'Start Date is required';

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
        taskName: '',
        priority: 'Non Critical',
        taskOwner: '',
        doerName: '',
        department: '',
        frequency: 'Monthly',
        taskDescription: '',
        guidelineUrl: '',
        category: 'Internal Task - Non Client',
        startDate: '',
      });
      onClose();
    } catch (error) {
      console.error('Error submitting loop task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Repeat className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Create Loop Task</h2>
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
          {/* Row 1: Task Name and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Task Name *
              </label>
              <input
                type="text"
                value={formData.taskName}
                onChange={(e) => handleInputChange('taskName', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 ${
                  errors.taskName ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter task name"
              />
              {errors.taskName && (
                <p className="text-sm text-red-600 font-medium">{errors.taskName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Priority *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Flag className="h-5 w-5 text-green-400" />
                </div>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as 'Critical' | 'Non Critical')}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Task Owner and Doer Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Task Owner *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <select
                  value={formData.taskOwner}
                  onChange={(e) => handleInputChange('taskOwner', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 ${
                    errors.taskOwner ? 'border-red-500' : 'border-gray-200'
                  }`}
                  disabled={isLoadingUsers}
                >
                  <option value="">Select Task Owner</option>
                  {userNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.taskOwner && (
                <p className="text-sm text-red-600 font-medium">{errors.taskOwner}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Doer Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-green-400" />
                </div>
                <select
                  value={formData.doerName}
                  onChange={(e) => handleInputChange('doerName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 ${
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

          {/* Row 3: Department and Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Department *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-green-400" />
                </div>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 ${
                    errors.department ? 'border-red-500' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              {errors.department && (
                <p className="text-sm text-red-600 font-medium">{errors.department}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Frequency *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Repeat className="h-5 w-5 text-green-400" />
                </div>
                <select
                  value={formData.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value as any)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
                >
                  {frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Category *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-green-400" />
              </div>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value as any)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Start Date *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-green-400" />
              </div>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.startDate && (
              <p className="text-sm text-red-600 font-medium">{errors.startDate}</p>
            )}
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Task Description *
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="h-5 w-5 text-green-400" />
              </div>
              <textarea
                value={formData.taskDescription}
                onChange={(e) => handleInputChange('taskDescription', e.target.value)}
                rows={4}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 resize-none ${
                  errors.taskDescription ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter detailed task description..."
              />
            </div>
            {errors.taskDescription && (
              <p className="text-sm text-red-600 font-medium">{errors.taskDescription}</p>
            )}
          </div>

          {/* Guideline URL */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Guideline (Link)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Paperclip className="h-5 w-5 text-green-400" />
              </div>
              <input
                type="url"
                value={formData.guidelineUrl || ''}
                onChange={(e) => handleInputChange('guidelineUrl', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
                placeholder="Enter guideline URL (optional)"
              />
            </div>
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
              className="flex items-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Create Loop</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}