import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PluginWidgetStrip from '../../../src/features/home/PluginWidgetStrip';
import { registerPlugin, clearAllPlugins } from '../../../src/core/pluginRegistry';

vi.mock('../../../src/api/client', () => ({
  default: vi.fn().mockResolvedValue(undefined),
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

beforeEach(() => {
  clearAllPlugins();
});

function MockWeatherPlugin() {
  return <div data-testid="mock-weather-plugin">Weather Plugin</div>;
}

function BrokenPlugin() {
  throw new Error('Plugin crash!');
}

describe('PluginWidgetStrip', () => {
  it('renders nothing when no plugins registered', () => {
    render(<PluginWidgetStrip />);
    expect(screen.queryByTestId('plugin-widget-strip')).toBeNull();
  });

  it('renders registered plugin widgets', () => {
    registerPlugin({
      pluginId: 'test-weather',
      capability: 'home_screen_widget',
      component: MockWeatherPlugin,
    });
    render(<PluginWidgetStrip />);
    expect(screen.getByTestId('plugin-widget-strip')).toBeInTheDocument();
    expect(screen.getByTestId('mock-weather-plugin')).toBeInTheDocument();
  });

  it('isolates a crashing plugin from the strip', () => {
    registerPlugin({
      pluginId: 'broken',
      capability: 'home_screen_widget',
      component: BrokenPlugin,
    });
    registerPlugin({
      pluginId: 'good',
      capability: 'home_screen_widget',
      component: MockWeatherPlugin,
      order: 2,
    });

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PluginWidgetStrip />);
    spy.mockRestore();

    expect(screen.getByTestId('plugin-widget-strip')).toBeInTheDocument();
    expect(screen.getByTestId('mock-weather-plugin')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('renders plugins in order', () => {
    registerPlugin({
      pluginId: 'second',
      capability: 'home_screen_widget',
      component: () => <div data-testid="second-plugin">Second</div>,
      order: 2,
    });
    registerPlugin({
      pluginId: 'first',
      capability: 'home_screen_widget',
      component: () => <div data-testid="first-plugin">First</div>,
      order: 1,
    });

    const { container } = render(<PluginWidgetStrip />);
    const slots = container.querySelectorAll('[data-plugin-id]');
    expect(slots[0]).toHaveAttribute('data-plugin-id', 'first');
    expect(slots[1]).toHaveAttribute('data-plugin-id', 'second');
  });
});
