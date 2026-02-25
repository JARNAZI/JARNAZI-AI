'use client';

import * as React from 'react';

type Props = {
  action: () => void;
  label: string;
  confirmText: string;
};

export function DeleteAccountForm({ action, label, confirmText }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        // Use native confirm dialog to avoid adding more UI dependencies
        const ok = window.confirm(confirmText);
        if (!ok) e.preventDefault();
      }}
    >
      <button
        className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700"
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
