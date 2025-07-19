// Session Management Utility
// This utility helps with debugging and managing user sessions

export interface SessionMetadata {
  sessionStart: number;
  userId: string;
  expiresAt?: number;
}

export const SESSION_DURATION = 12 * 60 * 60; // 12 hours in seconds
export const STORAGE_KEY = 'bms_session_metadata';

export class SessionManager {
  static store(session: any): void {
    const metadata: SessionMetadata = {
      sessionStart: Math.floor(Date.now() / 1000),
      userId: session.user.id,
      expiresAt: session.expires_at,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
    console.log('Session stored:', {
      userId: metadata.userId,
      sessionStart: new Date(metadata.sessionStart * 1000).toLocaleString(),
      willExpireAt: new Date((metadata.sessionStart + SESSION_DURATION) * 1000).toLocaleString(),
    });
  }

  static get(): SessionMetadata | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Session metadata cleared');
  }

  static hasMetadata(): boolean {
    return this.get() !== null;
  }

  static isExpired(): boolean {
    const metadata = this.get();
    if (!metadata) {
      // No metadata means either no session or fresh session
      // Don't consider this as "expired" - let the calling code handle it
      return false;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const sessionAge = now - metadata.sessionStart;
    const isExpired = sessionAge > SESSION_DURATION;
    
    if (isExpired) {
      console.log('Session expired:', {
        sessionAge: Math.floor(sessionAge / 60), // minutes
        maxAge: Math.floor(SESSION_DURATION / 60), // minutes
        sessionStart: new Date(metadata.sessionStart * 1000).toLocaleString(),
        now: new Date().toLocaleString(),
      });
    }
    
    return isExpired;
  }

  static getTimeRemaining(): number {
    const metadata = this.get();
    if (!metadata) return 0;
    
    const now = Math.floor(Date.now() / 1000);
    const sessionAge = now - metadata.sessionStart;
    const remaining = SESSION_DURATION - sessionAge;
    
    return Math.max(0, remaining);
  }

  static getTimeRemainingFormatted(): string {
    const remaining = this.getTimeRemaining();
    if (remaining === 0) return 'Expired';
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  }

  static debug(): void {
    const metadata = this.get();
    if (!metadata) {
      console.log('No session metadata found');
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const sessionAge = now - metadata.sessionStart;
    const remaining = this.getTimeRemaining();
    
    console.log('Session Debug Info:', {
      userId: metadata.userId,
      sessionStart: new Date(metadata.sessionStart * 1000).toLocaleString(),
      currentTime: new Date().toLocaleString(),
      sessionAge: `${Math.floor(sessionAge / 60)} minutes`,
      timeRemaining: this.getTimeRemainingFormatted(),
      isExpired: this.isExpired(),
      maxDuration: `${Math.floor(SESSION_DURATION / 3600)} hours`,
    });
  }
}

// Global debug function (can be called from browser console)
(window as any).debugSession = () => SessionManager.debug();
