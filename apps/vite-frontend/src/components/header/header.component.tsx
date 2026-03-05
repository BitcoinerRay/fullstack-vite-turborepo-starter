'use client';

import {type JSX} from 'react';

export function Header(): JSX.Element {
  /* eslint-disable-next-line no-warning-comments -- Placeholder until docs/header-nav-spec.md exists */
  // TODO: Replace with NavigationMenu or DropdownMenu when navigation requirements are defined
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4">
        {/* Navigation will be added here based on requirements */}
      </div>
    </header>
  );
}
