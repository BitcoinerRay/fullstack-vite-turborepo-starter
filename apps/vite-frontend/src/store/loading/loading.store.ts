import {create} from 'zustand';

type LoadingStore = {
  isLoading: boolean;
  pendingRequests: number;
  increment: () => void;
  decrement: () => void;
};

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  pendingRequests: 0,
  increment(): void {
    set((state) => {
      const pendingRequests = state.pendingRequests + 1;
      return {pendingRequests, isLoading: pendingRequests > 0};
    });
  },
  decrement(): void {
    set((state) => {
      const pendingRequests = Math.max(0, state.pendingRequests - 1);
      return {pendingRequests, isLoading: pendingRequests > 0};
    });
  },
}));
