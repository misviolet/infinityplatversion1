import React, { useState } from 'react';
import { X, GitBranch, FileText, Send, Hash, User, Clipboard, Clock } from 'lucide-react';

interface CreateStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stageData: { name: string; description?: string; order_index: number; who_responsible?: string; how_completion?: string; when_duration?: string }) => Promise<void>;
  nextOrderIndex: number;
}

export default function CreateStageModal({ isOpen, onClose, onSubmit, nextOrderIndex }: CreateStageModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order_index: nextOrderIndex,
    who_responsible: '',
    how_completion: '',
    when_duration: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, order_index: nextOrderIndex }));
    }
  }, [isOpen, nextOrderIndex]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Stage name is required';
    if (formData.order_index < 1) newErrors.order_index = 'Order must be at least 1';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        order_index: formData.order_index,
        who_responsible: formData.who_responsible.trim() || undefined,
        how_completion: formData.how_completion.trim() || undefined,
        when_duration: formData.when_duration.trim() || undefined
      });
      // Reset form on successful submission
      setFormData({
        name: '',
        description: '',
        order_index: nextOrderIndex,
        who_responsible: '',
        how_completion: '',
        when_duration: '',
      });
      onClose();
    } catch (error) {
      console.error('Error submitting stage:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      order_index: nextOrderIndex,
      who_responsible: '',
      how_completion: '',
      when_duration: '',
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
                <GitBranch className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold">Create New Stage</h2>
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
          {/* Stage Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Stage Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Enter stage name (e.g., Order Entry)"
            />
            {errors.name && (
              <p className="text-sm text-red-600 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Order Index */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Stage Order *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-red-400" />
              </div>
              <input
                type="number"
                min="1"
                value={formData.order_index}
                onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 1)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 ${
                  errors.order_index ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter stage order"
              />
            </div>
            {errors.order_index && (
              <p className="text-sm text-red-600 font-medium">{errors.order_index}</p>
            )}
            <p className="text-xs text-gray-500">
              Stages will be displayed in this order. Lower numbers appear first.
            </p>
          </div>

          {/* Stage Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Who (Responsible Person/Department)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-red-400" />
              </div>
              <input
                type="text"
                value={formData.who_responsible}
                onChange={(e) => handleInputChange('who_responsible', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300"
                placeholder="Enter responsible person or department"
              />
            </div>
          </div>

          {/* How Completion */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              How (Form/Process for Completion)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clipboard className="h-5 w-5 text-red-400" />
              </div>
              <input
                type="text"
                value={formData.how_completion}
                onChange={(e) => handleInputChange('how_completion', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300"
                placeholder="Enter form or process needed for completion"
              />
            </div>
          </div>

          {/* When Duration */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              When (Time Duration)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-red-400" />
              </div>
              <input
                type="text"
                value={formData.when_duration}
                onChange={(e) => handleInputChange('when_duration', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300"
                placeholder="Enter time duration (e.g., 2 hours, 1-3 days)"
              />
            </div>
          </div>

          {/* Stage Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Stage Description
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="h-5 w-5 text-red-400" />
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 resize-none"
                placeholder="Enter stage description (optional)..."
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
              disabled={isSubmitting}
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
                  <span>Create Stage</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}