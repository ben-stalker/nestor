import { beforeEach, describe, expect, it } from 'vitest';
import useAppStore from '../src/store/appStore';

beforeEach(() => {
  useAppStore.setState({
    activeProfileId: null,
    adminPin: null,
    alertCount: 0,
    voiceStatus: 'idle',
  });
});

describe('useAppStore', () => {
  it('has correct initial state', () => {
    const state = useAppStore.getState();
    expect(state.activeProfileId).toBeNull();
    expect(state.adminPin).toBeNull();
    expect(state.alertCount).toBe(0);
    expect(state.voiceStatus).toBe('idle');
  });

  it('setActiveProfile updates profileId and adminPin', () => {
    useAppStore.getState().setActiveProfile('profile-1', '1234');
    const state = useAppStore.getState();
    expect(state.activeProfileId).toBe('profile-1');
    expect(state.adminPin).toBe('1234');
  });

  it('setActiveProfile defaults adminPin to null', () => {
    useAppStore.getState().setActiveProfile('profile-2');
    expect(useAppStore.getState().adminPin).toBeNull();
  });

  it('setAlertCount updates alertCount', () => {
    useAppStore.getState().setAlertCount(5);
    expect(useAppStore.getState().alertCount).toBe(5);
  });

  it('setVoiceStatus updates voiceStatus', () => {
    useAppStore.getState().setVoiceStatus('listening');
    expect(useAppStore.getState().voiceStatus).toBe('listening');
  });
});
