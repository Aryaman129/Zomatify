# Testing & Verification Guide
## Order Management Synchronization Fixes

**Date:** November 10, 2025  
**Status:** ✅ All Fixes Applied - Ready for Testing

---

## 🎯 Issues Fixed

### 1. Backend 500 Error on Order Cancellation
**Problem:** Backend returned 500 when trying to set non-existent `cancellation_reason` column  
**Solution:** Temporarily disabled column assignment until migration runs  
**File:** `backend/src/routes/vendor.js`

### 2. Frontend Response Parsing Error
**Problem:** Frontend expected `data.order` but backend returns `data.data`  
**Solution:** Fixed both `updateOrderStatus()` and `cancelOrder()` to use correct structure  
**File:** `frontend/src/services/api.ts`

### 3. Pages Not Syncing Globally
**Problem:** Pickup and Delivery dashboards didn't have realtime subscriptions  
**Solution:** Added `realtimeSync.subscribeToVendorOrders()` to both dashboards  
**Files:** `PickupVendorDashboard.tsx`, `DeliveryVendorDashboard.tsx`

---

## 🧪 Testing Instructions

### Pre-Test Setup

1. **Start Backend Server**
   ```bash
   cd backend
   npm install
   npm run dev
   # Should start on http://localhost:5000
   ```

2. **Start Frontend Server**
   ```bash
   cd frontend
   npm install
   npm start
   # Should start on http://localhost:3000
   ```

3. **Login as Vendor**
   - Navigate to http://localhost:3000/vendor/login
   - Use Pizza Corner credentials (vendor ID: 3c926c67-e7a8-404d-a64b-61402cb4c9fa)

---

### Test Case 1: Order Cancellation (Primary Issue)

**Objective:** Verify order cancellation works without 500 errors

**Steps:**
1. Open Pickup Orders dashboard at `/vendor/pickup-orders`
2. Find an order with status "pending" or "accepted"
3. Click "Cancel Order" button
4. **Expected Results:**
   - ✅ Success toast notification appears
   - ✅ Order status changes to "cancelled" immediately
   - ✅ No 500 error in browser console
   - ✅ Order disappears from active pickup orders list
   - ✅ Queue positions of remaining orders shift down by 1

**Console Checks:**
```javascript
// Should see in browser console:
"📨 Pickup dashboard received order update: { eventType: 'UPDATE', new: {...}, old: {...} }"

// Should NOT see:
"PATCH .../status 500 (Internal Server Error)"
```

---

### Test Case 2: Global Synchronization (Primary Issue)

**Objective:** Verify changes sync across all dashboard pages in real-time

**Steps:**
1. Open THREE browser tabs:
   - Tab 1: Main Dashboard (`/vendor/dashboard`)
   - Tab 2: Pickup Orders (`/vendor/pickup-orders`)
   - Tab 3: Delivery Orders (`/vendor/delivery-orders`)

2. In Tab 2 (Pickup), click "Accept Order" on a pending order
3. **Expected Results:**
   - ✅ Tab 1 shows order status as "accepted" **immediately** (no refresh)
   - ✅ Tab 2 shows order status as "accepted" **immediately**
   - ✅ Tab 3 doesn't show pickup orders (correct filtering)
   
4. In Tab 1 (Main), change an order to "preparing"
5. **Expected Results:**
   - ✅ Tab 2 shows status as "preparing" **immediately**
   - ✅ All queue positions update correctly across all tabs

**Console Checks:**
```javascript
// Each dashboard should log:
"📡 Setting up realtime subscriptions for [Dashboard Name]"
"📨 [Dashboard Name] received order update: ..."
```

---

### Test Case 3: Queue Management

**Objective:** Verify queue auto-management works when orders complete/cancel

**Setup:**
- Create 5 orders for testing (queue positions 1-5)

**Steps:**
1. Complete order at position 2 (middle of queue)
2. **Expected Results:**
   - ✅ Order removed from queue (queue_position = null)
   - ✅ Positions 3, 4, 5 shift to 2, 3, 4
   - ✅ All dashboards reflect new positions immediately

3. Cancel order at position 1 (first in queue)
4. **Expected Results:**
   - ✅ Order removed from queue
   - ✅ All remaining orders shift down by 1
   - ✅ No gaps in queue numbering

**Database Verification:**
```sql
-- Run in Supabase SQL Editor
SELECT id, vendor_id, status, queue_position, order_type
FROM orders
WHERE vendor_id = '3c926c67-e7a8-404d-a64b-61402cb4c9fa'
  AND queue_position IS NOT NULL
ORDER BY queue_position ASC;

-- Should show continuous sequence: 1, 2, 3, 4... (no gaps)
```

---

### Test Case 4: Order Type Filtering

**Objective:** Verify pickup/delivery dashboards only show relevant orders

**Steps:**
1. Create 2 pickup orders and 2 delivery orders
2. Open Pickup Orders dashboard
3. **Expected Results:**
   - ✅ Shows only 2 pickup orders
   - ✅ Does NOT show delivery orders

4. Open Delivery Orders dashboard
5. **Expected Results:**
   - ✅ Shows only 2 delivery orders
   - ✅ Does NOT show pickup orders

6. Update a delivery order status in Main Dashboard
7. **Expected Results:**
   - ✅ Delivery dashboard updates in real-time
   - ✅ Pickup dashboard does NOT show delivery order

---

### Test Case 5: Error Handling

**Objective:** Verify proper error messages for various failure scenarios

**Test 5a: Missing Vendor ID**
```javascript
// In browser console:
localStorage.removeItem('vendor_session');
// Try to cancel an order
// Expected: Error toast "Vendor ID not found"
```

**Test 5b: Invalid Order ID**
```javascript
// Try to cancel non-existent order
orderService.cancelOrder('00000000-0000-0000-0000-000000000000', 'Test');
// Expected: Error toast "Order not found"
```

**Test 5c: Network Error**
```javascript
// Disconnect internet
// Try to cancel order
// Expected: Error toast with network error message
```

---

### Test Case 6: Backend Response Format

**Objective:** Verify backend returns correct data structure

**Manual API Test:**
```bash
# Test order status update
curl -X PATCH http://localhost:5000/api/vendor/orders/{order_id}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted",
    "vendor_id": "3c926c67-e7a8-404d-a64b-61402cb4c9fa"
  }'

# Expected Response:
{
  "success": true,
  "data": {
    "id": "...",
    "status": "accepted",
    "vendor_id": "...",
    "queue_position": 1,
    ...
  },
  "message": "Order status updated successfully"
}

# NOT: { "success": true, "order": {...} }
```

---

## 🔍 Debug Checklist

If tests fail, check these in order:

### Backend Issues
- [ ] Backend server running on correct port (5000)
- [ ] SUPABASE_URL environment variable set
- [ ] SUPABASE_SERVICE_ROLE_KEY environment variable set
- [ ] Check backend console for error logs
- [ ] Verify vendor exists in database

### Frontend Issues
- [ ] REACT_APP_API_BASE_URL points to backend (http://localhost:5000 or Vercel URL)
- [ ] Vendor session stored in localStorage
- [ ] Browser console shows realtime subscription logs
- [ ] Check Network tab for failed API calls

### Database Issues
- [ ] Supabase project is online
- [ ] Orders table exists with all required columns
- [ ] Vendors table has the test vendor
- [ ] RLS policies allow service role access

### Realtime Issues
- [ ] Supabase Realtime is enabled in project settings
- [ ] WebSocket connection established (check Network > WS tab)
- [ ] Channels are subscribed (check console logs)
- [ ] No firewall blocking WebSocket connections

---

## 📊 Success Criteria

**All tests must pass:**
- ✅ Order cancellation works without 500 errors
- ✅ Order status updates without 500 errors
- ✅ All 3 dashboards sync in real-time
- ✅ Queue management auto-updates correctly
- ✅ Order type filtering works properly
- ✅ Error messages are clear and helpful
- ✅ No console errors during normal operations

---

## 🚀 Production Deployment

**After all tests pass:**

1. **Commit Backend Changes**
   ```bash
   cd backend
   git add src/routes/vendor.js
   git commit -m "fix: improve error handling and prevent 500 errors on order updates"
   git push origin main
   ```

2. **Commit Frontend Changes**
   ```bash
   cd frontend
   git add src/services/api.ts src/pages/PickupVendorDashboard.tsx src/pages/DeliveryVendorDashboard.tsx
   git commit -m "fix: add realtime sync to all dashboards and fix API response parsing"
   git push origin main
   ```

3. **Verify Deployment**
   - Wait for Vercel deployment to complete
   - Test on production URLs
   - Monitor error logs in Vercel dashboard

4. **Optional: Run Migration** (when ready for cancellation_reason feature)
   ```bash
   # In Supabase SQL Editor, run:
   # migrations/add_cancellation_reason_column.sql
   
   # Then uncomment backend code at vendor.js line 173
   # And redeploy backend
   ```

---

## 📝 Monitoring Post-Deployment

**Things to monitor in production:**

1. **Error Rates**
   - Check Vercel function logs for 500 errors
   - Should see significant drop after deployment

2. **Realtime Performance**
   - Monitor Supabase Realtime metrics
   - Check for disconnected clients
   - Verify message delivery latency < 1 second

3. **User Reports**
   - Ask vendors if sync issues persist
   - Verify queue management complaints stop

4. **Database Load**
   - Monitor query performance on orders table
   - Check if queue updates cause slowdowns

---

## 🔧 Rollback Plan

If critical issues found in production:

1. **Quick Rollback**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   ```

2. **Partial Rollback** (if only one component fails)
   - Revert specific file changes
   - Keep working features deployed

3. **Emergency Fix**
   - Create hotfix branch
   - Apply minimal fix
   - Deploy immediately

---

## ✅ Final Verification

Before marking as complete:

- [ ] All 6 test cases passed
- [ ] No console errors during testing
- [ ] Realtime sync confirmed working
- [ ] Queue management verified
- [ ] Error handling confirmed proper
- [ ] Backend changes tested locally
- [ ] Frontend changes tested locally
- [ ] Database migration documented
- [ ] Deployment plan reviewed
- [ ] Rollback plan documented

**Testing completed:** _________________ (Date)  
**Tested by:** _________________ (Name)  
**Production deployed:** _________________ (Date)  
**Status:** [ ] Pass [ ] Fail [ ] Needs Revision
