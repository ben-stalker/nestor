import { useRef, useState, useEffect, useCallback } from 'react';
import { Button, EmptyState } from '../shared/ui';
import { useSnapshots, useSaveSnapshot, useDeleteSnapshot } from './hooks';

const COLOURS = [
  '#1e293b',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#ffffff',
];
const WIDTHS = [2, 4, 8, 16];

interface Point {
  x: number;
  y: number;
}

function getPoint(
  e: PointerEvent | React.PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function DrawingCanvas({ onSave }: { onSave: (blob: Blob) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colour, setColour] = useState('#1e293b');
  const [width, setWidth] = useState(4);
  const [erasing, setErasing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const drawing = useRef(false);
  const lastPoint = useRef<Point | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setHistory((prev) => [...prev.slice(-19), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, []);

  function undo() {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const prev = history[history.length - 1];
    ctx.putImageData(prev, 0, 0);
    setHistory((h) => h.slice(0, -1));
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    saveState();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    saveState();
    drawing.current = true;
    lastPoint.current = getPoint(e as unknown as PointerEvent, canvas);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pt = getPoint(e as unknown as PointerEvent, canvas);
    if (!lastPoint.current) {
      lastPoint.current = pt;
      return;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = erasing ? '#ffffff' : colour;
    ctx.lineWidth = erasing ? width * 4 : width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPoint.current = pt;
  }

  function handlePointerUp() {
    drawing.current = false;
    lastPoint.current = null;
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, 'image/png');
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 p-3 bg-surface rounded-lg">
        <div className="flex gap-1.5 flex-wrap">
          {COLOURS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColour(c);
                setErasing(false);
              }}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                colour === c && !erasing ? 'border-accent scale-125' : 'border-surface-elev'
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Colour ${c}`}
            />
          ))}
        </div>

        <div className="flex gap-1.5">
          {WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWidth(w)}
              className={`flex items-center justify-center w-8 h-8 rounded border ${
                width === w ? 'border-accent bg-accent/10' : 'border-surface-elev'
              }`}
              aria-label={`Width ${w}px`}
            >
              <span
                className="rounded-full bg-current"
                style={{ width: Math.min(w, 16), height: Math.min(w, 16) }}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setErasing((v) => !v)}
          className={`px-3 py-1.5 rounded text-caption font-medium border transition-colors ${
            erasing ? 'bg-accent text-white border-accent' : 'border-surface-elev text-secondary'
          }`}
        >
          Eraser
        </button>

        <button
          type="button"
          onClick={undo}
          disabled={history.length === 0}
          className="px-3 py-1.5 rounded text-caption font-medium border border-surface-elev text-secondary disabled:opacity-40"
        >
          Undo
        </button>

        <button
          type="button"
          onClick={clearCanvas}
          className="px-3 py-1.5 rounded text-caption font-medium border border-surface-elev text-secondary"
        >
          Clear
        </button>

        <Button onClick={handleSave} className="ml-auto">
          Save Snapshot
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        width={1200}
        height={700}
        className="w-full rounded-lg border border-surface-elev bg-white touch-none"
        style={{ cursor: erasing ? 'cell' : 'crosshair' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}

export default function WhiteboardTab() {
  const { data: snapshots = [], isLoading } = useSnapshots();
  const save = useSaveSnapshot();
  const remove = useDeleteSnapshot();
  const [view, setView] = useState<'draw' | 'gallery'>('draw');

  function handleSave(blob: Blob) {
    const name = `Whiteboard ${new Date().toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    save.mutate({ name, blob }, { onSuccess: () => setView('gallery') });
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Whiteboard</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView('draw')}
            className={`px-3 py-1.5 rounded text-caption font-medium border transition-colors ${
              view === 'draw'
                ? 'bg-accent text-white border-accent'
                : 'border-surface-elev text-secondary'
            }`}
          >
            Draw
          </button>
          <button
            type="button"
            onClick={() => setView('gallery')}
            className={`px-3 py-1.5 rounded text-caption font-medium border transition-colors ${
              view === 'gallery'
                ? 'bg-accent text-white border-accent'
                : 'border-surface-elev text-secondary'
            }`}
          >
            Saved ({snapshots.length})
          </button>
        </div>
      </div>

      {view === 'draw' ? (
        <>
          {save.isPending && <p className="text-caption text-secondary">Saving snapshot…</p>}
          <DrawingCanvas onSave={handleSave} />
        </>
      ) : (
        <div>
          {isLoading && <p className="text-secondary text-body">Loading snapshots…</p>}
          {!isLoading && snapshots.length === 0 && (
            <EmptyState heading="No snapshots" body="Draw something and save it to see it here." />
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {snapshots.map((s) => (
              <div
                key={s.id}
                className="rounded-card border border-surface-elev overflow-hidden"
                data-testid="snapshot-card"
              >
                <img
                  src={`/api/v1/board/whiteboard/${s.id}/image`}
                  alt={s.name}
                  className="w-full h-40 object-cover bg-white"
                />
                <div className="p-3 flex items-center justify-between gap-2">
                  <p className="text-body font-medium text-primary truncate">{s.name}</p>
                  <button
                    type="button"
                    onClick={() => remove.mutate(s.id)}
                    className="text-caption text-red-500 shrink-0 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
