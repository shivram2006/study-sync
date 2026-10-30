import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  Tag,
  Check,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { PwaInstallBanner } from '../components/pwa/PwaInstallBanner';
import { IosInstallModal } from '../components/pwa/IosInstallModal';
import { usePWA } from '../hooks/usePWA';
import { useAuth } from '../context/AuthContext';
import { requestNotificationPermission } from '../utils/notificationSound';

const INITIAL_TASKS = [
  {
    id: '1',
    title: 'Review weekly goals and priorities',
    completed: false,
    priority: 'high',
    category: 'Focus',
    dueDate: 'Today'
  },
  {
    id: '2',
    title: 'Read chapter 3 of Mindful Living',
    completed: true,
    priority: 'medium',
    category: 'Personal',
    dueDate: 'Today'
  },
  {
    id: '3',
    title: 'Plan weekend nature walk & fresh coffee',
    completed: false,
    priority: 'low',
    category: 'Wellness',
    dueDate: 'Tomorrow'
  }
];

export const TodoPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isInstalled, isIos, showIosGuide, setShowIosGuide, triggerInstall } = usePWA();

  // Local state persisted in localStorage
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('zenith_todos');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [inputTitle, setInputTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [filter, setFilter] = useState('all'); // all | pending | completed
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [secretTriggerActive, setSecretTriggerActive] = useState(false);

  // Sync tasks to localStorage
  useEffect(() => {
    localStorage.setItem('zenith_todos', JSON.stringify(tasks));
  }, [tasks]);

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  // Handle Add Task & Secret Code 2006 Trigger
  const handleAddTask = (e) => {
    e?.preventDefault();
    const cleanTitle = inputTitle.trim();

    if (!cleanTitle) return;

    // SECRET TRIGGER CHECK: Exactly '2006'
    if (cleanTitle === '2006') {
      setInputTitle('');
      setSecretTriggerActive(true);

      // Unlock sanctuary in this browser session
      sessionStorage.setItem('zenith_sanctuary_unlocked', 'true');

      // Request notification permission for disguised task updates
      requestNotificationPermission().catch(() => {});

      // Trigger elegant romantic confetti & smooth transition
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#fb7185', '#fda4af', '#fff1f2']
      });

      setTimeout(() => {
        // If already logged in, bypass login screen directly to private chat!
        if (isAuthenticated) {
          navigate('/private-chat');
        } else {
          navigate('/login');
        }
      }, 700);
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title: cleanTitle,
      completed: false,
      priority,
      category: 'General',
      dueDate: 'Today'
    };

    setTasks([newTask, ...tasks]);
    setInputTitle('');
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          const nextState = !t.completed;
          if (nextState) {
            confetti({
              particleCount: 25,
              spread: 45,
              origin: { y: 0.75 },
              colors: ['#4ade80', '#22c55e', '#16a34a']
            });
          }
          return { ...t, completed: nextState };
        }
        return t;
      })
    );
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = (id) => {
    if (!editTitle.trim()) return;
    setTasks(tasks.map((t) => (t.id === id ? { ...t, title: editTitle.trim() } : t)));
    setEditingId(null);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col font-sans-clean antialiased selection:bg-stone-300">
      {/* PWA Install Banner */}
      <PwaInstallBanner isInstalled={isInstalled} onInstall={triggerInstall} />

      {/* iOS Install Modal */}
      <IosInstallModal isOpen={showIosGuide} onClose={() => setShowIosGuide(false)} />

      {/* Secret Transition Overlay */}
      <AnimatePresence>
        {secretTriggerActive && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 bg-rose-50/80 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mb-4 shadow-lg shadow-rose-200"
            >
              <Sparkles size={30} className="animate-pulse" />
            </motion.div>
            <h2 className="text-2xl font-serif-romantic text-stone-900 mb-1">
              Opening Our Sanctuary...
            </h2>
            <p className="text-xs text-rose-600/80 tracking-wide uppercase font-medium">
              A private space just for us
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-16">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                  Zenith Harmony
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif-romantic font-semibold text-stone-900 tracking-tight mt-0.5">
                Daily Focus & Rhythm
              </h1>
            </div>

            {/* Profile Avatar / Neutral App Icon */}
            <div className="w-10 h-10 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-center text-stone-700">
              <Calendar size={18} className="text-stone-600" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-200/60 pb-3">
            <span className="font-medium text-stone-600">{todayFormatted}</span>
            <span className="italic text-stone-400">
              "Quiet progress, one deliberate step at a time."
            </span>
          </div>
        </header>

        {/* Task Input Form */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-stone-200/80 mb-6 transition-all focus-within:border-stone-400 focus-within:shadow-md">
          <form onSubmit={handleAddTask} className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="What would you like to achieve today?"
                className="flex-1 bg-transparent border-none outline-none text-stone-800 placeholder-stone-400 text-sm sm:text-base font-normal px-1 py-1"
              />
              <button
                type="submit"
                disabled={!inputTitle.trim()}
                aria-label="Add task"
                className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-800 active:scale-95 transition-all cursor-pointer shrink-0 shadow-xs"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
              <div className="flex items-center gap-1 text-stone-400">
                <Tag size={13} />
                <span>Priority:</span>
              </div>
              <div className="flex items-center gap-1.5">
                {['low', 'medium', 'high'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2.5 py-0.5 rounded-full capitalize text-xs transition-colors cursor-pointer ${
                      priority === p
                        ? p === 'high'
                          ? 'bg-rose-100 text-rose-700 font-semibold'
                          : p === 'medium'
                          ? 'bg-amber-100 text-amber-800 font-semibold'
                          : 'bg-emerald-100 text-emerald-800 font-semibold'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Filters & Stats Bar */}
        <div className="flex items-center justify-between mb-4 text-xs">
          <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl">
            {['all', 'pending', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <span className="text-stone-400 text-xs font-medium">
            {pendingCount} remaining • {completedCount} done
          </span>
        </div>

        {/* Task List */}
        <div className="space-y-2.5">
          <AnimatePresence>
            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center bg-white/60 rounded-2xl border border-dashed border-stone-200"
              >
                <p className="text-stone-400 text-sm">No tasks in this view.</p>
                <p className="text-stone-400 text-xs mt-1">Enjoy your mindful, quiet moment.</p>
              </motion.div>
            ) : (
              filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    task.completed
                      ? 'bg-stone-50/70 border-stone-200/60 opacity-60'
                      : 'bg-white border-stone-200/80 shadow-xs hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="cursor-pointer shrink-0 text-stone-400 hover:text-emerald-600 transition-colors"
                      aria-label={task.completed ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {task.completed ? (
                        <CheckCircle2 size={20} className="text-emerald-600" />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>

                    {editingId === task.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                          autoFocus
                          className="flex-1 bg-stone-100 rounded-lg px-2.5 py-1 text-sm outline-none border border-stone-300"
                        />
                        <button
                          onClick={() => saveEdit(task.id)}
                          className="p-1 rounded-md bg-stone-900 text-white"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => toggleTask(task.id)}
                        className={`text-sm cursor-pointer select-none truncate ${
                          task.completed
                            ? 'line-through text-stone-400'
                            : 'text-stone-800 font-medium'
                        }`}
                      >
                        {task.title}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${
                        task.priority === 'high'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : task.priority === 'medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {task.priority}
                    </span>

                    <button
                      onClick={() => startEdit(task)}
                      className="p-1 text-stone-300 hover:text-stone-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit task"
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
