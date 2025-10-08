import React, { useState, useEffect } from 'react';
import { X, Power, PowerOff, UserCheck, AlertCircle, Info, History } from 'lucide-react';
import { LoopTask } from '../lib/supabase';
import { loopTaskManagementService } from '../services/loopTaskManagementService';
import { rolePermissionService } from '../services/rolePermissions';
import { supabaseAuth } from '../services/supabaseAuth';

interface LoopTaskManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: LoopTask | null;
  userRole: string;
  userName: string;
  onSuccess: () => void;
}

export default function LoopTaskManagementModal({
  isOpen,
  onClose,
  task,
  userRole,
  userName,
  onSuccess
}: LoopTaskManagementModalProps) {
  const [action, setAction] = useState<'activate' | 'deactivate' | 'reassign' | null>(null);
  const [newDoerName, setNewDoerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const permissions = rolePermissionService.getPermissions(userRole);

  useEffect(() => {
    if (isOpen && task) {
      setAction(null);
      setNewDoerName('');
      setNotes('');
      setError('');
      fetchAvailableUsers();
    }
  }, [isOpen, task]);

  const fetchAvailableUsers = async () => {
    try {
      const users = await supabaseAuth.getUserNames();
      setAvailableUsers(users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const filteredUsers = availableUsers.filter(user =>
    user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !action) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (action === 'activate') {
        await loopTaskManagementService.activateTask({
          taskId: task.id,
          isActive: true,
          performedBy: userName,
          performedByRole: userRole,
          notes,
        });
      } else if (action === 'deactivate') {
        await loopTaskManagementService.deactivateTask({
          taskId: task.id,
          isActive: false,
          performedBy: userName,
          performedByRole: userRole,
          notes,
        });
      } else if (action === 'reassign') {
        if (!newDoerName) {
          setError('Please select a user to reassign the task to');
          setIsSubmitting(false);
          return;
        }
        await loopTaskManagementService.reassignTask({
          taskId: task.id,
          newDoerName,
          performedBy: userName,
          performedByRole: userRole,
          notes,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to perform action');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Manage Loop Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Task Information</h3>
                <p className="text-sm text-blue-800"><span className="font-medium">Task:</span> {task.task_name}</p>
                <p className="text-sm text-blue-800"><span className="font-medium">Current Assignee:</span> {task.doer_name}</p>
                <p className="text-sm text-blue-800"><span className="font-medium">Status:</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    task.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {task.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
                <p className="text-sm text-blue-800"><span className="font-medium">Priority:</span> {task.priority}</p>
                <p className="text-sm text-blue-800"><span className="font-medium">Frequency:</span> {task.frequency}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <History className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Your Permissions</h3>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Role:</span> {rolePermissionService.getRoleLabel(userRole)}
                </p>
                <p className="text-xs text-gray-600">
                  {rolePermissionService.getRoleDescription(userRole)}
                </p>
              </div>
            </div>
          </div>

          {!action && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Select Action</h3>

              {permissions.canActivateLoopTasks && !task.is_active && (
                <button
                  onClick={() => setAction('activate')}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <Power className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-semibold text-green-900">Activate Task</h4>
                    <p className="text-xs text-green-700">Make this task active and visible to assignee</p>
                  </div>
                </button>
              )}

              {permissions.canDeactivateLoopTasks && task.is_active && (
                <button
                  onClick={() => setAction('deactivate')}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                    <PowerOff className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-semibold text-red-900">Deactivate Task</h4>
                    <p className="text-xs text-red-700">Temporarily pause this task from appearing</p>
                  </div>
                </button>
              )}

              {permissions.canReassignLoopTasks && (
                <button
                  onClick={() => setAction('reassign')}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-semibold text-blue-900">Reassign Task</h4>
                    <p className="text-xs text-blue-700">Change who is responsible for this task</p>
                  </div>
                </button>
              )}
            </div>
          )}

          {action && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {action === 'activate' && 'Activate Task'}
                  {action === 'deactivate' && 'Deactivate Task'}
                  {action === 'reassign' && 'Reassign Task'}
                </h3>
                <p className="text-xs text-gray-600">
                  {action === 'activate' && 'This will make the task active and visible to the assignee.'}
                  {action === 'deactivate' && 'This will temporarily pause the task from appearing in the assignee\'s list.'}
                  {action === 'reassign' && 'Select a new user to assign this task to.'}
                </p>
              </div>

              {action === 'reassign' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Assignee <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for a user..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg">
                    {filteredUsers.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No users found</div>
                    ) : (
                      filteredUsers.map((user) => (
                        <button
                          key={user}
                          type="button"
                          onClick={() => {
                            setNewDoerName(user);
                            setSearchTerm(user);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                            newDoerName === user ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {user}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any notes or reasons for this action..."
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAction(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
