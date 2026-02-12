#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { io } from 'socket.io-client';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const CONFIG_DIR = join(homedir(), '.phone-backend');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const DATA_DIR = join(CONFIG_DIR, 'data');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDiS42BJ1Ppc1z9UNrdyTKWtb8qmkKuQ_Y",
  authDomain: "harshitproto.firebaseapp.com",
  projectId: "harshitproto",
  storageBucket: "harshitproto.firebasestorage.app",
  messagingSenderId: "805078252087",
  appId: "1:805078252087:web:1ca3704d0e672906445db2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Ensure config directory exists
if (!existsSync(CONFIG_DIR)) {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Database class
class Database {
  constructor() {
    this.dbFile = join(DATA_DIR, 'database.json');
    this.data = this.load();
  }

  load() {
    if (existsSync(this.dbFile)) {
      try {
        return JSON.parse(readFileSync(this.dbFile, 'utf8'));
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  save() {
    writeFileSync(this.dbFile, JSON.stringify(this.data, null, 2));
  }

  get(path) {
    const parts = path.split('/').filter(p => p);
    let current = this.data;
    
    for (const part of parts) {
      if (current[part] === undefined) {
        return null;
      }
      current = current[part];
    }
    
    return current;
  }

  set(path, value) {
    const parts = path.split('/').filter(p => p);
    let current = this.data;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    this.save();
  }

  delete(path) {
    const parts = path.split('/').filter(p => p);
    let current = this.data;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        return false;
      }
      current = current[parts[i]];
    }
    
    delete current[parts[parts.length - 1]];
    this.save();
    return true;
  }

  getAll() {
    return this.data;
  }
}

// Load or create config
function loadConfig() {
  if (existsSync(CONFIG_FILE)) {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
  }
  return null;
}

function saveConfig(config) {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Commands
const commands = {
  login: async () => {
    console.log('🔐 Login to Phone Backend Platform');
    console.log('\nPlease visit the dashboard to get your authentication token:');
    console.log('https://your-domain.com/dashboard/tokens');
    console.log('\nEnter your username:');
    
    // For now, save a simple config
    const username = process.argv[3] || 'testuser';
    
    const config = {
      username: username,
      timestamp: new Date().toISOString()
    };
    
    saveConfig(config);
    console.log(`✅ Logged in as: ${username}`);
    console.log('Run "phone-backend start" to begin serving');
  },

  start: async () => {
    const config = loadConfig();
    
    if (!config) {
      console.log('❌ Not logged in. Run "phone-backend login" first');
      return;
    }

    console.log('🚀 Phone Backend Starting...');
    console.log(`📱 Username: ${config.username}`);
    
    const db = new Database();
    const ROUTING_URL = process.env.ROUTING_URL || 'http://localhost:3001';
    
    const socket = io(ROUTING_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to routing service');
      
      // Authenticate
      socket.emit('authenticate', {
        username: config.username,
        userId: config.username
      });
    });

    socket.on('authenticated', (data) => {
      console.log('✅ Authentication successful');
      console.log(`\n🔗 Your API URL: ${ROUTING_URL}/api/u/${config.username}`);
      console.log('\n📊 Status: Online ✅');
      console.log('Press Ctrl+C to stop\n');
    });

    socket.on('auth_error', (data) => {
      console.log('❌ Authentication failed:', data.message);
      process.exit(1);
    });

    socket.on('api_request', async (request) => {
      console.log(`📨 ${request.method} ${request.path}`);
      
      try {
        let response;
        
        switch (request.method) {
          case 'GET':
            const data = db.get(request.path);
            response = {
              requestId: request.id,
              statusCode: data !== null ? 200 : 404,
              body: data !== null ? data : { error: 'Not found' }
            };
            break;
            
          case 'POST':
            const id = Date.now().toString();
            const pathParts = request.path.split('/').filter(p => p);
            const newPath = `${request.path}/${id}`;
            db.set(newPath, { id, ...request.body });
            response = {
              requestId: request.id,
              statusCode: 201,
              body: { id, ...request.body }
            };
            break;
            
          case 'PATCH':
            const existing = db.get(request.path);
            if (existing) {
              db.set(request.path, { ...existing, ...request.body });
              response = {
                requestId: request.id,
                statusCode: 200,
                body: { ...existing, ...request.body }
              };
            } else {
              response = {
                requestId: request.id,
                statusCode: 404,
                body: { error: 'Not found' }
              };
            }
            break;
            
          case 'DELETE':
            const deleted = db.delete(request.path);
            response = {
              requestId: request.id,
              statusCode: deleted ? 200 : 404,
              body: deleted ? { success: true } : { error: 'Not found' }
            };
            break;
            
          default:
            response = {
              requestId: request.id,
              statusCode: 405,
              body: { error: 'Method not allowed' }
            };
        }
        
        socket.emit('api_response', response);
        console.log(`✅ ${response.statusCode}`);
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        socket.emit('api_response', {
          requestId: request.id,
          statusCode: 500,
          error: error.message
        });
      }
    });

    socket.on('get_data_snapshot', (data) => {
      const snapshot = db.getAll();
      socket.emit('data_snapshot', {
        requestId: data.requestId,
        snapshot
      });
      console.log('📸 Sent data snapshot');
    });

    socket.on('disconnect', () => {
      console.log('📴 Disconnected from routing service');
    });

    socket.on('error', (error) => {
      console.log('❌ Error:', error);
    });

    // Heartbeat
    setInterval(() => {
      socket.emit('heartbeat');
    }, 30000);

    // Handle exit
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down...');
      socket.disconnect();
      process.exit(0);
    });
  },

  status: async () => {
    const config = loadConfig();
    
    if (!config) {
      console.log('❌ Not logged in');
      return;
    }

    console.log('📊 Phone Backend Status\n');
    console.log(`Username: ${config.username}`);
    console.log(`Logged in: ${config.timestamp}`);
    console.log(`\nTo start: phone-backend start`);
  },

  data: async () => {
    const db = new Database();
    const data = db.getAll();
    
    console.log('📁 Local Database:\n');
    console.log(JSON.stringify(data, null, 2));
  },

  help: () => {
    console.log(`
📱 Phone Backend CLI

Commands:
  login        Login to Phone Backend Platform
  start        Start the backend server
  status       Show connection status
  data         View local database
  help         Show this help message

Examples:
  phone-backend login testuser
  phone-backend start
  phone-backend status
  phone-backend data

For more info: https://your-domain.com/docs
    `);
  }
};

// Main
const command = process.argv[2];

if (!command || !commands[command]) {
  commands.help();
} else {
  commands[command]().catch(console.error);
}
