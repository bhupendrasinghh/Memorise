'use client';

import React, { useState } from 'react';
import { TopicAttachment } from '@/lib/types';
import {
  X,
  FileText,
  File,
  Image as ImageIcon,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
} from 'lucide-react';

interface AttachmentViewerModalProps {
  attachment: TopicAttachment | null;
  onClose: () => void;
}

export function AttachmentViewerModal({
  attachment,
  onClose,
}: AttachmentViewerModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!attachment) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const openInNewTab = () => {
    try {
      const win = window.open();
      if (win) {
        if (attachment.type === 'pdf') {
          win.document.write(
            `<html><head><title>${attachment.name}</title></head><body style="margin:0"><embed width="100%" height="100%" src="${attachment.dataUrl}" type="application/pdf"></body></html>`
          );
        } else if (attachment.type === 'image') {
          win.document.write(
            `<html><head><title>${attachment.name}</title></head><body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh"><img src="${attachment.dataUrl}" style="max-width:100%;max-height:100%"></body></html>`
          );
        } else {
          // Trigger direct download
          const a = document.createElement('a');
          a.href = attachment.dataUrl;
          a.download = attachment.name;
          a.click();
        }
      }
    } catch {
      window.open(attachment.dataUrl, '_blank');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'max-w-5xl w-full h-[90vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                attachment.type === 'pdf'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : attachment.type === 'word'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {attachment.type === 'pdf' ? (
                <File className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              ) : attachment.type === 'word' ? (
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {attachment.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <span className="uppercase font-semibold text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {attachment.type}
                </span>
                <span>{formatFileSize(attachment.size)}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {attachment.type === 'image' && (
              <>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={openInNewTab}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Open in Full Window"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <a
              href={attachment.dataUrl}
              download={attachment.name}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: File Viewer */}
        <div className="flex-1 overflow-auto bg-slate-100/60 dark:bg-slate-950 flex items-center justify-center p-4 relative">
          {/* PDF Viewer */}
          {attachment.type === 'pdf' && (
            <div className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-inner flex flex-col">
              <iframe
                src={`${attachment.dataUrl}#toolbar=1&navpanes=1`}
                className="w-full h-full border-none"
                title={attachment.name}
              />
            </div>
          )}

          {/* Image Viewer */}
          {attachment.type === 'image' && (
            <div className="w-full h-full flex items-center justify-center overflow-auto select-none p-4">
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                }}
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
              />
            </div>
          )}

          {/* Word Document (.docx / .doc) Viewer */}
          {attachment.type === 'word' && (
            <div className="max-w-2xl w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/15 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/10">
                <FileText className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  {attachment.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Microsoft Word Document • {formatFileSize(attachment.size)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/50 text-xs text-slate-700 dark:text-slate-300 text-left">
                <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  💡 Revision Study Tip:
                </p>
                <p>
                  You can open this Word document with Word, LibreOffice, or Google Docs to revise questions, diagrams, and highlighted study notes.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={attachment.dataUrl}
                  download={attachment.name}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download Word Document
                </a>
                <button
                  onClick={openInNewTab}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" /> Open in New Tab
                </button>
              </div>
            </div>
          )}

          {/* Fallback for other file types */}
          {attachment.type === 'other' && (
            <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                <File className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {attachment.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {formatFileSize(attachment.size)}
                </p>
              </div>
              <a
                href={attachment.dataUrl}
                download={attachment.name}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <Download className="w-4 h-4" /> Download Document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
