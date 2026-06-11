import { useState } from 'react';
import { motion } from 'framer-motion';
import { systemBootContainer } from '@/lib/animations';
import { MOCK_ROUTINES } from '@/lib/mockData';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { RoutineData } from '@/types';
import { RoutineCard } from '@/features/automation/RoutineCard';
import { ROUTINE_TEMPLATES } from '@/features/automation/data/routineTemplates';
import { getLogSequence } from '@/features/automation/data/executionLogs';

export const AutomationPage = () => {
  const [routines, setRoutines] = useState(MOCK_ROUTINES);
  const [executingRoutines, setExecutingRoutines] = useState<Record<string, boolean>>({});
  const [executionLogs, setExecutionLogs] = useState<Record<string, string[]>>({});

  const toggleRoutine = (id: string) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const deleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  const handleInitializeRoutine = () => {
    const template = ROUTINE_TEMPLATES[routines.length % ROUTINE_TEMPLATES.length];
    const newRoutine: RoutineData = {
      id: 'rt-' + (Date.now()),
      ...template
    };
    setRoutines(prev => [...prev, newRoutine]);
  };

  const forceExecute = (id: string, name: string, isActive: boolean) => {
    if (executingRoutines[id]) return;

    setExecutingRoutines(prev => ({ ...prev, [id]: true }));

    const routine = routines.find(r => r.id === id);
    const logsSeq = getLogSequence(name, routine?.actionTarget);

    if (!isActive) {
      logsSeq.unshift(`[WARN] Routine is inactive. Overriding for manual trigger.`);
    }

    setExecutionLogs(prev => ({ ...prev, [id]: [] }));

    logsSeq.forEach((log, index) => {
      setTimeout(() => {
        setExecutionLogs(prev => ({
          ...prev,
          [id]: [...(prev[id] || []), log]
        }));
      }, index * 450);
    });

    setTimeout(() => {
      setExecutingRoutines(prev => ({ ...prev, [id]: false }));
    }, logsSeq.length * 450 + 200);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      
      {/* Header Info & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-primary-txt tracking-tighter">
            ROUTINE_PROTOCOLS
          </h1>
          <p className="text-secondary-txt font-mono text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-theme-accent shadow-[0_0_8px_var(--theme-accent)] animate-pulse" />
            {routines.filter(r => r.isActive).length} Active Nodes
          </p>
        </div>
        
        <Button variant="primary" size="sm" onClick={handleInitializeRoutine}>
          <Plus size={14} /> Initialize Routine
        </Button>
      </div>

      {/* Routine Grid */}
      <motion.div 
        variants={systemBootContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            isExecuting={executingRoutines[routine.id]}
            executionLogs={executionLogs[routine.id]}
            onToggle={toggleRoutine}
            onDelete={deleteRoutine}
            onExecute={forceExecute}
          />
        ))}
      </motion.div>
    </div>
  );
};
