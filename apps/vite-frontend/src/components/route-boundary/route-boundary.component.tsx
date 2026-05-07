import React, {type ReactNode} from 'react';
import {LoadingAnimation} from '@/components/loading-animation/loading-animation.component';

type RouteBoundaryProps = {
  readonly children: ReactNode;
};

type RouteBoundaryState = {
  readonly error: Error | undefined;
};

// Catches render-time errors from lazy() chunks (e.g. dynamic import failed
// after a deploy invalidated old hashes) and gives the user a way out.
export class RouteBoundary extends React.Component<RouteBoundaryProps, RouteBoundaryState> {
  static getDerivedStateFromError(error: Error): RouteBoundaryState {
    return {error};
  }

  override state: RouteBoundaryState = {error: undefined};

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-slate-600">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            onClick={this.handleReload}
          >
            Reload
          </button>
        </div>
      );
    }

    return (
      <React.Suspense fallback={<LoadingAnimation />}>{this.props.children}</React.Suspense>
    );
  }

  private readonly handleReload = (): void => {
    globalThis.window?.location.reload();
  };
}
