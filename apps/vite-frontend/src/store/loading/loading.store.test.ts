import {beforeEach, describe, expect, it} from 'vitest';
import {useLoadingStore} from './loading.store';

describe('useLoadingStore', () => {
  beforeEach(() => {
    useLoadingStore.setState({pendingRequests: 0, isLoading: false});
  });

  it('starts with no pending requests and not loading', () => {
    const state = useLoadingStore.getState();
    expect(state.pendingRequests).toBe(0);
    expect(state.isLoading).toBe(false);
  });

  it('flips isLoading on the first increment and back on matching decrement', () => {
    useLoadingStore.getState().increment();
    expect(useLoadingStore.getState()).toMatchObject({pendingRequests: 1, isLoading: true});

    useLoadingStore.getState().decrement();
    expect(useLoadingStore.getState()).toMatchObject({pendingRequests: 0, isLoading: false});
  });

  it('keeps loading until every concurrent request completes', () => {
    const {increment, decrement} = useLoadingStore.getState();
    increment();
    increment();
    increment();
    expect(useLoadingStore.getState()).toMatchObject({pendingRequests: 3, isLoading: true});

    decrement();
    decrement();
    expect(useLoadingStore.getState()).toMatchObject({pendingRequests: 1, isLoading: true});

    decrement();
    expect(useLoadingStore.getState()).toMatchObject({pendingRequests: 0, isLoading: false});
  });

  it('clamps pendingRequests at zero on unbalanced decrement', () => {
    useLoadingStore.getState().decrement();
    useLoadingStore.getState().decrement();
    expect(useLoadingStore.getState()).toMatchObject({pendingRequests: 0, isLoading: false});
  });
});
