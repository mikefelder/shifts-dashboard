/**
 * Rate Limiting Middleware
 *
 * Prevents abuse by limiting request rates from individual clients.
 */

import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * General API rate limiter
 * Limit: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for health check endpoint
  skip: (req: Request) => req.path === '/health' || req.path === '/',
});

/**
 * Strict rate limiter for authentication-related endpoints
 * Limit: 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Moderate rate limiter for data-fetching endpoints
 * Limit: 200 requests per 15 minutes per IP
 */
export const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for data fetching
  message: {
    error: 'Too many data requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
