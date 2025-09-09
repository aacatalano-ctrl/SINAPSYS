import { render, screen } from '@testing-library/react';
import Toast from './Toast';
import React from 'react';

describe('Toast component', () => {
  it('should not render when show is false', () => {
    render(<Toast message="Test message" show={false} />);
    const toastElement = screen.queryByText(/Test message/i);
    expect(toastElement).not.toBeInTheDocument();
  });

  it('should render when show is true', () => {
    render(<Toast message="Test message" show={true} />);
    const toastElement = screen.getByText(/Test message/i);
    expect(toastElement).toBeInTheDocument();
  });
});