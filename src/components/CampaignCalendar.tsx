/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, Calendar, CheckCircle2, Circle, GripVertical, Link2, RefreshCw,
} from 'lucide-react';
import {
  CalendarTask,
  CalendarTaskStatus,
  MarketingAssetType,
  WebsiteAnalysis,
} from '../types';
import {
  ensureCalendarTasks,
  loadCalendarTasks,
  moveTaskToDate,
  resetCalendarForPlan,
  saveCalendarTasks,
  updateTaskStatus,
} from '../utils/calendarTasks';

interface CampaignCalendarProps {
  analysis: WebsiteAnalysis;
  onBack: () => void;
  onOpenAsset?: (type: MarketingAssetType) => void;
  hasAsset?: (type: MarketingAssetType) => boolean;
}

const STATUS_CYCLE: CalendarTaskStatus[] = ['pending', 'in_progress', 'done'];

function nextStatus(s: CalendarTaskStatus): CalendarTaskStatus {
  const i = STATUS_CYCLE.indexOf(s);
  return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
}

function statusIcon(status: CalendarTaskStatus) {
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === 'in_progress') return <Circle className="w-4 h-4 text-amber-400 fill-amber-400/30" />;
  return <Circle className="w-4 h-4 text-slate-600" />;
}

export default function CampaignCalendar({
  analysis,
  onBack,
  onOpenAsset,
  hasAsset,
}: CampaignCalendarProps) {
  const [tasks, setTasks] = useState<CalendarTask[]>(() => ensureCalendarTasks(analysis));
  const [dragId, setDragId] = useState<string | null>(null);

  const dates = useMemo(() => {
    const set = new Set(tasks.map((t) => t.scheduledDate));
    return Array.from(set).sort();
  }, [tasks]);

  const doneCount = tasks.filter((t) => t.status === 'done').length;

  const handleDrop = (date: string) => {
    if (!dragId) return;
    setTasks(moveTaskToDate(dragId, date));
    setDragId(null);
  };

  const toggleStatus = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setTasks(updateTaskStatus(id, nextStatus(task.status)));
  };

  const handleReset = () => {
    if (!window.confirm('Reset calendar from your 4-week plan? This replaces all tasks.')) return;
    setTasks(resetCalendarForPlan(analysis));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Campaign calendar
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {doneCount}/{tasks.length} tasks done · drag to reschedule · click circle to mark progress
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-bold px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Rebuild from plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {dates.map((date) => {
          const dayTasks = tasks.filter((t) => t.scheduledDate === date);
          const d = new Date(date + 'T12:00:00');
          const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          return (
            <div
              key={date}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(date)}
              className={`min-h-[120px] p-3 rounded-xl border transition-colors ${
                dragId ? 'border-dashed border-emerald-600/50 bg-emerald-950/10' : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">{label}</p>
              <div className="space-y-2">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => setDragId(null)}
                    className={`p-2.5 rounded-lg border text-xs cursor-grab active:cursor-grabbing ${
                      task.status === 'done'
                        ? 'bg-emerald-950/30 border-emerald-800/40 opacity-75'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
                      <button
                        type="button"
                        onClick={() => toggleStatus(task.id)}
                        className="shrink-0 cursor-pointer"
                        title="Mark progress"
                      >
                        {statusIcon(task.status)}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-white leading-snug ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{task.weekLabel} · {task.focus}</p>
                        {task.linkedAssetType && onOpenAsset && (
                          <button
                            type="button"
                            onClick={() => onOpenAsset(task.linkedAssetType!)}
                            className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                          >
                            <Link2 className="w-3 h-3" />
                            {hasAsset?.(task.linkedAssetType) ? 'Open asset' : `Create ${task.linkedAssetType.replace('_', ' ')}`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
