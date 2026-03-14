'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoUploaderProps {
  onVideoReady: (file: File, videoUrl: string) => void;
  isProcessing: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

export function VideoUploader({ onVideoReady, isProcessing }: VideoUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload an MP4, MOV, or WebM video file';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Video must be under 100MB';
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      onVideoReady(file, url);
    },
    [validateFile, onVideoReady],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-burnt-orange bg-burnt-orange/5 shadow-[0_0_30px_rgba(191,87,0,0.1)]'
                : 'border-border-subtle bg-surface-dugout hover:border-burnt-orange/30 hover:bg-surface-dugout/80'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleChange}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-burnt-orange/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-burnt-orange" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>

              <div>
                <p className="text-bsi-bone font-semibold mb-1">
                  {dragActive ? 'Drop your swing video' : 'Upload your swing video'}
                </p>
                <p className="text-xs text-text-muted">
                  MP4, MOV, or WebM up to 100MB. Side angle recommended.
                </p>
              </div>

              <button
                type="button"
                className="btn-heritage text-sm px-6 py-2"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              >
                Choose File
              </button>
            </div>

            {/* Camera guide hint */}
            <div className="mt-6 pt-4 border-t border-border-subtle">
              <div className="flex items-start gap-3 text-left max-w-sm mx-auto">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-burnt-orange shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Best results: Record from the <strong className="text-bsi-dust">side angle</strong> (3rd base or 1st base side),
                  phone held vertically, full body in frame from stance through follow-through.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl overflow-hidden border border-border-subtle bg-surface-dugout"
          >
            <video
              src={preview}
              controls
              className="w-full max-h-[400px] object-contain bg-black"
            />
            <div className="p-4 flex items-center justify-between">
              <div className="text-sm">
                <p className="text-bsi-bone font-medium">{selectedFile?.name}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : ''}
                </p>
              </div>
              {!isProcessing && (
                <button
                  onClick={() => {
                    setPreview(null);
                    setSelectedFile(null);
                    setError(null);
                  }}
                  className="text-xs text-text-muted hover:text-burnt-orange transition-colors"
                >
                  Change video
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-red-400 text-sm px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v3M8 10.5h.01" />
          </svg>
          {error}
        </motion.div>
      )}
    </div>
  );
}
