'use client';

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Calendar,
  Tag,
  Sparkles,
  Paperclip,
  File,
  FileText,
  Image as ImageIcon,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import { STANDARD_INTERVALS } from '@/lib/spaced-repetition';
import { getAuthHeaders } from '@/context/AuthContext';
import { TopicAttachment, AttachmentType } from '@/lib/types';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTopicCreated: () => void;
}

export function TopicModal({ isOpen, onClose, onTopicCreated }: TopicModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [initialStudyDate, setInitialStudyDate] = useState('');
  const [attachments, setAttachments] = useState<TopicAttachment[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setInitialStudyDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  if (!isOpen) return null;

  // Calculate live preview of 6 revision dates
  const baseDate = initialStudyDate ? parseISO(initialStudyDate) : null;
  const schedulePreview = STANDARD_INTERVALS.map((days) => ({
    days,
    date: baseDate ? format(addDays(baseDate, days), 'MMM dd, yyyy') : `+${days} days`,
  }));

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError('');

    const newAttachments: TopicAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 15MB limit.`);
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

        newAttachments.push({
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

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          title,
          subject,
          content,
          tags,
          difficulty,
          initialStudyDate,
          attachments,
        }),
      });

      if (res.ok) {
        onTopicCreated();
        onClose();
        setTitle('');
        setContent('');
        setTags('');
        setAttachments([]);
      }
    } catch (err) {
      console.error('Error creating topic:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Save New Topic & Auto-Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Attach PDFs, Word docs, images & schedule 6 automated spaced repetitions
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Topic Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Self-Balancing AVL Trees"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Subject / Category *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Computer Science, Medicine, Law"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Initial Study Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={initialStudyDate}
                  onChange={(e) => setInitialStudyDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 text-xs font-bold rounded-xl capitalize transition-all border ${
                      difficulty === diff
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tags (comma separated)
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Algorithms, Exam 2026, Important"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Study Notes / Key Takeaways / Flashcard Text
            </label>
            <textarea
              rows={3}
              placeholder="Write core definitions, equations, key formulas, or bullet points to test yourself during revisions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* PDF, Word & Image Attachments Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Revision Materials (PDF, Word, Images)
              </label>
              <span className="text-[11px] text-slate-400">PDF • DOC/DOCX • PNG/JPG</span>
            </div>

            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition-colors group">
              <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-1 transition-colors" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Click to upload or drag & drop files
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Attach slides, notes, diagrams, cheat sheets to revise anytime
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </label>

            {uploadError && (
              <p className="text-xs text-rose-500 mt-1.5">{uploadError}</p>
            )}

            {/* Uploaded Attachments List */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          file.type === 'pdf'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : file.type === 'word'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                            : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {file.type === 'pdf' ? (
                          <File className="w-4 h-4" />
                        ) : file.type === 'word' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          {file.type} • {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeAttachment(file.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Automatic Revision Schedule Visual Preview */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2.5">
              <Sparkles className="w-4 h-4" />
              <span>Automated Spaced Repetition Schedule (6 Intervals)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
              {schedulePreview.map((item) => (
                <div
                  key={item.days}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/50 dark:border-indigo-800/50 shadow-xs"
                >
                  <p className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                    Day {item.days}
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5 truncate">
                    {item.date}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Scheduling...' : 'Save & Schedule 6 Revisions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
