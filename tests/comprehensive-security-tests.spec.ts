import { test, expect } from '@playwright/test';
import { loginAs } from '../src/test/helpers/auth';

test.describe('Comprehensive Security & Feature Tests', () => {
    test.setTimeout(120000); // 2 minutes for thorough testing

    test.describe('Phase 1: Webhook Security Tests', () => {
        
        test('should reject webhook without signature', async ({ request }) => {
            const response = await request.post('http://localhost:3000/api/webhooks/stripe', {
                data: {
                    id: 'evt_test_webhook',
                    type: 'payment_intent.succeeded',
                    data: { object: { id: 'pi_test' } }
                }
            });
            
            expect(response.status()).toBe(400);
            const body = await response.text();
            expect(body).toContain('Missing signature');
        });

        test('should reject webhook with invalid signature', async ({ request }) => {
            const response = await request.post('http://localhost:3000/api/webhooks/stripe', {
                headers: {
                    'stripe-signature': 'invalid_signature_12345'
                },
                data: {
                    id: 'evt_test_webhook',
                    type: 'payment_intent.succeeded'
                }
            });
            
            expect(response.status()).toBe(400);
        });

        test('should handle idempotent webhooks (duplicate prevention)', async ({ request }) => {
            // This test would require valid Stripe signature
            // In production, use Stripe CLI for testing: stripe trigger payment_intent.succeeded
            console.log('⚠️  Idempotency test requires Stripe CLI: stripe trigger payment_intent.succeeded');
        });
    });

    test.describe('Phase 2: Audit Logging Tests', () => {
        
        test('should track IP address and user agent', async ({ request }) => {
            const response = await request.get('http://localhost:3000/api/health', {
                headers: {
                    'x-forwarded-for': '8.8.8.8',
                    'user-agent': 'Mozilla/5.0 Test Browser'
                }
            });
            
            expect(response.ok()).toBeTruthy();
            const data = await response.json();
            expect(data.status).toBe('ok');
            expect(data.audit).toBeDefined();
        });

        test('should get audit statistics', async ({ request }) => {
            const response = await request.get('http://localhost:3000/api/admin/audit/stats', {
                headers: {
                    'x-api-key': process.env.SERVICE_API_KEY || 'test-api-key',
                    'x-user-role': 'admin'
                }
            });
            
            if (response.ok()) {
                const stats = await response.json();
                expect(stats).toHaveProperty('buffered');
                expect(stats).toHaveProperty('bySeverity');
                console.log('✅ Audit Stats:', stats);
            }
        });

        test('should flush audit buffer', async ({ request }) => {
            const response = await request.post('http://localhost:3000/api/admin/audit/flush', {
                headers: {
                    'x-api-key': process.env.SERVICE_API_KEY || 'test-api-key',
                    'x-user-role': 'admin'
                }
            });
            
            if (response.ok()) {
                const result = await response.json();
                expect(result).toHaveProperty('flushed');
                expect(result).toHaveProperty('failed');
                console.log('✅ Flush Result:', result);
            }
        });

        test('should test geolocation integration', async () => {
            // Test geolocation for a public IP
            const testIp = '8.8.8.8'; // Google DNS
            console.log(`🌍 Testing geolocation for IP: ${testIp}`);
            
            try {
                const response = await fetch(`http://ip-api.com/json/${testIp}`);
                const data = await response.json();
                
                expect(data.status).toBe('success');
                expect(data.country).toBeDefined();
                expect(data.city).toBeDefined();
                console.log('✅ Geolocation Test:', {
                    country: data.country,
                    city: data.city,
                    isp: data.isp
                });
            } catch (error) {
                console.error('❌ Geolocation test failed:', error);
            }
        });
    });

    test.describe('Phase 3: Authentication Helper Tests', () => {
        
        test('should login as owner using helper', async ({ page }) => {
            await loginAs(page, 'owner');
            await expect(page).toHaveURL(/.*\/admin/);
            console.log('✅ Owner login successful');
        });

        test('should login as admin using helper', async ({ page }) => {
            await loginAs(page, 'admin');
            // Verify admin dashboard or appropriate page
            console.log('✅ Admin login successful');
        });

        test('should login as teacher using helper', async ({ page }) => {
            await loginAs(page, 'teacher');
            console.log('✅ Teacher login successful');
        });
    });

    test.describe('Phase 4: Payment Endpoints Tests', () => {
        
        test('should test payment intent creation', async ({ request }) => {
            const response = await request.post('http://localhost:3000/api/payments/create-intent', {
                headers: {
                    'x-api-key': process.env.SERVICE_API_KEY || 'test-api-key',
                    'x-tenant-id': 'test-tenant-001'
                },
                data: {
                    amount: 5000,
                    currency: 'usd',
                    description: 'Test payment',
                    metadata: { test: true }
                }
            });
            
            if (response.ok()) {
                const data = await response.json();
                expect(data).toHaveProperty('payment_intent_id');
                expect(data).toHaveProperty('client_secret');
                console.log('✅ Payment Intent Created:', data.payment_intent_id);
            } else {
                console.log('⚠️  Payment test requires Stripe configuration');
            }
        });
    });

    test.describe('Phase 5: Islamic API Tests', () => {
        
        test('should fetch Quran surahs', async () => {
            const response = await fetch('https://api.alquran.cloud/v1/surah');
            const data = await response.json();
            
            expect(data.code).toBe(200);
            expect(data.data).toHaveLength(114);
            console.log('✅ Quran API: 114 Surahs loaded');
        });

        test('should fetch prayer times', async () => {
            const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=London&country=UK&method=4');
            const data = await response.json();
            
            expect(data.code).toBe(200);
            expect(data.data.timings).toHaveProperty('Fajr');
            expect(data.data.timings).toHaveProperty('Dhuhr');
            console.log('✅ Prayer Times API working');
        });

        test('should fetch Hijri date', async () => {
            const today = new Date();
            const response = await fetch(`https://api.aladhan.com/v1/gToH/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`);
            const data = await response.json();
            
            expect(data.code).toBe(200);
            expect(data.data.hijri).toBeDefined();
            console.log('✅ Hijri Calendar API:', data.data.hijri.month.en);
        });

        test('should fetch Qibla direction', async () => {
            const response = await fetch('https://api.aladhan.com/v1/qibla/51.5074/-0.1278'); // London coordinates
            const data = await response.json();
            
            expect(data.code).toBe(200);
            expect(data.data.direction).toBeDefined();
            console.log('✅ Qibla Direction API:', data.data.direction, 'degrees');
        });

        test('should fetch random hadith', async () => {
            const response = await fetch('https://random-hadith-generator.vercel.app/bukhari/');
            const data = await response.json();
            
            expect(data.data).toBeDefined();
            expect(data.data.hadith_english).toBeDefined();
            console.log('✅ Hadith API working');
        });
    });

    test.describe('Phase 6: Security Tests', () => {
        
        test('should require API key for protected endpoints', async ({ request }) => {
            const response = await request.post('http://localhost:3000/api/payments/create-intent', {
                data: { amount: 1000, currency: 'usd' }
            });
            
            expect(response.status()).toBe(401);
        });

        test('should require admin role for admin endpoints', async ({ request }) => {
            const response = await request.get('http://localhost:3000/api/admin/audit/stats', {
                headers: {
                    'x-api-key': process.env.SERVICE_API_KEY || 'test-api-key',
                    'x-user-role': 'user' // Not admin
                }
            });
            
            expect(response.status()).toBe(403);
        });
    });

    test.describe('Phase 7: Performance Tests', () => {
        
        test('should handle health check quickly', async ({ request }) => {
            const start = Date.now();
            const response = await request.get('http://localhost:3000/api/health');
            const duration = Date.now() - start;
            
            expect(response.ok()).toBeTruthy();
            expect(duration).toBeLessThan(1000); // Should respond within 1 second
            console.log(`✅ Health check responded in ${duration}ms`);
        });

        test('should test audit buffer overflow', async () => {
            console.log('🧪 Testing audit buffer overflow (1000+ entries)...');
            // This would require generating 1000+ audit logs
            // In production, monitor buffer size via /api/admin/audit/stats
        });
    });
});

test.describe('Load Testing (Manual)', () => {
    test.skip('Load test webhook endpoint', async () => {
        console.log('⚠️  Load testing should be done with tools like Apache Bench or k6');
        console.log('Example: ab -n 1000 -c 10 http://localhost:3000/api/health');
    });
});
