import { supabase } from "./supabase";
import { Client, Service, Reminder, DashboardStats } from "../types";

export const api = {
  // Stats
  getStats: async (): Promise<DashboardStats> => {
    const { data: clients } = await supabase.from('clients').select('*');
    const { data: services } = await supabase.from('services').select('*, clients(name)');
    const { data: reminders } = await supabase.from('reminders').select('*, clients(name)').eq('completed', 0);

    const totalClients = clients?.length || 0;
    const completedServices = services?.filter(s => s.status === 'completed') || [];
    const totalRevenue = completedServices.reduce((sum, s) => sum + s.value, 0);
    const activeReminders = reminders?.length || 0;
    const pendingServices = services?.filter(s => s.status === 'pending').length || 0;

    // Recent services with client names
    const recentServices = (services || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map(s => ({
        ...s,
        client_name: s.clients?.name
      }));

    // Recent clients
    const recentClients = (clients || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Monthly revenue (last 6 months)
    const monthlyRevenue: { month: string; total: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toISOString().substring(0, 7); // YYYY-MM
      const total = completedServices
        .filter(s => s.date.startsWith(monthStr))
        .reduce((sum, s) => sum + s.value, 0);
      monthlyRevenue.push({ month: monthStr, total });
    }

    return {
      totalClients,
      totalRevenue,
      activeReminders,
      pendingServices,
      recentServices,
      monthlyRevenue,
      recentClients
    };
  },

  // Clients
  getClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  getClient: async (id: number): Promise<Client & { services: Service[]; reminders: Reminder[] }> => {
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    if (clientError) throw clientError;

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('client_id', id)
      .order('date', { ascending: false });

    const { data: reminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('client_id', id)
      .eq('completed', 0)
      .order('due_date', { ascending: true });

    return { 
      ...client, 
      services: services || [], 
      reminders: reminders || [] 
    };
  },

  createClient: async (client: Partial<Client>): Promise<{ id: number }> => {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();
    if (error) throw error;
    return { id: data.id };
  },

  deleteClient: async (id: number): Promise<void> => {
    // Cascading deletes should be handled by Supabase FK constraints or manually
    await supabase.from('reminders').delete().eq('client_id', id);
    await supabase.from('services').delete().eq('client_id', id);
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  // Services
  getServices: async (): Promise<Service[]> => {
    const { data, error } = await supabase
      .from('services')
      .select('*, clients(name)')
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      client_name: s.clients?.name
    }));
  },

  createService: async (service: Partial<Service>): Promise<{ id: number }> => {
    const { data, error } = await supabase
      .from('services')
      .insert([service])
      .select()
      .single();
    if (error) throw error;
    return { id: data.id };
  },

  updateService: async (id: number, data: { status: string; completion_date?: string | null }): Promise<void> => {
    const { error } = await supabase
      .from('services')
      .update(data)
      .eq('id', id);
    if (error) throw error;
  },

  // Reminders
  getReminders: async (): Promise<Reminder[]> => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*, clients(name)')
      .eq('completed', 0)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      client_name: r.clients?.name
    }));
  },

  createReminder: async (reminder: Partial<Reminder>): Promise<{ id: number }> => {
    const { data, error } = await supabase
      .from('reminders')
      .insert([reminder])
      .select()
      .single();
    if (error) throw error;
    return { id: data.id };
  },

  completeReminder: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('reminders')
      .update({ completed: 1 })
      .eq('id', id);
    if (error) throw error;
  },
};
