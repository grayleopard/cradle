import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ListingCard from './ListingCard';
import { Listing, Condition, Category, AgeRange } from '../types';

const mockListing: Listing = {
  id: 'l1',
  userId: 'u1',
  title: 'Test Stroller',
  description: 'Desc',
  price: 150,
  originalPrice: 300,
  condition: Condition.GOOD,
  category: Category.GEAR,
  ageRange: AgeRange.ZERO_TO_SIX_MO,
  images: ['img.jpg'],
  locationZip: '98001',
  distanceMiles: 2.5,
  isSafetyVerified: true,
  createdAt: '2024-01-01'
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('ListingCard', () => {
  it('displays core listing details', () => {
    renderWithRouter(<ListingCard listing={mockListing} />);
    
    expect(screen.getByText('Test Stroller')).toBeInTheDocument();
    expect(screen.getByText('$150')).toBeInTheDocument();
    expect(screen.getByText('2.5mi • 98001')).toBeInTheDocument();
  });

  it('calculates and shows discount percentage', () => {
    renderWithRouter(<ListingCard listing={mockListing} />);
    // (300 - 150) / 300 = 50%
    expect(screen.getByText('50% OFF')).toBeInTheDocument();
  });

  it('shows SOLD overlay when item is sold', () => {
    const soldListing = { ...mockListing, isSold: true };
    renderWithRouter(<ListingCard listing={soldListing} />);
    expect(screen.getByText('SOLD')).toBeInTheDocument();
  });

  it('shows safety badge if verified', () => {
    // We check for the visual presence implies the badge component is rendered
    // Since SafetyBadge test covers the icon, we just ensure no errors here
    const { container } = renderWithRouter(<ListingCard listing={mockListing} />);
    expect(container.querySelector('.text-\\[\\#2D9B8C\\]')).toBeInTheDocument(); // ShieldCheck color
  });
});