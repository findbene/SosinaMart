import {
  cn,
  formatPrice,
  generateOrderNumber,
  formatPhoneForLink,
  truncateText,
  debounce,
  isValidEmail,
  isValidPhone,
  getCategoryDisplayName,
} from '@/lib/utils';

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});

describe('formatPrice', () => {
  it('should format whole numbers', () => {
    expect(formatPrice(10)).toBe('$10.00');
  });

  it('should format decimal numbers', () => {
    expect(formatPrice(10.99)).toBe('$10.99');
  });

  it('should format large numbers with commas', () => {
    expect(formatPrice(1234.56)).toBe('$1,234.56');
  });

  it('should format zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('should handle small decimals', () => {
    expect(formatPrice(0.99)).toBe('$0.99');
  });

  it('should round to 2 decimal places', () => {
    expect(formatPrice(10.999)).toBe('$11.00');
  });
});

describe('generateOrderNumber', () => {
  it('should generate a string starting with SM-', () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber).toMatch(/^SM-/);
  });

  it('should generate unique order numbers', () => {
    const orderNumbers = new Set<string>();
    for (let i = 0; i < 100; i++) {
      orderNumbers.add(generateOrderNumber());
    }
    expect(orderNumbers.size).toBe(100);
  });

  it('should contain only uppercase alphanumeric characters after prefix', () => {
    const orderNumber = generateOrderNumber();
    const suffix = orderNumber.slice(3);
    expect(suffix).toMatch(/^[A-Z0-9]+$/);
  });
});

describe('formatPhoneForLink', () => {
  it('should format phone number with dashes', () => {
    expect(formatPhoneForLink('470-359-7924')).toBe('tel:+14703597924');
  });

  it('should format phone number without dashes', () => {
    expect(formatPhoneForLink('4703597924')).toBe('tel:+14703597924');
  });

  it('should format phone number with dots', () => {
    expect(formatPhoneForLink('470.359.7924')).toBe('tel:+14703597924');
  });

  it('should format phone number with parentheses', () => {
    expect(formatPhoneForLink('(470) 359-7924')).toBe('tel:+14703597924');
  });
});

describe('truncateText', () => {
  it('should not truncate short text', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
  });

  it('should truncate long text with ellipsis', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
  });

  it('should handle exact length', () => {
    expect(truncateText('Hello', 5)).toBe('Hello');
  });

  it('should trim whitespace before ellipsis', () => {
    expect(truncateText('Hello World Test', 6)).toBe('Hello...');
  });

  it('should handle empty string', () => {
    expect(truncateText('', 10)).toBe('');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should only call once for multiple rapid calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the debounced function', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2');
    jest.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should use the latest arguments', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('third');
  });
});

describe('isValidEmail', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.org')).toBe(true);
    expect(isValidEmail('user+tag@gmail.com')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('should return true for valid phone formats', () => {
    expect(isValidPhone('4703597924')).toBe(true);
    expect(isValidPhone('470-359-7924')).toBe(true);
    expect(isValidPhone('470.359.7924')).toBe(true);
    expect(isValidPhone('(470) 359-7924')).toBe(true);
  });

  it('should return false for invalid phone formats', () => {
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone('123')).toBe(false);
    // Note: The current implementation extracts last 10 digits, so long numbers may still match
    expect(isValidPhone('abcdefghij')).toBe(false);
  });
});

describe('getCategoryDisplayName', () => {
  it('should return display name for known categories', () => {
    expect(getCategoryDisplayName('food')).toBe('Food & Coffee');
    expect(getCategoryDisplayName('kitchenware')).toBe('Traditional Kitchenware');
    expect(getCategoryDisplayName('artifacts')).toBe('Artifacts & Accessories');
  });

  it('should return original string for unknown categories', () => {
    expect(getCategoryDisplayName('unknown')).toBe('unknown');
    expect(getCategoryDisplayName('other')).toBe('other');
  });
});
