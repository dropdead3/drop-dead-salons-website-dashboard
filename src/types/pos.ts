/**
 * POS (Point of Sale) System Types
 * 
 * This module defines the abstraction layer for multi-POS support.
 * The adapter pattern allows the application to work with different
 * POS systems (Phorest, Square, Boulevard, Zenoti, etc.) through
 * a unified interface.
 */

// Supported POS system types
export type POSType = 'phorest' | 'square' | 'boulevard' | 'zenoti' | 'manual';

// Appointment status normalized across POS systems
export type POSAppointmentStatus = 
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

/**
 * Normalized appointment data structure
 */
export interface POSAppointment {
  id: string;
  externalId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  stylistUserId?: string;
  stylistName?: string;
  locationId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  serviceName: string;
  serviceCategory?: string;
  status: POSAppointmentStatus;
  totalPrice?: number;
  tipAmount?: number;
  notes?: string;
  rebookedAtCheckout?: boolean;
}

/**
 * Normalized client data structure
 */
export interface POSClient {
  id: string;
  externalId: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email?: string;
  phone?: string;
  preferredStylistId?: string;
  isNew: boolean;
  firstVisitDate?: string;
  lastVisitDate?: string;
  totalVisits?: number;
  totalSpend?: number;
  notes?: string;
}

/**
 * Normalized sales summary data structure
 */
export interface POSSalesSummary {
  date: string; // YYYY-MM-DD
  locationId?: string;
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  transactionCount: number;
  appointmentCount: number;
  averageTicket?: number;
  tipTotal?: number;
}

/**
 * Normalized staff member data structure
 */
export interface POSStaffMember {
  id: string;
  externalId: string;
  userId?: string; // Internal user ID mapping
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isActive: boolean;
  locationIds?: string[];
}

/**
 * Sync operation result
 */
export interface POSSyncResult {
  success: boolean;
  syncType: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errors?: string[];
  syncedAt: string;
}

/**
 * POS configuration for an organization
 */
export interface POSConfig {
  id: string;
  organizationId: string;
  posType: POSType;
  syncEnabled: boolean;
  lastSyncAt?: string;
  settings?: Record<string, unknown>;
}

/**
 * POS Adapter Interface
 * 
 * All POS integrations must implement this interface to provide
 * consistent data access across different POS systems.
 */
export interface POSAdapter {
  /** The type of POS system this adapter handles */
  readonly type: POSType;
  
  /**
   * Fetch appointments within a date range
   */
  getAppointments(params: {
    dateFrom: string;
    dateTo: string;
    locationId?: string;
    stylistUserId?: string;
    status?: POSAppointmentStatus[];
  }): Promise<POSAppointment[]>;
  
  /**
   * Fetch clients with optional search
   */
  getClients(params: {
    search?: string;
    preferredStylistId?: string;
    limit?: number;
    offset?: number;
  }): Promise<POSClient[]>;
  
  /**
   * Fetch a single client by ID
   */
  getClientById(id: string): Promise<POSClient | null>;
  
  /**
   * Fetch daily sales summaries
   */
  getSalesSummary(params: {
    dateFrom: string;
    dateTo: string;
    locationId?: string;
  }): Promise<POSSalesSummary[]>;
  
  /**
   * Fetch staff members
   */
  getStaffMembers(params?: {
    locationId?: string;
    isActive?: boolean;
  }): Promise<POSStaffMember[]>;
  
  /**
   * Trigger a data sync operation
   */
  syncData(syncType: 'full' | 'incremental' | 'appointments' | 'clients' | 'sales'): Promise<POSSyncResult>;
  
  /**
   * Check if the POS connection is healthy
   */
  checkHealth(): Promise<{ healthy: boolean; message?: string }>;
}

/**
 * Factory function type for creating POS adapters
 */
export type POSAdapterFactory = (organizationId: string) => POSAdapter;
