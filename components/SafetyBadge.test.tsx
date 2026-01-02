import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SafetyBadge from './SafetyBadge';

describe('SafetyBadge', () => {
  it('renders verified state correctly', () => {
    render(<SafetyBadge isVerified={true} />);
    expect(screen.getByText('Safety Verified')).toBeInTheDocument();
  });

  it('renders pending/warning state correctly', () => {
    render(<SafetyBadge isVerified={false} />);
    expect(screen.getByText('Pending Check')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<SafetyBadge isVerified={true} showLabel={false} />);
    expect(screen.queryByText('Safety Verified')).not.toBeInTheDocument();
  });
});