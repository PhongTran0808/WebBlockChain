/**
 * Property-Based Tests for RequireWalletModal
 *
 * Feature: wallet-address-recovery
 * Properties: 13, 14, 16
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ─── Mock axiosClient ────────────────────────────────────────────────────────
vi.mock('../../api/axiosClient', () => ({
  default: {
    put: vi.fn(),
  },
}));

import axiosClient from '../../api/axiosClient';

// ─── Mock useAuth ─────────────────────────────────────────────────────────────
const mockUpdateWallet = vi.fn();
let mockUser = null;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, updateWallet: mockUpdateWallet }),
}));

import RequireWalletModal from '../RequireWalletModal';

// ─── Arbitraries ──────────────────────────────────────────────────────────────

/** Roles that SHOULD trigger the modal */
const requiresWalletRole = fc.constantFrom('SHOP', 'TRANSPORTER');

/** Roles that should NOT trigger the modal */
const noWalletRole = fc.constantFrom('ADMIN', 'CITIZEN');

/** Any role */
const anyRole = fc.constantFrom('SHOP', 'TRANSPORTER', 'ADMIN', 'CITIZEN');

/** Valid Ethereum address: 0x + 40 hex chars */
const validWalletAddress = fc
  .hexaString({ minLength: 40, maxLength: 40 })
  .map((hex) => `0x${hex}`);

/** Invalid address: anything that does NOT match ^0x[a-fA-F0-9]{40}$ */
const invalidWalletAddress = fc.oneof(
  fc.constant(''),
  fc.constant('0x'),
  fc.constant('0x123'),
  fc.constant('not-an-address'),
  // Too short (39 hex chars)
  fc.hexaString({ minLength: 39, maxLength: 39 }).map((h) => `0x${h}`),
  // Too long (41 hex chars)
  fc.hexaString({ minLength: 41, maxLength: 41 }).map((h) => `0x${h}`),
  // Invalid chars after 0x
  fc.string({ minLength: 40, maxLength: 40 }).filter(
    (s) => !/^[a-fA-F0-9]{40}$/.test(s)
  ).map((s) => `0x${s}`),
);

/** User object with a given role and walletAddress */
const userWith = (role, walletAddress) => ({
  userId: 1,
  role,
  walletAddress,
  fullName: 'Test User',
  username: 'testuser',
  province: 'HN',
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderModal() {
  return render(
    <MemoryRouter>
      <RequireWalletModal />
    </MemoryRouter>
  );
}

// ─── Property 13: Modal Hiển Thị Đúng Điều Kiện ──────────────────────────────
// Validates: Requirements 4.1, 4.13, 5.4

describe('Property 13: Modal Hiển Thị Đúng Điều Kiện', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal for SHOP/TRANSPORTER with null walletAddress', () => {
    fc.assert(
      fc.property(requiresWalletRole, (role) => {
        mockUser = userWith(role, null);
        const { unmount } = renderModal();
        const heading = screen.queryByText('Cập nhật địa chỉ ví');
        const result = heading !== null;
        unmount();
        return result;
      }),
      { numRuns: 100 }
    );
  });

  it('should NOT render modal for SHOP/TRANSPORTER when walletAddress is set', () => {
    fc.assert(
      fc.property(requiresWalletRole, validWalletAddress, (role, wallet) => {
        mockUser = userWith(role, wallet);
        const { unmount } = renderModal();
        const heading = screen.queryByText('Cập nhật địa chỉ ví');
        const result = heading === null;
        unmount();
        return result;
      }),
      { numRuns: 100 }
    );
  });

  it('should NOT render modal for ADMIN or CITIZEN regardless of walletAddress', () => {
    fc.assert(
      fc.property(
        noWalletRole,
        fc.option(validWalletAddress, { nil: null }),
        (role, wallet) => {
          mockUser = userWith(role, wallet);
          const { unmount } = renderModal();
          const heading = screen.queryByText('Cập nhật địa chỉ ví');
          const result = heading === null;
          unmount();
          return result;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT render modal when user is null', () => {
    fc.assert(
      fc.property(fc.constant(null), (_) => {
        mockUser = null;
        const { unmount } = renderModal();
        const heading = screen.queryByText('Cập nhật địa chỉ ví');
        const result = heading === null;
        unmount();
        return result;
      }),
      { numRuns: 10 }
    );
  });
});

// ─── Property 14: Modal Validate Trước Khi Gọi API ───────────────────────────
// Validates: Requirements 4.9

describe('Property 14: Modal Validate Trước Khi Gọi API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set a user that will show the modal
    mockUser = userWith('SHOP', null);
  });

  it('should show inline error and NOT call API for any invalid address', () => {
    fc.assert(
      fc.property(invalidWalletAddress, (badAddress) => {
        const { unmount } = renderModal();

        const input = screen.getByPlaceholderText('0x...');
        fireEvent.change(input, { target: { value: badAddress } });

        const confirmBtn = screen.getByText('Xác nhận');
        fireEvent.click(confirmBtn);

        // API must NOT be called
        const apiNotCalled = axiosClient.put.mock.calls.length === 0;

        // An error message must be visible
        const errorEl = screen.queryByText(/không hợp lệ/i);
        const errorShown = errorEl !== null;

        unmount();
        vi.clearAllMocks();

        return apiNotCalled && errorShown;
      }),
      { numRuns: 100 }
    );
  });

  it('should call API for a valid address (no inline error)', () => {
    // Resolve immediately so the modal doesn't throw
    axiosClient.put.mockResolvedValue({ data: { walletAddress: '0xabc' } });

    fc.assert(
      fc.property(validWalletAddress, (goodAddress) => {
        const { unmount } = renderModal();

        const input = screen.getByPlaceholderText('0x...');
        fireEvent.change(input, { target: { value: goodAddress } });

        const confirmBtn = screen.getByText('Xác nhận');
        fireEvent.click(confirmBtn);

        // API SHOULD be called
        const apiCalled = axiosClient.put.mock.calls.length === 1;

        unmount();
        vi.clearAllMocks();

        return apiCalled;
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 16: Modal Hiển Thị Trên Tất Cả Routes Của Role ─────────────────
// Validates: Requirements 5.2, 5.3

describe('Property 16: Modal Hiển Thị Trên Tất Cả Routes Của Role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Arbitrary sub-paths under /shop/ */
  const shopRoute = fc
    .array(fc.stringMatching(/^[a-z0-9-]+$/), { minLength: 0, maxLength: 3 })
    .map((parts) => `/shop/${parts.join('/')}`);

  /** Arbitrary sub-paths under /transporter/ */
  const transporterRoute = fc
    .array(fc.stringMatching(/^[a-z0-9-]+$/), { minLength: 0, maxLength: 3 })
    .map((parts) => `/transporter/${parts.join('/')}`);

  it('should show modal on any /shop/* route when SHOP user has no wallet', () => {
    fc.assert(
      fc.property(shopRoute, (route) => {
        mockUser = userWith('SHOP', null);
        const { unmount } = render(
          <MemoryRouter initialEntries={[route]}>
            <RequireWalletModal />
          </MemoryRouter>
        );
        const heading = screen.queryByText('Cập nhật địa chỉ ví');
        const result = heading !== null;
        unmount();
        return result;
      }),
      { numRuns: 100 }
    );
  });

  it('should show modal on any /transporter/* route when TRANSPORTER user has no wallet', () => {
    fc.assert(
      fc.property(transporterRoute, (route) => {
        mockUser = userWith('TRANSPORTER', null);
        const { unmount } = render(
          <MemoryRouter initialEntries={[route]}>
            <RequireWalletModal />
          </MemoryRouter>
        );
        const heading = screen.queryByText('Cập nhật địa chỉ ví');
        const result = heading !== null;
        unmount();
        return result;
      }),
      { numRuns: 100 }
    );
  });

  it('should NOT show modal on /shop/* routes when SHOP user already has a wallet', () => {
    fc.assert(
      fc.property(shopRoute, validWalletAddress, (route, wallet) => {
        mockUser = userWith('SHOP', wallet);
        const { unmount } = render(
          <MemoryRouter initialEntries={[route]}>
            <RequireWalletModal />
          </MemoryRouter>
        );
        const heading = screen.queryByText('Cập nhật địa chỉ ví');
        const result = heading === null;
        unmount();
        return result;
      }),
      { numRuns: 100 }
    );
  });

  it('should NOT show modal on /transporter/* routes when TRANSPORTER user already has a wallet', () => {
    fc.assert(
      fc.property(transporterRoute, validWalletAddress, (route, wallet) => {
        mockUser = userWith('TRANSPORTER', wallet);
        const { unmount } = render(
          <MemoryRouter initialEntries={[route]}>
            <RequireWalletModal />
          </MemoryRouter>
        );
        const heading = screen.queryByText('Cập nhật địa chỉ ví');
        const result = heading === null;
        unmount();
        return result;
      }),
      { numRuns: 100 }
    );
  });

  it('modal should render a blocking backdrop (z-50) that covers the full screen', () => {
    fc.assert(
      fc.property(requiresWalletRole, (role) => {
        mockUser = userWith(role, null);
        const { container, unmount } = renderModal();
        // The backdrop is the outermost div with fixed inset-0 z-50
        const backdrop = container.querySelector('.fixed.inset-0.z-50');
        const result = backdrop !== null;
        unmount();
        return result;
      }),
      { numRuns: 100 }
    );
  });
});
