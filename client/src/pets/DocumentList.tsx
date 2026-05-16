import { useState, useRef } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PetHealthLog } from './types';
import { deleteHealthLog, uploadDocument, createHealthLog } from './api';
import { Button } from '../shared/ui';

interface DocumentListProps {
  petId: number;
  logs: PetHealthLog[];
}

export default function DocumentList({ petId, logs }: DocumentListProps) {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const docLogs = logs.filter((l) => l.log_type === 'document');

  const deleteMutation = useMutation({
    mutationFn: (logId: number) => deleteHealthLog(petId, logId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['pet-health-logs', petId] });
    },
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !docTitle.trim()) return;
    setUploading(true);
    try {
      // First create a placeholder log entry
      const log = await createHealthLog(petId, {
        log_type: 'document',
        title: docTitle.trim(),
        log_date: docDate,
      });
      // Then upload the document
      await uploadDocument(petId, log.id, file);
      await qc.invalidateQueries({ queryKey: ['pet-health-logs', petId] });
      setShowUpload(false);
      setDocTitle('');
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      // silent fail
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body font-semibold text-primary">Documents</h3>
        <Button size="sm" onClick={() => setShowUpload((v) => !v)}>
          <Upload size={14} className="mr-1" />
          Upload
        </Button>
      </div>

      {showUpload && (
        <form
          onSubmit={(e) => {
            handleUpload(e).catch(() => {});
          }}
          className="space-y-3 bg-surface-elev rounded-card p-3"
        >
          <div>
            <label className="block text-caption text-secondary mb-1" htmlFor="doc-title">
              Title *
            </label>
            <input
              id="doc-title"
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              required
              className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
            />
          </div>
          <div>
            <label className="block text-caption text-secondary mb-1" htmlFor="doc-date">
              Date
            </label>
            <input
              id="doc-date"
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className="w-full rounded-md border border-surface-elev bg-surface px-3 py-2 text-body text-primary"
            />
          </div>
          <div>
            <label className="block text-caption text-secondary mb-1" htmlFor="doc-file">
              File (PDF, JPEG, PNG ≤ 10 MB)
            </label>
            <input
              id="doc-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              ref={fileRef}
              required
              className="w-full text-body text-primary"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </form>
      )}

      {docLogs.length === 0 ? (
        <p className="text-secondary text-body text-center py-4">No documents uploaded yet.</p>
      ) : (
        <ul className="space-y-2" role="list">
          {docLogs.map((log) => (
            <li key={log.id} className="flex items-center gap-3 bg-surface rounded-card p-3">
              <FileText size={20} className="shrink-0 text-secondary" />
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-primary truncate">{log.title}</p>
                {log.document_name && (
                  <a
                    href={`/api/v1/pets/${petId}/health-log/${log.id}/document`}
                    className="text-caption text-accent hover:underline truncate block"
                    download={log.document_name}
                  >
                    {log.document_name}
                  </a>
                )}
                <p className="text-caption text-secondary">{log.log_date}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(log.id)}
                className="shrink-0 text-red-400 hover:text-red-600 p-1"
                aria-label="Delete document"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
