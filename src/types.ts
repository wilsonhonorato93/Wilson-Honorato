export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at: string;
}

export interface Service {
  id: number;
  client_id: number;
  client_name?: string;
  description: string;
  value: number;
  date: string;
  status: string;
  completion_date?: string;
}

export interface Reminder {
  id: number;
  client_id: number;
  client_name?: string;
  message: string;
  due_date: string;
  completed: number;
}

export interface DashboardStats {
  totalClients: number;
  totalRevenue: number;
  activeReminders: number;
  pendingServices: number;
  recentServices: Service[];
  monthlyRevenue: { month: string; total: number }[];
  recentClients: Client[];
}
