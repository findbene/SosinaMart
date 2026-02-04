import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  ProductCardSkeleton,
  TableSkeleton,
} from '@/components/ui/skeleton';

describe('Skeleton', () => {
  it('renders with default styles', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('bg-gray-200');
  });

  it('applies custom className', () => {
    render(<Skeleton className="h-10 w-full" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-10');
    expect(skeleton).toHaveClass('w-full');
  });

  it('accepts custom width and height', () => {
    render(<Skeleton className="w-32 h-8" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('w-32');
    expect(skeleton).toHaveClass('h-8');
  });
});

describe('ProductCardSkeleton', () => {
  it('renders skeleton elements for product card', () => {
    render(<ProductCardSkeleton />);

    // Should have skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('has correct structure', () => {
    const { container } = render(<ProductCardSkeleton />);

    // Should have a card-like container
    expect(container.firstChild).toHaveClass('rounded-lg');
  });
});

describe('TableSkeleton', () => {
  it('renders default number of rows plus header', () => {
    render(<TableSkeleton />);

    // Default is 5 body rows + 1 header row = 6 total
    const rows = document.querySelectorAll('tr');
    expect(rows.length).toBe(6);
  });

  it('renders specified number of rows plus header', () => {
    render(<TableSkeleton rows={3} />);

    // 3 body rows + 1 header row = 4 total
    const rows = document.querySelectorAll('tr');
    expect(rows.length).toBe(4);
  });

  it('renders specified number of columns', () => {
    render(<TableSkeleton rows={1} columns={4} />);

    const cells = document.querySelectorAll('td');
    expect(cells.length).toBe(4);
  });

  it('renders skeleton elements in cells and header', () => {
    render(<TableSkeleton rows={2} columns={3} />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    // 2 body rows * 3 columns + 3 header columns = 9
    expect(skeletons.length).toBe(9);
  });
});
