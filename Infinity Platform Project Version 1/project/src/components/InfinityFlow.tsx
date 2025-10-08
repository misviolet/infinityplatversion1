import React, { useState, useEffect } from 'react';
import { Search, Plus, GitBranch, ChevronDown, ChevronRight, CheckCircle2, Circle, Trash2, Edit, Loader2, AlertCircle, RefreshCw, User, Clipboard, Clock, FileText, Flag, Calendar, Play, Pause, Square } from 'lucide-react';
import { flowService } from '../services/flowService';
import { FlowProcess, FlowStage, WorkflowEntry } from '../lib/supabase';
import CreateProcessModal from './CreateProcessModal';
import CreateStageModal from './CreateStageModal';
import CreateWorkflowEntryModal, { WorkflowEntryFormData } from './CreateWorkflowEntryModal';

interface InfinityFlowProps {
  userFullName: string;
}

export default function InfinityFlow({ userFullName }: InfinityFlowProps) {
  const [processes, setProcesses] = useState<FlowProcess[]>([]);
  const [stages, setStages] = useState<FlowStage[]>([]);
  const [workflowEntries, setWorkflowEntries] = useState<WorkflowEntry[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<FlowProcess | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProcesses, setFilteredProcesses] = useState<FlowProcess[]>([]);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(true);
  const [isLoadingStages, setIsLoadingStages] = useState(false);
  const [error, setError] = useState('');
  const [isCreateProcessModalOpen, setIsCreateProcessModalOpen] = useState(false);
  const [isCreateStageModalOpen, setIsCreateStageModalOpen] = useState(false);
  const [isCreateEntryModalOpen, setIsCreateEntryModalOpen] = useState(false);
  const [selectedStageForEntry, setSelectedStageForEntry] = useState<FlowStage | null>(null);

  useEffect(() => {
    fetchProcesses();
  }, []);

  useEffect(() => {
    if (selectedProcess) {
      fetchStages(selectedProcess.id);
      fetchWorkflowEntries(selectedProcess.id);
    }
  }, [selectedProcess]);

  useEffect(() => {
    const filtered = processes.filter(process =>
      process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (process.description && process.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProcesses(filtered);
  }, [processes, searchTerm]);

  const fetchProcesses = async () => {
    try {
      setIsLoadingProcesses(true);
      setError('');
      const processData = await flowService.getProcesses();
      setProcesses(processData);
      
      // Auto-select first process if none selected
      if (processData.length > 0 && !selectedProcess) {
        setSelectedProcess(processData[0]);
      }
    } catch (err) {
      console.error('Error fetching processes:', err);
      setError('Failed to load processes. Please check your connection.');
    } finally {
      setIsLoadingProcesses(false);
    }
  };

  const fetchStages = async (processId: string) => {
    try {
      setIsLoadingStages(true);
      const stageData = await flowService.getStagesByProcessId(processId);
      setStages(stageData);
    } catch (err) {
      console.error('Error fetching stages:', err);
      setError('Failed to load stages for this process.');
    } finally {
      setIsLoadingStages(false);
    }
  };

  const fetchWorkflowEntries = async (processId: string) => {
    try {
      const entryData = await flowService.getWorkflowEntries(processId);
      setWorkflowEntries(entryData);
    } catch (err) {
      console.error('Error fetching workflow entries:', err);
    }
  };

  const handleProcessSelect = (process: FlowProcess) => {
    setSelectedProcess(process);
    setExpandedStages(new Set()); // Collapse all stages when switching process
  };

  const toggleStageExpansion = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const handleStageCompletionToggle = async (stageId: string, currentStatus: boolean) => {
    try {
      await flowService.updateStageCompletion(stageId, !currentStatus);
      // Refresh stages
      if (selectedProcess) {
        await fetchStages(selectedProcess.id);
      }
    } catch (error) {
      console.error('Error updating stage completion:', error);
      alert('Failed to update stage completion. Please try again.');
    }
  };

  const handleCreateProcess = async (processData: { name: string; description?: string }) => {
    try {
      await flowService.createProcess(processData, userFullName);
      await fetchProcesses();
      setIsCreateProcessModalOpen(false);
    } catch (error) {
      console.error('Error creating process:', error);
      alert('Failed to create process. Please try again.');
    }
  };

  const handleCreateStage = async (stageData: { name: string; description?: string; order_index: number }) => {
    try {
      if (!selectedProcess) return;
      await flowService.createStage(selectedProcess.id, stageData);
      await fetchStages(selectedProcess.id);
      setIsCreateStageModalOpen(false);
    } catch (error) {
      console.error('Error creating stage:', error);
      alert('Failed to create stage. Please try again.');
    }
  };

  const handleCreateWorkflowEntry = async (entryData: WorkflowEntryFormData) => {
    try {
      if (!selectedProcess || !selectedStageForEntry) return;
      await flowService.createWorkflowEntry(
        selectedProcess.id, 
        selectedStageForEntry.id, 
        entryData, 
        userFullName
      );
      await fetchWorkflowEntries(selectedProcess.id);
      setIsCreateEntryModalOpen(false);
      setSelectedStageForEntry(null);
    } catch (error) {
      console.error('Error creating workflow entry:', error);
      alert('Failed to create workflow entry. Please try again.');
    }
  };

  const handleUpdateEntryStatus = async (
    entryId: string, 
    status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked'
  ) => {
    try {
      await flowService.updateWorkflowEntryStatus(entryId, status, userFullName);
      if (selectedProcess) {
        await fetchWorkflowEntries(selectedProcess.id);
        // Check if stage is now complete and update stage status
        const stageEntry = workflowEntries.find(entry => entry.id === entryId);
        if (stageEntry && status === 'Completed') {
          const isStageComplete = await flowService.checkStageCompletion(selectedProcess.id, stageEntry.stage_id);
          if (isStageComplete) {
            await flowService.updateStageCompletion(stageEntry.stage_id, true);
            await fetchStages(selectedProcess.id);
          }
        }
      }
    } catch (error) {
      console.error('Error updating entry status:', error);
      alert('Failed to update entry status. Please try again.');
    }
  };

  const openCreateEntryModal = (stage: FlowStage) => {
    setSelectedStageForEntry(stage);
    setIsCreateEntryModalOpen(true);
  };

  const getEntriesForStage = (stageId: string): WorkflowEntry[] => {
    return workflowEntries.filter(entry => entry.stage_id === stageId);
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
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500 text-white">
            <Play className="w-3 h-3 mr-1" />
            In Progress
          </span>
        );
      case 'Blocked':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-500 text-white">
            <Square className="w-3 h-3 mr-1" />
            Blocked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-500 text-white">
            <Pause className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
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
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-600">
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

  if (error && processes.length === 0) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-red-600">
            Error Loading Flow Processes
          </h3>
        </div>
        <p className="text-red-700 mb-6 font-medium">{error}</p>
        <button
          onClick={fetchProcesses}
          className="px-6 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <RefreshCw className="w-4 h-4 mr-2 inline" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Left Panel - Process List (20%) */}
      <div className="w-1/5 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Processes</h3>
            </div>
            <button
              onClick={() => setIsCreateProcessModalOpen(true)}
              className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
              title="Create New Process"
            >
              <Plus className="w-4 h-4" />
            </button>
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
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 text-xs"
              placeholder="Search processes..."
            />
          </div>
        </div>

        {/* Process List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingProcesses ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                <span className="text-xs text-gray-600">Loading processes...</span>
              </div>
            </div>
          ) : filteredProcesses.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No processes found</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredProcesses.map((process) => (
                <button
                  key={process.id}
                  onClick={() => handleProcessSelect(process)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    selectedProcess?.id === process.id
                      ? 'bg-red-100 border-2 border-red-300 text-red-800'
                      : 'bg-white hover:bg-gray-100 border border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="font-medium text-xs mb-1">{process.name}</div>
                  {process.description && (
                    <div className="text-xs text-gray-500 line-clamp-2">
                      {process.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Process Stages (80%) */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {selectedProcess ? selectedProcess.name : 'Select a Process'}
                </h2>
                {selectedProcess?.description && (
                  <p className="text-sm text-gray-600">{selectedProcess.description}</p>
                )}
              </div>
            </div>
            
            {selectedProcess && (
              <button
                onClick={() => setIsCreateStageModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Stage</span>
              </button>
            )}
          </div>
        </div>

        {/* Stages Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedProcess ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <GitBranch className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Select a Process
              </h3>
              <p className="text-gray-600">
                Choose a process from the left panel to view its stages
              </p>
            </div>
          ) : isLoadingStages ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
                <span className="text-sm font-semibold text-red-600">
                  Loading stages...
                </span>
              </div>
            </div>
          ) : stages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <GitBranch className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No Stages Found
              </h3>
              <p className="text-gray-600 mb-4">
                This process doesn't have any stages yet.
              </p>
              <button
                onClick={() => setIsCreateStageModalOpen(true)}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md"
              >
                Create First Stage
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Stage Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleStageExpansion(stage.id)}
                          className="p-1 hover:bg-gray-100 rounded-md transition-all duration-200"
                        >
                          {expandedStages.has(stage.id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            Stage {index + 1}
                          </span>
                          <button
                            onClick={() => handleStageCompletionToggle(stage.id, stage.is_completed)}
                            className="transition-all duration-200"
                          >
                            {stage.is_completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 hover:text-green-600" />
                            )}
                          </button>
                        </div>
                        
                        <div>
                          <h4 className={`text-sm font-semibold ${
                            stage.is_completed ? 'text-green-700 line-through' : 'text-gray-800'
                          }`}>
                            {stage.name}
                          </h4>
                          {stage.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {stage.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          stage.is_completed 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {stage.is_completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedStages.has(stage.id) && (
                    <div className="p-4 bg-gray-50 space-y-4">
                      {/* Stage Parameters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* What */}
                        <div className="bg-white p-3 rounded-lg border border-red-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-bold text-red-700">WHAT</span>
                          </div>
                          <p className="text-sm text-gray-800 font-medium">{stage.name}</p>
                          {stage.description && (
                            <p className="text-xs text-gray-600 mt-1">{stage.description}</p>
                          )}
                        </div>

                        {/* Who */}
                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-blue-700">WHO</span>
                          </div>
                          <p className="text-sm text-gray-800 font-medium">
                            {stage.who_responsible || 'Not specified'}
                          </p>
                        </div>

                        {/* How */}
                        <div className="bg-white p-3 rounded-lg border border-green-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clipboard className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-bold text-green-700">HOW</span>
                          </div>
                          <p className="text-sm text-gray-800 font-medium">
                            {stage.how_completion || 'Not specified'}
                          </p>
                        </div>

                        {/* When */}
                        <div className="bg-white p-3 rounded-lg border border-orange-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span className="text-xs font-bold text-orange-700">WHEN</span>
                          </div>
                          <p className="text-sm text-gray-800 font-medium">
                            {stage.when_duration || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      {/* Workflow Entries Section */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-bold text-gray-800 flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-red-600" />
                            Workflow Entries ({getEntriesForStage(stage.id).length})
                          </h5>
                          <button
                            onClick={() => openCreateEntryModal(stage)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-all duration-200"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Entry</span>
                          </button>
                        </div>

                        {/* Entries List */}
                        <div className="space-y-2">
                          {getEntriesForStage(stage.id).length === 0 ? (
                            <div className="text-center py-4 bg-white rounded-lg border border-gray-200">
                              <FileText className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">No entries yet</p>
                              <button
                                onClick={() => openCreateEntryModal(stage)}
                                className="text-xs text-red-600 hover:text-red-700 font-medium mt-1"
                              >
                                Create first entry
                              </button>
                            </div>
                          ) : (
                            getEntriesForStage(stage.id).map((entry) => (
                              <div key={entry.id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <h6 className="text-sm font-semibold text-gray-800">{entry.entry_name}</h6>
                                    {getPriorityBadge(entry.priority)}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {getStatusBadge(entry.status)}
                                    {entry.status !== 'Completed' && (
                                      <div className="flex space-x-1">
                                        <button
                                          onClick={() => handleUpdateEntryStatus(entry.id, 'In Progress')}
                                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all duration-200"
                                          title="Mark In Progress"
                                        >
                                          <Play className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleUpdateEntryStatus(entry.id, 'Completed')}
                                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-all duration-200"
                                          title="Mark Completed"
                                        >
                                          <CheckCircle2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleUpdateEntryStatus(entry.id, 'Blocked')}
                                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                                          title="Mark Blocked"
                                        >
                                          <Square className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {entry.entry_description && (
                                  <p className="text-xs text-gray-600 mb-2">{entry.entry_description}</p>
                                )}
                                
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>Assigned to: <span className="font-medium">{entry.assigned_to}</span></span>
                                  {entry.due_date && (
                                    <span>Due: <span className="font-medium">{new Date(entry.due_date).toLocaleDateString()}</span></span>
                                  )}
                                </div>
                                
                                {entry.completed_at && (
                                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-green-600">
                                    Completed by {entry.completed_by} on {new Date(entry.completed_at).toLocaleDateString()}
                                    {entry.notes && (
                                      <p className="text-gray-600 mt-1">Notes: {entry.notes}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Process Modal */}
      <CreateProcessModal
        isOpen={isCreateProcessModalOpen}
        onClose={() => setIsCreateProcessModalOpen(false)}
        onSubmit={handleCreateProcess}
      />

      {/* Create Stage Modal */}
      <CreateStageModal
        isOpen={isCreateStageModalOpen}
        onClose={() => setIsCreateStageModalOpen(false)}
        onSubmit={handleCreateStage}
        nextOrderIndex={stages.length + 1}
      />

      {/* Create Workflow Entry Modal */}
      <CreateWorkflowEntryModal
        isOpen={isCreateEntryModalOpen}
        onClose={() => {
          setIsCreateEntryModalOpen(false);
          setSelectedStageForEntry(null);
        }}
        onSubmit={handleCreateWorkflowEntry}
        stageName={selectedStageForEntry?.name || ''}
      />
    </div>
  );
}