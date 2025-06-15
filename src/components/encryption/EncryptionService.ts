import { supabase } from '@/integrations/supabase/client';

export interface EncryptionConfig {
  id: string;
  keyName: string;
  keyVersion: number;
  algorithm: string;
  keyStatus: 'active' | 'rotating' | 'deprecated';
  complianceLevel: 'FIPS-140-2' | 'Common-Criteria' | 'NSA-Suite-B';
  createdAt: string;
  expiresAt?: string;
  metadata: Record<string, any>;
}

export interface EncryptionAuditLog {
  operationType: 'encrypt' | 'decrypt' | 'key_rotation' | 'key_access' | 'authentication';
  userId?: string;
  resourceType: string;
  resourceId?: string;
  encryptionAlgorithm?: string;
  keyVersion?: number;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  riskScore?: number;
  metadata?: Record<string, any>;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: CryptoKey | null = null;

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  async initializeEncryption(): Promise<void> {
    try {
      // Generate or retrieve master key
      const keyMaterial = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      );
      
      this.encryptionKey = keyMaterial;
      
      await this.logAuditEvent({
        operationType: 'key_access',
        resourceType: 'encryption_service',
        success: true,
        metadata: { action: 'initialization' }
      });
    } catch (error) {
      await this.logAuditEvent({
        operationType: 'key_access',
        resourceType: 'encryption_service',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async encryptData(data: string, metadata?: Record<string, any>): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      const encryptedData = btoa(String.fromCharCode(...combined));

      await this.logAuditEvent({
        operationType: 'encrypt',
        resourceType: 'sensitive_data',
        success: true,
        encryptionAlgorithm: 'AES-256-GCM',
        metadata
      });

      return encryptedData;
    } catch (error) {
      await this.logAuditEvent({
        operationType: 'encrypt',
        resourceType: 'sensitive_data',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Encryption failed'
      });
      throw error;
    }
  }

  async decryptData(encryptedData: string, metadata?: Record<string, any>): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption service not initialized');
    }

    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey,
        encrypted
      );

      const decoder = new TextDecoder();
      const decryptedData = decoder.decode(decryptedBuffer);

      await this.logAuditEvent({
        operationType: 'decrypt',
        resourceType: 'sensitive_data',
        success: true,
        encryptionAlgorithm: 'AES-256-GCM',
        metadata
      });

      return decryptedData;
    } catch (error) {
      await this.logAuditEvent({
        operationType: 'decrypt',
        resourceType: 'sensitive_data',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Decryption failed'
      });
      throw error;
    }
  }

  async rotateKeys(): Promise<void> {
    try {
      // Generate new encryption key
      const newKeyMaterial = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      );

      this.encryptionKey = newKeyMaterial;

      await this.logAuditEvent({
        operationType: 'key_rotation',
        resourceType: 'encryption_keys',
        success: true,
        metadata: { rotation_type: 'automatic' }
      });
    } catch (error) {
      await this.logAuditEvent({
        operationType: 'key_rotation',
        resourceType: 'encryption_keys',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Key rotation failed'
      });
      throw error;
    }
  }

  private async logAuditEvent(event: EncryptionAuditLog): Promise<void> {
    try {
      const { error } = await supabase
        .from('encryption_audit_log')
        .insert({
          operation_type: event.operationType,
          user_id: event.userId,
          resource_type: event.resourceType,
          resource_id: event.resourceId,
          encryption_algorithm: event.encryptionAlgorithm,
          key_version: event.keyVersion,
          ip_address: event.ipAddress,
          user_agent: event.userAgent || navigator.userAgent,
          success: event.success,
          error_message: event.errorMessage,
          risk_score: event.riskScore,
          metadata: event.metadata || {}
        });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  async getEncryptionConfigs(): Promise<EncryptionConfig[]> {
    const { data, error } = await supabase
      .from('encryption_config')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the database response to match our interface
    return (data || []).map(config => ({
      id: config.id,
      keyName: config.key_name,
      keyVersion: config.key_version,
      algorithm: config.algorithm,
      keyStatus: config.key_status as 'active' | 'rotating' | 'deprecated',
      complianceLevel: config.compliance_level as 'FIPS-140-2' | 'Common-Criteria' | 'NSA-Suite-B',
      createdAt: config.created_at,
      expiresAt: config.expires_at,
      metadata: config.metadata as Record<string, any>
    }));
  }

  async getAuditLogs(limit: number = 100): Promise<any[]> {
    const { data, error } = await supabase
      .from('encryption_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const encryptionService = EncryptionService.getInstance();
