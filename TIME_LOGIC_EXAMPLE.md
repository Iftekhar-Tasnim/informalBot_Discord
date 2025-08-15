# 🕐 Hourly Reset Logic - How It Works

## **Problem Fixed:**
The bot now properly handles hourly boundaries for registrations. People can only register within each hour window, and the reset happens exactly at the hour boundary.

## **How It Works:**

### **Hour 1:00 - 1:59 (Registration OPEN)**
- ✅ Users can register with `+` message
- ✅ Bot tracks up to 10 unique users
- ✅ All times shown in GMT+6

### **Hour 2:00 (Reset Moment)**
- 🔄 Bot automatically resets at exactly 2:00 GMT+6
- 🗑️ Clears all previous registrations
- ✅ Opens new registration period
- 📢 Sends reset notification

### **Hour 2:01 - 2:59 (Registration OPEN)**
- ✅ New users can register for this hour
- ✅ Fresh count starts from 0/10
- ✅ Previous hour's registrations are cleared

### **Hour 3:00 (Reset Moment)**
- 🔄 Bot resets again at exactly 3:00 GMT+6
- 🗑️ Clears all registrations from 2:00-2:59
- ✅ Opens new registration period

## **Example Timeline (GMT+6):**

```
1:00 AM - Bot starts, registrations OPEN
1:15 AM - User A registers (1/10)
1:30 AM - User B registers (2/10)
1:45 AM - User C registers (3/10)
1:59 AM - User D registers (4/10)

2:00 AM - ⚡ RESET HAPPENS ⚡
         - All registrations cleared
         - New hour begins
         - Registrations OPEN again

2:01 AM - User E registers (1/10) - Fresh start!
2:15 AM - User F registers (2/10)
2:30 AM - User G registers (3/10)

3:00 AM - ⚡ RESET HAPPENS ⚡
         - All registrations cleared
         - New hour begins
         - Registrations OPEN again
```

## **Key Features:**

### **✅ Exact Hour Boundaries:**
- Reset happens at **exactly** 1:00, 2:00, 3:00, etc.
- No more "approximately 1 hour" logic
- Precise GMT+6 timezone synchronization

### **✅ Registration Windows:**
- **1:00-1:59** → Registration period 1
- **2:00-2:59** → Registration period 2  
- **3:00-3:59** → Registration period 3
- Each period is completely independent

### **✅ Clear Status Indicators:**
- Bot shows whether registrations are currently OPEN or CLOSED
- Users see exactly when next reset will happen
- All times displayed in GMT+6 (Bangladesh time)

### **✅ Smart Message Handling:**
- During closed periods, only commands work
- Non-command messages are deleted with explanation
- Users get clear feedback about registration status

## **Commands That Always Work:**
- `!ping` - Test bot response
- `!help` - Show available commands
- `!status` - Check bot status
- `!stats` - Show detailed statistics
- `/informalbot` commands

## **Registration Rules:**
1. **Only `+` messages** are accepted for registration
2. **Max 10 unique users** per hour
3. **1 registration per user** per hour
4. **Reset happens exactly at hour boundary**
5. **All times in GMT+6** (Bangladesh Standard Time)

## **Why This Fixes the Issue:**
- **Before:** Bot could reset at random times, causing confusion
- **After:** Bot resets exactly at 1:00, 2:00, 3:00, etc.
- **Before:** Users could register outside their intended hour
- **After:** Users can only register within the current hour window
- **Before:** Unclear when registrations would open/close
- **After:** Clear status showing OPEN/CLOSED with exact timing

Your Salamanca Informal Bot now works like a precise clock - resetting exactly on the hour and only allowing registrations within each hour window! 🎯
