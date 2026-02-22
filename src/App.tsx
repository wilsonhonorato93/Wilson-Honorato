import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Calendar, 
  DollarSign, 
  History, 
  Bell, 
  ChevronRight, 
  Trash2, 
  CheckCircle2,
  LayoutDashboard,
  Search,
  Phone,
  Mail,
  FileText,
  X,
  TrendingUp,
  ArrowUpRight,
  Clock,
  UserPlus,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";
import { api } from "./services/api";
import { Client, Service, Reminder, DashboardStats } from "./types";

type View = "dashboard" | "clients" | "services" | "reminders" | "ai";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [clientDetail, setClientDetail] = useState<(Client & { services: Service[]; reminders: Reminder[] }) | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [s, c, sv, r] = await Promise.all([
        api.getStats(),
        api.getClients(),
        api.getServices(),
        api.getReminders()
      ]);
      setStats(s);
      setClients(c);
      setServices(sv);
      setReminders(r);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      api.getClient(selectedClient).then(setClientDetail);
    } else {
      setClientDetail(null);
    }
  }, [selectedClient]);

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    await api.createClient(data);
    setIsClientModalOpen(false);
    fetchData();
  };

  const handleCreateService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    await api.createService({
      ...data,
      client_id: Number(data.client_id),
      value: Number(data.value)
    });
    setIsServiceModalOpen(false);
    fetchData();
    if (selectedClient) api.getClient(selectedClient).then(setClientDetail);
  };

  const handleCreateReminder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    await api.createReminder({
      ...data,
      client_id: Number(data.client_id)
    });
    setIsReminderModalOpen(false);
    fetchData();
    if (selectedClient) api.getClient(selectedClient).then(setClientDetail);
  };

  const handleCompleteReminder = async (id: number) => {
    await api.completeReminder(id);
    fetchData();
    if (selectedClient) api.getClient(selectedClient).then(setClientDetail);
  };

  const handleUpdateService = async (id: number, status: string, completion_date?: string | null) => {
    await api.updateService(id, { status, completion_date });
    fetchData();
    if (selectedClient) api.getClient(selectedClient).then(setClientDetail);
  };

  const handleDeleteClient = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este cliente? Todos os dados vinculados serão perdidos.")) {
      await api.deleteClient(id);
      setSelectedClient(null);
      fetchData();
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;

    const userMessage = aiInput.trim();
    setAiInput("");
    setAiMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsAiLoading(true);

    try {
      const { chatWithAI } = await import("./services/geminiService");
      const context = {
        stats,
        clientsCount: clients.length,
        servicesCount: services.length,
        pendingReminders: reminders.length,
        recentServices: stats?.recentServices.slice(0, 5)
      };
      
      const response = await chatWithAI(userMessage, context);
      setAiMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'ai', text: "Erro ao conectar com a IA." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
            <Briefcase className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-none">
              SoloBiz
            </h1>
            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mt-1">Gestão Inteligente</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={view === "dashboard"} 
            onClick={() => setView("dashboard")} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Clientes" 
            active={view === "clients"} 
            onClick={() => setView("clients")} 
          />
          <SidebarItem 
            icon={<Briefcase size={20} />} 
            label="Serviços" 
            active={view === "services"} 
            onClick={() => setView("services")} 
          />
          <SidebarItem 
            icon={<Bell size={20} />} 
            label="Lembretes" 
            active={view === "reminders"} 
            onClick={() => setView("reminders")} 
          />
          <SidebarItem 
            icon={<TrendingUp size={20} />} 
            label="Assistente IA" 
            active={view === "ai"} 
            onClick={() => setView("ai")} 
          />
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100/50">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Premium</p>
            <p className="text-sm text-indigo-900 font-medium mb-3">Desbloqueie todas as funções</p>
            <button className="w-full bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-30">
          <h2 className="text-lg font-bold text-slate-800 capitalize">{view}</h2>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 w-64 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">Alex Silva</p>
                <p className="text-xs text-slate-400">Autônomo</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {view === "dashboard" && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-7xl mx-auto"
              >
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard 
                    icon={<Users size={20} />} 
                    label="Total de Clientes" 
                    value={stats?.totalClients || 0} 
                    trend="+2"
                    color="blue"
                  />
                  <StatCard 
                    icon={<DollarSign size={20} />} 
                    label="Ganhos Totais" 
                    value={`R$ ${(stats?.totalRevenue || 0).toLocaleString('pt-BR')}`} 
                    trend="Mensal"
                    color="emerald"
                  />
                  <StatCard 
                    icon={<Clock size={20} />} 
                    label="Serviços Pendentes" 
                    value={stats?.pendingServices || 0} 
                    trend="Atenção"
                    color="orange"
                  />
                  <StatCard 
                    icon={<CheckCircle2 size={20} />} 
                    label="Serviços Concluídos" 
                    value={services.filter(s => s.status === 'completed').length} 
                    trend="Total"
                    color="emerald"
                  />
                  <StatCard 
                    icon={<Bell size={20} />} 
                    label="Lembretes Ativos" 
                    value={stats?.activeReminders || 0} 
                    trend="Hoje"
                    color="purple"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Chart Section */}
                  <section className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Desempenho Financeiro</h3>
                        <p className="text-sm text-slate-400">Ganhos mensais no último semestre</p>
                      </div>
                      <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20">
                        <option>Últimos 6 meses</option>
                        <option>Último ano</option>
                      </select>
                    </div>
                    
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.monthlyRevenue || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                            dy={15}
                            tickFormatter={(value) => {
                              const [year, month] = value.split('-');
                              const date = new Date(parseInt(year), parseInt(month) - 1);
                              return date.toLocaleDateString('pt-BR', { month: 'short' });
                            }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                            dx={-10}
                            tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            itemStyle={{ fontWeight: 'bold', color: '#6366f1' }}
                            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#6366f1" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* Recent Activity Section */}
                  <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Atividades Recentes</h3>
                    <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                      {stats?.recentServices.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                          <Clock size={48} strokeWidth={1} />
                          <p className="text-sm font-medium">Nenhuma atividade recente.</p>
                        </div>
                      ) : (
                        stats?.recentServices.slice(0, 8).map((activity, i) => (
                          <div key={i} className="flex gap-4 group">
                            <div className="relative">
                              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <History size={18} />
                              </div>
                              {i !== (stats?.recentServices.slice(0, 8).length - 1) && (
                                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-6 bg-slate-100"></div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{activity.description}</p>
                              <p className="text-xs text-slate-400">{activity.client_name} • {new Date(activity.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button 
                      onClick={() => setView("services")}
                      className="mt-8 w-full py-3 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Ver todas atividades
                    </button>
                  </section>
                </div>
              </motion.div>
            )}

          {view === "clients" && (
            <motion.div 
              key="clients"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 max-w-7xl mx-auto"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Seus Clientes</h2>
                  <p className="text-sm text-slate-400">Gerencie sua base de contatos e histórico.</p>
                </div>
                <button 
                  onClick={() => setIsClientModalOpen(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold"
                >
                  <Plus size={18} />
                  Novo Cliente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(client => (
                  <div 
                    key={client.id} 
                    onClick={() => setSelectedClient(client.id)}
                    className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black">
                        {client.name[0].toUpperCase()}
                      </div>
                      <div className="p-2 bg-slate-50 text-slate-300 rounded-xl group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{client.name}</h3>
                    <div className="space-y-2">
                      {client.phone && (
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                          <Phone size={14} className="text-slate-300" /> {client.phone}
                        </p>
                      )}
                      {client.email && (
                        <p className="text-sm text-slate-400 flex items-center gap-2">
                          <Mail size={14} className="text-slate-300" /> {client.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {clients.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                    <Users size={48} className="mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-400 font-medium">Nenhum cliente cadastrado ainda.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === "services" && (
            <motion.div 
              key="services"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 max-w-7xl mx-auto"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Histórico de Serviços</h2>
                  <p className="text-sm text-slate-400">Acompanhe todos os serviços realizados e valores.</p>
                </div>
                <button 
                  onClick={() => setIsServiceModalOpen(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold"
                >
                  <Plus size={18} />
                  Registrar Serviço
                </button>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Data Solicitação</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Descrição</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Data Realização</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {services.map(service => (
                      <tr key={service.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5 text-sm font-medium text-slate-500">
                          {new Date(service.date).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-800">
                          {service.client_name}
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-500">
                          {service.description}
                        </td>
                        <td className="px-8 py-5 text-sm font-black text-indigo-600">
                          R$ {service.value.toFixed(2)}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <select 
                              value={service.status}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                const newDate = newStatus === 'completed' && !service.completion_date 
                                  ? new Date().toISOString().split('T')[0] 
                                  : service.completion_date;
                                handleUpdateService(service.id, newStatus, newDate);
                              }}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider outline-none border-none cursor-pointer ${
                                service.status === 'completed' 
                                  ? 'bg-emerald-50 text-emerald-600' 
                                  : 'bg-orange-50 text-orange-600'
                              }`}
                            >
                              <option value="pending">Pendente</option>
                              <option value="completed">Concluído</option>
                            </select>
                            {service.status !== 'completed' && (
                              <button 
                                onClick={() => handleUpdateService(service.id, 'completed', new Date().toISOString().split('T')[0])}
                                className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all shadow-sm"
                                title="Concluir Serviço"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <input 
                            type="date"
                            value={service.completion_date ? service.completion_date.split('T')[0] : ""}
                            onChange={(e) => handleUpdateService(service.id, service.status, e.target.value)}
                            className="bg-transparent border-none text-sm text-slate-500 outline-none focus:ring-0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {services.length === 0 && (
                  <div className="p-20 text-center text-slate-300 italic">Nenhum serviço registrado.</div>
                )}
              </div>
            </motion.div>
          )}

          {view === "reminders" && (
            <motion.div 
              key="reminders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 max-w-7xl mx-auto"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Lembretes Pendentes</h2>
                  <p className="text-sm text-slate-400">Não perca prazos importantes com seus clientes.</p>
                </div>
                <button 
                  onClick={() => setIsReminderModalOpen(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold"
                >
                  <Plus size={18} />
                  Novo Lembrete
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reminders.map(reminder => (
                  <div key={reminder.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-start justify-between group hover:shadow-xl transition-all">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                          <Calendar size={16} />
                        </div>
                        <span className="text-xs font-black text-orange-500 uppercase tracking-widest">
                          {new Date(reminder.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-800 mb-1">{reminder.message}</p>
                        <p className="text-sm text-slate-400">Cliente: <span className="font-bold text-slate-600">{reminder.client_name}</span></p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCompleteReminder(reminder.id)}
                      className="p-4 text-slate-200 hover:text-emerald-500 hover:bg-emerald-50 rounded-2xl transition-all"
                    >
                      <CheckCircle2 size={32} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
                {reminders.length === 0 && (
                  <div className="col-span-full p-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-300">
                    <Bell size={64} strokeWidth={1} className="mx-auto mb-6 opacity-20" />
                    <p className="font-medium">Tudo em dia! Nenhum lembrete pendente.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === "ai" && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 max-w-7xl mx-auto h-full flex flex-col"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Assistente SoloBiz</h2>
                  <p className="text-sm text-slate-400">Inteligência artificial para ajudar na gestão do seu negócio.</p>
                </div>
              </div>

              <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <div className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
                      <TrendingUp size={20} />
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl rounded-tl-none max-w-[80%]">
                      <p className="text-slate-800 leading-relaxed">
                        Olá! Eu sou seu assistente SoloBiz. Posso ajudar você a analisar seu faturamento, sugerir lembretes ou tirar dúvidas sobre seus clientes. Como posso ajudar hoje?
                      </p>
                    </div>
                  </div>

                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
                        {msg.role === 'user' ? <Users size={20} /> : <TrendingUp size={20} />}
                      </div>
                      <div className={`p-6 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none'}`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}

                  {isAiLoading && (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 animate-pulse">
                        <TrendingUp size={20} />
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-50 bg-slate-50/30">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Pergunte algo para a IA..." 
                      className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 pr-16 text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={isAiLoading || !aiInput.trim()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Client Detail Sidebar */}
      <AnimatePresence>
        {selectedClient && clientDetail && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-40 flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Detalhes do Cliente</h3>
              <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold">
                    {clientDetail.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">{clientDetail.name}</h4>
                    <p className="text-sm text-gray-500">Cliente desde {new Date(clientDetail.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone size={18} />
                    <span>{clientDetail.phone || "Não informado"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail size={18} />
                    <span>{clientDetail.email || "Não informado"}</span>
                  </div>
                  <div className="flex items-start gap-3 text-gray-600">
                    <FileText size={18} className="mt-1" />
                    <p className="text-sm">{clientDetail.notes || "Sem observações."}</p>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                    <History size={18} className="text-indigo-600" />
                    Histórico de Serviços
                  </h5>
                  <button 
                    onClick={() => setIsServiceModalOpen(true)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="space-y-3">
                  {clientDetail.services.map(s => (
                    <div key={s.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">{new Date(s.date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase ${s.status === 'completed' ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {s.status === 'completed' ? 'Concluído' : 'Pendente'}
                          </span>
                          <span className="text-xs font-bold text-indigo-600">R$ {s.value.toFixed(2)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-800">{s.description}</p>
                    </div>
                  ))}
                  {clientDetail.services.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Nenhum serviço registrado.</p>
                  )}
                </div>
              </section>

              <section>
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Bell size={18} className="text-orange-500" />
                    Lembretes
                  </h5>
                  <button 
                    onClick={() => setIsReminderModalOpen(true)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="space-y-3">
                  {clientDetail.reminders.map(r => (
                    <div key={r.id} className="p-3 bg-orange-50 rounded-lg border border-orange-100 flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                          {new Date(r.due_date).toLocaleDateString()}
                        </span>
                        <p className="text-sm text-gray-800">{r.message}</p>
                      </div>
                      <button 
                        onClick={() => handleCompleteReminder(r.id)}
                        className="text-orange-400 hover:text-emerald-600"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </div>
                  ))}
                  {clientDetail.reminders.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Sem lembretes pendentes.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-gray-100">
              <button 
                onClick={() => handleDeleteClient(clientDetail.id)}
                className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
                Excluir Cliente
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title="Novo Cliente">
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input name="name" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: João Silva" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input name="email" type="email" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="joao@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input name="phone" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="(11) 99999-9999" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea name="notes" rows={3} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Detalhes adicionais sobre o cliente..." />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
            Cadastrar Cliente
          </button>
        </form>
      </Modal>

      <Modal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} title="Registrar Serviço">
        <form onSubmit={handleCreateService} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select name="client_id" required defaultValue={selectedClient || ""} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="" disabled>Selecione um cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Serviço</label>
            <input name="description" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Consultoria Mensal" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input name="value" type="number" step="0.01" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0,00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="pending">Pendente</option>
                <option value="completed">Concluído</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Solicitação</label>
              <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Realização</label>
              <input name="completion_date" type="date" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
            Salvar Serviço
          </button>
        </form>
      </Modal>

      <Modal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} title="Novo Lembrete">
        <form onSubmit={handleCreateReminder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select name="client_id" required defaultValue={selectedClient || ""} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="" disabled>Selecione um cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
            <input name="message" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Retornar contato para fechamento" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Limite</label>
            <input name="due_date" type="date" required className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
            Criar Lembrete
          </button>
        </form>
      </Modal>
    </div>
  </div>
);
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-6 py-3.5 rounded-2xl transition-all group ${
        active 
          ? "bg-indigo-50 text-indigo-600 font-bold shadow-sm shadow-indigo-50/50" 
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
      }`}
    >
      <span className={`${active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} transition-colors`}>
        {icon}
      </span>
      <span className="text-sm tracking-tight">{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, trend, color }: { icon: React.ReactNode, label: string, value: string | number, trend: string, color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    emerald: "text-emerald-600 bg-emerald-50",
    orange: "text-orange-600 bg-orange-50",
    purple: "text-purple-600 bg-purple-50"
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">
          <ArrowUpRight size={10} />
          {trend}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
