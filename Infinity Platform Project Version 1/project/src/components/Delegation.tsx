import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2, AlertCircle, User, Users, RefreshCw, CheckCircle2, AlertTriangle, Plus, Clock, Flag, Search, Filter } from 'lucide-react';
import DelegateTaskModal, { TaskFormData } from './DelegateTaskModal';
import TaskCompletionModal, { TaskCompletionData } from './TaskCompletionModal';
import { taskService } from '../services/taskService';
import { Task } from '../lib/supabase';

interface DelegationProps {
  userFullName: string;
}

export default function Delegation({ userFullName }: DelegationProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'my-tasks' | 'assigned-by-me'>('my-tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [stakeholderFilter, setStakeholderFilter] = useState('');
  const [uniqueStakeholders, setUniqueStakeholders] = useState<string[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    // Get unique stakeholders for filter dropdown
    const stakeholders = [...new Set(tasks.map(task => task.stake_holder_name))].sort();
    setUniqueStakeholders(stakeholders);

    // Filter tasks based on view mode and filters
    let filtered = tasks;

    // Apply view mode filter
    if (viewMode === 'my-tasks') {
      filtered = filtered.filter(task => 
        task.doer_name.toLowerCase().trim() === userFullName.toLowerCase().trim()
      );
    } else if (viewMode === 'assigned-by-me') {
      filtered = filtered.filter(task => 
        task.stake_holder_name.toLowerCase().trim() === userFullName.toLowerCase().trim()
      );
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.task_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.doer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Apply date filter
    if (dateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.expected_completion_date);
        taskDate.setHours(0, 0, 0, 0);
        
        switch (dateFilter) {
          case 'overdue':
            return taskDate < today;
          case 'today':
            return taskDate.getTime() === today.getTime();
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return taskDate.getTime() === tomorrow.getTime();
          case 'this-week':
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return taskDate >= today && taskDate <= weekEnd;
          default:
            return true;
        }
      });
    }

    // Apply stakeholder filter
    if (stakeholderFilter) {
      filtered = filtered.filter(task => task.stake_holder_name === stakeholderFilter);
    }

    setFilteredTasks(filtered);
  }, [tasks, userFullName, viewMode, searchTerm, priorityFilter, dateFilter, stakeholderFilter]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError('');
      const taskData = await taskService.getTasks();
      setTasks(taskData);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please check your Supabase connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  const getDateStatus = (dateString: string) => {
    if (!dateString) return 'invalid';
    
    const taskDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate < today) return 'overdue';
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (taskDate.getTime() === today.getTime()) return 'today';
    if (taskDate.getTime() === tomorrow.getTime()) return 'tomorrow';
    
    return 'upcoming';
  };

  const getDateColor = (dateString: string) => {
    const status = getDateStatus(dateString);
    switch (status) {
      case 'overdue': return 'text-red-600 font-bold';
      case 'today': return 'text-red-600 font-bold';
      case 'tomorrow': return 'text-blue-600 font-bold';
      case 'upcoming': return 'text-green-600 font-semibold';
      default: return 'text-gray-500';
    }
  };

  const getDateBadge = (dateString: string) => {
    const status = getDateStatus(dateString);
    switch (status) {
      case 'overdue': 
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-500 text-white shadow-sm">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </span>
        );
      case 'today': 
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-500 text-white shadow-sm">
            <Clock className="w-3 h-3 mr-1" />
            Today
          </span>
        );
      case 'tomorrow': 
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500 text-white shadow-sm">
            <Clock className="w-3 h-3 mr-1" />
            Tomorrow
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-500 text-white shadow-sm">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Upcoming
          </span>
        );
      default: 
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-500 text-white">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'Need Clarity':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500 text-white">
            <AlertCircle className="w-3 h-3 mr-1" />
            Need Clarity
          </span>
        );
      case 'Not Applicable':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-500 text-white">
            Not Applicable
          </span>
        );
      case 'Shifted':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-500 text-white">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Shifted
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-600">
            <Flag className="w-3 h-3 mr-1" />
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-600">
            <Flag className="w-3 h-3 mr-1" />
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-600">
            <Flag className="w-3 h-3 mr-1" />
            Low
          </span>
        );
      default:
        return null;
    }
  };

  const isOverdueTask = (dateString: string) => {
    return getDateStatus(dateString) === 'overdue';
  };

  const handleDelegateTask = async (taskData: TaskFormData) => {
    try {
      await taskService.createTask(taskData, userFullName);
      await fetchTasks();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error delegating task:', error);
      alert('Failed to delegate task. Please try again.');
    }
  };

  const handleCompleteTask = (task: Task) => {
    setSelectedTask(task);
    setIsCompletionModalOpen(true);
  };

  const handleTaskCompletion = async (completionData: TaskCompletionData) => {
    try {
      await taskService.completeTask(completionData);
      await fetchTasks();
      setIsCompletionModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <span className="text-lg font-semibold text-blue-600">
            Loading your tasks...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-red-600">
            Error Loading Tasks
          </h3>
        </div>
        <p className="text-red-700 mb-6 font-medium">{error}</p>
        <button
          onClick={fetchTasks}
          className="px-6 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <RefreshCw className="w-4 h-4 mr-2 inline" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Task Dashboard
            </h2>
            <p className="text-sm font-medium text-blue-600">
              {viewMode === 'my-tasks' ? `Tasks assigned to ${userFullName}` : `Tasks assigned by ${userFullName}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Delegate Task</span>
          </button>
          
          <button
            onClick={fetchTasks}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Buttons */}
          <button
            onClick={() => setViewMode('my-tasks')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm ${
              viewMode === 'my-tasks'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Tasks</span>
          </button>
          
          <button
            onClick={() => setViewMode('assigned-by-me')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm ${
              viewMode === 'assigned-by-me'
                ? 'bg-green-600 text-white'
                : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Assigned by Me</span>
          </button>
          
          {/* Stakeholder Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={stakeholderFilter}
              onChange={(e) => setStakeholderFilter(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none min-w-[160px] text-xs"
            >
              <option value="">All Stakeholders</option>
              {uniqueStakeholders.map((stakeholder) => (
                <option key={stakeholder} value={stakeholder}>
                  {stakeholder}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-xs min-w-[200px]"
              placeholder="Search tasks..."
            />
          </div>

          {/* Priority Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Flag className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none text-xs min-w-[140px]"
            >
              <option value="">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none text-xs min-w-[140px]"
            >
              <option value="">All Dates</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="tomorrow">Due Tomorrow</option>
              <option value="this-week">Due This Week</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || priorityFilter || dateFilter || stakeholderFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPriorityFilter('');
                setDateFilter('');
                setStakeholderFilter('');
              }}
              className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
            >
              <Filter className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Tasks Found
            </h3>
            <p className="text-gray-600 font-medium text-sm">
              {viewMode === 'my-tasks' 
                ? `No tasks assigned to ${userFullName} found.`
                : `No tasks assigned by ${userFullName} found.`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Task Name
                  </th>
                  {viewMode === 'assigned-by-me' && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Doer Name
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr 
                    key={task.id} 
                    className="hover:bg-gray-50 transition-all duration-200"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div 
                        className="text-xs font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-all duration-200"
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                      >
                        {task.task}
                      </div>
                      
                      {/* Hover Card */}
                      {hoveredTask === task.id && (
                        <div className="absolute left-0 top-full z-50 w-80 pointer-events-none mt-1">
                          <div className="bg-white border border-blue-200 rounded-lg shadow-lg p-4 pointer-events-auto">
                            <h4 className="text-xs font-semibold text-blue-600 mb-2">Task Details:</h4>
                            <div className="space-y-1 text-xs">
                              <p><span className="font-medium text-gray-600">Stake Holder:</span> {task.stake_holder_name}</p>
                              <p><span className="font-medium text-gray-600">Delegated By:</span> {task.delegated_by}</p>
                              <p><span className="font-medium text-gray-600">Description:</span> {task.task_description}</p>
                              {task.supporting_document_url && (
                                <p>
                                  <span className="font-medium text-gray-600">Document:</span>
                                  <a
                                    href={task.supporting_document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 ml-1"
                                  >
                                    View Document
                                  </a>
                                </p>
                              )}
                              {task.comments && (
                                <p><span className="font-medium text-gray-600">Comments:</span> {task.comments}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    {viewMode === 'assigned-by-me' && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="text-xs font-medium text-gray-900">{task.doer_name}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium ${getDateColor(task.expected_completion_date)}`}>
                          {formatDate(task.expected_completion_date)}
                        </span>
                        {getDateBadge(task.expected_completion_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {viewMode === 'my-tasks' && (task.status === 'Pending' || task.status === 'Need Clarity') && (
                          <button
                            onClick={() => handleCompleteTask(task)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-all duration-200 shadow-sm"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Complete</span>
                          </button>
                        )}
                        {task.supporting_document_url && (
                          <a
                            href={task.supporting_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm"
                          >
                            <span>Document</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredTasks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-blue-600">
                  {filteredTasks.length}
                </span>
                <p className="text-xs font-medium text-blue-700">
                  {viewMode === 'my-tasks' ? 'My Tasks' : 'Assigned by Me'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-red-600">
                  {filteredTasks.filter(task => isOverdueTask(task.expected_completion_date)).length}
                </span>
                <p className="text-xs font-medium text-red-700">Overdue</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-green-600">
                  {filteredTasks.filter(task => task.status === 'Completed').length}
                </span>
                <p className="text-xs font-medium text-green-700">Completed</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-blue-600">
                  {filteredTasks.filter(task => task.status === 'Pending').length}
                </span>
                <p className="text-xs font-medium text-blue-700">Pending</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delegate Task Modal */}
      <DelegateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleDelegateTask}
      />

      {/* Task Completion Modal */}
      <TaskCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => {
          setIsCompletionModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSubmit={handleTaskCompletion}
      />
    </div>
  );
}