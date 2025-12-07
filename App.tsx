
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Users, 
  Settings, 
  Plus, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle,
  Menu,
  X,
  Search,
  FolderKanban,
  Calendar,
  UserCircle,
  LogOut,
  Lock,
  ChevronDown,
  Trash2,
  Edit,
  ArrowRight,
  Clock,
  Palette,
  AlertTriangle,
  ArrowUpRight,
  KeyRound,
  FileText,
  Building2,
  Bell,
  ChevronLeft,
  Paperclip,
  CheckSquare,
  CalendarRange,
  Download,
  Upload,
  LayoutList,
  Printer,
  TrendingUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  Project, 
  Task, 
  User, 
  UserRole, 
  ViewState, 
  TaskStatus, 
  Priority,
  Permission,
  RolePermissions,
  Attachment,
  Subtask
} from './types';
import { generateTasksFromDescription, analyzeProjectRisks } from './services/geminiService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// --- Default Permissions Configuration ---
const DEFAULT_PERMISSIONS: RolePermissions = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.PRODUCT_OWNER]: [Permission.CREATE_PROJECT, Permission.EDIT_PROJECT, Permission.CREATE_TASK, Permission.EDIT_TASK, Permission.DELETE_TASK, Permission.VIEW_REPORTS],
  [UserRole.SCRUM_MASTER]: [Permission.CREATE_TASK, Permission.EDIT_TASK, Permission.VIEW_REPORTS, Permission.MANAGE_USERS],
  [UserRole.DEVELOPER]: [Permission.EDIT_TASK],
  [UserRole.VIEWER]: []
};

// --- Helper Functions ---
const hasPermission = (userRole: UserRole, permission: Permission, permissionsMap: RolePermissions): boolean => {
  return permissionsMap[userRole]?.includes(permission) || false;
};

// Mock function to simulate file upload
const mockUploadFile = (file: File): Attachment => {
  return {
    id: `file-${Date.now()}`,
    name: file.name,
    url: '#', // Placeholder
    type: file.type,
    size: (file.size / 1024).toFixed(2) + ' KB',
    uploadDate: Date.now()
  };
};

const calculateTaskProgress = (subtasks: Subtask[]) => {
  if (!subtasks || subtasks.length === 0) return 0;
  const completed = subtasks.filter(s => s.completed).length;
  return Math.round((completed / subtasks.length) * 100);
};

// --- Components Definitions ---

// 0. Login View
const LoginView = ({ onLogin }: { onLogin: (u: string, p: string) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin(username, password);
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-10 border-t-4 border-brand-500 animate-fadeIn">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Building2 size={50} className="text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">المعهد المتوسط</h1>
          <h2 className="text-lg text-brand-600 font-semibold mt-1">للدراسات الإسلامية</h2>
          <p className="text-slate-400 mt-4 text-sm">نظام إدارة المشاريع والمهام</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم</label>
            <div className="relative">
              <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="أدخل اسم المستخدم"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
            <div className="relative">
              <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="أدخل كلمة المرور"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-md transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            دخول للنظام
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>اسم المستخدم الافتراضي: admin</p>
          <p>كلمة المرور الافتراضية: admin</p>
        </div>
      </div>
    </div>
  );
};

// 1. Sidebar (Redesigned to match image)
const Sidebar = ({ 
  currentView, 
  setView, 
  currentUser,
  isMobileOpen,
  toggleMobile,
  onLogout
}: { 
  currentView: ViewState; 
  setView: (v: ViewState) => void; 
  currentUser: User;
  isMobileOpen: boolean;
  toggleMobile: () => void;
  onLogout: () => void;
}) => {
  const menuItems = [
    { id: 'DASHBOARD', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'PROJECTS', label: 'المشاريع', icon: FolderKanban },
    { id: 'BOARD', label: 'المهام', icon: KanbanSquare },
    { id: 'TEAM', label: 'المستخدمون', icon: Users },
    { id: 'SETTINGS', label: 'الإعدادات الأساسية', icon: Settings },
  ];

  const sidebarClass = `fixed inset-y-0 right-0 z-50 w-72 bg-[#fdfdfd] text-slate-600 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-lg lg:shadow-none border-l border-slate-100 ${
    isMobileOpen ? 'translate-x-0' : 'translate-x-full'
  }`;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleMobile}
        ></div>
      )}
      
      <div className={sidebarClass}>
        {/* Logo Area */}
        <div className="flex flex-col items-center justify-center pt-8 pb-6 px-4 border-b border-dashed border-slate-200">
           <div className="mb-3 text-brand-500">
             <Building2 size={48} strokeWidth={1.5} />
           </div>
           <h1 className="font-bold text-lg text-slate-800 text-center leading-tight">
             المعهد المتوسط
             <br />
             <span className="text-sm font-normal text-slate-500">للدراسات الإسلامية</span>
           </h1>
           <button onClick={toggleMobile} className="lg:hidden absolute top-4 left-4 text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs font-bold text-slate-400 mb-4 px-2">القائمة الرئيسية</p>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as ViewState);
                  if (window.innerWidth < 1024) toggleMobile();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                  currentView === item.id 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-600'
                }`}
              >
                <item.icon size={20} strokeWidth={1.5} />
                <span>{item.label}</span>
                {currentView === item.id && <ChevronLeft size={16} className="mr-auto" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Actions similar to image "My Files" */}
        <div className="absolute bottom-0 w-full p-6">
           <button 
             onClick={() => {
               setView('REPORTS');
               if (window.innerWidth < 1024) toggleMobile();
             }}
             className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors mb-4 ${
               currentView === 'REPORTS' 
               ? 'bg-brand-700 text-white'
               : 'bg-brand-600 text-white hover:bg-brand-700'
             }`}
           >
              <FileText size={20} />
              <span>تقاريري</span>
           </button>
           
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 text-slate-400 hover:text-red-500 transition-colors w-full px-4 py-2 text-sm"
          >
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </>
  );
};

// 1.5 Reports View
const ReportsView = ({ tasks, projects, users }: { tasks: Task[], projects: Project[], users: User[] }) => {
  
  // Data for Charts
  const statusData = [
    { name: 'مكتمل', value: tasks.filter(t => t.status === TaskStatus.DONE).length, color: '#10b981' },
    { name: 'جاري العمل', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#3b82f6' },
    { name: 'مراجعة', value: tasks.filter(t => t.status === TaskStatus.REVIEW).length, color: '#f59e0b' },
    { name: 'قائمة المهام', value: tasks.filter(t => t.status === TaskStatus.TODO).length, color: '#94a3b8' },
  ];

  const priorityData = [
    { name: 'حرج', count: tasks.filter(t => t.priority === Priority.CRITICAL).length, fill: '#ef4444' },
    { name: 'عالي', count: tasks.filter(t => t.priority === Priority.HIGH).length, fill: '#f97316' },
    { name: 'متوسط', count: tasks.filter(t => t.priority === Priority.MEDIUM).length, fill: '#3b82f6' },
    { name: 'منخفض', count: tasks.filter(t => t.priority === Priority.LOW).length, fill: '#94a3b8' },
  ];

  // User Performance Data
  const userPerformanceData = users.slice(0, 10).map(user => {
    const userTasks = tasks.filter(t => t.assignee === user.id);
    const completed = userTasks.filter(t => t.status === TaskStatus.DONE).length;
    const active = userTasks.length - completed;
    return {
      name: user.name.split(' ')[0], // First name only for chart
      completed,
      active
    };
  });

  // Project Progress Data
  const projectProgressData = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.id);
    const completed = pTasks.filter(t => t.status === TaskStatus.DONE).length;
    const progress = pTasks.length > 0 ? Math.round((completed / pTasks.length) * 100) : 0;
    return {
      name: p.name,
      progress: progress
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-20 print:p-0 print:space-y-4">
      <div className="flex justify-between items-center mb-4 print:hidden">
         <div>
           <h2 className="text-2xl font-bold text-slate-800">تقارير الأداء</h2>
           <p className="text-sm text-slate-500">تحليلات شاملة للمشاريع والمهام</p>
         </div>
         <button 
           onClick={() => window.print()} 
           className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 shadow-sm"
         >
           <Printer size={18} />
           <span>طباعة / تصدير</span>
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-4">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">إجمالي المهام</h3>
            <div className="text-4xl font-bold text-slate-800">{tasks.length}</div>
            <div className="text-xs text-slate-400 mt-2">مهمة مسجلة بالنظام</div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">نسبة الإنجاز الكلية</h3>
            <div className="text-4xl font-bold text-brand-600">
               {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100) : 0}%
            </div>
            <div className="text-xs text-slate-400 mt-2">لجميع المشاريع</div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">عدد المشاريع</h3>
            <div className="text-4xl font-bold text-slate-800">{projects.length}</div>
            <div className="text-xs text-slate-400 mt-2">مشروع نشط</div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">نقاط الجهد المنجزة</h3>
            <div className="text-4xl font-bold text-emerald-600">
               {tasks.filter(t => t.status === TaskStatus.DONE).reduce((acc, t) => acc + t.points, 0)}
            </div>
            <div className="text-xs text-slate-400 mt-2">من أصل {tasks.reduce((acc, t) => acc + t.points, 0)} نقطة</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
         {/* Status Chart */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PieChartIcon size={20} className="text-brand-500"/>
              توزيع حالات المهام
            </h3>
            <ResponsiveContainer width="100%" height={300}>
               <PieChart>
                 <Pie
                   data={statusData}
                   cx="50%"
                   cy="50%"
                   innerRadius={80}
                   outerRadius={110}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {statusData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
            </ResponsiveContainer>
         </div>

         {/* Priority Chart */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <AlertCircle size={20} className="text-red-500"/>
               المهام حسب الأولوية
            </h3>
            <ResponsiveContainer width="100%" height={300}>
               <BarChart data={priorityData} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
                 <XAxis type="number" fontSize={12} stroke="#94a3b8"/>
                 <YAxis dataKey="name" type="category" width={80} fontSize={12} stroke="#64748b"/>
                 <Tooltip cursor={{fill: '#f8fafc'}} />
                 <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
                    {priorityData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                 </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
         
         {/* Project Progress Chart */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <TrendingUp size={20} className="text-blue-500"/>
               نسب إنجاز المشاريع
            </h3>
            <ResponsiveContainer width="100%" height={300}>
               <BarChart data={projectProgressData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                 <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" tick={{fill: '#64748b'}} interval={0} angle={-15} textAnchor="end"/>
                 <YAxis fontSize={12} stroke="#94a3b8" unit="%" />
                 <Tooltip />
                 <Bar dataKey="progress" fill="#b4833e" radius={[4, 4, 0, 0]} barSize={50} />
               </BarChart>
            </ResponsiveContainer>
         </div>

         {/* Team Performance Chart */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Users size={20} className="text-purple-500"/>
               أداء الفريق
            </h3>
            <ResponsiveContainer width="100%" height={300}>
               <BarChart data={userPerformanceData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                 <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" />
                 <YAxis fontSize={12} stroke="#94a3b8"/>
                 <Tooltip />
                 <Legend />
                 <Bar name="مهام مكتملة" dataKey="completed" fill="#10b981" stackId="a" />
                 <Bar name="مهام نشطة" dataKey="active" fill="#e2e8f0" stackId="a" radius={[4, 4, 0, 0]}/>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

// 2. Dashboard
const Dashboard = ({ projects, tasks }: { projects: Project[]; tasks: Task[] }) => {
  const statusData = [
    { name: TaskStatus.TODO, value: tasks.filter(t => t.status === TaskStatus.TODO).length, color: '#94a3b8' },
    { name: TaskStatus.IN_PROGRESS, value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#3b82f6' },
    { name: TaskStatus.REVIEW, value: tasks.filter(t => t.status === TaskStatus.REVIEW).length, color: '#f59e0b' },
    { name: TaskStatus.DONE, value: tasks.filter(t => t.status === TaskStatus.DONE).length, color: '#b4833e' }, // Brand color for done
  ];

  const priorityData = [
    { name: Priority.LOW, count: tasks.filter(t => t.priority === Priority.LOW).length },
    { name: Priority.MEDIUM, count: tasks.filter(t => t.priority === Priority.MEDIUM).length },
    { name: Priority.HIGH, count: tasks.filter(t => t.priority === Priority.HIGH).length },
    { name: Priority.CRITICAL, count: tasks.filter(t => t.priority === Priority.CRITICAL).length },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex justify-between items-center mb-2">
         <h2 className="text-2xl font-bold text-slate-800">لوحة التحكم</h2>
         <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded border border-slate-200">
           {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
         </span>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'إجمالي المشاريع', value: projects.length, icon: FolderKanban, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'المهام النشطة', value: tasks.filter(t => t.status !== TaskStatus.DONE).length, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'المهام المنجزة', value: tasks.filter(t => t.status === TaskStatus.DONE).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'نقاط الجهد', value: tasks.reduce((acc, t) => acc + t.points, 0), icon: KanbanSquare, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 mb-2 font-medium">{stat.label}</p>
                <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
              </div>
              <div className={`p-3 ${stat.bg} ${stat.color} rounded-lg`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">توزيع حالة المهام</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">المهام حسب الأولوية</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" fill="#b4833e" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// 3. Projects View (Enhanced)
const ProjectsView = ({ 
  projects, 
  users,
  tasks,
  canCreateProject,
  canEditProject,
  canDeleteProject,
  onDeleteProject,
  onProjectClick,
  onOpenCreateProject,
  onOpenEditProject
}: { 
  projects: Project[]; 
  users: User[];
  tasks: Task[];
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  onDeleteProject: (id: string) => void;
  onProjectClick: (p: Project) => void;
  onOpenCreateProject: () => void;
  onOpenEditProject: (p: Project) => void;
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">قائمة المشاريع</h2>
          <p className="text-slate-500 text-sm mt-1">إدارة المشاريع والجداول الزمنية للفريق</p>
        </div>
        {canCreateProject && (
          <button 
            onClick={onOpenCreateProject}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm font-medium"
          >
            <Plus size={18} />
            <span>مشروع جديد</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-10">
        {projects.map(project => {
          const manager = users.find(u => u.id === project.managerId);
          const projectTasks = tasks.filter(t => t.projectId === project.id);
          const completedTasks = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
          const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
          const attachmentsCount = project.attachments ? project.attachments.length : 0;

          return (
            <div 
              key={project.id} 
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-brand-300 transition-all cursor-pointer group relative"
              onClick={() => onProjectClick(project)}
            >
              <div className="flex justify-between items-start mb-5">
                <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
                  <FolderKanban size={24} />
                </div>
                
                <div className="flex gap-2">
                   {/* Actions for project */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {canEditProject && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onOpenEditProject(project); }} 
                        className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                        title="تعديل"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {canDeleteProject && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation();
                          if(window.confirm(`تحذير: هل أنت متأكد من حذف مشروع "${project.name}"؟\n\nسيتم حذف جميع المهام المرتبطة بهذا المشروع ولا يمكن التراجع عن هذا الإجراء.`)) {
                            onDeleteProject(project.id);
                          }
                        }} 
                        className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <h3 className="font-bold text-lg text-slate-800 mb-2 leading-tight">{project.name}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10 leading-relaxed">{project.description}</p>
              
              {attachmentsCount > 0 && (
                <div className="flex items-center gap-1 text-slate-400 text-xs mb-4">
                  <Paperclip size={12} />
                  <span>{attachmentsCount} مرفقات</span>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-2 font-medium">
                  <span className="text-slate-500">نسبة الإنجاز</span>
                  <span className="text-brand-600">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-brand-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                   {manager ? (
                      <>
                        <img src={manager.avatar} className="w-8 h-8 rounded-full border border-slate-200" alt={manager.name} />
                        <div className="flex flex-col">
                           <span className="text-[10px] text-slate-400">المدير</span>
                           <span className="text-xs font-bold text-slate-700">{manager.name}</span>
                        </div>
                      </>
                   ) : (
                      <span className="text-xs text-slate-400">بدون مدير</span>
                   )}
                </div>
                
                <div className="flex -space-x-2 space-x-reverse">
                    {project.members.slice(0, 3).map(mid => {
                      const m = users.find(u => u.id === mid);
                      return m ? (
                        <img key={mid} src={m.avatar} className="w-8 h-8 rounded-full border-2 border-white" alt={m.name} title={m.name} />
                      ) : null;
                    })}
                    {project.members.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs text-slate-500 font-bold">
                        +{project.members.length - 3}
                      </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3.5 Project Detail View (Includes Attachments)
const ProjectDetailView = ({
  project,
  tasks,
  users,
  onBack,
  onOpenEditTask,
  onDeleteTask,
  onNavigateToBoard,
  onUpdateProject // Callback to update project (for attachments)
}: {
  project: Project;
  tasks: Task[];
  users: User[];
  onBack: () => void;
  onOpenEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onNavigateToBoard: (projectId: string) => void;
  onUpdateProject: (p: Project) => void;
}) => {
  const manager = users.find(u => u.id === project.managerId);
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAttachment = mockUploadFile(file);
      const updatedProject = {
        ...project,
        attachments: [...(project.attachments || []), newAttachment]
      };
      onUpdateProject(updatedProject);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fadeIn overflow-y-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-brand-600 transition-colors">
          <ArrowRight size={20} />
        </button>
        <div>
           <h1 className="text-2xl font-bold text-slate-800">تفاصيل المشروع</h1>
           <p className="text-sm text-slate-500">{project.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Info */}
        <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">{project.name}</h2>
            <p className="text-slate-600 mb-6 leading-relaxed text-lg">{project.description}</p>
            
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                  <UserCircle size={20} />
                </div>
                <div>
                   <span className="block text-slate-400 text-xs">مدير المشروع</span>
                   <span className="font-bold text-slate-800">{manager?.name || 'غير محدد'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                   <Calendar size={20} />
                 </div>
                 <div>
                    <span className="block text-slate-400 text-xs">الجدول الزمني</span>
                    <span className="font-bold text-slate-800 dir-ltr">{project.startDate} — {project.endDate || 'مفتوح'}</span>
                 </div>
              </div>
            </div>
        </div>

        {/* Attachments Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Paperclip size={18} className="text-brand-500" />
                مستندات المشروع
              </h3>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-100 font-bold flex items-center gap-1"
              >
                <Plus size={14}/> إضافة
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
           </div>

           <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
              {project.attachments && project.attachments.length > 0 ? (
                project.attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-brand-200 transition-colors">
                     <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-slate-500">
                           <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                           <p className="text-sm font-bold text-slate-700 truncate">{att.name}</p>
                           <p className="text-[10px] text-slate-400">{att.size} • {new Date(att.uploadDate).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <button className="text-slate-400 hover:text-brand-600">
                       <Download size={16} />
                     </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-slate-400 py-4 border-2 border-dashed border-slate-100 rounded-lg">لا توجد ملفات مرفقة</p>
              )}
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-800">قائمة المهام</h3>
        <button 
            onClick={() => onNavigateToBoard(project.id)} 
            className="flex items-center gap-2 text-sm font-bold text-brand-600 hover:underline"
          >
            <span>عرض في اللوحة</span>
            <KanbanSquare size={16} />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
         {projectTasks.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10">
             <KanbanSquare size={48} className="mb-4 opacity-30"/>
             <p>لا توجد مهام مضافة لهذا المشروع بعد</p>
           </div>
         ) : (
           <div className="overflow-auto h-full">
             <table className="w-full text-right">
               <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100">
                 <tr>
                   <th className="p-4 font-semibold">العنوان</th>
                   <th className="p-4 font-semibold">الحالة</th>
                   <th className="p-4 font-semibold">التقدم</th>
                   <th className="p-4 font-semibold">الأولوية</th>
                   <th className="p-4 font-semibold">المكلف</th>
                   <th className="p-4 font-semibold">تاريخ الاستحقاق</th>
                   <th className="p-4 text-center font-semibold">الإجراءات</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {projectTasks.map(task => {
                   const progress = calculateTaskProgress(task.subtasks || []);
                   return (
                   <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                     <td className="p-4 font-medium text-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-sm shadow-sm border border-slate-200" style={{ backgroundColor: task.color || '#fff' }}></span>
                        {task.title}
                        {(task.attachments?.length ?? 0) > 0 && <Paperclip size={12} className="text-slate-400"/>}
                      </div>
                     </td>
                     <td className="p-4">
                        <span className={`px-2.5 py-1 rounded text-xs font-medium border ${
                          task.status === TaskStatus.DONE ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                          task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {task.status}
                        </span>
                     </td>
                     <td className="p-4">
                        {task.subtasks && task.subtasks.length > 0 ? (
                          <div className="w-24">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full">
                               <div className="h-1.5 bg-brand-500 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                            </div>
                          </div>
                        ) : <span className="text-slate-400 text-xs">-</span>}
                     </td>
                     <td className="p-4 text-xs font-medium">{task.priority}</td>
                     <td className="p-4">
                       {task.assignee ? (
                          <div className="flex items-center gap-2">
                             <img src={users.find(u => u.id === task.assignee)?.avatar} className="w-6 h-6 rounded-full border border-slate-200" alt={manager?.name} />
                             <span className="text-xs text-slate-600">{users.find(u => u.id === task.assignee)?.name}</span>
                          </div>
                       ) : <span className="text-slate-400 text-xs">-</span>}
                     </td>
                     <td className="p-4 text-xs font-mono text-slate-500">{task.dueDate || '-'}</td>
                     <td className="p-4">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onOpenEditTask(task)} 
                            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
                            title="تعديل المهمة"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => {
                               if(window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) onDeleteTask(task.id);
                            }} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="حذف المهمة"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                     </td>
                   </tr>
                 )})}
               </tbody>
             </table>
           </div>
         )}
      </div>
    </div>
  );
};

// 4. Kanban & Timeline Board (Unified)
const ProjectBoard = ({ 
  tasks, 
  projects,
  selectedProjectId,
  onSelectedProjectChange,
  onUpdateTaskStatus, 
  onAddTask,
  onEditTask,
  onDeleteTask,
  currentUser,
  users,
  permissions
}: { 
  tasks: Task[]; 
  projects: Project[];
  selectedProjectId: string;
  onSelectedProjectChange: (id: string) => void;
  onUpdateTaskStatus: (id: string, newStatus: TaskStatus) => void;
  onAddTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  currentUser: User;
  users: User[];
  permissions: RolePermissions;
}) => {
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TIMELINE'>('KANBAN');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  
  // Default prompt based on selected project
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const [aiPrompt, setAiPrompt] = useState('');
  const [riskAnalysis, setRiskAnalysis] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProject) {
      setAiPrompt(selectedProject.description);
    } else {
      setAiPrompt('');
    }
  }, [selectedProjectId, projects]);
  
  const filteredTasks = selectedProjectId === 'general'
    ? tasks.filter(t => !t.projectId)
    : tasks.filter(t => t.projectId === selectedProjectId);

  const columns = Object.values(TaskStatus);
  const canEdit = hasPermission(currentUser.role, Permission.EDIT_TASK, permissions);
  const canCreate = hasPermission(currentUser.role, Permission.CREATE_TASK, permissions);
  const canDelete = hasPermission(currentUser.role, Permission.DELETE_TASK, permissions);

  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    setRiskAnalysis(null);
    try {
      const newTasksData = await generateTasksFromDescription(aiPrompt);
      const newTasks: Task[] = newTasksData.map((t, index) => ({
        id: `gen-${Date.now()}-${index}`,
        title: t.title,
        description: t.description,
        status: TaskStatus.TODO,
        priority: t.priority as Priority,
        points: t.points,
        createdAt: Date.now(),
        projectId: selectedProjectId === 'general' ? undefined : selectedProjectId,
        assignee: undefined,
        color: '#ffffff',
        attachments: [],
        subtasks: []
      }));
      
      newTasks.forEach(t => onAddTask(t));
      
      // Analyze risks
      const risks = await analyzeProjectRisks(aiPrompt, newTasks.length);
      setRiskAnalysis(risks);

    } catch (error) {
      alert('حدث خطأ أثناء توليد المهام. تأكد من إعداد مفتاح API.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.CRITICAL: return 'bg-red-50 text-red-700 border-red-100';
      case Priority.HIGH: return 'bg-orange-50 text-orange-700 border-orange-100';
      case Priority.MEDIUM: return 'bg-blue-50 text-blue-700 border-blue-100';
      case Priority.LOW: return 'bg-slate-50 text-slate-700 border-slate-100';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && canEdit) {
      onUpdateTaskStatus(taskId, targetStatus);
    }
  };

  // --- Timeline Calculations ---
  const today = new Date();
  const timelineStart = new Date(today);
  timelineStart.setDate(today.getDate() - 15);
  const timelineEnd = new Date(today);
  timelineEnd.setDate(today.getDate() + 45);
  
  const timelineDays: Date[] = [];
  for (let d = new Date(timelineStart); d <= timelineEnd; d.setDate(d.getDate() + 1)) {
    timelineDays.push(new Date(d));
  }

  const getTaskStyle = (taskStart: string | undefined, taskEnd: string | undefined) => {
    const start = taskStart ? new Date(taskStart) : new Date();
    const end = taskEnd ? new Date(taskEnd) : new Date(start.getTime() + 86400000); // Default 1 day
    
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Calculate days from the start of the timeline
    let leftDays = (start.getTime() - timelineStart.getTime()) / oneDay;
    let durationDays = (end.getTime() - start.getTime()) / oneDay;
    
    if (durationDays < 1) durationDays = 1;

    return {
      right: `${leftDays * 50}px`,
      width: `${durationDays * 50}px`
    };
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة المهام</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm">المشروع:</span>
              <div className="relative">
                <select 
                  value={selectedProjectId}
                  onChange={(e) => onSelectedProjectChange(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg py-2 pl-3 pr-10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none appearance-none min-w-[200px] shadow-sm cursor-pointer"
                >
                  <option value="general">المهام العامة (بدون مشروع)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* View Switcher */}
            <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
              <button 
                onClick={() => setViewMode('KANBAN')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${viewMode === 'KANBAN' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <KanbanSquare size={16} />
                <span>لوحة</span>
              </button>
              <button 
                onClick={() => setViewMode('TIMELINE')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${viewMode === 'TIMELINE' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <CalendarRange size={16} />
                <span>جدول زمني</span>
              </button>
            </div>
          </div>
        </div>
        
        {canCreate && (
          <div className="flex gap-3">
             <button 
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <BrainCircuit size={18} />
              <span>مساعد AI</span>
            </button>
            <button 
              onClick={() => {
                 const defaultTask = {
                  status: TaskStatus.TODO,
                  priority: Priority.MEDIUM,
                  points: 1,
                  projectId: selectedProjectId === 'general' ? undefined : selectedProjectId,
                  color: '#ffffff',
                  attachments: [],
                  subtasks: []
                };
                onEditTask(defaultTask as Task); 
              }}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium"
            >
              <Plus size={18} />
              <span>مهمة جديدة</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Modal Overlay */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-purple-700">
                <BrainCircuit />
                المساعد الذكي للمشاريع
              </h3>
              <button onClick={() => setShowAIModal(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">وصف المتطلبات</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg p-4 h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none text-slate-700"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="اشرح ما تريد بناءه وسأقوم باقتراح المهام..."
                />
              </div>

              {riskAnalysis && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-sm text-amber-900 leading-relaxed">
                  <strong className="block mb-2 flex items-center gap-2 font-bold"><AlertCircle size={16}/> تحليل المخاطر:</strong>
                  {riskAnalysis}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setShowAIModal(false)}
                className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                إغلاق
              </button>
              <button 
                onClick={handleGenerateTasks}
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {isGenerating ? 'جاري التحليل...' : 'توليد المهام وتحليل المخاطر'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: KANBAN vs TIMELINE */}
      <div className="flex-1 overflow-hidden relative border border-slate-200 rounded-xl bg-slate-50/50">
        
        {viewMode === 'KANBAN' && (
          <div className="h-full overflow-x-auto overflow-y-hidden p-4">
            <div className="flex h-full gap-6 min-w-[1000px]">
              {columns.map(status => (
                <div 
                  key={status} 
                  className="flex-1 flex flex-col bg-slate-100/50 border border-slate-200 rounded-xl min-w-[280px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-[#f8fafc] rounded-t-xl z-10">
                    <span className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        status === TaskStatus.DONE ? 'bg-brand-500' :
                        status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' :
                        status === TaskStatus.REVIEW ? 'bg-amber-500' : 'bg-slate-400'
                      }`}></span>
                      {status}
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded text-xs text-slate-500 font-bold border border-slate-200 shadow-sm">
                      {filteredTasks.filter(t => t.status === status).length}
                    </span>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {filteredTasks.filter(t => t.status === status).map(task => {
                      const progress = calculateTaskProgress(task.subtasks || []);
                      const attachmentCount = task.attachments?.length || 0;
                      
                      return (
                        <div 
                          key={task.id} 
                          draggable={canEdit}
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-300 transition-all group relative cursor-grab active:cursor-grabbing ${canEdit ? '' : 'cursor-default'}`}
                          style={{ borderRight: `4px solid ${task.color && task.color !== '#ffffff' ? task.color : 'transparent'}` }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            
                            {/* Quick Actions */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white p-0.5 rounded shadow-sm border border-slate-100 z-20">
                              {canEdit && (
                                  <button onClick={() => onEditTask(task)} className="p-1 text-slate-400 hover:text-brand-600 rounded">
                                    <Edit size={14}/>
                                  </button>
                              )}
                              {canDelete && (
                                  <button 
                                    onClick={() => {
                                      if(window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) onDeleteTask(task.id);
                                    }} 
                                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                                  >
                                    <Trash2 size={14}/>
                                  </button>
                              )}
                            </div>
                          </div>
                          
                          <h4 className="font-bold text-slate-800 mb-2 text-sm leading-snug">{task.title}</h4>
                          
                          {/* Subtasks Progress */}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mb-3">
                              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                                  <div className="flex items-center gap-1">
                                    <CheckSquare size={10} />
                                    <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                                  </div>
                                  <span>{progress}%</span>
                              </div>
                              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${progress}%` }}></div>
                              </div>
                            </div>
                          )}

                          {(task.startDate || task.dueDate || attachmentCount > 0) && (
                            <div className="flex flex-wrap gap-2 mb-3 text-[10px] text-slate-500">
                                {task.startDate && (
                                  <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                    <Clock size={10} /> {task.startDate}
                                  </span>
                                )}
                                {task.dueDate && (
                                  <span className="flex items-center gap-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                                    <AlertTriangle size={10} /> {task.dueDate}
                                  </span>
                                )}
                                {attachmentCount > 0 && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-100">
                                    <Paperclip size={10} /> {attachmentCount}
                                  </span>
                                )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                            <div className="flex items-center gap-2">
                              {task.assignee ? (
                                <div className="flex items-center gap-1" title={users.find(u => u.id === task.assignee)?.name}>
                                  <img 
                                    src={users.find(u => u.id === task.assignee)?.avatar || `https://picsum.photos/30/30?random=${task.assignee}`} 
                                    className="w-6 h-6 rounded-full border border-slate-200" 
                                    alt="Assignee" 
                                  />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px]">?</div>
                              )}
                            </div>
                            <span className="text-[10px] font-mono bg-slate-50 px-2 py-0.5 rounded text-slate-500 border border-slate-100">
                              {task.points} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'TIMELINE' && (
          <div className="h-full flex flex-col bg-white">
             <div className="flex-1 overflow-auto relative custom-scrollbar">
                <div className="min-w-max relative pb-10">
                   {/* Timeline Header */}
                   <div className="flex border-b border-slate-200 sticky top-0 bg-slate-50 z-20 h-10 shadow-sm">
                      <div className="sticky right-0 w-64 bg-slate-50 border-l border-slate-200 z-30 flex items-center px-4 font-bold text-slate-700 text-sm">
                         المهمة
                      </div>
                      {timelineDays.map((day, idx) => (
                        <div key={idx} className={`w-[50px] flex-shrink-0 flex flex-col items-center justify-center border-l border-slate-200 text-[10px] ${day.getDay() === 5 || day.getDay() === 6 ? 'bg-slate-100' : 'bg-white'}`}>
                           <span className="font-bold text-slate-600">{day.getDate()}</span>
                        </div>
                      ))}
                   </div>

                   {/* Timeline Body */}
                   <div className="divide-y divide-slate-100">
                      {filteredTasks.length === 0 && (
                        <div className="p-10 text-center text-slate-400">لا توجد مهام لعرضها في هذا المشروع</div>
                      )}
                      {filteredTasks.map(task => {
                        const style = getTaskStyle(task.startDate, task.dueDate);
                        // Skip tasks without dates for clearer timeline
                        if(!task.startDate && !task.dueDate) return null;

                        return (
                           <div key={task.id} className="flex h-12 relative hover:bg-slate-50 transition-colors group">
                              <div className="sticky right-0 w-64 bg-white border-l border-slate-200 z-10 flex items-center px-4 text-sm text-slate-700 font-medium truncate shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)] cursor-pointer hover:text-brand-600" onClick={() => onEditTask(task)}>
                                 <span className={`w-2 h-2 rounded-full mr-2 ml-2 ${
                                    task.status === TaskStatus.DONE ? 'bg-emerald-500' :
                                    task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500' : 'bg-slate-300'
                                 }`}></span>
                                 {task.title}
                              </div>

                              {/* Grid Lines */}
                              <div className="absolute inset-0 flex pointer-events-none">
                                {timelineDays.map((d, i) => (
                                  <div key={i} className="w-[50px] border-l border-slate-50 h-full flex-shrink-0"></div>
                                ))}
                              </div>

                              {/* Task Bar */}
                              <div className="absolute h-full flex items-center top-0 transition-all hover:brightness-95 cursor-pointer" style={{ right: `calc(16rem + ${style.right})`, width: style.width }} onClick={() => onEditTask(task)}>
                                <div 
                                  className={`h-7 rounded-md shadow-sm border px-2 flex items-center text-xs text-white truncate w-full ${
                                    task.status === TaskStatus.DONE ? 'bg-emerald-500 border-emerald-600' : 
                                    task.priority === Priority.CRITICAL ? 'bg-red-400 border-red-500' :
                                    'bg-brand-400 border-brand-500'
                                  }`}
                                  title={`${task.title} (${task.startDate || 'N/A'} - ${task.dueDate || 'N/A'})`}
                                >
                                  {task.title}
                                </div>
                              </div>
                           </div>
                        );
                      })}
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

// 5. Team List View
const TeamList = ({ users, permissions }: { users: User[], permissions: RolePermissions }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800">فريق العمل</h2>
        <p className="text-sm text-slate-500">أعضاء الفريق وصلاحياتهم</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">العضو</th>
              <th className="px-6 py-4">الدور الوظيفي</th>
              <th className="px-6 py-4">الصلاحيات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-200" alt={user.name} />
                    <span className="font-bold text-slate-700">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-bold border border-brand-100">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {permissions[user.role]?.slice(0, 3).map((perm, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                        {perm}
                      </span>
                    ))}
                    {(permissions[user.role]?.length || 0) > 3 && (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                        +{permissions[user.role].length - 3} المزيد
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 6. Settings View
const SettingsView = ({ 
  currentUser, 
  permissions,
  onUpdatePermission
}: { 
  currentUser: User; 
  permissions: RolePermissions;
  onUpdatePermission: (role: UserRole, permission: Permission, allowed: boolean) => void;
}) => {
  if (currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Lock size={64} className="mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-slate-600">غير مصرح لك بالوصول</h2>
        <p>فقط مدير النظام يمكنه تعديل الإعدادات.</p>
      </div>
    );
  }

  const roles = Object.values(UserRole);
  const allPermissions = Object.values(Permission);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn pb-10">
       <div className="p-6 border-b border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800">إعدادات الصلاحيات</h2>
        <p className="text-sm text-slate-500">إدارة صلاحيات الوصول للأدوار المختلفة</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr>
              <th className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 w-1/3">الصلاحية / الدور</th>
              {roles.map(role => (
                <th key={role} className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 text-center min-w-[100px]">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPermissions.map(permission => (
              <tr key={permission} className="hover:bg-slate-50 border-b border-slate-50 last:border-0">
                <td className="p-4 font-medium text-slate-700 text-sm">{permission}</td>
                {roles.map(role => {
                  const hasPerm = permissions[role]?.includes(permission);
                  return (
                    <td key={role} className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={hasPerm}
                        onChange={(e) => onUpdatePermission(role, permission, e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 transition-all cursor-pointer accent-brand-500"
                        disabled={role === UserRole.ADMIN} 
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);
  
  // State for Project Details View
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Lifted state for Board Project Filter
  const [selectedBoardProjectId, setSelectedBoardProjectId] = useState<string>('general');

  // State for Project Modal (Create/Edit)
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormData, setProjectFormData] = useState<Partial<Project>>({});

  // State for Task Modal (Lifted from ProjectBoard to allow access from ProjectDetailView)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isTaskEditingMode, setIsTaskEditingMode] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
  
  // Ref for Task file upload
  const taskFileInputRef = useRef<HTMLInputElement>(null);

  // Mock Data Initialization
  const [users] = useState<User[]>([
    { id: 'u1', name: 'أحمد محمد', role: UserRole.ADMIN, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
    { id: 'u2', name: 'سارة العلي', role: UserRole.PRODUCT_OWNER, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
    { id: 'u3', name: 'خالد عمر', role: UserRole.SCRUM_MASTER, avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
    { id: 'u4', name: 'ليلى حسن', role: UserRole.DEVELOPER, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
    { id: 'u5', name: 'فهد سالم', role: UserRole.DEVELOPER, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
  ]);

  const [currentUser, setCurrentUser] = useState<User>(users[0]);

  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'p1',
      name: 'تطوير البوابة التعليمية',
      description: 'إنشاء بوابة إلكترونية شاملة للطلاب والمحاضرين مع نظام تسجيل المقررات.',
      members: ['u1', 'u2', 'u4', 'u5'],
      managerId: 'u2',
      startDate: '2023-10-01',
      endDate: '2023-12-31',
      tasks: [],
      createdAt: Date.now(),
      attachments: []
    },
    {
      id: 'p2',
      name: 'رقمنة الأرشيف الإداري',
      description: 'مشروع تحويل الوثائق الورقية إلى أرشيف رقمي آمن قابل للبحث.',
      members: ['u1', 'u3', 'u5'],
      managerId: 'u3',
      startDate: '2024-01-15',
      endDate: '2024-04-15',
      tasks: [],
      createdAt: Date.now(),
      attachments: []
    }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: 't1', 
      title: 'تحليل المتطلبات الفنية', 
      description: 'دراسة احتياجات الأقسام المختلفة من النظام الجديد.', 
      status: TaskStatus.DONE, 
      priority: Priority.HIGH, 
      points: 5, 
      createdAt: Date.now(), 
      assignee: 'u4', 
      projectId: 'p1', 
      startDate: '2023-10-05',
      dueDate: '2023-10-15',
      color: '#ffffff',
      attachments: [],
      subtasks: [
        { id: 'st1', title: 'مقابلة أصحاب المصلحة', completed: true },
        { id: 'st2', title: 'كتابة وثيقة المتطلبات', completed: true }
      ]
    },
    { id: 't2', title: 'تصميم واجهة تسجيل الطلاب', description: 'تصميم الشاشات والرحلة الخاصة بتسجيل الطلاب الجدد.', status: TaskStatus.IN_PROGRESS, priority: Priority.CRITICAL, points: 8, createdAt: Date.now(), assignee: 'u5', projectId: 'p1', startDate: '2023-10-16', dueDate: '2023-10-30', color: '#fef3c7', attachments: [], subtasks: [] },
    { id: 't3', title: 'صيانة السيرفر الداخلي', description: 'تحديث أنظمة الحماية وإجراء النسخ الاحتياطي.', status: TaskStatus.TODO, priority: Priority.MEDIUM, points: 3, createdAt: Date.now(), color: '#ffffff', attachments: [], subtasks: [] }, // General Task
    { id: 't4', title: 'إعداد تقارير الأداء الفصلي', description: 'تجهيز النماذج الخاصة بتقييم الأداء.', status: TaskStatus.TODO, priority: Priority.HIGH, points: 5, createdAt: Date.now(), projectId: 'p1', dueDate: '2023-12-01', color: '#fee2e2', attachments: [], subtasks: [] },
  ]);

  // Auth Handlers
  const handleLogin = (u: string, p: string) => {
    // Check credentials (hardcoded as requested)
    if (u === 'admin' && p === 'admin') {
      setIsAuthenticated(true);
      // Ensure current user is admin
      const adminUser = users.find(user => user.role === UserRole.ADMIN);
      if (adminUser) setCurrentUser(adminUser);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('DASHBOARD');
  };

  const handleUpdateTaskStatus = (id: string, newStatus: TaskStatus) => {
    if (!hasPermission(currentUser.role, Permission.EDIT_TASK, rolePermissions)) {
      alert("ليس لديك صلاحية لتعديل المهام");
      return;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleAddTask = (newTask: Task) => {
     if (!hasPermission(currentUser.role, Permission.CREATE_TASK, rolePermissions)) {
      alert("ليس لديك صلاحية لإنشاء مهام");
      return;
    }
    setTasks(prev => [...prev, newTask]);
  };

  const handleEditTask = (updatedTask: Task) => {
    if (!hasPermission(currentUser.role, Permission.EDIT_TASK, rolePermissions)) {
      alert("ليس لديك صلاحية لتعديل المهام");
      return;
    }
    
    // Check if subtasks complete => 100% => DONE
    let finalTask = { ...updatedTask };
    if (finalTask.subtasks && finalTask.subtasks.length > 0) {
      const allCompleted = finalTask.subtasks.every(s => s.completed);
      if (allCompleted && finalTask.status !== TaskStatus.DONE) {
         finalTask.status = TaskStatus.DONE;
      }
    }

    setTasks(prev => prev.map(t => t.id === finalTask.id ? finalTask : t));
  };

  const handleDeleteTask = (taskId: string) => {
    if (!hasPermission(currentUser.role, Permission.DELETE_TASK, rolePermissions)) {
      alert("ليس لديك صلاحية لحذف المهام");
      return;
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // --- Task Modal Handlers ---
  const openNewTaskModal = (initialData?: Partial<Task>) => {
    setCurrentTask(initialData || {
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      points: 1,
      projectId: selectedBoardProjectId === 'general' ? undefined : selectedBoardProjectId,
      color: '#ffffff',
      attachments: [],
      subtasks: []
    });
    setIsTaskEditingMode(false);
    setShowTaskModal(true);
  };

  const openEditTaskModal = (task: Task) => {
    setCurrentTask({ ...task });
    setIsTaskEditingMode(true);
    setShowTaskModal(true);
  };
  
  const handleAddSubtask = (title: string) => {
    const newSubtask: Subtask = { id: `st-${Date.now()}`, title, completed: false };
    setCurrentTask(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), newSubtask] }));
  };

  const handleToggleSubtask = (id: string) => {
    setCurrentTask(prev => ({
      ...prev,
      subtasks: prev.subtasks?.map(s => s.id === id ? { ...s, completed: !s.completed } : s)
    }));
  };

  const handleDeleteSubtask = (id: string) => {
    setCurrentTask(prev => ({
      ...prev,
      subtasks: prev.subtasks?.filter(s => s.id !== id)
    }));
  };

  const handleTaskFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       const attachment = mockUploadFile(file);
       setCurrentTask(prev => ({
         ...prev,
         attachments: [...(prev.attachments || []), attachment]
       }));
     }
  };

  const handleTaskSubmit = () => {
    if(!currentTask.title?.trim()) return;

    if (isTaskEditingMode && currentTask.id) {
       handleEditTask(currentTask as Task);
    } else {
      const newTask: Task = {
        id: `man-${Date.now()}`,
        title: currentTask.title!,
        description: currentTask.description || '',
        status: currentTask.status || TaskStatus.TODO,
        priority: currentTask.priority || Priority.MEDIUM,
        points: currentTask.points || 1,
        createdAt: Date.now(),
        projectId: currentTask.projectId,
        assignee: currentTask.assignee,
        startDate: currentTask.startDate,
        dueDate: currentTask.dueDate,
        color: currentTask.color || '#ffffff',
        attachments: currentTask.attachments || [],
        subtasks: currentTask.subtasks || []
      };
      handleAddTask(newTask);
    }
    setShowTaskModal(false);
  };

  // --- Navigation Handlers ---
  const handleNavigateToBoard = (projectId: string) => {
    setSelectedBoardProjectId(projectId);
    setCurrentView('BOARD');
    setActiveProject(null); // Close detail view
  };


  // Project Handlers
  const openCreateProjectModal = () => {
    setEditingProject(null);
    setProjectFormData({ members: [currentUser.id] }); // Default current user as member
    setShowProjectModal(true);
  };

  const openEditProjectModal = (p: Project) => {
    setEditingProject(p);
    setProjectFormData({ ...p });
    setShowProjectModal(true);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    if (activeProject && activeProject.id === updatedProject.id) {
      setActiveProject(updatedProject);
    }
  };

  const handleProjectSubmit = () => {
    if (!projectFormData.name?.trim() || !projectFormData.managerId) {
      alert("الرجاء إدخال اسم المشروع واختيار المدير");
      return;
    }

    if (editingProject) {
      // Update existing
      const updatedProject: Project = {
        ...editingProject,
        ...projectFormData as Project,
        id: editingProject.id
      };
      handleUpdateProject(updatedProject);
    } else {
      // Create new
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: projectFormData.name!,
        description: projectFormData.description || '',
        managerId: projectFormData.managerId!,
        startDate: projectFormData.startDate || new Date().toISOString().split('T')[0],
        endDate: projectFormData.endDate || '',
        members: projectFormData.members || [],
        tasks: [],
        createdAt: Date.now(),
        attachments: []
      };
      setProjects(prev => [...prev, newProject]);
    }
    setShowProjectModal(false);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId)); // Cascade delete
  };

  const handleUpdatePermission = (role: UserRole, permission: Permission, allowed: boolean) => {
    setRolePermissions(prev => {
      const rolePerms = prev[role];
      if (allowed) {
        return { ...prev, [role]: [...rolePerms, permission] };
      } else {
        return { ...prev, [role]: rolePerms.filter(p => p !== permission) };
      }
    });
  };

  const toggleProjectMember = (userId: string) => {
    setProjectFormData(prev => {
      const currentMembers = prev.members || [];
      if (currentMembers.includes(userId)) {
        return { ...prev, members: currentMembers.filter(id => id !== userId) };
      } else {
        return { ...prev, members: [...currentMembers, userId] };
      }
    });
  };

  // Determine users available for assignment in modal
  const assignableUsers = currentTask.projectId 
    ? users.filter(u => projects.find(p => p.id === currentTask.projectId)?.members.includes(u.id))
    : users;

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#fcfbf9] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar Area */}
      <Sidebar 
        currentView={currentView} 
        setView={(view) => {
          setCurrentView(view);
          setActiveProject(null); // Reset detail view on navigation
        }} 
        currentUser={currentUser}
        isMobileOpen={isMobileMenuOpen}
        toggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 h-20 flex items-center justify-between px-8 z-10 shadow-sm print:hidden">
          <div className="flex items-center gap-4">
             <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-slate-500 hover:text-brand-600"
            >
              <Menu size={24} />
            </button>
            <div className="relative hidden md:block w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="بحث في النظام..." 
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl py-2.5 pr-12 pl-4 text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder-slate-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors">
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              <Bell size={22} />
            </button>
            
            <div className="h-8 w-[1px] bg-slate-200"></div>

            <div className="flex items-center gap-3">
               <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-slate-700">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.role}</p>
              </div>
              <img 
                src={currentUser.avatar} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border border-slate-200 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {currentView === 'DASHBOARD' && (
            <Dashboard projects={projects} tasks={tasks} />
          )}
          
          {currentView === 'PROJECTS' && !activeProject && (
            <ProjectsView 
              projects={projects} 
              users={users}
              tasks={tasks}
              canCreateProject={hasPermission(currentUser.role, Permission.CREATE_PROJECT, rolePermissions)}
              canEditProject={hasPermission(currentUser.role, Permission.EDIT_PROJECT, rolePermissions)}
              canDeleteProject={hasPermission(currentUser.role, Permission.DELETE_PROJECT, rolePermissions)}
              onDeleteProject={handleDeleteProject}
              onProjectClick={setActiveProject}
              onOpenCreateProject={openCreateProjectModal}
              onOpenEditProject={openEditProjectModal}
            />
          )}

          {currentView === 'PROJECTS' && activeProject && (
            <ProjectDetailView 
              project={activeProject}
              tasks={tasks}
              users={users}
              onBack={() => setActiveProject(null)}
              onOpenEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onNavigateToBoard={handleNavigateToBoard}
              onUpdateProject={handleUpdateProject}
            />
          )}

          {currentView === 'BOARD' && (
            <ProjectBoard 
              tasks={tasks}
              projects={projects}
              selectedProjectId={selectedBoardProjectId}
              onSelectedProjectChange={setSelectedBoardProjectId}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onAddTask={handleAddTask}
              onEditTask={openNewTaskModal} // Used for 'New Task' button
              onDeleteTask={handleDeleteTask}
              currentUser={currentUser}
              users={users}
              permissions={rolePermissions}
            />
          )}

          {currentView === 'TEAM' && (
            <TeamList users={users} permissions={rolePermissions} />
          )}

          {currentView === 'REPORTS' && (
            <ReportsView tasks={tasks} projects={projects} users={users} />
          )}

          {currentView === 'SETTINGS' && (
            <SettingsView 
              currentUser={currentUser} 
              permissions={rolePermissions}
              onUpdatePermission={handleUpdatePermission}
            />
          )}
        </main>
      </div>

      {/* Task Modal (Add/Edit) */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-slate-800 pb-4 border-b border-slate-100">
               {isTaskEditingMode ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
            </h3>
            <div className="space-y-5">
               <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">عنوان المهمة</label>
                  <input
                    type="text"
                    value={currentTask.title || ''}
                    onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none bg-slate-50"
                    placeholder="مثال: مراجعة التقارير الشهرية"
                  />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">الوصف</label>
                    <textarea
                      value={currentTask.description || ''}
                      onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-brand-500 outline-none h-32 resize-none bg-slate-50"
                      placeholder="تفاصيل المهمة..."
                    />
                    
                    {/* Attachments for Task */}
                    <div className="mt-4">
                       <label className="block text-sm font-bold text-slate-600 mb-2 flex justify-between">
                         <span>المرفقات</span>
                         <button onClick={() => taskFileInputRef.current?.click()} className="text-xs text-brand-600 hover:underline flex items-center gap-1"><Upload size={12}/> رفع ملف</button>
                       </label>
                       <input type="file" className="hidden" ref={taskFileInputRef} onChange={handleTaskFileUpload} />
                       
                       <div className="space-y-2">
                          {currentTask.attachments && currentTask.attachments.length > 0 ? (
                            currentTask.attachments.map(att => (
                              <div key={att.id} className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                <Paperclip size={12} className="text-slate-400"/>
                                <span className="truncate flex-1">{att.name}</span>
                              </div>
                            ))
                          ) : <p className="text-xs text-slate-400 italic">لا توجد مرفقات</p>}
                       </div>
                    </div>
                  </div>

                  {/* Subtasks Section */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <label className="block text-sm font-bold text-slate-600 mb-2">خطوات التنفيذ (Subtasks)</label>
                      <div className="flex gap-2 mb-3">
                         <input 
                           type="text" 
                           id="new-subtask"
                           placeholder="أضف خطوة جديدة..."
                           className="flex-1 text-sm p-2 rounded border border-slate-200 outline-none focus:border-brand-500"
                           onKeyDown={(e) => {
                             if(e.key === 'Enter') {
                               handleAddSubtask((e.target as HTMLInputElement).value);
                               (e.target as HTMLInputElement).value = '';
                             }
                           }}
                         />
                         <button 
                           onClick={() => {
                             const input = document.getElementById('new-subtask') as HTMLInputElement;
                             if(input.value) {
                               handleAddSubtask(input.value);
                               input.value = '';
                             }
                           }}
                           className="bg-brand-500 text-white p-2 rounded hover:bg-brand-600"
                         >
                           <Plus size={16}/>
                         </button>
                      </div>
                      
                      <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                         {currentTask.subtasks && currentTask.subtasks.map(st => (
                           <div key={st.id} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-100">
                              <input 
                                type="checkbox" 
                                checked={st.completed} 
                                onChange={() => handleToggleSubtask(st.id)}
                                className="rounded text-brand-600 focus:ring-brand-500"
                              />
                              <span className={`text-sm flex-1 ${st.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{st.title}</span>
                              <button onClick={() => handleDeleteSubtask(st.id)} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                           </div>
                         ))}
                         {(!currentTask.subtasks || currentTask.subtasks.length === 0) && (
                           <p className="text-xs text-center text-slate-400 py-2">لا توجد خطوات مضافة</p>
                         )}
                      </div>
                      <div className="mt-2 text-xs text-slate-500 text-center">
                         اكتمال الخطوات يعني إنجاز المهمة 100%
                      </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-5">
                 <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">الأولوية</label>
                    <select
                      value={currentTask.priority}
                      onChange={(e) => setCurrentTask({...currentTask, priority: e.target.value as Priority})}
                      className="w-full border border-slate-200 rounded-lg p-3 bg-white focus:ring-1 focus:ring-brand-500 outline-none"
                    >
                      {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">نقاط الجهد</label>
                    <input
                      type="number"
                      value={currentTask.points}
                      onChange={(e) => setCurrentTask({...currentTask, points: parseInt(e.target.value) || 0})}
                      className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 focus:ring-1 focus:ring-brand-500 outline-none"
                    />
                 </div>
               </div>

               <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">المشروع التابع له</label>
                  <select
                    value={currentTask.projectId || 'general'}
                    onChange={(e) => setCurrentTask({...currentTask, projectId: e.target.value === 'general' ? undefined : e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-3 bg-white focus:ring-1 focus:ring-brand-500 outline-none"
                  >
                    <option value="general">مهام عامة (بدون مشروع)</option>
                    {projects.map(p => (
                       <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">تاريخ البدء</label>
                    <input 
                      type="date" 
                      value={currentTask.startDate || ''}
                      onChange={(e) => setCurrentTask({...currentTask, startDate: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">تاريخ الاستحقاق</label>
                    <input 
                      type="date" 
                      value={currentTask.dueDate || ''}
                      onChange={(e) => setCurrentTask({...currentTask, dueDate: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                    />
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-slate-600 mb-2">الموظف المسؤول</label>
                 <select
                    value={currentTask.assignee || ''}
                    onChange={(e) => setCurrentTask({...currentTask, assignee: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-3 bg-white focus:ring-1 focus:ring-brand-500 outline-none"
                 >
                   <option value="">غير معين</option>
                   {assignableUsers.map(u => (
                     <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                   ))}
                 </select>
               </div>
               
               <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">لون البطاقة</label>
                  <div className="flex gap-3">
                     {['#ffffff', '#fee2e2', '#fef3c7', '#dcfce7', '#dbeafe', '#f3e8ff'].map(color => (
                        <button
                          key={color}
                          onClick={() => setCurrentTask({...currentTask, color})}
                          className={`w-8 h-8 rounded-full border border-slate-200 shadow-sm hover:scale-110 transition-transform ${currentTask.color === color ? 'ring-2 ring-brand-400 ring-offset-2' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                     ))}
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              <button onClick={() => setShowTaskModal(false)} className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-medium">إلغاء</button>
              <button onClick={handleTaskSubmit} className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-bold shadow-md">حفظ</button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-slate-800 pb-4 border-b border-slate-100">
               {editingProject ? 'تعديل بيانات المشروع' : 'إنشاء مشروع جديد'}
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">اسم المشروع</label>
                <input
                  type="text"
                  value={projectFormData.name || ''}
                  onChange={(e) => setProjectFormData({...projectFormData, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-brand-500 outline-none bg-slate-50"
                  placeholder="أدخل اسم المشروع"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">وصف المشروع</label>
                <textarea
                  value={projectFormData.description || ''}
                  onChange={(e) => setProjectFormData({...projectFormData, description: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-3 focus:ring-1 focus:ring-brand-500 outline-none h-24 resize-none bg-slate-50"
                  placeholder="وصف مختصر للمشروع وأهدافه..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">تاريخ البدء</label>
                  <input 
                    type="date" 
                    value={projectFormData.startDate || ''}
                    onChange={(e) => setProjectFormData({...projectFormData, startDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">تاريخ الانتهاء</label>
                  <input 
                    type="date" 
                    value={projectFormData.endDate || ''}
                    onChange={(e) => setProjectFormData({...projectFormData, endDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">مدير المشروع</label>
                <select
                  value={projectFormData.managerId || ''}
                  onChange={(e) => setProjectFormData({...projectFormData, managerId: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-3 bg-white outline-none"
                >
                  <option value="">اختر مديراً...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                 <label className="block text-sm font-bold text-slate-600 mb-3">أعضاء الفريق</label>
                 <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors" onClick={() => toggleProjectMember(user.id)}>
                         <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${projectFormData.members?.includes(user.id) ? 'bg-brand-500 border-brand-500' : 'border-slate-300 bg-white'}`}>
                            {projectFormData.members?.includes(user.id) && <CheckCircle2 size={12} className="text-white"/>}
                         </div>
                         <img src={user.avatar} className="w-6 h-6 rounded-full" alt="" />
                         <span className="text-sm text-slate-700">{user.name}</span>
                      </div>
                    ))}
                 </div>
              </div>

            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              <button onClick={() => setShowProjectModal(false)} className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-medium">إلغاء</button>
              <button onClick={handleProjectSubmit} className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-bold shadow-md">حفظ البيانات</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}