import { io } from 'socket.io-client';
import { base_url } from '../config/constant';
import { retrieveEncryptedData } from '../config/storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  getSocketUrl() {
    try {
      // Convert API URL (e.g., http://192.168.1.23:5000/api) to root socket URL (http://192.168.1.23:5000)
      const parsed = new URL(base_url);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return base_url.replace(/\/api\/?$/, '');
    }
  }

  async connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    try {
      const socketUrl = this.getSocketUrl();
      const token = await retrieveEncryptedData('token');
      const userStr = await retrieveEncryptedData('user');
      const roleName = await retrieveEncryptedData('roleName');

      let userObj = null;
      try {
        if (userStr) userObj = JSON.parse(userStr);
      } catch (e) {
        console.warn('SocketService: Error parsing user json', e);
      }

      console.log(`Connecting to Socket server at ${socketUrl}...`);

      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 10000,
        auth: {
          token: token || '',
          userId: userObj?.id || '',
          roleName: roleName || userObj?.role?.name || userObj?.role || '',
          locationId: userObj?.locationId || ''
        }
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log(`Socket connected successfully with ID: ${this.socket.id}`);

        // Join role and user rooms if needed
        const currentRole = (roleName || userObj?.role?.name || userObj?.role || '').toLowerCase().replace(/\s+/g, '-');
        if (currentRole) {
          this.socket.emit('joinRoom', `role_${currentRole}`);
        }
        if (userObj?.id) {
          this.socket.emit('joinRoom', `user_${userObj.id}`);
        }
        if (userObj?.locationId) {
          this.socket.emit('joinRoom', `location_${userObj.locationId}`);
        }
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.log(`Socket disconnected: ${reason}`);
      });

      this.socket.on('connect_error', (error) => {
        console.warn(`Socket connection error: ${error?.message || error}`);
      });

      // Re-attach existing listeners
      this.listeners.forEach((callback, event) => {
        this.socket.on(event, callback);
      });

      return this.socket;
    } catch (err) {
      console.error('SocketService: Failed to initialize socket', err);
      return null;
    }
  }

  on(event, callback) {
    this.listeners.set(event, callback);
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    this.listeners.delete(event);
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket not connected, cannot emit: ${event}`);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
