# Infinity Loop Task Management System - Design Document

## Overview
A comprehensive role-based task management system for recurring tasks with granular permission controls, audit trails, and task lifecycle management.

---

## Role-Based Permissions

### PC Role (Process Coordinator)
**Full Permissions:**
- ✅ Create new Infinity Loop Tasks
- ✅ Activate tasks
- ✅ Deactivate tasks
- ✅ Reassign tasks to other users
- ✅ View audit trail

### Admin Role
**Management Permissions:**
- ❌ Cannot create new tasks
- ✅ Activate tasks
- ✅ Deactivate tasks
- ✅ Reassign tasks to other users
- ✅ View audit trail

### MIS Role
**Management Permissions:**
- ❌ Cannot create new tasks
- ✅ Activate tasks
- ✅ Deactivate tasks
- ✅ Reassign tasks to other users
- ✅ View audit trail

### Other Roles
**No Management Permissions:**
- ❌ Cannot create tasks
- ❌ Cannot activate/deactivate tasks
- ❌ Cannot reassign tasks
- ❌ Cannot view audit trail
- ✅ Can only complete their assigned tasks

---

## Database Schema

### 1. Enhanced `loop_tasks` Table

**New Columns Added:**
- `is_active` (boolean, default: true) - Controls task visibility
- `deactivated_at` (timestamptz) - When task was deactivated
- `deactivated_by` (text) - Who deactivated the task
- `last_reassigned_at` (timestamptz) - Last reassignment timestamp
- `last_reassigned_by` (text) - Who performed the reassignment

**Existing Columns:**
- `id` (uuid, primary key)
- `task_name` (text)
- `priority` (Critical | Non Critical)
- `task_owner` (text)
- `doer_name` (text)
- `department` (text)
- `frequency` (Daily | Weekly | Monthly | Quarterly | Yearly)
- `task_description` (text)
- `guideline_url` (text, optional)
- `category` (text)
- `status` (Pending | Completed | Not Applicable | Need Clarity | Shifted)
- `comments` (text, optional)
- `created_at` (timestamptz)
- `completed_at` (timestamptz, optional)
- `created_by` (text)
- `next_due_date` (date)
- `last_completed_date` (date, optional)
- `shifted_to_date` (date, optional)

### 2. New `loop_task_audit_trail` Table

**Purpose:** Complete history of all actions performed on loop tasks

**Columns:**
- `id` (uuid, primary key)
- `task_id` (uuid, foreign key → loop_tasks.id)
- `action_type` (created | activated | deactivated | reassigned | completed | status_changed)
- `performed_by` (text) - User who performed the action
- `performed_by_role` (text) - Role of the user
- `previous_value` (jsonb) - State before the action
- `new_value` (jsonb) - State after the action
- `notes` (text, optional) - Additional notes from user
- `created_at` (timestamptz)

**Indexes:**
- `idx_audit_trail_task_id` - Fast lookups by task
- `idx_audit_trail_created_at` - Chronological ordering
- `idx_audit_trail_action_type` - Filter by action type

**RLS Policies:**
- Anonymous users can SELECT (for login flow)
- Authenticated users can SELECT and INSERT

**Automatic Triggers:**
- Automatically logs actions when loop_tasks are created, updated, or status changed
- Tracks activation/deactivation
- Tracks reassignments
- Tracks status changes

---

## Service Layer Architecture

### 1. `rolePermissionService.ts`
**Purpose:** Centralized role permission management

**Key Functions:**
- `getPermissions(role)` - Returns permission object for role
- `canPerformAction(role, action)` - Boolean check for specific action
- `getRoleLabel(role)` - Human-readable role name
- `getRoleDescription(role)` - Role permission description

### 2. `loopTaskManagementService.ts`
**Purpose:** Task management operations with role validation

**Key Functions:**
- `activateTask(data)` - Activates a task (validates role first)
- `deactivateTask(data)` - Deactivates a task (validates role first)
- `reassignTask(data)` - Reassigns task to new user (validates role first)
- `getTaskAuditTrail(taskId)` - Retrieves audit history for a task
- `getAllAuditTrails(limit)` - Retrieves recent audit entries
- `getActiveLoopTasks()` - Retrieves only active tasks
- `getInactiveLoopTasks()` - Retrieves deactivated tasks
- `getAllLoopTasks()` - Retrieves all tasks regardless of status

**Security:**
- All management functions validate user role before execution
- Throws error if user lacks permission
- Automatically logs actions to audit trail

### 3. `loopTaskService.ts`
**Purpose:** Task creation and completion (existing service, unchanged)

---

## User Interface Components

### 1. LoopTaskManagementModal
**Purpose:** Centralized management interface for authorized users

**Features:**
- Displays current task information
- Shows user's role and permissions
- Action selection (Activate, Deactivate, Reassign)
- User search and selection for reassignment
- Optional notes field for all actions
- Real-time permission validation

**UI Flow:**
1. User clicks "Manage" button on task
2. Modal shows task details and available actions
3. User selects action (only permitted actions shown)
4. For reassignment: search and select user from dropdown
5. Add optional notes
6. Confirm action
7. Action logged to audit trail
8. Task list refreshed

### 2. LoopTaskAuditTrailModal
**Purpose:** View complete history of task actions

**Features:**
- Chronological timeline of all actions
- Visual indicators for action types (created, activated, deactivated, reassigned, completed)
- Shows who performed action and their role
- Displays before/after values for changes
- Shows user-provided notes
- Timestamp for each action
- Color-coded action badges

**UI Design:**
- Timeline visualization with connecting line
- Color-coded action badges (green for activated, red for deactivated, etc.)
- Expandable details for each action
- Before/after value comparison

### 3. Enhanced InfinityLoop Component
**Purpose:** Main loop task dashboard with management features

**New Features:**
- Role-based "Create Loop" button (only PC role)
- "Manage" button on each task (PC, Admin, MIS roles)
- "History" button to view audit trail (authorized roles)
- Filters only active tasks by default
- Displays task status badges (Active/Inactive)

**Action Buttons Per Task:**
- **Complete** - For task doers (existing functionality)
- **Manage** - For PC/Admin/MIS roles (NEW)
- **History** - View audit trail (NEW)
- **Guideline** - View task guidelines (existing)

---

## Workflow Diagrams

### Task Creation Workflow
```
[PC User] → [Create Loop Button] → [Create Loop Modal] → [Fill Task Details]
    ↓
[Submit] → [loopTaskService.createLoopTask()] → [Insert to loop_tasks]
    ↓
[Trigger: log_loop_task_audit()] → [Insert to audit_trail: 'created']
    ↓
[Task appears in active tasks list]
```

### Task Activation Workflow
```
[PC/Admin/MIS User] → [Manage Button] → [Management Modal] → [Select Activate]
    ↓
[Role Check] → [loopTaskManagementService.activateTask()]
    ↓
[Update: is_active = true] → [Trigger: audit trail logging]
    ↓
[Task becomes visible to assignee]
```

### Task Deactivation Workflow
```
[PC/Admin/MIS User] → [Manage Button] → [Management Modal] → [Select Deactivate]
    ↓
[Role Check] → [loopTaskManagementService.deactivateTask()]
    ↓
[Update: is_active = false, deactivated_by, deactivated_at]
    ↓
[Trigger: audit trail logging] → [Task hidden from assignee]
```

### Task Reassignment Workflow
```
[PC/Admin/MIS User] → [Manage Button] → [Management Modal] → [Select Reassign]
    ↓
[Search Users] → [Select New Assignee] → [Add Optional Notes]
    ↓
[Role Check] → [loopTaskManagementService.reassignTask()]
    ↓
[Update: doer_name, last_reassigned_by, last_reassigned_at]
    ↓
[Trigger: audit trail logging] → [Task appears for new assignee]
```

### Audit Trail View Workflow
```
[Authorized User] → [History Button] → [Audit Trail Modal]
    ↓
[loopTaskManagementService.getTaskAuditTrail(taskId)]
    ↓
[Display chronological timeline of all actions]
    ↓
[Show: who, when, what changed, notes]
```

---

## API Endpoints (Service Functions)

### Task Management APIs

**Activate Task**
```typescript
loopTaskManagementService.activateTask({
  taskId: string,
  isActive: true,
  performedBy: string,
  performedByRole: string,
  notes?: string
})
```

**Deactivate Task**
```typescript
loopTaskManagementService.deactivateTask({
  taskId: string,
  isActive: false,
  performedBy: string,
  performedByRole: string,
  notes?: string
})
```

**Reassign Task**
```typescript
loopTaskManagementService.reassignTask({
  taskId: string,
  newDoerName: string,
  performedBy: string,
  performedByRole: string,
  notes?: string
})
```

**Get Audit Trail**
```typescript
// For specific task
loopTaskManagementService.getTaskAuditTrail(taskId: string)

// All recent actions
loopTaskManagementService.getAllAuditTrails(limit: number)
```

---

## Security Features

### 1. Role-Based Access Control (RBAC)
- All management functions validate role before execution
- UI components conditionally render based on permissions
- Server-side validation prevents unauthorized actions

### 2. Audit Trail
- Every action is automatically logged
- Immutable audit records
- Tracks who, what, when, and why
- Complete change history with before/after states

### 3. Data Validation
- Role validation on every management operation
- Input sanitization for user-provided data
- Database constraints enforce data integrity

### 4. Row-Level Security (RLS)
- Anonymous users can SELECT login table (for authentication)
- Anonymous users can SELECT audit trail (for transparency)
- Only authenticated users can INSERT/UPDATE
- Policies prevent unauthorized data access

---

## Migration Files

### Primary Migration: `20251007080000_add_loop_task_management.sql`
**Contains:**
1. New columns for loop_tasks table
2. New loop_task_audit_trail table
3. Indexes for performance
4. RLS policies
5. Automatic audit logging trigger function
6. Trigger setup for automatic logging

### Additional Migration: `20251007070500_fix_login_rls_and_add_users.sql`
**Contains:**
- Fixed RLS policies for login table
- Added department column to login table
- Populated initial users with roles
- Allows anonymous SELECT for authentication flow

---

## Key Implementation Details

### 1. Active/Inactive Task Filtering
```typescript
// Only show active tasks by default
const activeTasks = taskData.filter(task => task.is_active !== false);
```

### 2. Role Permission Checking
```typescript
const permissions = rolePermissionService.getPermissions(userRole);
if (!permissions.canCreateLoopTasks) {
  // Hide create button
}
```

### 3. Automatic Audit Logging
- Database trigger automatically logs changes
- No manual logging required in application code
- Ensures complete audit trail even if app code bypassed

### 4. User-Friendly Action Labels
```typescript
loopTaskManagementService.getActionLabel('activated')
// Returns: "Task Activated"

loopTaskManagementService.getActionColor('deactivated')
// Returns: "text-red-600 bg-red-100"
```

---

## Testing Checklist

### Role Permission Tests
- [ ] PC role can create tasks
- [ ] Admin role cannot create tasks
- [ ] MIS role cannot create tasks
- [ ] All authorized roles can activate/deactivate
- [ ] All authorized roles can reassign
- [ ] Unauthorized roles cannot access management features

### Task Lifecycle Tests
- [ ] Task creation logs to audit trail
- [ ] Task activation updates status and logs
- [ ] Task deactivation hides from assignee
- [ ] Task reassignment changes assignee and logs
- [ ] Inactive tasks don't appear in task lists
- [ ] Audit trail shows complete history

### UI/UX Tests
- [ ] Create button only shows for PC role
- [ ] Manage button shows for authorized roles
- [ ] History button shows for authorized roles
- [ ] Management modal displays correct actions per role
- [ ] Audit trail modal shows chronological history
- [ ] User search works in reassignment flow

---

## Future Enhancements

### Potential Features
1. **Bulk Operations** - Activate/deactivate multiple tasks at once
2. **Task Templates** - Create tasks from templates
3. **Notification System** - Alert users when tasks are reassigned
4. **Advanced Filtering** - Filter by active/inactive status
5. **Export Audit Trail** - Download audit history as CSV/PDF
6. **Task Delegation** - Temporary delegation without reassignment
7. **Approval Workflow** - Require approval for deactivation
8. **Task Scheduling** - Schedule activation/deactivation dates

---

## Conclusion

This system provides a robust, secure, and user-friendly solution for managing recurring tasks with role-based permissions. The audit trail ensures complete transparency and accountability for all actions performed on tasks.

**Key Benefits:**
- Clear role-based permission structure
- Complete audit trail for compliance
- Flexible task management (activate, deactivate, reassign)
- User-friendly interface with contextual actions
- Secure with proper validation and RLS
- Scalable architecture for future enhancements
