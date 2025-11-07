# User Roles & Permissions Guide

**Last Updated**: 2025-01-27

---

## 👥 User Roles

### **1. Guest (Not Logged In)**
- Can browse public pages
- Can view institutions and programs
- Can use calculator (but results not saved)
- Cannot access AI assistant
- Cannot access dashboard
- Cannot access admin panel

### **2. Student (Logged In - Regular User)**
- **Email**: Any user with `roles: ["user"]` or no roles
- **Access**: All public features + authenticated features
- **Dashboard**: `/dashboard` (Student Portal)

### **3. Admin (Logged In - Admin User)**
- **Email**: User with `roles: ["admin", "user"]` or `["admin"]`
- **Access**: All student features + admin features
- **Dashboard**: `/admin` (Admin Panel)

---

## 🎓 Student Features & Permissions

### **What Students CAN Do:**

#### **1. Browse & Search**
- ✅ View all institutions (`/institutions`)
- ✅ View all programs (`/programs`)
- ✅ Search institutions and programs
- ✅ Filter by type, ownership, state, degree type
- ✅ View institution details
- ✅ View program details

#### **2. Calculator & Eligibility**
- ✅ Calculate admission probability (`/calculator`)
- ✅ Get program recommendations (`/recommendations`)
- ✅ View eligibility results
- ✅ Save calculations (if implemented)

#### **3. AI Assistant**
- ✅ Ask questions about institutions (`/ai`)
- ✅ Ask questions about programs
- ✅ Get personalized recommendations
- ✅ View AI chat history

#### **4. Dashboard & Profile**
- ✅ Access student dashboard (`/dashboard`)
- ✅ View profile (`/profile`)
- ✅ Manage watchlist (`/watchlist`)
- ✅ View saved programs
- ✅ View application history (if implemented)

#### **5. Analytics**
- ✅ View analytics (`/analytics`)
- ✅ View trends
- ✅ Export data (if implemented)

### **What Students CANNOT Do:**
- ❌ Access admin panel (`/admin/*`)
- ❌ Edit institution data
- ❌ Edit program data
- ❌ Add new institutions
- ❌ Add new programs
- ❌ View audit logs
- ❌ Manage data quality
- ❌ Bulk operations

---

## 🔐 Admin Features & Permissions

### **What Admins CAN Do:**

#### **1. All Student Features**
- ✅ Everything a student can do
- ✅ Plus admin-only features below

#### **2. Admin Dashboard**
- ✅ Access admin dashboard (`/admin`)
- ✅ View overview statistics
- ✅ View data quality metrics
- ✅ View recent changes
- ✅ Quick actions

#### **3. Institution Management**
- ✅ List all institutions (`/admin/institutions`)
- ✅ Search and filter institutions
- ✅ Edit institution details (`/admin/institutions/[id]`)
- ✅ Add new institutions (if implemented)
- ✅ Delete institutions
- ✅ Update website URLs
- ✅ Update contact information
- ✅ Manage fees schedules
- ✅ View associated programs

#### **4. Program Management**
- ✅ List all programs (`/admin/programs`)
- ✅ Search and filter programs
- ✅ Edit program details (`/admin/programs/[id]`)
- ✅ Add new programs (if implemented)
- ✅ Delete programs
- ✅ Manage cutoff history
- ✅ Update admission requirements
- ✅ Update UTME/O-level subjects
- ✅ Manage application deadlines
- ✅ Update descriptions

#### **5. Data Quality Dashboard**
- ✅ View data quality metrics (`/admin/data-quality`)
- ✅ See missing websites
- ✅ See missing cutoff data
- ✅ See missing descriptions
- ✅ View quality scores
- ✅ Direct links to fix issues

#### **6. Audit & Logging**
- ✅ View audit logs (`/admin/audit` - if implemented)
- ✅ See who made changes
- ✅ See what changed
- ✅ See when changes were made

#### **7. Settings**
- ✅ Access admin settings (`/admin/settings` - if implemented)
- ✅ Configure system settings

### **What Admins CANNOT Do:**
- ❌ Delete their own admin role (security)
- ❌ Grant admin role to others (if not implemented)
- ❌ Access other users' private data (if implemented)

---

## 🚪 Route Access Control

### **Public Routes (No Auth Required)**
```
/                           # Homepage
/institutions               # Browse institutions
/programs                   # Browse programs
/calculator                 # Calculator (public)
/recommendations            # Recommendations (public)
/analytics                  # Analytics (public)
/auth/signin                # Sign in
/auth/signup                # Sign up
```

### **Student Routes (Auth Required)**
```
/dashboard                  # Student dashboard
/profile                    # User profile
/watchlist                  # Saved programs
/ai                         # AI assistant (requires auth)
```

### **Admin Routes (Admin Role Required)**
```
/admin                      # Admin dashboard
/admin/institutions         # Institution management
/admin/institutions/[id]    # Edit institution
/admin/programs             # Program management
/admin/programs/[id]        # Edit program
/admin/data-quality         # Data quality dashboard
/admin/audit                # Audit log (if implemented)
/admin/settings             # Admin settings (if implemented)
```

### **API Routes**
```
/api/ai/chat                # AI chat (auth required)
/api/admin/*                # All admin APIs (admin role required)
```

---

## 🔄 Navigation Behavior

### **Navbar (When Not Logged In)**
- Shows: Home, Institutions, Programs, Calculator, Recommendations, AI Assistant, Analytics
- Shows: "Get Started" button → `/calculator`
- Shows: "Sign In" button → `/auth/signin`

### **Navbar (When Logged In as Student)**
- Shows: Same as above
- Shows: User email/name
- Shows: "Dashboard" link → `/dashboard`
- Shows: "Sign Out" button

### **Navbar (When Logged In as Admin)**
- Shows: Same as student
- Shows: "Admin Panel" link → `/admin`
- Shows: User email/name with admin badge
- Shows: "Sign Out" button

### **Sidebar (Student Dashboard)**
- Shows: Dashboard, Calculator, Recommendations, Programs, Institutions, AI Assistant, Profile
- Shows: "Back to Home" link

### **Sidebar (Admin Dashboard)**
- Shows: Dashboard, Institutions, Programs, Data Quality, Audit Log, Settings
- Shows: "Back to Site" link

---

## 🎯 Key Differences Summary

| Feature | Guest | Student | Admin |
|---------|-------|---------|-------|
| Browse Institutions | ✅ | ✅ | ✅ |
| Browse Programs | ✅ | ✅ | ✅ |
| Use Calculator | ✅ | ✅ | ✅ |
| Get Recommendations | ✅ | ✅ | ✅ |
| AI Assistant | ❌ | ✅ | ✅ |
| Dashboard | ❌ | ✅ (Student) | ✅ (Admin) |
| Watchlist | ❌ | ✅ | ✅ |
| Edit Institutions | ❌ | ❌ | ✅ |
| Edit Programs | ❌ | ❌ | ✅ |
| Data Quality | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ |
| Admin Settings | ❌ | ❌ | ✅ |

---

## 🔧 Implementation Status

### **✅ Implemented**
- Role-based access control
- Admin dashboard
- Institution management
- Program management
- Data quality dashboard
- Student dashboard
- Student sidebar
- Admin sidebar

### **⚠️ Partially Implemented**
- Navbar user info display
- Admin badge in navbar
- Audit log viewer
- Admin settings page

### **❌ Not Implemented**
- Grant admin role to others
- User management
- Bulk operations UI
- Advanced admin features

---

## 📝 Notes

- **Admin users** have access to ALL student features PLUS admin features
- **Student users** can only access student features
- **Guests** can browse but cannot use authenticated features
- **Role checking** is done at both UI and API levels
- **Security**: Admin routes are protected by middleware

