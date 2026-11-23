import React from 'react';
import { X } from 'lucide-react';

type QueueTicket = {
  queingNumber: number;
  isOpen?: boolean;
  onClose?: () => void;
};

function QueingNumber({ queingNumber, isOpen = true, onClose }: QueueTicket) {
    console.log(isOpen)
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        )}

        <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Queue Number
        </span>

        <h1 className="my-4 font-mono text-6xl font-black text-teal-600">
          {String(queingNumber).padStart(2, '0')}
        </h1>

        <p className="text-sm text-slate-500">
          Please wait for your number to be called.
        </p>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500"
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
}

export default QueingNumber;