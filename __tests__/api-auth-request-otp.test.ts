import { describe, it, expect, vi } from 'vitest';
import { POST } from '../src/app/api/auth/request-otp/route';
import { NextRequest } from 'next/server';

// Mock the Supabase admin client
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

describe('POST /api/auth/request-otp', () => {
  it('should return 400 if phone is missing', async () => {
    const req = new NextRequest('http://localhost/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Phone number is required');
  });

  it('should return 200 on successful OTP request', async () => {
    const req = new NextRequest('http://localhost/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '+919876543210' }),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toBe('OTP sent successfully');
  });
});
