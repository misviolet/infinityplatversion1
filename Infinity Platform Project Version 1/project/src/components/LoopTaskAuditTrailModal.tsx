import React, { useState, useEffect } from 'react';
import { X, History, Loader2, AlertCircle, Clock, User, FileText } from 'lucide-react';
import { LoopTask, LoopTaskAuditTrail } from '../lib/supabase';
import { loopTaskManagementService } from '../services/loopTaskManagementService';

interface LoopTaskAuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: LoopTask | null;
}

export default function LoopTaskAuditTrailModal({
  isOpen,
  onClose,
  task
}: LoopTaskAuditTrailModalProps) {
  const [auditTrail, setAuditTrail] = useState<LoopTaskAuditTrail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && task) {
      fetchAuditTrail();
    }
  }, [isOpen, task]);

  const fetchAuditTrail = async () => {
    if (!task) return;

    setIsLoading(true);
    setError('');

    try {
      const trail = await loopTaskManagementService.getTaskAuditTrail(task.id);
      setAuditTrail(trail);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit trail');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderValueChange = (previous: any, newValue: any) => {
    if (!previous && !newValue) return null;

    const renderValue = (value: any) => {
      if (typeof value === 'object' && value !== null) {
        return Object.entries(value).map(([key, val]) => (
          <div key={key} className="text-xs">
            <span className="font-medium">{key}:</span> {String(val)}
          </div>
        ));
      }
      return <span className="text-xs">{String(value)}</span>;
    };

    return (
      <div className="mt-2 space-y-1">
        {previous && (
          <div className="bg-red-50 border border-red-200 rounded px-2 py-1">
            <div className="text-xs font-medium text-red-800 mb-0.5">Previous:</div>
            <div className="text-red-700">{renderValue(previous)}</div>
          </div>
        )}
        {newValue && (
          <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
            <div className="text-xs font-medium text-green-800 mb-0.5">New:</div>
            <div className="text-green-700">{renderValue(newValue)}</div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Audit Trail</h2>
              <p className="text-sm text-gray-600">{task.task_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-600">Loading audit trail...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          ) : auditTrail.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Audit History</h3>
              <p className="text-sm text-gray-600">No actions have been recorded for this task yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Activity History ({auditTrail.length} {auditTrail.length === 1 ? 'event' : 'events'})
                </h3>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-6">
                  {auditTrail.map((entry, index) => (
                    <div key={entry.id} className="relative flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        loopTaskManagementService.getActionColor(entry.action_type)
                      } ring-4 ring-white z-10`}>
                        <History className="w-4 h-4" />
                      </div>

                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              loopTaskManagementService.getActionColor(entry.action_type)
                            }`}>
                              {loopTaskManagementService.getActionLabel(entry.action_type)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(entry.created_at)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{entry.performed_by}</span>
                            <span className="text-gray-500">({entry.performed_by_role})</span>
                          </div>

                          {(entry.previous_value || entry.new_value) && (
                            <div>
                              {renderValueChange(entry.previous_value, entry.new_value)}
                            </div>
                          )}

                          {entry.notes && (
                            <div className="mt-2 flex items-start space-x-2 bg-white border border-gray-200 rounded p-2">
                              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-0.5">Notes:</div>
                                <p className="text-xs text-gray-600">{entry.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
