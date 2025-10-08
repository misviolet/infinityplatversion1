import React, { useState } from 'react';
import { X, MessageSquare, Flag, Calendar, CheckCircle2, Paperclip } from 'lucide-react';
import { Task } from '../lib/supabase';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSubmit: (completionData: TaskCompletionData) => Promise<void>;
}

export interface TaskCompletionData {
  taskId: string;
  comments: string;
  status: 'Completed' | 'Not Applicable' | 'Need Clarity' | 'Shifted';
  shiftedToDate?: string;
  supportDocumentUrl?: string;
}

export default function TaskCompletionModal({ isOpen, onClose, task, onSubmit }: TaskCompletionModalProps) {
  const [formData, setFormData] = useState<TaskCompletionData>({
    taskId: '',
    comments: '',
    status: 'Completed',
    shiftedToDate: '',
    supportDocumentUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const statusOptions = [
    { value: 'Completed', color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'Not Applicable', color: 'text-gray-600', bg: 'bg-gray-50' },
    { value: 'Need Clarity', color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'Shifted', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  React.useEffect(() => {
    if (isOpen && task) {
      setFormData({
        taskId: task.id,
        comments: '',
        status: 'Completed',
        shiftedToDate: '',
        supportDocumentUrl: '',
      });
      setErrors({});
    }
  }, [isOpen, task]);

  const handleInputChange = (field: keyof TaskCompletionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.comments.trim()) newErrors.comments = 'Comments are required';
    if (formData.status === 'Shifted' && !formData.shiftedToDate) {
      newErrors.shiftedToDate = 'New date is required when shifting task';
    }
    if (task?.support_document_required && formData.status === 'Completed' && !formData.supportDocumentUrl?.trim()) {
      newErrors.supportDocumentUrl = 'Support document is required for this task';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Complete Task</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Task Details (Read-only) */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Task Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-600">Task:</span>
              <p className="text-gray-800 font-medium">{task.task}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Doer:</span>
              <p className="text-gray-800 font-medium">{task.doer_name}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Priority:</span>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                task.priority === 'High' ? 'bg-red-100 text-red-600' :
                task.priority === 'Medium' ? 'bg-blue-100 text-blue-600' :
                'bg-green-100 text-green-600'
              }`}>
                {task.priority}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Due Date:</span>
              <p className="text-gray-800 font-medium">{new Date(task.expected_completion_date).toLocaleDateString()}</p>
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold text-gray-600">Description:</span>
              <p className="text-gray-800 font-medium">{task.task_description}</p>
            </div>
            {task.support_document_required && (
              <div className="md:col-span-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                  <Paperclip className="w-3 h-3 mr-1" />
                  Support Document Required
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Completion Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Status *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Flag className="h-5 w-5 text-blue-400" />
              </div>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* New Date (only if Shifted) */}
          {formData.status === 'Shifted' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                New Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <input
                  type="date"
                  value={formData.shiftedToDate || ''}
                  onChange={(e) => handleInputChange('shiftedToDate', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                    errors.shiftedToDate ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
              </div>
              {errors.shiftedToDate && (
                <p className="text-sm text-red-600 font-medium">{errors.shiftedToDate}</p>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Comments *
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
              <textarea
                value={formData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                rows={4}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none ${
                  errors.comments ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter completion comments..."
              />
            </div>
            {errors.comments && (
              <p className="text-sm text-red-600 font-medium">{errors.comments}</p>
            )}
          </div>

          {/* Support Document Upload (only if required and status is Completed) */}
          {task?.support_document_required && formData.status === 'Completed' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Support Document * 
                <span className="text-xs text-blue-600 font-normal ml-1">(Required for completion)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Paperclip className="h-5 w-5 text-blue-400" />
                </div>
                <input
                  type="url"
                  value={formData.supportDocumentUrl || ''}
                  onChange={(e) => handleInputChange('supportDocumentUrl', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 ${
                    errors.supportDocumentUrl ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Enter support document URL"
                />
              </div>
              {errors.supportDocumentUrl && (
                <p className="text-sm text-red-600 font-medium">{errors.supportDocumentUrl}</p>
              )}
              <p className="text-xs text-gray-500">
                Please provide a URL to your support document (Google Drive, Dropbox, etc.)
              </p>
            </div>
          )}

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
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}