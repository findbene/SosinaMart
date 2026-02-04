import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '@/context/CartContext';
import { ToastContextProvider } from '@/context/ToastContext';
import CheckoutModal from '@/components/checkout/CheckoutModal';
import { Product } from '@/types';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  db: {
    createOrder: jest.fn().mockResolvedValue({ id: 'test-order-id' }),
  },
  supabase: null,
}));

const mockProduct: Product = {
  id: 'test-1',
  name: 'Test Berbere Spice',
  price: 12.99,
  category: 'food',
  image: '/test.jpg',
  inStock: true,
};

// Helper to setup cart with items
function CartSetup({ onReady }: { onReady: () => void }) {
  const { addToCart } = useCart();

  React.useEffect(() => {
    addToCart(mockProduct);
    onReady();
  }, []);

  return null;
}

import React from 'react';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastContextProvider>
    <CartProvider>{children}</CartProvider>
  </ToastContextProvider>
);

describe('Checkout Flow Integration', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('displays checkout form when modal is open', async () => {
    let ready = false;

    render(
      <TestWrapper>
        <CartSetup onReady={() => { ready = true; }} />
        <CheckoutModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    await waitFor(() => expect(ready).toBe(true));

    expect(screen.getByText(/checkout/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('470-359-7924')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/123 Main St/i)).toBeInTheDocument();
  });

  it('shows order summary with cart items', async () => {
    let ready = false;

    render(
      <TestWrapper>
        <CartSetup onReady={() => { ready = true; }} />
        <CheckoutModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    await waitFor(() => expect(ready).toBe(true));

    expect(screen.getByText(/order summary/i)).toBeInTheDocument();
    expect(screen.getByText(/test berbere spice/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    let ready = false;

    render(
      <TestWrapper>
        <CartSetup onReady={() => { ready = true; }} />
        <CheckoutModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    await waitFor(() => expect(ready).toBe(true));

    const submitButton = screen.getByRole('button', { name: /place order/i });
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    let ready = false;

    render(
      <TestWrapper>
        <CartSetup onReady={() => { ready = true; }} />
        <CheckoutModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    await waitFor(() => expect(ready).toBe(true));

    // Use fireEvent for more reliable input simulation
    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('john@example.com');
    const phoneInput = screen.getByPlaceholderText('470-359-7924');
    const addressInput = screen.getByPlaceholderText(/123 Main St/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(phoneInput, { target: { value: '4703597924' } });
    fireEvent.change(addressInput, { target: { value: '123 Main St' } });

    // Submit the form directly
    const form = screen.getByRole('button', { name: /place order/i }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('validates phone format', async () => {
    const user = userEvent.setup();
    let ready = false;

    render(
      <TestWrapper>
        <CartSetup onReady={() => { ready = true; }} />
        <CheckoutModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    await waitFor(() => expect(ready).toBe(true));

    await user.type(screen.getByPlaceholderText('John Doe'), 'John Doe');
    await user.type(screen.getByPlaceholderText('john@example.com'), 'john@example.com');
    await user.type(screen.getByPlaceholderText('470-359-7924'), '123');
    await user.type(screen.getByPlaceholderText(/123 Main St/i), '123 Main St');

    const submitButton = screen.getByRole('button', { name: /place order/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid phone format/i)).toBeInTheDocument();
    });
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <CheckoutModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Find the close button by its position (first button in the modal) or by finding the X icon
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn => btn.querySelector('svg.lucide-x'));
    expect(closeButton).toBeTruthy();
    await user.click(closeButton!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    render(
      <TestWrapper>
        <CheckoutModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    expect(screen.queryByText(/checkout/i)).not.toBeInTheDocument();
  });
});
