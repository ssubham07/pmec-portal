import React, { useRef, useState } from 'react';

/**
 * Lets an admin either draw their signature on a canvas or upload an image
 * of their signature. Drawn signatures are exported as a base64 PNG data
 * URL; uploaded signatures are passed back as a File.
 */
export default function SignaturePad({ onSaveDrawn, onSaveFile, saving }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('draw'); // 'draw' | 'upload'

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawing(true);
  }

  function end() {
    drawing.current = false;
  }

  function clearCanvas() {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawing(false);
  }

  function handleSaveDrawn() {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSaveDrawn(dataUrl);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-md">
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1.5 text-sm rounded ${mode === 'draw' ? 'bg-pmec-blue text-white' : 'bg-slate-100'}`}
          onClick={() => setMode('draw')}
        >
          Draw Signature
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded ${mode === 'upload' ? 'bg-pmec-blue text-white' : 'bg-slate-100'}`}
          onClick={() => setMode('upload')}
        >
          Upload Image
        </button>
      </div>

      {mode === 'draw' ? (
        <>
          <canvas
            ref={canvasRef}
            width={380}
            height={150}
            className="border-2 border-dashed border-slate-300 rounded-lg touch-none w-full bg-slate-50"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
          />
          <div className="flex gap-2 mt-3">
            <button onClick={clearCanvas} className="text-sm px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200">
              Clear
            </button>
            <button
              onClick={handleSaveDrawn}
              disabled={!hasDrawing || saving}
              className="text-sm px-3 py-1.5 rounded bg-pmec-blue text-white disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save Signature'}
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-sm"
          />
          <button
            onClick={() => file && onSaveFile(file)}
            disabled={!file || saving}
            className="block mt-3 text-sm px-3 py-1.5 rounded bg-pmec-blue text-white disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Upload Signature'}
          </button>
        </>
      )}
      <p className="text-xs text-slate-400 mt-3">
        This signature will be stamped on every certificate/approval memo you sign off on.
      </p>
    </div>
  );
}
