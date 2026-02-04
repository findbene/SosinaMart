import { render, screen } from '@testing-library/react';
import { Badge, OrderStatusBadge, CustomerStatusBadge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders with children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('bg-primary');
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-green-100');

    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toHaveClass('bg-red-100');

    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-100');

    rerender(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toHaveClass('bg-blue-100');

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toHaveClass('border-gray-300');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<Badge size="default">Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('px-2.5');

    rerender(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('px-2');

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText('Large')).toHaveClass('px-3');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Badge</Badge>);
    expect(screen.getByText('Badge')).toHaveClass('custom-class');
  });
});

describe('OrderStatusBadge', () => {
  it('renders pending status', () => {
    render(<OrderStatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toHaveClass('bg-yellow-100');
  });

  it('renders processing status', () => {
    render(<OrderStatusBadge status="processing" />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toHaveClass('bg-purple-100');
  });

  it('renders shipped status', () => {
    render(<OrderStatusBadge status="shipped" />);
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    expect(screen.getByText('Shipped')).toHaveClass('bg-indigo-100');
  });

  it('renders delivered status', () => {
    render(<OrderStatusBadge status="delivered" />);
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toHaveClass('bg-green-100');
  });

  it('renders cancelled status', () => {
    render(<OrderStatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toHaveClass('bg-red-100');
  });

  it('applies size prop', () => {
    render(<OrderStatusBadge status="pending" size="lg" />);
    expect(screen.getByText('Pending')).toHaveClass('px-3');
  });
});

describe('CustomerStatusBadge', () => {
  it('renders active status', () => {
    render(<CustomerStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Active')).toHaveClass('bg-green-100');
  });

  it('renders inactive status', () => {
    render(<CustomerStatusBadge status="inactive" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toHaveClass('bg-gray-100');
  });

  it('renders blocked status', () => {
    render(<CustomerStatusBadge status="blocked" />);
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toHaveClass('bg-red-100');
  });

  it('renders VIP status', () => {
    render(<CustomerStatusBadge status="vip" />);
    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('VIP')).toHaveClass('bg-amber-100');
  });
});
