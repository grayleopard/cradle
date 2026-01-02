import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StoreProvider, useStore } from './StoreContext';
import { TransactionStatus, Condition, Category, AgeRange, Listing } from '../types';

// Wrapper for hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <StoreProvider>{children}</StoreProvider>
);

describe('StoreContext (Business Logic)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should initialize with no logged in user', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    expect(result.current.currentUser).toBeNull();
  });

  it('should handle user login and persistence', () => {
    const { result } = renderHook(() => useStore(), { wrapper });
    
    const mockUser = {
      id: 'test_user',
      name: 'Test Mom',
      isVerifiedParent: true,
      joinDate: 'Jan 2024',
      itemsSold: 0,
      avatarUrl: 'test.jpg',
      location: '98001'
    };

    act(() => {
      result.current.login(mockUser);
    });

    expect(result.current.currentUser).toEqual(mockUser);
    expect(window.localStorage.getItem('cradle_user')).toContain('test_user');
  });

  describe('Listing Management', () => {
    it('should add a listing and calculate distance', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      
      // Login first
      const mockUser = { id: 'u1', name: 'User', isVerifiedParent: true, joinDate: 'Now', itemsSold: 0, avatarUrl: '', location: '98001' };
      act(() => result.current.login(mockUser));

      // Mock User Location (StoreContext does this via useEffect, we simulate the result)
      // Note: In a real test we'd wait for the useEffect, but here we assume location defaults 
      
      const newListing: Listing = {
        id: 'new_l',
        userId: 'u1',
        title: 'Test Stroller',
        description: 'Desc',
        price: 100,
        condition: Condition.GOOD,
        category: Category.GEAR,
        ageRange: AgeRange.ZERO_TO_SIX_MO,
        images: [],
        locationZip: '98002', // Different zip to trigger distance
        isSafetyVerified: true,
        distanceMiles: 0,
        createdAt: 'Now'
      };

      act(() => {
        result.current.addListing(newListing);
      });

      const added = result.current.listings.find(l => l.id === 'new_l');
      expect(added).toBeDefined();
      expect(added?.coordinates).toBeDefined();
    });
  });

  describe('Transaction State Machine', () => {
    it('should progress through the full escrow flow', async () => {
      const { result } = renderHook(() => useStore(), { wrapper });

      // Setup: Login Buyer
      const buyer = { id: 'buyer1', name: 'Buyer', isVerifiedParent: true, joinDate: '', itemsSold: 0, avatarUrl: '', location: '98001' };
      await act(async () => result.current.login(buyer));

      // 1. Create Transaction (INITIATED)
      let txId = '';
      await act(async () => {
        txId = await result.current.createTransaction('l1'); // l1 is a mock listing
      });

      let tx = result.current.getTransactionById(txId);
      expect(tx?.status).toBe(TransactionStatus.INITIATED);
      expect(tx?.platformFee).toBeGreaterThan(0); // Check fee calculation

      // 2. Accept (ACCEPTED)
      await act(async () => {
        result.current.updateTransactionStatus(txId, TransactionStatus.ACCEPTED);
      });
      expect(result.current.getTransactionById(txId)?.status).toBe(TransactionStatus.ACCEPTED);

      // 3. Pay (PAYMENT_HELD)
      await act(async () => {
        result.current.updateTransactionStatus(txId, TransactionStatus.PAYMENT_HELD);
      });
      expect(result.current.getTransactionById(txId)?.status).toBe(TransactionStatus.PAYMENT_HELD);

      // 4. Meetup & Inspect (INSPECTION_PENDING -> COMPLETED)
      await act(async () => {
        result.current.updateTransactionStatus(txId, TransactionStatus.COMPLETED, {
          inspectionChecklist: { matchesDescription: true, conditionAcceptable: true, noUndisclosedDamage: true }
        });
      });

      tx = result.current.getTransactionById(txId);
      expect(tx?.status).toBe(TransactionStatus.COMPLETED);

      // 5. Verify Item is Marked Sold
      const listing = result.current.getListingById('l1');
      expect(listing?.isSold).toBe(true);
    });

    it('should allow dispute resolution by admin (cancellation)', async () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      await act(async () => result.current.login({ id: 'admin', name: 'Admin', isVerifiedParent: true, joinDate: '', itemsSold: 0, avatarUrl: '', location: '' }));

      let txId = '';
      await act(async () => { txId = await result.current.createTransaction('l1'); });

      // Move to disputed
      await act(async () => {
        result.current.updateTransactionStatus(txId, TransactionStatus.DISPUTED);
      });

      // Resolve as Refund (Cancelled)
      await act(async () => {
        result.current.updateTransactionStatus(txId, TransactionStatus.CANCELLED);
      });

      const tx = result.current.getTransactionById(txId);
      expect(tx?.status).toBe(TransactionStatus.CANCELLED);
    });
  });

  describe('Community Features', () => {
    it('should follow and unfollow users', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const me = { id: 'me', name: 'Me', isVerifiedParent: true, joinDate: '', itemsSold: 0, avatarUrl: '', location: '', followingIds: [] };
      act(() => result.current.login(me));

      // Follow
      act(() => result.current.followUser('u2'));
      expect(result.current.currentUser?.followingIds).toContain('u2');

      // Unfollow
      act(() => result.current.unfollowUser('u2'));
      expect(result.current.currentUser?.followingIds).not.toContain('u2');
    });
  });
});