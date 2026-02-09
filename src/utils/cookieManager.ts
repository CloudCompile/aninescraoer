/**
 * Dynamic Cookie Manager for YouTube
 * 
 * Automatically fetches cookies from YouTube without requiring manual export.
 * Based on the approach discussed in yt-dl issue #32734.
 * 
 * This helps bypass bot detection by getting fresh cookies dynamically,
 * similar to how curl gets cookies automatically.
 */

import axios from "axios";

interface Cookie {
  name: string;
  value: string;
  domain: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
}

class YouTubeCookieManager {
  private cookies: Map<string, Cookie> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  private readonly USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  
  /**
   * Fetch fresh cookies from YouTube
   * Makes a request to youtube.com to get CONSENT and other cookies
   */
  async fetchCookies(): Promise<void> {
    try {
      const response = await axios.get("https://www.youtube.com", {
        headers: {
          "User-Agent": this.USER_AGENT,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
        },
        maxRedirects: 5,
        timeout: 10000,
        validateStatus: () => true, // Accept any status code
      });
      
      // Extract cookies from Set-Cookie headers
      const setCookieHeaders = response.headers["set-cookie"];
      if (setCookieHeaders) {
        this.parseCookies(setCookieHeaders);
      }
      
      this.lastFetch = Date.now();
      console.log(`Dynamic cookies fetched: ${this.cookies.size} cookies`);
    } catch (error) {
      console.error("Failed to fetch YouTube cookies:", error instanceof Error ? error.message : error);
      // Don't throw - fall back to existing mechanisms
    }
  }
  
  /**
   * Parse Set-Cookie headers into cookie objects
   */
  private parseCookies(setCookieHeaders: string[]): void {
    for (const cookieStr of setCookieHeaders) {
      const parts = cookieStr.split(';');
      const [nameValue] = parts;
      const [name, ...valueParts] = nameValue.split('=');
      const value = valueParts.join('=');
      
      if (!name || !value) continue;
      
      const cookie: Cookie = {
        name: name.trim(),
        value: value.trim(),
        domain: '.youtube.com',
        path: '/',
      };
      
      // Parse additional attributes
      for (let i = 1; i < parts.length; i++) {
        const attr = parts[i].trim();
        const [key, val] = attr.split('=');
        
        switch (key.toLowerCase()) {
          case 'domain':
            cookie.domain = val || '.youtube.com';
            break;
          case 'path':
            cookie.path = val || '/';
            break;
          case 'expires':
            cookie.expires = val ? new Date(val).getTime() : undefined;
            break;
          case 'httponly':
            cookie.httpOnly = true;
            break;
          case 'secure':
            cookie.secure = true;
            break;
        }
      }
      
      this.cookies.set(cookie.name, cookie);
    }
  }
  
  /**
   * Get cookies in Netscape format for yt-dlp
   */
  getNetscapeCookies(): string {
    const lines: string[] = [
      "# Netscape HTTP Cookie File",
      "# This is a generated file! Do not edit.",
      ""
    ];
    
    for (const [name, cookie] of this.cookies) {
      // Skip expired cookies
      if (cookie.expires && cookie.expires < Date.now()) {
        this.cookies.delete(name);
        continue;
      }
      
      // Format: domain, flag, path, secure, expiration, name, value
      const domain = cookie.domain;
      const flag = domain.startsWith('.') ? 'TRUE' : 'FALSE';
      const path = cookie.path || '/';
      const secure = cookie.secure ? 'TRUE' : 'FALSE';
      const expiration = cookie.expires ? Math.floor(cookie.expires / 1000) : 0;
      
      lines.push(`${domain}\t${flag}\t${path}\t${secure}\t${expiration}\t${cookie.name}\t${cookie.value}`);
    }
    
    return lines.join('\n');
  }
  
  /**
   * Get cookies as semicolon-separated string (for YOUTUBE_COOKIE format)
   */
  getCookieString(): string {
    const cookieArray: string[] = [];
    
    for (const [name, cookie] of this.cookies) {
      // Skip expired cookies
      if (cookie.expires && cookie.expires < Date.now()) {
        this.cookies.delete(name);
        continue;
      }
      
      cookieArray.push(`${cookie.name}=${cookie.value}`);
    }
    
    return cookieArray.join('; ');
  }
  
  /**
   * Get cookies as array of objects (for ytdl.createAgent format)
   */
  getCookieArray(): Array<{ name: string; value: string; domain: string }> {
    const cookieArray: Array<{ name: string; value: string; domain: string }> = [];
    
    for (const [name, cookie] of this.cookies) {
      // Skip expired cookies
      if (cookie.expires && cookie.expires < Date.now()) {
        this.cookies.delete(name);
        continue;
      }
      
      cookieArray.push({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
      });
    }
    
    return cookieArray;
  }
  
  /**
   * Check if cookies need refresh
   */
  needsRefresh(): boolean {
    return (Date.now() - this.lastFetch) > this.CACHE_TTL || this.cookies.size === 0;
  }
  
  /**
   * Get cookies, fetching if needed
   */
  async getCookies(): Promise<Array<{ name: string; value: string; domain: string }>> {
    if (this.needsRefresh()) {
      await this.fetchCookies();
    }
    
    return this.getCookieArray();
  }
  
  /**
   * Get cookie string, fetching if needed
   */
  async getCookieStringAsync(): Promise<string> {
    if (this.needsRefresh()) {
      await this.fetchCookies();
    }
    
    return this.getCookieString();
  }
  
  /**
   * Clear all cookies
   */
  clear(): void {
    this.cookies.clear();
    this.lastFetch = 0;
  }
  
  /**
   * Check if we have cookies
   */
  hasCookies(): boolean {
    return this.cookies.size > 0;
  }
}

// Singleton instance
export const youtubeCookieManager = new YouTubeCookieManager();
