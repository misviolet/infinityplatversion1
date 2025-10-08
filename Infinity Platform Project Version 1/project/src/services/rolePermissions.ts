export type UserRole = 'PC' | 'Admin' | 'MIS' | 'admin' | 'Doer' | 'User';

export interface RolePermissions {
  canCreateLoopTasks: boolean;
  canActivateLoopTasks: boolean;
  canDeactivateLoopTasks: boolean;
  canReassignLoopTasks: boolean;
  canViewAuditTrail: boolean;
}

export class RolePermissionService {
  private normalizeRole(role: string): string {
    const normalized = role.toLowerCase().trim();

    if (normalized === 'admin') return 'Admin';
    if (normalized === 'pc') return 'PC';
    if (normalized === 'mis') return 'MIS';

    return role;
  }

  getPermissions(role: string): RolePermissions {
    const normalizedRole = this.normalizeRole(role);

    switch (normalizedRole) {
      case 'PC':
        return {
          canCreateLoopTasks: true,
          canActivateLoopTasks: true,
          canDeactivateLoopTasks: true,
          canReassignLoopTasks: true,
          canViewAuditTrail: true,
        };

      case 'Admin':
        return {
          canCreateLoopTasks: false,
          canActivateLoopTasks: true,
          canDeactivateLoopTasks: true,
          canReassignLoopTasks: true,
          canViewAuditTrail: true,
        };

      case 'MIS':
        return {
          canCreateLoopTasks: false,
          canActivateLoopTasks: true,
          canDeactivateLoopTasks: true,
          canReassignLoopTasks: true,
          canViewAuditTrail: true,
        };

      default:
        return {
          canCreateLoopTasks: false,
          canActivateLoopTasks: false,
          canDeactivateLoopTasks: false,
          canReassignLoopTasks: false,
          canViewAuditTrail: false,
        };
    }
  }

  canPerformAction(role: string, action: keyof RolePermissions): boolean {
    const permissions = this.getPermissions(role);
    return permissions[action];
  }

  getRoleLabel(role: string): string {
    const normalizedRole = this.normalizeRole(role);

    switch (normalizedRole) {
      case 'PC':
        return 'Process Coordinator';
      case 'Admin':
        return 'Administrator';
      case 'MIS':
        return 'MIS Manager';
      default:
        return role;
    }
  }

  getRoleDescription(role: string): string {
    const normalizedRole = this.normalizeRole(role);

    switch (normalizedRole) {
      case 'PC':
        return 'Full permissions: Create, Activate, Deactivate, and Reassign loop tasks';
      case 'Admin':
        return 'Management permissions: Activate, Deactivate, and Reassign loop tasks (Cannot create new tasks)';
      case 'MIS':
        return 'Management permissions: Activate, Deactivate, and Reassign loop tasks (Cannot create new tasks)';
      default:
        return 'No loop task management permissions';
    }
  }
}

export const rolePermissionService = new RolePermissionService();
