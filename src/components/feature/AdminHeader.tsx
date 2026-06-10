
import React from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * AdminHeader – displays a title with an optional subtitle.
 *
 * The component is deliberately simple but includes defensive checks:
 *  - `title` is required; if an empty string is passed we render a fallback.
 *  - `subtitle` is rendered only when it is a non‑empty string.
 */
export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  // Guard against accidental empty titles (unlikely but makes the component more robust)
  const safeTitle = title?.trim() ? title : 'Untitled';

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <h1 className="text-2xl font-bold text-gray-900">{safeTitle}</h1>
      {subtitle?.trim() && (
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
