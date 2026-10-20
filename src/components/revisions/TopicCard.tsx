'use client';

import React, { useState } from 'react';
import { Topic, RevisionScheduleItem, TopicAttachment, AttachmentType } from '@/lib/types';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Award,
  Paperclip,
  File,
  FileText,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import { getCalculatedRevisionStatus } from '@/lib/spaced-repetition';
import { getAuthHeaders } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { AttachmentViewerModal } from './AttachmentViewerModal';

interface TopicCardProps {
  topic: Topic;
  onOpenReviewStep: (topic: Topic, stepItem: RevisionScheduleItem) => void;
  onDeleteTopic: (topicId: string) => void;
  onTopicUpdated?: () => void;
}

export function TopicCard({
  topic,
  onOpenReviewStep,
  onDeleteTopic,
  onTopicUpdated,
}: TopicCardProps) {
  const { success, error } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<TopicAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  React.useEffect(() => {
    setNow(new Date());
  }, []);

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case 'hard':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300';
    }
  };

  const handleAddAttachment = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const newItems: TopicAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        error('File too large', `"${file.name}" exceeds 15MB limit.`);
        continue;
      }

      let type: AttachmentType = 'other';
      const lower = file.name.toLowerCase();
      if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
        type = 'pdf';
      } else if (
        file.type.includes('word') ||
        file.type.includes('officedocument') ||
        lower.endsWith('.docx') ||
        lower.endsWith('.doc')
      ) {
        type = 'word';
      } else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(lower)) {
        type = 'image';
      }

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newItems.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type,
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }

    if (newItems.length > 0) {
      const currentAttachments = topic.attachments || [];
      const updatedList = [...currentAttachments, ...newItems];

      try {
        await fetch(`/api/topics/${topic.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ attachments: updatedList }),
        });
        success('Materials Added', `${newItems.length} file(s) attached to ${topic.title}.`);
        if (onTopicUpdated) onTopicUpdated();
      } catch (e) {
        console.error('Failed to attach files to topic:', e);
      }
    }

    setIsUploading(false);
  };

  // Check if Day 60 is completed (Mastered!)
  const isMastered = topic.revisions.find((r) => r.step === 6)?.status === 'completed';
  const attachments = topic.attachments || [];

  return (
    <>
      <div className="p-5 sm:p-6 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                {topic.subject}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${getDifficultyBadge(
                  topic.difficulty
                )}`}
              >
                {topic.difficulty || 'medium'}
              </span>
              {isMastered && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Mastered (Day 60)
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {topic.title}
            </h3>
          </div>

          <button
            onClick={() => onDeleteTopic(topic.id)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Topic"
            aria-label="Delete Topic"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Tags */}
        {topic.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {topic.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Attached Revision Materials Pills */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {attachments.map((file) => (
            <button
              key={file.id}
              onClick={() => setSelectedAttachment(file)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                file.type === 'pdf'
                  ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                  : file.type === 'word'
                  ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
                  : 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
              }`}
              title={`Click to read & revise ${file.name}`}
            >
              {file.type === 'pdf' ? (
                <File className="w-3.5 h-3.5 text-rose-500" />
              ) : file.type === 'word' ? (
                <FileText className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span className="truncate max-w-[140px]">{file.name}</span>
            </button>
          ))}

          {/* Quick upload pill */}
          <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors">
            <Plus className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Adding...' : 'Attach PDF/Doc'}</span>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
              onChange={(e) => handleAddAttachment(e.target.files)}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>

        {/* 6-Step Spaced Repetition Timeline */}
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Spaced Repetition Schedule (6 Intervals)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {topic.revisions.map((rev) => {
              const status = getCalculatedRevisionStatus(rev, now);
              const isCompleted = rev.status === 'completed';
              const isDue = status === 'due';
              const isOverdue = status === 'overdue';

              return (
                <div
                  key={rev.id}
                  onClick={() => {
                    if (!isCompleted) onOpenReviewStep(topic, rev);
                  }}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    isCompleted
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30'
                      : isDue || isOverdue
                      ? 'border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 cursor-pointer shadow-sm hover:scale-102'
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100">
                      Day {rev.intervalDays}
                    </span>
                    {isCompleted && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                    {(isDue || isOverdue) && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {rev.scheduledDate.substring(5)}
                  </p>

                  {isCompleted ? (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                      {rev.rating || 'Done'}
                    </span>
                  ) : isDue || isOverdue ? (
                    <span className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-tight block mt-0.5">
                      {isOverdue ? 'Overdue' : 'Due Today'}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400">Scheduled</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Expandable Notes */}
        {topic.content && (
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <span>{expanded ? 'Hide Topic Notes' : 'View Topic Notes & Summary'}</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expanded && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-56 overflow-y-auto">
                {topic.content}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attachment Reader Modal */}
      <AttachmentViewerModal
        attachment={selectedAttachment}
        onClose={() => setSelectedAttachment(null)}
      />
    </>
  );
}
