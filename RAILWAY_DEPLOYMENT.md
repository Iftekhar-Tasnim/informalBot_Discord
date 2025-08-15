# 🚂 Railway Deployment Guide for InformalBot

This guide will help you deploy your Discord bot to Railway and ensure it stays running 24/7.

## 🚀 Quick Deploy to Railway

### Option 1: Deploy from GitHub (Recommended)

1. **Fork this repository** to your GitHub account
2. **Go to [Railway.app](https://railway.app)** and sign in with GitHub
3. **Click "New Project"** → "Deploy from GitHub repo"
4. **Select your forked repository**
5. **Set environment variables** (see below)
6. **Deploy!**

### Option 2: Deploy from Local Files

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize and deploy:**
   ```bash
   railway init
   railway up
   ```

## 🔧 Environment Variables

Set these in your Railway project dashboard:

### Required Variables:
```
TOKEN=your_discord_bot_token_here
```

### Optional Variables:
```
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
RAILWAY_SERVICE_NAME=informalbot
```

## 📁 Railway-Specific Files

- **`railway.json`** - Railway deployment configuration
- **`railway-start.js`** - Railway-optimized startup script
- **`package.json`** - Updated with Railway scripts

## 🏥 Health Checks

Railway automatically monitors your bot's health:

- **Health Endpoint:** `https://your-app.railway.app/health`
- **Automatic Restarts:** Railway restarts failed services
- **Memory Monitoring:** Automatic restart on high memory usage
- **Uptime Monitoring:** Tracks service availability

## 🔄 Railway Restart Policy

Your bot is configured with Railway's restart policies:

```json
{
  "restartPolicyType": "ON_FAILURE",
  "restartPolicyMaxRetries": 10
}
```

This means:
- ✅ **Automatic restart** on any failure
- ✅ **Up to 10 restart attempts** before giving up
- ✅ **Smart restart timing** to avoid rapid cycling

## 📊 Monitoring Your Bot

### Railway Dashboard:
- **Deployments** - View deployment history
- **Logs** - Real-time bot logs
- **Metrics** - CPU, memory, and network usage
- **Health** - Service status and uptime

### Bot Commands:
- `/informalbot status` - Check bot status
- `!stats` - View monitoring statistics
- `!ping` - Test bot responsiveness

## 🛠️ Railway Commands

### View Logs:
```bash
railway logs
```

### Restart Service:
```bash
railway service restart
```

### View Status:
```bash
railway status
```

### Update Environment Variables:
```bash
railway variables set TOKEN=new_token_here
```

## 🔍 Troubleshooting

### Bot Won't Start:
1. **Check environment variables** in Railway dashboard
2. **Verify Discord token** is correct
3. **Check Railway logs** for error messages
4. **Ensure Node.js version** is 16+ (set in `package.json`)

### Bot Keeps Restarting:
1. **Check memory usage** in Railway metrics
2. **Review bot logs** for error patterns
3. **Verify Discord API** is accessible
4. **Check bot permissions** in Discord

### Connection Issues:
1. **Verify internet connectivity** from Railway
2. **Check Discord status** at [status.discord.com](https://status.discord.com)
3. **Review bot intents** and permissions
4. **Check rate limiting** in Discord API

## 📈 Performance Optimization

### Memory Management:
- Bot automatically monitors memory usage
- Railway restarts on high memory (>500MB)
- Heartbeat system every 30 seconds
- Automatic cleanup of old data

### Connection Stability:
- Automatic Discord reconnection
- Smart retry logic with backoff
- Connection health monitoring
- Graceful error handling

## 🚀 Scaling on Railway

### Automatic Scaling:
- Railway automatically scales based on demand
- No manual configuration needed
- Cost-effective for Discord bots

### Manual Scaling:
- Adjust CPU/memory limits in dashboard
- Set custom restart policies
- Configure custom health checks

## 💰 Cost Optimization

### Free Tier:
- **500 hours/month** of runtime
- **512MB RAM** per service
- **Shared CPU** resources
- **Perfect for Discord bots**

### Paid Plans:
- **Unlimited runtime**
- **Higher resource limits**
- **Priority support**
- **Custom domains**

## 🔐 Security Best Practices

1. **Never commit tokens** to Git
2. **Use Railway environment variables**
3. **Regular token rotation**
4. **Monitor bot permissions**
5. **Review access logs**

## 📞 Support

### Railway Support:
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app/)

### Bot Issues:
- Check Railway logs first
- Review Discord bot permissions
- Verify environment variables
- Test locally before deploying

## 🎯 Success Checklist

- [ ] Bot deployed to Railway
- [ ] Environment variables set
- [ ] Bot connects to Discord
- [ ] Health checks passing
- [ ] Bot responds to commands
- [ ] Monitoring working
- [ ] Auto-restart configured
- [ ] Logs accessible

---

**Your bot will now run 24/7 on Railway with automatic restarts and monitoring! 🎉**
