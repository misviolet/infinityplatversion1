import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2, AlertCircle, User, Users, RefreshCw, CheckCircle2, AlertTriangle, Plus, Clock, Flag, Search, Filter, Repeat, Building, Tag, Settings, History } from 'lucide-react';
import CreateLoopModal, { LoopTaskFormData } from './CreateLoopModal';
import LoopTaskCompletionModal, { LoopTaskCompletionData } from './LoopTaskCompletionModal';
import LoopTaskManagementModal from './LoopTaskManagementModal';
import LoopTaskAuditTrailModal from './LoopTaskAuditTrailModal';
import { loopTaskService } from '../services/loopTaskService';
import { rolePermissionService } from '../services/rolePermissions';
import { LoopTask } from '../lib/supabase';

interface GeneratedTask extends LoopTask {
  generated_due_date: string;
  is_generated: boolean;
}

interface InfinityLoopProps {
  userFullName: string;
  userRole: string;
}

export default function InfinityLoop({ userFullName, userRole }: InfinityLoopProps) {
  const [tasks, setTasks] = useState<LoopTask[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<GeneratedTask[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<GeneratedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredTodaysTasks, setFilteredTodaysTasks] = useState<GeneratedTask[]>([]);
  const [filteredUpcomingTasks, setFilteredUpcomingTasks] = useState<GeneratedTask[]>([]);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<GeneratedTask | null>(null);
  const [viewMode, setViewMode] = useState<'my-tasks' | 'assigned-by-me'>('my-tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [uniqueDepartments, setUniqueDepartments] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);

  const permissions = rolePermissionService.getPermissions(userRole);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      generateTasksForPeriod();
    }
  }, [tasks]);

  useEffect(() => {
    // Get unique departments and categories for filter dropdowns
    const allTasks = [...todaysTasks, ...upcomingTasks];
    const departments = [...new Set(allTasks.map(task => task.department))].sort();
    const categories = [...new Set(allTasks.map(task => task.category))].sort();
    setUniqueDepartments(departments);
    setUniqueCategories(categories);

    // Filter today's tasks
    applyFilters(todaysTasks, setFilteredTodaysTasks);
    // Filter upcoming tasks
    applyFilters(upcomingTasks, setFilteredUpcomingTasks);
  }, [todaysTasks, upcomingTasks, userFullName, viewMode, searchTerm, priorityFilter, frequencyFilter, categoryFilter, departmentFilter]);

  const applyFilters = (taskList: GeneratedTask[], setFilteredList: React.Dispatch<React.SetStateAction<GeneratedTask[]>>) => {
    let filtered = taskList;

    // Apply view mode filter
    if (viewMode === 'my-tasks') {
      filtered = filtered.filter(task => 
        task.doer_name.toLowerCase().trim() === userFullName.toLowerCase().trim()
      );
    } else if (viewMode === 'assigned-by-me') {
      filtered = filtered.filter(task => 
        task.task_owner.toLowerCase().trim() === userFullName.toLowerCase().trim()
      );
    }

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.task_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.doer_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (frequencyFilter) {
      filtered = filtered.filter(task => task.frequency === frequencyFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }

    if (departmentFilter) {
      filtered = filtered.filter(task => task.department === departmentFilter);
    }

    setFilteredList(filtered);
  };

  const generateTasksForPeriod = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 60);
    
    const todaysGenerated: GeneratedTask[] = [];
    const upcomingGenerated: GeneratedTask[] = [];

    tasks.forEach(task => {
      if (!task.next_due_date) return;

      const startDate = new Date(task.next_due_date);
      startDate.setHours(0, 0, 0, 0);

      // Generate occurrences based on frequency
      const occurrences = generateOccurrences(task, startDate, endDate);
      
      occurrences.forEach(occurrence => {
        const generatedTask: GeneratedTask = {
          ...task,
          generated_due_date: occurrence.toISOString().split('T')[0],
          is_generated: true
        };

        if (occurrence.getTime() === today.getTime()) {
          todaysGenerated.push(generatedTask);
        } else if (occurrence > today) {
          upcomingGenerated.push(generatedTask);
        }
      });
    });

    setTodaysTasks(todaysGenerated);
    setUpcomingTasks(upcomingGenerated);
  };

  const generateOccurrences = (task: LoopTask, startDate: Date, endDate: Date): Date[] => {
    const occurrences: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      occurrences.push(new Date(current));

      switch (task.frequency) {
        case 'Daily':
          current.setDate(current.getDate() + 1);
          break;
        case 'Weekly':
          current.setDate(current.getDate() + 7);
          break;
        case 'Monthly':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'Quarterly':
          current.setMonth(current.getMonth() + 3);
          break;
        case 'Yearly':
          current.setFullYear(current.getFullYear() + 1);
          break;
        default:
          return occurrences; // Stop if frequency is unknown
      }
    }

    return occurrences;
  };

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError('');
      const taskData = await loopTaskService.getLoopTasks();
      const activeTasks = taskData.filter(task => task.is_active !== false);
      setTasks(activeTasks);
    } catch (err) {
      console.error('Error fetching loop tasks:', err);
      setError('Failed to load loop tasks. Please check your Supabase connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageTask = (task: GeneratedTask) => {
    setSelectedTask(task);
    setIsManagementModalOpen(true);
  };

  const handleViewAudit = (task: GeneratedTask) => {
    setSelectedTask(task);
    setIsAuditModalOpen(true);
  };

  const handleManagementSuccess = () => {
    fetchTasks();
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
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-600">
            <Flag className="w-3 h-3 mr-1" />
            Critical
          </span>
        );
      case 'Non Critical':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-600">
            <Flag className="w-3 h-3 mr-1" />
            Non Critical
          </span>
        );
      default:
        return null;
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      'Daily': 'bg-red-100 text-red-600',
      'Weekly': 'bg-orange-100 text-orange-600',
      'Monthly': 'bg-blue-100 text-blue-600',
      'Quarterly': 'bg-green-100 text-green-600',
      'Yearly': 'bg-purple-100 text-purple-600'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${colors[frequency as keyof typeof colors] || 'bg-gray-100 text-gray-600'}`}>
        <Repeat className="w-3 h-3 mr-1" />
        {frequency}
      </span>
    );
  };

  const handleCreateLoop = async (taskData: LoopTaskFormData) => {
    try {
      await loopTaskService.createLoopTask(taskData, userFullName);
      await fetchTasks();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating loop task:', error);
      alert('Failed to create loop task. Please try again.');
    }
  };

  const handleCompleteTask = (task: GeneratedTask) => {
    setSelectedTask(task);
    setIsCompletionModalOpen(true);
  };

  const handleTaskCompletion = async (completionData: LoopTaskCompletionData) => {
    try {
      await loopTaskService.completeLoopTask(completionData);
      await fetchTasks();
      setIsCompletionModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error completing loop task:', error);
      alert('Failed to complete loop task. Please try again.');
    }
  };

  const renderTaskTable = (taskList: GeneratedTask[], title: string, emptyMessage: string) => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-green-600" />
          {title}
          <span className="ml-2 text-sm font-medium text-gray-500">({taskList.length})</span>
        </h3>
      </div>
      
      {taskList.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Repeat className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">
            {emptyMessage}
          </h4>
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
                  Frequency
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
              {taskList.map((task, index) => (
                <tr 
                  key={`${task.id}-${task.generated_due_date}-${index}`} 
                  className="hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div 
                      className="text-xs font-semibold text-gray-900 cursor-pointer hover:text-green-600 transition-all duration-200"
                      onMouseEnter={() => setHoveredTask(`${task.id}-${index}`)}
                      onMouseLeave={() => setHoveredTask(null)}
                    >
                      {task.task_name}
                    </div>
                    
                    {/* Hover Card */}
                    {hoveredTask === `${task.id}-${index}` && (
                      <div className="absolute left-0 top-full z-50 w-80 pointer-events-none mt-1">
                        <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4 pointer-events-auto">
                          <h4 className="text-xs font-semibold text-green-600 mb-2">Loop Task Details:</h4>
                          <div className="space-y-1 text-xs">
                            <p><span className="font-medium text-gray-600">Task Owner:</span> {task.task_owner}</p>
                            <p><span className="font-medium text-gray-600">Department:</span> {task.department}</p>
                            <p><span className="font-medium text-gray-600">Category:</span> {task.category}</p>
                            <p><span className="font-medium text-gray-600">Description:</span> {task.task_description}</p>
                            {task.guideline_url && (
                              <p>
                                <span className="font-medium text-gray-600">Guideline:</span>
                                <a
                                  href={task.guideline_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-700 ml-1"
                                >
                                  View Guideline
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
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-gray-900">{task.doer_name}</span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getPriorityBadge(task.priority)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getFrequencyBadge(task.frequency)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium ${getDateColor(task.generated_due_date)}`}>
                        {formatDate(task.generated_due_date)}
                      </span>
                      {getDateBadge(task.generated_due_date)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(task.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-wrap gap-2">
                      {viewMode === 'my-tasks' && (task.status === 'Pending' || task.status === 'Need Clarity') && (
                        <button
                          onClick={() => handleCompleteTask(task)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-all duration-200 shadow-sm"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Complete</span>
                        </button>
                      )}
                      {(permissions.canActivateLoopTasks || permissions.canDeactivateLoopTasks || permissions.canReassignLoopTasks) && (
                        <button
                          onClick={() => handleManageTask(task)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-orange-600 text-white text-xs font-medium rounded-md hover:bg-orange-700 transition-all duration-200 shadow-sm"
                          title="Manage Task"
                        >
                          <Settings className="w-3 h-3" />
                          <span>Manage</span>
                        </button>
                      )}
                      {permissions.canViewAuditTrail && (
                        <button
                          onClick={() => handleViewAudit(task)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-all duration-200 shadow-sm"
                          title="View Audit Trail"
                        >
                          <History className="w-3 h-3" />
                          <span>History</span>
                        </button>
                      )}
                      {task.guideline_url && (
                        <a
                          href={task.guideline_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-all duration-200 shadow-sm"
                        >
                          <span>Guideline</span>
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
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-2xl">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <span className="text-lg font-semibold text-green-600">
            Loading your loop tasks...
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
            Error Loading Loop Tasks
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
          <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-full shadow-lg">
            <Repeat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Infinity Loop Dashboard
            </h2>
            <p className="text-sm font-medium text-green-600">
              {viewMode === 'my-tasks' ? `Loop tasks assigned to ${userFullName}` : `Loop tasks assigned by ${userFullName}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {permissions.canCreateLoopTasks && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Loop</span>
            </button>
          )}

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
                ? 'bg-green-600 text-white'
                : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
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

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 text-xs min-w-[200px]"
              placeholder="Search loop tasks..."
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
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 appearance-none text-xs min-w-[140px]"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="Non Critical">Non Critical</option>
            </select>
          </div>

          {/* Frequency Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Repeat className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 appearance-none text-xs min-w-[140px]"
            >
              <option value="">All Frequencies</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 appearance-none text-xs min-w-[160px]"
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 appearance-none text-xs min-w-[180px]"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || priorityFilter || frequencyFilter || departmentFilter || categoryFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPriorityFilter('');
                setFrequencyFilter('');
                setDepartmentFilter('');
                setCategoryFilter('');
              }}
              className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
            >
              <Filter className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Today's Tasks Table */}
      {renderTaskTable(
        filteredTodaysTasks, 
        "Today's Tasks", 
        "No tasks due today"
      )}

      {/* Upcoming Tasks Table */}
      {renderTaskTable(
        filteredUpcomingTasks, 
        "Upcoming Tasks (Next 60 Days)", 
        "No upcoming tasks in the next 60 days"
      )}

      {/* Summary */}
      {(filteredTodaysTasks.length > 0 || filteredUpcomingTasks.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-sm">
                <Repeat className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-green-600">
                  {filteredTodaysTasks.length + filteredUpcomingTasks.length}
                </span>
                <p className="text-xs font-medium text-green-700">
                  {viewMode === 'my-tasks' ? 'My Loop Tasks' : 'Assigned by Me'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-sm">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-red-600">
                  {filteredTodaysTasks.length}
                </span>
                <p className="text-xs font-medium text-red-700">Today's Tasks</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-sm">
                <Flag className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-red-600">
                  {[...filteredTodaysTasks, ...filteredUpcomingTasks].filter(task => task.priority === 'Critical').length}
                </span>
                <p className="text-xs font-medium text-red-700">Critical</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-green-600">
                  {[...filteredTodaysTasks, ...filteredUpcomingTasks].filter(task => task.status === 'Completed').length}
                </span>
                <p className="text-xs font-medium text-green-700">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Loop Modal */}
      <CreateLoopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateLoop}
      />

      {/* Loop Task Completion Modal */}
      <LoopTaskCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => {
          setIsCompletionModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSubmit={handleTaskCompletion}
      />

      {/* Loop Task Management Modal */}
      <LoopTaskManagementModal
        isOpen={isManagementModalOpen}
        onClose={() => {
          setIsManagementModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        userRole={userRole}
        userName={userFullName}
        onSuccess={handleManagementSuccess}
      />

      {/* Loop Task Audit Trail Modal */}
      <LoopTaskAuditTrailModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
      />
    </div>
  );
}