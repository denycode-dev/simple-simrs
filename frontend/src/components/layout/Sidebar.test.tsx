import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardLayout } from './DashboardLayout';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin', full_name: 'Admin SIMRS', role: 'admin' },
    logout: vi.fn(),
    isLoading: false,
  }),
  UserProfile: () => <div data-testid="user-profile" />,
}));

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: (_: string, cb: (event: MediaQueryListEvent) => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: (event: MediaQueryListEvent) => void) => listeners.delete(cb),
      dispatchEvent: vi.fn(),
    })),
  });
  return {
    triggerChange(nextMatches: boolean) {
      listeners.forEach((cb) => cb({ matches: nextMatches } as MediaQueryListEvent));
    },
  };
}

describe('Sidebar cross-device behavior', () => {
  afterEach(() => {
    document.body.style.overflow = '';
    vi.restoreAllMocks();
  });
  it('renders without any dark backdrop on desktop and hides mobile close button', () => {
    const onClose = vi.fn();
    render(
      <Sidebar
        isOpen={true}
        isDesktop={true}
        onClose={onClose}
        activeMenuId="dashboard"
        onSelectMenu={vi.fn()}
        userRole="admin"
      />
    );

    expect(screen.queryByTestId('sidebar-click-outside')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tutup Sidebar' })).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('uses a transparent click-outside layer (no dark backdrop), supports Escape, and locks body scroll on mobile/tablet', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Sidebar
        isOpen={true}
        isDesktop={false}
        onClose={onClose}
        activeMenuId="dashboard"
        onSelectMenu={vi.fn()}
        userRole="admin"
      />
    );

    const clickOutside = screen.getByTestId('sidebar-click-outside');
    expect(clickOutside.style.backgroundColor).toBe('transparent');
    expect(clickOutside.style.backdropFilter).toBe('');
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByRole('button', { name: 'Tutup Sidebar' })).toBeDefined();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(clickOutside);
    expect(onClose).toHaveBeenCalledTimes(2);

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('DashboardLayout defaults to closed overlay (marginLeft 0) on mobile and docked open (marginLeft 260px) on desktop', () => {
    mockMatchMedia(false);
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <DashboardLayout>
          <div>Konten Utama</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const mobileWrapper = screen.getByTestId('dashboard-main-wrapper');
    expect(mobileWrapper.style.marginLeft).toBe('0px');
    expect(screen.getByRole('button', { name: 'Toggle Sidebar Menu' }).getAttribute('aria-expanded')).toBe('false');

    // Buka sidebar di mobile — konten tidak terdorong (marginLeft tetap 0)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Sidebar Menu' }));
    expect(mobileWrapper.style.marginLeft).toBe('0px');
    expect(screen.getByTestId('sidebar-click-outside').style.backgroundColor).toBe('transparent');
    unmount();

    mockMatchMedia(true);
    render(
      <MemoryRouter initialEntries={['/']}>
        <DashboardLayout>
          <div>Konten Utama</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const desktopWrapper = screen.getByTestId('dashboard-main-wrapper');
    expect(desktopWrapper.style.marginLeft).toBe('260px');
    expect(screen.queryByTestId('sidebar-click-outside')).toBeNull();
  });
});
