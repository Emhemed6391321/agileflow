
export enum UserRole {
  ADMIN = 'مدير النظام',
  PRODUCT_OWNER = 'مالك المنتج',
  SCRUM_MASTER = 'سكرام ماستر',
  DEVELOPER = 'مطور',
  VIEWER = 'مشاهد'
}

export enum Permission {
  MANAGE_SETTINGS = 'إدارة الإعدادات',
  MANAGE_USERS = 'إدارة المستخدمين',
  CREATE_PROJECT = 'إنشاء مشاريع',
  EDIT_PROJECT = 'تعديل مشاريع',
  DELETE_PROJECT = 'حذف مشاريع',
  CREATE_TASK = 'إنشاء مهام',
  EDIT_TASK = 'تعديل المهام',
  DELETE_TASK = 'حذف مهام',
  VIEW_REPORTS = 'عرض التقارير'
}

export type RolePermissions = Record<UserRole, Permission[]>;

export enum TaskStatus {
  TODO = 'قائمة المهام',
  IN_PROGRESS = 'جاري العمل',
  REVIEW = 'مراجعة',
  DONE = 'مكتمل'
}

export enum Priority {
  LOW = 'منخفض',
  MEDIUM = 'متوسط',
  HIGH = 'عالي',
  CRITICAL = 'حرج'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  uploadDate: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee?: string; // User ID
  priority: Priority;
  points: number; // Story points
  projectId?: string; // Optional: if undefined, it's a general task
  createdAt: number;
  startDate?: string; // ISO Date YYYY-MM-DD
  dueDate?: string; // ISO Date YYYY-MM-DD
  color?: string; // Hex color for visual tagging
  attachments: Attachment[];
  subtasks: Subtask[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  managerId: string; // User ID
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  tasks: Task[];
  members: string[]; // User IDs
  createdAt: number;
  attachments: Attachment[];
}

export type ViewState = 'DASHBOARD' | 'PROJECTS' | 'BOARD' | 'TEAM' | 'SETTINGS' | 'REPORTS';

// AI Related Types
export interface GeneratedTask {
  title: string;
  description: string;
  priority: Priority;
  points: number;
}