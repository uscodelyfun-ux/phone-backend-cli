# 📱 Phone Backend CLI

Command-line tool to turn your Android phone into a backend server.

## 🚀 Installation

### On Android (Termux)

```bash
# 1. Install Termux from F-Droid
# Download: https://f-droid.org/

# 2. Update packages
pkg update && pkg upgrade

# 3. Install Node.js
pkg install nodejs

# 4. Install CLI
npm install -g @yourname/phone-backend

# 5. Verify
phone-backend help
```

## 📝 Commands

### `phone-backend login <username>`

Authenticate with the platform.

```bash
phone-backend login myusername

# Output:
✅ Logged in as: myusername
Run "phone-backend start" to begin serving
```

### `phone-backend start`

Start the backend server.

```bash
phone-backend start

# Output:
🚀 Phone Backend Starting...
📱 Username: myusername
✅ Connected to routing service
✅ Authentication successful
🔗 Your API URL: https://routing-url.app/api/u/myusername
📊 Status: Online ✅
Press Ctrl+C to stop
```

### `phone-backend status`

Check connection status.

```bash
phone-backend status

# Output:
📊 Phone Backend Status
Username: myusername
Logged in: 2024-02-10T12:00:00.000Z
To start: phone-backend start
```

### `phone-backend data`

View local database.

```bash
phone-backend data

# Output:
📁 Local Database:
{
  "todos": {
    "1234567890": {
      "id": "1234567890",
      "title": "Learn backend",
      "done": false
    }
  }
}
```

### `phone-backend help`

Show help message.

```bash
phone-backend help
```

## 📂 File Storage

```
~/.phone-backend/
├── config.json          # User credentials
└── data/
    └── database.json    # Local database
```

## 🔧 Configuration

Edit `~/.phone-backend/config.json`:

```json
{
  "username": "myusername",
  "timestamp": "2024-02-10T12:00:00.000Z"
}
```

## 🎯 API Request Handling

The CLI automatically handles:

### GET Requests
```
GET /todos → Returns all todos
GET /todos/123 → Returns specific todo
```

### POST Requests
```
POST /todos
Body: { "title": "New todo" }
→ Creates todo with auto-generated ID
```

### PATCH Requests
```
PATCH /todos/123
Body: { "done": true }
→ Updates specific todo
```

### DELETE Requests
```
DELETE /todos/123
→ Deletes specific todo
```

## 🔄 Running in Background

### Option 1: tmux

```bash
# Install tmux
pkg install tmux

# Start session
tmux new -s backend

# Start server
phone-backend start

# Detach: Ctrl+B, then D
# Reattach: tmux attach -t backend
```

### Option 2: Wake Lock

```bash
# Install wake lock
pkg install termux-wake-lock

# Acquire lock
termux-wake-lock

# Start server
phone-backend start &
```

### Option 3: Termux:Boot

```bash
# Install Termux:Boot from F-Droid
# Create startup script:

mkdir -p ~/.termux/boot
nano ~/.termux/boot/start-backend.sh

# Add:
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
phone-backend start

# Make executable:
chmod +x ~/.termux/boot/start-backend.sh
```

## 🐛 Troubleshooting

### Can't connect to routing service

```bash
# Check internet connection
ping google.com

# Check routing URL in code
# Edit: node_modules/@yourname/phone-backend/bin/phone-backend.js
# Update ROUTING_URL
```

### Command not found

```bash
# Install globally
npm install -g @yourname/phone-backend

# Verify installation
which phone-backend
```

### Database not saving

```bash
# Check permissions
ls -la ~/.phone-backend/

# Recreate directory
rm -rf ~/.phone-backend
phone-backend login myusername
```

### Phone keeps disconnecting

```bash
# Use wake lock
termux-wake-lock

# Check WiFi stability
# Use tmux to keep running
```

## 💡 Tips

1. **Keep phone plugged in** - Running server drains battery
2. **Use stable WiFi** - Mobile data may disconnect
3. **Monitor logs** - Watch for errors
4. **Backup data** - Download database.json periodically
5. **Use old phone** - Don't use daily driver

## 🎓 How It Works

```
1. CLI connects to routing service via WebSocket
2. Authenticates with username
3. Waits for API requests
4. Processes requests against local database
5. Sends responses back via WebSocket
6. Routing service forwards to client
```

## 📊 Database Structure

```json
{
  "collection_name": {
    "item_id": {
      "field": "value"
    }
  }
}
```

Example:
```json
{
  "users": {
    "user1": {
      "name": "John",
      "email": "john@example.com"
    }
  },
  "posts": {
    "post1": {
      "title": "Hello World",
      "author": "user1"
    }
  }
}
```

## 🔒 Security

- Local database (not exposed)
- WebSocket authentication
- Request validation
- Error handling
- No sensitive data in logs

## 🚀 Publishing (For Developers)

```bash
# Update version
npm version patch

# Login to NPM
npm login

# Publish
npm publish --access=public
```

## 📝 Development

```bash
# Clone repo
git clone https://github.com/yourname/phone-backend-cli

# Install dependencies
npm install

# Test locally
node bin/phone-backend.js help

# Make executable
chmod +x bin/phone-backend.js
```

---

**For complete setup guide, see the main README.md**
