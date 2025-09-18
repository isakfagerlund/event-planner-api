import { Context } from 'hono';
import { Event, CreateEventRequest, UpdateEventRequest, EventQueryParams } from './events';

/**
 * Base controller interface with common HTTP methods
 */
export interface BaseController {
  /**
   * Handle GET request for listing resources
   */
  index(c: Context): Promise<Response>;
  
  /**
   * Handle POST request for creating a resource
   */
  create(c: Context): Promise<Response>;
  
  /**
   * Handle GET request for a specific resource
   */
  show(c: Context): Promise<Response>;
  
  /**
   * Handle PUT request for updating a resource
   */
  update(c: Context): Promise<Response>;
  
  /**
   * Handle DELETE request for removing a resource
   */
  destroy(c: Context): Promise<Response>;
}

/**
 * Event controller interface with typed methods
 */
export interface EventController extends BaseController {
  /**
   * Get all events with optional filtering
   */
  getAllEvents(c: Context): Promise<Response>;
  
  /**
   * Create a new event
   */
  createEvent(c: Context): Promise<Response>;
  
  /**
   * Get a specific event by ID
   */
  getEventById(c: Context): Promise<Response>;
  
  /**
   * Update an existing event
   */
  updateEvent(c: Context): Promise<Response>;
  
  /**
   * Delete an event
   */
  deleteEvent(c: Context): Promise<Response>;
}

/**
 * Controller method context with typed request data
 */
export interface ControllerContext<TBody = unknown, TParams = unknown, TQuery = unknown> extends Context {
  req: Context['req'] & {
    valid: (target: 'json') => TBody;
    param: (key: keyof TParams) => string;
    query: (key: keyof TQuery) => string | undefined;
  };
}