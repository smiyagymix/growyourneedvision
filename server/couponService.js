/**
 * Coupon & Discount Code Management Service
 * Handles promotional codes, discounts, and usage tracking
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class CouponService {
    /**
     * Create a coupon code
     */
    async createCoupon({ 
        code, 
        percentOff, 
        amountOff, 
        currency = 'usd',
        duration = 'once', // once | repeating | forever
        durationInMonths,
        maxRedemptions,
        redeemBy,
        metadata = {}
    }) {
        try {
            const couponData = {
                id: code.toUpperCase().replace(/\s+/g, ''),
                name: code,
                metadata: {
                    ...metadata,
                    created_by: 'admin',
                    created_at: new Date().toISOString()
                }
            };

            // Set discount type (percentage or fixed amount)
            if (percentOff) {
                couponData.percent_off = percentOff;
            } else if (amountOff) {
                couponData.amount_off = amountOff;
                couponData.currency = currency;
            } else {
                throw new Error('Either percentOff or amountOff must be provided');
            }

            // Set duration
            couponData.duration = duration;
            if (duration === 'repeating' && durationInMonths) {
                couponData.duration_in_months = durationInMonths;
            }

            // Set usage limits
            if (maxRedemptions) {
                couponData.max_redemptions = maxRedemptions;
            }

            // Set expiration date
            if (redeemBy) {
                couponData.redeem_by = Math.floor(new Date(redeemBy).getTime() / 1000);
            }

            const coupon = await stripe.coupons.create(couponData);

            console.log(`✅ Coupon created: ${coupon.id}`);
            return coupon;
        } catch (error) {
            console.error('❌ Error creating coupon:', error);
            throw error;
        }
    }

    /**
     * Create a promotion code (customer-facing code)
     */
    async createPromotionCode({
        couponId,
        code,
        active = true,
        maxRedemptions,
        firstTimeTransaction = false,
        minimumAmount,
        minimumAmountCurrency = 'usd',
        expiresAt,
        metadata = {}
    }) {
        try {
            const promoData = {
                coupon: couponId,
                code: code.toUpperCase().replace(/\s+/g, ''),
                active,
                metadata: {
                    ...metadata,
                    created_at: new Date().toISOString()
                }
            };

            // Set usage limits
            if (maxRedemptions) {
                promoData.max_redemptions = maxRedemptions;
            }

            // Restrict to first-time customers only
            if (firstTimeTransaction) {
                promoData.restrictions = {
                    first_time_transaction: true
                };
            }

            // Set minimum purchase amount
            if (minimumAmount) {
                promoData.restrictions = {
                    ...promoData.restrictions,
                    minimum_amount: minimumAmount,
                    minimum_amount_currency: minimumAmountCurrency
                };
            }

            // Set expiration
            if (expiresAt) {
                promoData.expires_at = Math.floor(new Date(expiresAt).getTime() / 1000);
            }

            const promotionCode = await stripe.promotionCodes.create(promoData);

            console.log(`✅ Promotion code created: ${promotionCode.code}`);
            return promotionCode;
        } catch (error) {
            console.error('❌ Error creating promotion code:', error);
            throw error;
        }
    }

    /**
     * Get all coupons
     */
    async getAllCoupons(limit = 100) {
        try {
            const coupons = await stripe.coupons.list({ limit });
            return coupons.data;
        } catch (error) {
            console.error('❌ Error fetching coupons:', error);
            throw error;
        }
    }

    /**
     * Get all promotion codes
     */
    async getAllPromotionCodes(active = null, limit = 100) {
        try {
            const params = { limit };
            if (active !== null) {
                params.active = active;
            }

            const promotionCodes = await stripe.promotionCodes.list(params);
            
            // Enrich with redemption data
            const enrichedCodes = await Promise.all(
                promotionCodes.data.map(async (promo) => {
                    const coupon = await stripe.coupons.retrieve(promo.coupon);
                    return {
                        ...promo,
                        couponDetails: coupon,
                        redemptionsRemaining: promo.max_redemptions 
                            ? promo.max_redemptions - (promo.times_redeemed || 0)
                            : 'Unlimited'
                    };
                })
            );

            return enrichedCodes;
        } catch (error) {
            console.error('❌ Error fetching promotion codes:', error);
            throw error;
        }
    }

    /**
     * Validate a promotion code
     */
    async validatePromotionCode(code, customerId = null) {
        try {
            const promotionCodes = await stripe.promotionCodes.list({
                code: code.toUpperCase(),
                limit: 1
            });

            if (promotionCodes.data.length === 0) {
                return {
                    valid: false,
                    error: 'Invalid promotion code'
                };
            }

            const promo = promotionCodes.data[0];
            const coupon = await stripe.coupons.retrieve(promo.coupon);

            // Check if active
            if (!promo.active || !coupon.valid) {
                return {
                    valid: false,
                    error: 'This promotion code is no longer active'
                };
            }

            // Check expiration
            if (promo.expires_at && promo.expires_at < Math.floor(Date.now() / 1000)) {
                return {
                    valid: false,
                    error: 'This promotion code has expired'
                };
            }

            // Check redemption limit
            if (promo.max_redemptions && promo.times_redeemed >= promo.max_redemptions) {
                return {
                    valid: false,
                    error: 'This promotion code has reached its redemption limit'
                };
            }

            // Check if first-time transaction restriction applies
            if (promo.restrictions?.first_time_transaction && customerId) {
                const subscriptions = await stripe.subscriptions.list({
                    customer: customerId,
                    limit: 1
                });

                if (subscriptions.data.length > 0) {
                    return {
                        valid: false,
                        error: 'This promotion code is only valid for first-time customers'
                    };
                }
            }

            return {
                valid: true,
                promotionCode: promo,
                coupon: coupon,
                discount: coupon.percent_off 
                    ? `${coupon.percent_off}% off`
                    : `$${coupon.amount_off / 100} off`,
                duration: coupon.duration,
                durationInMonths: coupon.duration_in_months
            };
        } catch (error) {
            console.error('❌ Error validating promotion code:', error);
            return {
                valid: false,
                error: 'Failed to validate promotion code'
            };
        }
    }

    /**
     * Apply promotion code to subscription
     */
    async applyToSubscription(subscriptionId, promotionCodeId) {
        try {
            const subscription = await stripe.subscriptions.update(subscriptionId, {
                promotion_code: promotionCodeId,
                proration_behavior: 'none' // Don't prorate when applying discount
            });

            console.log(`✅ Promotion code applied to subscription: ${subscriptionId}`);
            return subscription;
        } catch (error) {
            console.error('❌ Error applying promotion code:', error);
            throw error;
        }
    }

    /**
     * Remove discount from subscription
     */
    async removeFromSubscription(subscriptionId) {
        try {
            const subscription = await stripe.subscriptions.update(subscriptionId, {
                promotion_code: '',
                proration_behavior: 'none'
            });

            console.log(`✅ Discount removed from subscription: ${subscriptionId}`);
            return subscription;
        } catch (error) {
            console.error('❌ Error removing discount:', error);
            throw error;
        }
    }

    /**
     * Deactivate a promotion code
     */
    async deactivatePromotionCode(promotionCodeId) {
        try {
            const promotionCode = await stripe.promotionCodes.update(promotionCodeId, {
                active: false
            });

            console.log(`✅ Promotion code deactivated: ${promotionCodeId}`);
            return promotionCode;
        } catch (error) {
            console.error('❌ Error deactivating promotion code:', error);
            throw error;
        }
    }

    /**
     * Delete a coupon
     */
    async deleteCoupon(couponId) {
        try {
            const deleted = await stripe.coupons.del(couponId);
            console.log(`✅ Coupon deleted: ${couponId}`);
            return deleted;
        } catch (error) {
            console.error('❌ Error deleting coupon:', error);
            throw error;
        }
    }

    /**
     * Get coupon usage statistics
     */
    async getCouponStats(couponId) {
        try {
            const coupon = await stripe.coupons.retrieve(couponId);
            
            // Get all promotion codes for this coupon
            const promoCodes = await stripe.promotionCodes.list({
                coupon: couponId,
                limit: 100
            });

            const totalRedemptions = promoCodes.data.reduce(
                (sum, promo) => sum + (promo.times_redeemed || 0),
                0
            );

            // Get all customers who used this coupon
            const subscriptions = await stripe.subscriptions.list({
                limit: 100
            });

            const subscribersWithCoupon = subscriptions.data.filter(
                sub => sub.discount?.coupon?.id === couponId
            );

            const totalRevenueLost = subscribersWithCoupon.reduce((sum, sub) => {
                const discount = sub.discount;
                if (!discount) return sum;

                const price = sub.items.data[0]?.price?.unit_amount || 0;
                const discountAmount = discount.coupon.percent_off
                    ? (price * discount.coupon.percent_off) / 100
                    : discount.coupon.amount_off || 0;

                return sum + discountAmount;
            }, 0);

            return {
                couponId,
                name: coupon.name,
                valid: coupon.valid,
                timesRedeemed: coupon.times_redeemed || 0,
                totalRedemptions,
                activePromoCodes: promoCodes.data.filter(p => p.active).length,
                totalPromoCodes: promoCodes.data.length,
                activeSubscribers: subscribersWithCoupon.length,
                estimatedRevenueLost: totalRevenueLost / 100, // Convert cents to dollars
                discount: coupon.percent_off 
                    ? `${coupon.percent_off}%`
                    : `$${coupon.amount_off / 100}`,
                duration: coupon.duration,
                createdAt: new Date(coupon.created * 1000),
                expiresAt: coupon.redeem_by ? new Date(coupon.redeem_by * 1000) : null
            };
        } catch (error) {
            console.error('❌ Error fetching coupon stats:', error);
            throw error;
        }
    }

    /**
     * Bulk create promotion codes for a campaign
     */
    async createBulkPromotionCodes({
        couponId,
        prefix,
        count = 100,
        expiresAt,
        maxRedemptionsPerCode = 1,
        metadata = {}
    }) {
        try {
            const codes = [];
            const errors = [];

            for (let i = 1; i <= count; i++) {
                const code = `${prefix}${String(i).padStart(4, '0')}`;
                
                try {
                    const promoCode = await this.createPromotionCode({
                        couponId,
                        code,
                        maxRedemptions: maxRedemptionsPerCode,
                        expiresAt,
                        metadata: {
                            ...metadata,
                            bulk_batch: prefix,
                            batch_index: i
                        }
                    });
                    
                    codes.push(promoCode);
                } catch (error) {
                    errors.push({ code, error: error.message });
                }
            }

            console.log(`✅ Bulk promotion codes created: ${codes.length}/${count} successful`);
            
            return {
                success: codes.length,
                failed: errors.length,
                codes,
                errors
            };
        } catch (error) {
            console.error('❌ Error creating bulk promotion codes:', error);
            throw error;
        }
    }

    /**
     * Send promotion code via email
     */
    async sendPromotionEmail(email, customerName, promotionCode, couponDetails) {
        console.log(`[EMAIL] Would send promotion code ${promotionCode} to ${email}`);
        // TODO: Implement email service
        /*
        try {
            await emailService.sendEmail({
                to: email,
                subject: `Special Offer: ${couponDetails.percent_off || couponDetails.amount_off}% Off!`,
                template: 'promotion_code',
                context: {
                    name: customerName || 'Valued Customer',
                    code: promotionCode,
                    discount: couponDetails.percent_off 
                        ? `${couponDetails.percent_off}% off`
                        : `$${couponDetails.amount_off / 100} off`,
                    duration: couponDetails.duration,
                    durationText: this.getDurationText(couponDetails),
                    expiresAt: couponDetails.redeem_by 
                        ? new Date(couponDetails.redeem_by * 1000).toLocaleDateString()
                        : null,
                    redeemUrl: `${process.env.FRONTEND_URL}/subscribe?promo=${promotionCode}`
                }
            });

            console.log(`✅ Promotion email sent to ${email}`);
        } catch (error) {
            console.error('❌ Error sending promotion email:', error);
            throw error;
        }
        */
    }

    /**
     * Helper: Get human-readable duration text
     */
    getDurationText(coupon) {
        switch (coupon.duration) {
            case 'once':
                return 'first payment';
            case 'forever':
                return 'lifetime of subscription';
            case 'repeating':
                return `${coupon.duration_in_months} months`;
            default:
                return coupon.duration;
        }
    }
}

export const couponService = new CouponService();
export default couponService;
