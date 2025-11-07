# Admin Login Guide

## Quick Steps to Access Admin Dashboard

### Step 1: Create or Use Existing Account

**Option A: Use Seed User (Quickest)**
- The seed script creates a test user:
  - **Email**: `test@example.com`
  - **Password**: `password123`
- Run seed if not already done:
  ```bash
  npm run db:seed
  ```

**Option B: Create New Account**
1. Go to `/auth/signup`
2. Fill in:
   - Full Name
   - Email
   - Password (minimum 8 characters)
3. Click "Create Account"
4. You'll be redirected to sign in page

### Step 2: Grant Admin Role

**Option 1: Using SQL (Recommended)**
```sql
UPDATE users 
SET roles = array_append(roles, 'admin') 
WHERE email = 'test@example.com';
```

**Option 2: Using Prisma Studio (Easiest)**
1. Open Prisma Studio:
   ```bash
   npx prisma studio
   ```
2. Navigate to `User` table
3. Find your user (e.g., `test@example.com`)
4. Click on the user to edit
5. Find the `roles` field
6. Add `"admin"` to the array: `["user", "admin"]` or just `["admin"]`
7. Click "Save 1 change"

**Option 3: Using Prisma Client (Code)**
```typescript
await prisma.user.update({
  where: { email: "test@example.com" },
  data: {
    roles: {
      push: "admin"
    }
  }
})
```

### Step 3: Sign In

1. Go to `/auth/signin`
2. Enter your credentials:
   - **Email**: `test@example.com` (or your email)
   - **Password**: `password123` (or your password)
3. Click "Sign In"

### Step 4: Access Admin Dashboard

1. After signing in, navigate to `/admin`
2. You should see the admin dashboard

---

## Troubleshooting

### "Access Denied" on `/admin`

**Problem**: User doesn't have admin role

**Solution**: 
1. Sign out
2. Grant admin role (see Step 2 above)
3. Sign in again
4. Navigate to `/admin`

### "User not found" or "Invalid credentials"

**Problem**: User doesn't exist or wrong password

**Solution**:
1. Check if user exists in database
2. Or create new account at `/auth/signup`
3. Then grant admin role

### Can't see admin role in Prisma Studio

**Problem**: Roles field might be empty or null

**Solution**:
1. In Prisma Studio, edit the user
2. Set `roles` field to: `["admin"]`
3. Save

---

## Admin Dashboard URLs

Once logged in as admin, you can access:

- **Dashboard Home**: `/admin`
- **Institutions**: `/admin/institutions`
- **Programs**: `/admin/programs`
- **Data Quality**: `/admin/data-quality`
- **Audit Log**: `/admin/audit-log` (if implemented)

---

## Quick Test

1. **Start dev server**: `npm run dev`
2. **Run seed** (if needed): `npm run db:seed`
3. **Grant admin role**: Use Prisma Studio or SQL
4. **Sign in**: Go to `/auth/signin`
5. **Access admin**: Go to `/admin`

---

**Note**: Make sure your database is running and migrations are applied before attempting to login.

