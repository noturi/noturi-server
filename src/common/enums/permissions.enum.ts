export enum Permission {
  // 기본 카테고리 관리
  READ_DEFAULT_CATEGORIES = 'read:default_categories',
  CREATE_DEFAULT_CATEGORIES = 'create:default_categories',
  UPDATE_DEFAULT_CATEGORIES = 'update:default_categories',
  DELETE_DEFAULT_CATEGORIES = 'delete:default_categories',

  // 사용자 관리
  READ_USERS = 'read:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',

  // 시스템 관리
  MANAGE_SYSTEM = 'manage:system',
  VIEW_ANALYTICS = 'view:analytics',
  READ_DASHBOARD = 'read:dashboard',

  // 알림 관리
  MANAGE_NOTIFICATIONS = 'manage:notifications',

  // 어드민 관리 (슈퍼어드민만)
  CREATE_ADMIN = 'create:admin',
  DELETE_ADMIN = 'delete:admin',
  MANAGE_PERMISSIONS = 'manage:permissions',
}

// UserRole enum을 직접 정의하여 순환 참조 방지
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [],

  [UserRole.ADMIN]: [
    Permission.READ_DEFAULT_CATEGORIES,
    Permission.CREATE_DEFAULT_CATEGORIES,
    Permission.UPDATE_DEFAULT_CATEGORIES,
    Permission.DELETE_DEFAULT_CATEGORIES,
    Permission.READ_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.READ_DASHBOARD,
  ],

  [UserRole.SUPER_ADMIN]: [
    Permission.READ_DEFAULT_CATEGORIES,
    Permission.CREATE_DEFAULT_CATEGORIES,
    Permission.UPDATE_DEFAULT_CATEGORIES,
    Permission.DELETE_DEFAULT_CATEGORIES,
    Permission.READ_USERS,
    Permission.UPDATE_USERS,
    Permission.DELETE_USERS,
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_ANALYTICS,
    Permission.READ_DASHBOARD,
    Permission.MANAGE_NOTIFICATIONS,
    Permission.CREATE_ADMIN,
    Permission.DELETE_ADMIN,
    Permission.MANAGE_PERMISSIONS,
  ],
};
