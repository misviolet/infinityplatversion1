import React from 'react';
import { LogOut, User, Users, Infinity, GitBranch, FolderOpen, Database, Sparkles, BarChart3, TrendingUp, Calendar, Award, CheckCircle2, Clock, AlertTriangle, Flag } from 'lucide-react';
import Delegation from './Delegation';
import InfinityLoop from './InfinityLoop';
import InfinityFlow from './InfinityFlow';
import { taskService } from '../services/taskService';
import { Task } from '../lib/supabase';

interface DashboardProps {
  username: string;
  userFullName: string;
  userRole: string;
  onLogout: () => void;
}

interface ScoreCardData {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  weeklyData: { week: string; completed: number; pending: number; total: number }[];
  monthlyData: { month: string; completed: number; pending: number; total: number }[];
  yearlyData: { year: string; completed: number; pending: number; total: number }[];
  priorityBreakdown: { priority: string; count: number; completed: number }[];
  statusBreakdown: { status: string; count: number }[];
}

const navigationItems = [
  { name: 'Dashboard', icon: Sparkles, href: '#dashboard', color: 'bg-purple-600 hover:bg-purple-700' },
  { name: 'Delegation', icon: Users, href: '#delegation', color: 'bg-blue-600 hover:bg-blue-700' },
  { name: 'Loop', icon: Infinity, href: '#loop', color: 'bg-green-600 hover:bg-green-700' },
  { name: 'Flow', icon: GitBranch, href: '#flow', color: 'bg-red-600 hover:bg-red-700' },
  { name: 'Project', icon: FolderOpen, href: '#project', color: 'bg-indigo-600 hover:bg-indigo-700' },
  { name: 'CRM', icon: Database, href: '#crm', color: 'bg-teal-600 hover:bg-teal-700' },
];

const dashboardSubModules = [
  { name: 'Overview', icon: Sparkles, color: 'bg-purple-600 hover:bg-purple-700' },
  { name: 'Analytics', icon: BarChart3, color: 'bg-blue-600 hover:bg-blue-700' },
  { name: 'Scorecard', icon: TrendingUp, color: 'bg-orange-600 hover:bg-orange-700' },
];

export default function Dashboard({ username, userFullName, userRole, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = React.useState('delegation');
  const [activeDashboardTab, setActiveDashboardTab] = React.useState('overview');
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [scoreCardData, setScoreCardData] = React.useState<ScoreCardData | null>(null);
  const [scoreCardPeriod, setScoreCardPeriod] = React.useState<'week' | 'month' | 'year'>('month');
  const [isLoadingTasks, setIsLoadingTasks] = React.useState(false);

  React.useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchTasks();
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (tasks.length > 0) {
      calculateScoreCardData();
    }
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      setIsLoadingTasks(true);
      const taskData = await taskService.getTasks();
      setTasks(taskData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const calculateScoreCardData = () => {
    if (tasks.length === 0) {
      setScoreCardData(null);
      return;
    }

    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'Pending').length;
    const overdueTasks = tasks.filter(task => {
      const taskDate = new Date(task.expected_completion_date);
      return taskDate < now && task.status !== 'Completed';
    }).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Weekly data (last 12 weeks)
    const weeklyData = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekTasks = tasks.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      const weekCompleted = weekTasks.filter(task => task.status === 'Completed').length;
      const weekPending = weekTasks.filter(task => task.status === 'Pending').length;
      
      weeklyData.push({
        week: `Week ${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        completed: weekCompleted,
        pending: weekPending,
        total: weekTasks.length
      });
    }

    // Monthly data (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      
      const monthTasks = tasks.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate >= monthDate && taskDate <= monthEnd;
      });
      
      const monthCompleted = monthTasks.filter(task => task.status === 'Completed').length;
      const monthPending = monthTasks.filter(task => task.status === 'Pending').length;
      
      monthlyData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        completed: monthCompleted,
        pending: monthPending,
        total: monthTasks.length
      });
    }

    // Yearly data (last 3 years)
    const yearlyData = [];
    for (let i = 2; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      
      const yearTasks = tasks.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate >= yearStart && taskDate <= yearEnd;
      });
      
      const yearCompleted = yearTasks.filter(task => task.status === 'Completed').length;
      const yearPending = yearTasks.filter(task => task.status === 'Pending').length;
      
      yearlyData.push({
        year: year.toString(),
        completed: yearCompleted,
        pending: yearPending,
        total: yearTasks.length
      });
    }

    // Priority breakdown
    const priorityBreakdown = ['High', 'Medium', 'Low'].map(priority => {
      const priorityTasks = tasks.filter(task => task.priority === priority);
      const completed = priorityTasks.filter(task => task.status === 'Completed').length;
      return {
        priority,
        count: priorityTasks.length,
        completed
      };
    });

    // Status breakdown
    const statusBreakdown = ['Pending', 'Completed', 'Need Clarity', 'Not Applicable', 'Shifted'].map(status => ({
      status,
      count: tasks.filter(task => task.status === status).length
    })).filter(item => item.count > 0);

    setScoreCardData({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      weeklyData,
      monthlyData,
      yearlyData,
      priorityBreakdown,
      statusBreakdown
    });
  };

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName.toLowerCase().replace(' ', '-'));
    if (tabName.toLowerCase() === 'dashboard') {
      setActiveDashboardTab('overview');
    }
  };

  const handleDashboardTabClick = (tabName: string) => {
    setActiveDashboardTab(tabName.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-100 rounded-full blur-3xl animate-float opacity-20"></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-green-100 rounded-full blur-3xl animate-float-delayed opacity-20"></div>
        <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-red-100 rounded-full blur-3xl animate-float-slow opacity-20"></div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-xl border-b-2 border-gray-100 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-14 h-14 bg-white border-4 border-blue-500 rounded-full shadow-lg">
                <Infinity className="w-8 h-8 text-blue-600 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Infinity Platform
                </h1>
                <p className="text-sm font-semibold text-blue-600 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1 text-blue-500" />
                  Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-blue-50 rounded-full px-4 py-2 border border-blue-200">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-blue-700">
                    {userFullName}
                  </div>
                  <div className="text-xs text-blue-600">
                    {userRole}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white border-b-2 border-gray-100 shadow-lg relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 overflow-x-auto py-2">
            {navigationItems.map((item, index) => {
              const IconComponent = item.icon;
              const tabName = item.name.toLowerCase().replace(' ', '-');
              const isActive = activeTab === tabName;
              return (
                <a
                  key={item.name}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleTabClick(item.name);
                  }}
                  className={`flex items-center space-x-3 px-6 py-4 text-sm font-bold transition-all duration-300 whitespace-nowrap rounded-full transform hover:scale-105 ${
                    isActive
                      ? `text-white ${item.color} shadow-lg`
                      : 'text-gray-600 hover:text-white hover:bg-blue-600 hover:shadow-lg bg-white border border-gray-200'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{item.name}</span>
                  {isActive && <Sparkles className="w-4 h-4" />}
                </a>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 relative z-10">
        <div className="px-4 py-6 sm:px-0">
          <>
          {activeTab === 'delegation' && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100 relative overflow-hidden">
              <div className="relative z-10">
                <Delegation userFullName={userFullName} />
              </div>
            </div>
          )}
          
          {activeTab === 'dashboard' && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100 relative overflow-hidden">
              <div className="relative z-10 text-center py-16">
                {/* Dashboard Sub-Navigation */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                      <p className="text-sm font-medium text-purple-600">Analytics & Insights</p>
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Sub-Navigation Tabs */}
                <div className="flex space-x-2 mb-8 bg-gray-50 p-2 rounded-xl">
                  {dashboardSubModules.map((module, index) => {
                    const IconComponent = module.icon;
                    const tabName = module.name.toLowerCase();
                    const isActive = activeDashboardTab === tabName;
                    return (
                      <button
                        key={module.name}
                        onClick={() => handleDashboardTabClick(module.name)}
                        className={`flex items-center space-x-2 px-4 py-3 text-sm font-bold transition-all duration-300 whitespace-nowrap rounded-lg transform hover:scale-105 ${
                          isActive
                            ? `text-white ${module.color} shadow-lg`
                            : 'text-gray-600 hover:text-white hover:bg-purple-600 hover:shadow-lg bg-white border border-gray-200'
                        }`}
                        style={{
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{module.name}</span>
                        {isActive && <Sparkles className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>

                {/* Dashboard Content */}
                {activeDashboardTab === 'overview' && (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white border-4 border-purple-500 rounded-full mb-6 shadow-2xl">
                      <Sparkles className="w-12 h-12 text-purple-600" />
                    </div>
                    <h3 className="text-4xl font-bold text-gray-800 mb-4">
                      Dashboard Overview
                    </h3>
                    <p className="text-xl text-gray-600 mb-8 font-medium">Your personalized dashboard overview.</p>
                    
                    <div className="bg-purple-50 rounded-2xl p-8 max-w-md mx-auto border-2 border-purple-200">
                      <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-4" />
                      <p className="text-sm text-gray-700 font-medium">
                        This will be your central hub for quick insights and actions.
                      </p>
                    </div>
                  </div>
                )}

                {activeDashboardTab === 'analytics' && (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white border-4 border-blue-500 rounded-full mb-6 shadow-2xl">
                      <BarChart3 className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-4xl font-bold text-gray-800 mb-4">
                      Analytics Dashboard
                    </h3>
                    <p className="text-xl text-gray-600 mb-8 font-medium">Advanced analytics and reporting.</p>
                    
                    <div className="bg-blue-50 rounded-2xl p-8 max-w-md mx-auto border-2 border-blue-200">
                      <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-4" />
                      <p className="text-sm text-gray-700 font-medium">
                        Detailed analytics and performance metrics coming soon.
                      </p>
                    </div>
                  </div>
                )}

                {activeDashboardTab === 'scorecard' && scoreCardData && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Task Analytics Scorecard</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setScoreCardPeriod('week')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                            scoreCardPeriod === 'week' 
                              ? 'bg-orange-600 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Weekly
                        </button>
                        <button
                          onClick={() => setScoreCardPeriod('month')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                            scoreCardPeriod === 'month' 
                              ? 'bg-orange-600 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setScoreCardPeriod('year')}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                            scoreCardPeriod === 'year' 
                              ? 'bg-orange-600 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Yearly
                        </button>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">Total Tasks</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{scoreCardData.totalTasks}</div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Completed</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">{scoreCardData.completedTasks}</div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">Pending</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{scoreCardData.pendingTasks}</div>
                      </div>
                      
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-xs font-medium text-red-700">Overdue</span>
                        </div>
                        <div className="text-2xl font-bold text-red-600">{scoreCardData.overdueTasks}</div>
                      </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Award className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-bold text-orange-700">Completion Rate</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">{scoreCardData.completionRate}%</div>
                      </div>
                      <div className="mt-2 bg-white rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${scoreCardData.completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Time-based Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-gray-600" />
                          {scoreCardPeriod === 'week' ? 'Weekly' : scoreCardPeriod === 'month' ? 'Monthly' : 'Yearly'} Trends
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(scoreCardPeriod === 'week' ? scoreCardData.weeklyData : 
                            scoreCardPeriod === 'month' ? scoreCardData.monthlyData : 
                            scoreCardData.yearlyData).map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="font-medium text-gray-600">
                                {scoreCardPeriod === 'week' ? item.week : 
                                 scoreCardPeriod === 'month' ? item.month : 
                                 item.year}
                              </span>
                              <div className="flex items-center space-x-3">
                                <span className="text-green-600 font-medium">✓ {item.completed}</span>
                                <span className="text-blue-600 font-medium">⏳ {item.pending}</span>
                                <span className="text-gray-600 font-medium">Total: {item.total}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                          <Flag className="w-4 h-4 mr-2 text-gray-600" />
                          Priority Breakdown
                        </h4>
                        <div className="space-y-3">
                          {scoreCardData.priorityBreakdown.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  item.priority === 'High' ? 'bg-red-500' :
                                  item.priority === 'Medium' ? 'bg-blue-500' : 'bg-green-500'
                                }`}></div>
                                <span className="text-xs font-medium text-gray-700">{item.priority}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-xs">
                                <span className="text-gray-600">{item.count} total</span>
                                <span className="text-green-600 font-medium">{item.completed} done</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-gray-600" />
                        Status Distribution
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {scoreCardData.statusBreakdown.map((item, index) => (
                          <div key={index} className="text-center">
                            <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm ${
                              item.status === 'Completed' ? 'bg-green-500' :
                              item.status === 'Pending' ? 'bg-blue-500' :
                              item.status === 'Need Clarity' ? 'bg-blue-500' :
                              item.status === 'Not Applicable' ? 'bg-gray-500' : 'bg-red-500'
                            }`}>
                              {item.count}
                            </div>
                            <div className="text-xs font-medium text-gray-600">{item.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeDashboardTab === 'scorecard' && !scoreCardData && (
                  <div className="text-center py-16">
                    {isLoadingTasks ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center shadow-2xl">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                        <span className="text-lg font-semibold text-orange-600">
                          Loading scorecard data...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-white border-4 border-orange-500 rounded-full mb-6 shadow-2xl">
                          <TrendingUp className="w-12 h-12 text-orange-600" />
                        </div>
                        <h3 className="text-4xl font-bold text-gray-800 mb-4">
                          Task Scorecard
                        </h3>
                        <p className="text-xl text-gray-600 mb-8 font-medium">No task data available for scorecard.</p>
                        
                        <div className="bg-orange-50 rounded-2xl p-8 max-w-md mx-auto border-2 border-orange-200">
                          <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-4" />
                          <p className="text-sm text-gray-700 font-medium">
                            Create some tasks to see your performance scorecard.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'loop' && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100 relative overflow-hidden">
              <div className="relative z-10">
                <InfinityLoop userFullName={userFullName} userRole={userRole} />
              </div>
            </div>
          )}
          
          {activeTab === 'flow' && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100 relative overflow-hidden">
              <div className="relative z-10">
                <InfinityFlow userFullName={userFullName} />
              </div>
            </div>
          )}
          
          {activeTab !== 'delegation' && activeTab !== 'dashboard' && activeTab !== 'loop' && activeTab !== 'flow' && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100 relative overflow-hidden">
              <div className="relative z-10 text-center py-16">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white border-4 border-blue-500 rounded-full mb-6 shadow-2xl">
                  <Infinity className="w-12 h-12 text-blue-600 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <h2 className="text-4xl font-bold text-gray-800 mb-4">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')} Module
                </h2>
                <p className="text-xl text-gray-600 mb-8 font-medium">This incredible module is coming soon.</p>
                
                <div className="bg-blue-50 rounded-2xl p-8 max-w-md mx-auto border-2 border-blue-200">
                  <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-700 font-medium">
                    This feature will unlock infinite possibilities in your workflow.
                  </p>
                </div>
              </div>
            </div>
          )}
          </>
        </div>
      </main>
    </div>
  );
}