import { Event, CreateEventRequest, UpdateEventRequest, EventQueryParams } from './events';

/**
 * Base service interface for CRUD operations
 */
export interface BaseService<T, TCreate, TUpdate> {
  /**
   * Find all records with optional filtering
   */
  findAll(params?: Record<string, unknown>): Promise<T[]>;
  
  /**
   * Create a new record
   */
  create(data: TCreate): Promise<T>;
  
  /**
   * Find a record by ID
   */
  findById(id: string): Promise<T | null>;
  
  /**
   * Update a record by ID
   */
  update(id: string, data: TUpdate): Promise<T>;
  
  /**
   * Delete a record by ID
   */
  delete(id: string): Promise<void>;
  
  /**
   * Check if a record exists by ID
   */
  exists(id: string): Promise<boolean>;
}

/**
 * Event service interface with typed methods
 */
export interface EventService extends BaseService<Event, CreateEventRequest, UpdateEventRequest> {
  /**
   * Find all events with optional query parameters
   */
  findAll(params?: EventQueryParams): Promise<Event[]>;
  
  /**
   * Create a new event
   */
  create(data: CreateEventRequest): Promise<Event>;
  
  /**
   * Find an event by ID
   */
  findById(id: string): Promise<Event | null>;
  
  /**
   * Update an event by ID
   */
  update(id: string, data: UpdateEventRequest): Promise<Event>;
  
  /**
   * Delete an event by ID
   */
  delete(id: string): Promise<void>;
  
  /**
   * Check if an event exists by ID
   */
  exists(id: string): Promise<boolean>;
  
  /**
   * Find events by name (search functionality)
   */
  findByName(name: string): Promise<Event[]>;
  
  /**
   * Get total count of events
   */
  count(params?: EventQueryParams): Promise<number>;
}

/**
 * Database service interface for connection management
 */
export interface DatabaseService {
  /**
   * Get database connection instance
   */
  getConnection(): unknown;
  
  /**
   * Test database connectivity
   */
  healthCheck(): Promise<boolean>;
  
  /**
   * Close database connection
   */
  close(): Promise<void>;
}