import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { events } from '../../drizzle/schema';
import { ApiResponse } from './api';

/**
 * Base event type from database schema
 */
export type Event = InferSelectModel<typeof events>;

/**
 * Event data for insertion (without auto-generated fields)
 */
export type NewEvent = InferInsertModel<typeof events>;

/**
 * Create event request payload
 */
export interface CreateEventRequest {
  id: string;
  name: string;
}

/**
 * Update event request payload (partial update)
 */
export interface UpdateEventRequest {
  name?: string;
}

/**
 * Event response wrapper
 */
export interface EventResponse extends ApiResponse<Event> {
  data: Event;
}

/**
 * Event list response wrapper
 */
export interface EventListResponse extends ApiResponse<Event[]> {
  data: Event[];
  count: number;
}

/**
 * Event query parameters for filtering/pagination
 */
export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Event route parameters
 */
export interface EventParams {
  id: string;
}