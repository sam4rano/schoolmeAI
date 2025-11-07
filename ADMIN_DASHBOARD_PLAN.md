# Admin Dashboard Implementation Plan

**Purpose**: Create a comprehensive admin dashboard to manage, edit, and enhance scraped data, bridging gaps and ensuring data quality.

**Date**: 2025-01-27

---

## 🎯 Goals

1. **Data Management**: Allow admins to manually add/edit institution and program data
2. **Data Quality**: Identify and fill gaps in scraped data
3. **Data Verification**: Review and verify scraped data before publishing
4. **Bulk Operations**: Efficiently manage large datasets
5. **Audit Trail**: Track all changes for accountability

---

## 📋 Features Overview

### **1. Institution Management**
- ✅ View all institutions with filters/search
- ✅ Edit institution details (name, website, contact, type, ownership, state, city)
- ✅ Add missing websites
- ✅ Update contact information
- ✅ Add/edit fees schedules
- ✅ Manage programs for each institution
- ✅ Data quality indicators

### **2. Program Management**
- ✅ View all programs with filters/search
- ✅ Add new programs manually
- ✅ Edit program details (name, description, degree type, duration)
- ✅ Manage cutoff history (add/edit/delete years)
- ✅ Update admission requirements
- ✅ Add/edit UTME and O-level subjects
- ✅ Manage application deadlines
- ✅ Add career prospects and curriculum

### **3. Data Quality Dashboard**
- ✅ Institutions missing websites
- ✅ Programs missing cutoff data
- ✅ Programs missing descriptions
- ✅ Missing contact information
- ✅ Data quality scores
- ✅ Last updated timestamps

### **4. Bulk Operations**
- ✅ Bulk import from CSV/JSON
- ✅ Bulk update fields
- ✅ Bulk delete (with confirmation)
- ✅ Export data for backup

### **5. Audit & Logging**
- ✅ View all changes (who, what, when)
- ✅ Revert changes if needed
- ✅ Activity timeline

---

## 🏗️ Architecture

### **File Structure**
```
app/
├── admin/
│   ├── page.tsx                    # Admin dashboard home
│   ├── institutions/
│   │   ├── page.tsx                # Institution list
│   │   ├── [id]/
│   │   │   └── page.tsx           # Edit institution
│   │   └── new/
│   │       └── page.tsx           # Add new institution
│   ├── programs/
│   │   ├── page.tsx               # Program list
│   │   ├── [id]/
│   │   │   └── page.tsx           # Edit program
│   │   └── new/
│   │       └── page.tsx           # Add new program
│   ├── data-quality/
│   │   └── page.tsx                # Data quality dashboard
│   ├── audit/
│   │   └── page.tsx                # Audit log viewer
│   └── settings/
│       └── page.tsx                # Admin settings
│
api/
├── admin/
│   ├── institutions/
│   │   ├── route.ts               # GET list, POST create
│   │   ├── [id]/
│   │   │   └── route.ts          # GET, PUT, DELETE
│   │   └── bulk/
│   │       └── route.ts          # Bulk operations
│   ├── programs/
│   │   ├── route.ts               # GET list, POST create
│   │   ├── [id]/
│   │   │   └── route.ts          # GET, PUT, DELETE
│   │   └── bulk/
│   │       └── route.ts          # Bulk operations
│   ├── data-quality/
│   │   └── route.ts               # Get data quality metrics
│   └── audit/
│       └── route.ts               # Get audit logs
│
components/
├── admin/
│   ├── admin-layout.tsx           # Admin layout wrapper
│   ├── admin-sidebar.tsx          # Admin navigation sidebar
│   ├── institution-form.tsx       # Institution edit form
│   ├── program-form.tsx            # Program edit form
│   ├── data-quality-card.tsx      # Data quality metric card
│   ├── audit-log-table.tsx        # Audit log table
│   └── bulk-import.tsx            # Bulk import component
```

---

## 🔐 Security & Access Control

### **Role-Based Access**
- Only users with `roles` containing `"admin"` can access admin routes
- Middleware to check admin role on all admin routes
- API routes protected with role checks

### **Implementation**
```typescript
// lib/middleware/admin.ts
export function requireAdmin(session: Session) {
  if (!session?.user?.roles?.includes("admin")) {
    throw new Error("Unauthorized: Admin access required")
  }
}

// app/admin/layout.tsx
export default function AdminLayout({ children }) {
  const session = useSession()
  
  if (!session?.data?.user?.roles?.includes("admin")) {
    return <AccessDenied />
  }
  
  return <AdminSidebar>{children}</AdminSidebar>
}
```

---

## 📊 Database Schema Updates

### **No Schema Changes Needed**
- Existing `User.roles` field supports admin role
- Existing `AuditEvent` model can track changes
- Existing models have all needed fields

### **Optional Enhancements**
- Add `lastModifiedBy` to Institution and Program models (optional)
- Add `status` field for draft/published (optional)

---

## 🎨 UI Components

### **1. Admin Dashboard Home**
- Overview cards:
  - Total institutions
  - Total programs
  - Data quality score
  - Recent changes
- Quick actions:
  - Add institution
  - Add program
  - View data quality issues
  - View audit log

### **2. Institution Management**
- **List View**:
  - Table with columns: Name, Type, State, Website, Programs Count, Quality Score
  - Filters: Type, Ownership, State, Missing Data
  - Search by name
  - Actions: Edit, Delete, View Details

- **Edit Form**:
  - Basic Info: Name, Type, Ownership, State, City
  - Contact: Website, Email, Phone, Address
  - Fees: Fees schedule editor (JSON)
  - Programs: List of programs with links
  - Data Quality: Quality score, missing fields indicator

### **3. Program Management**
- **List View**:
  - Table with columns: Name, Institution, Degree Type, Cutoff Data, Quality Score
  - Filters: Institution, Degree Type, Missing Data
  - Search by name/institution

- **Edit Form**:
  - Basic Info: Name, Institution (dropdown), Degree Type, Duration
  - Description: Rich text editor
  - Subjects: UTME subjects (multi-select), O-level subjects (multi-select)
  - Cutoff History: Table with Add/Edit/Delete
    - Year, Cutoff, Admission Mode, Source URL
  - Requirements: Admission requirements editor
  - Deadlines: Application deadline picker
  - Career: Career prospects (array)
  - Curriculum: Course curriculum (JSON)

### **4. Data Quality Dashboard**
- **Metrics Cards**:
  - Institutions missing websites (count + list)
  - Programs missing cutoff data (count + list)
  - Programs missing descriptions (count + list)
  - Average data quality score
  - Last updated timestamps

- **Actionable Lists**:
  - Click to edit directly
  - Bulk actions (e.g., "Add website to all")

### **5. Audit Log**
- **Table View**:
  - Columns: Timestamp, User, Action, Entity Type, Entity ID, Changes
  - Filters: User, Action, Entity Type, Date Range
  - Search

---

## 🔧 API Endpoints

### **Institutions**
```
GET    /api/admin/institutions          # List with filters
POST   /api/admin/institutions          # Create new
GET    /api/admin/institutions/[id]     # Get one
PUT    /api/admin/institutions/[id]     # Update
DELETE /api/admin/institutions/[id]     # Delete
POST   /api/admin/institutions/bulk     # Bulk operations
```

### **Programs**
```
GET    /api/admin/programs              # List with filters
POST   /api/admin/programs              # Create new
GET    /api/admin/programs/[id]         # Get one
PUT    /api/admin/programs/[id]         # Update
DELETE /api/admin/programs/[id]         # Delete
POST   /api/admin/programs/bulk         # Bulk operations
```

### **Data Quality**
```
GET    /api/admin/data-quality          # Get metrics
GET    /api/admin/data-quality/issues   # Get issues list
```

### **Audit**
```
GET    /api/admin/audit                 # Get audit logs with filters
```

---

## 📝 Implementation Phases

### **Phase 1: Foundation (Week 1)**
- [ ] Create admin layout and sidebar
- [ ] Implement role-based access control middleware
- [ ] Create admin dashboard home page
- [ ] Set up admin API route structure

### **Phase 2: Institution Management (Week 2)**
- [ ] Institution list page with filters/search
- [ ] Institution edit form
- [ ] Institution create form
- [ ] Institution API endpoints (CRUD)
- [ ] Audit logging for institution changes

### **Phase 3: Program Management (Week 2-3)**
- [ ] Program list page with filters/search
- [ ] Program edit form (with cutoff history editor)
- [ ] Program create form
- [ ] Program API endpoints (CRUD)
- [ ] Audit logging for program changes

### **Phase 4: Data Quality Dashboard (Week 3)**
- [ ] Data quality metrics API
- [ ] Data quality dashboard UI
- [ ] Issue lists with direct edit links
- [ ] Bulk action capabilities

### **Phase 5: Advanced Features (Week 4)**
- [ ] Audit log viewer
- [ ] Bulk import/export
- [ ] Bulk update operations
- [ ] Advanced search and filters

---

## 🎯 Priority Features (MVP)

### **Must Have**
1. ✅ Institution edit form (especially website field)
2. ✅ Program edit form (especially cutoff history)
3. ✅ Data quality dashboard showing missing websites
4. ✅ Basic audit logging
5. ✅ Role-based access control

### **Nice to Have**
1. ⚠️ Bulk import/export
2. ⚠️ Advanced filters
3. ⚠️ Data quality scoring
4. ⚠️ Change history/revert

---

## 💡 Key Implementation Details

### **1. Cutoff History Editor**
```typescript
// Component for managing cutoff history
interface CutoffEntry {
  year: number
  cutoff: number
  admissionMode: "UTME" | "POST_UTME" | "DIRECT_ENTRY"
  sourceUrl?: string
  confidence: "verified" | "estimated" | "unverified"
}

// Table with Add/Edit/Delete actions
// Validation: year must be valid, cutoff must be number
```

### **2. Website URL Validation**
```typescript
// Validate and normalize website URLs
function validateWebsite(url: string): string | null {
  if (!url) return null
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url
  }
  try {
    new URL(url)
    return url
  } catch {
    return null
  }
}
```

### **3. Data Quality Scoring**
```typescript
// Calculate data quality score
function calculateInstitutionQuality(inst: Institution): number {
  let score = 0
  if (inst.website) score += 20
  if (inst.contact) score += 20
  if (inst.programs.length > 0) score += 20
  if (inst.tuitionFees) score += 20
  if (inst.dataQualityScore) score += 20
  return score
}
```

### **4. Audit Logging**
```typescript
// Log all changes
async function logChange(
  userId: string,
  entityType: "institution" | "program",
  entityId: string,
  action: "create" | "update" | "delete",
  changes?: Record<string, { old: any; new: any }>
) {
  await prisma.auditEvent.create({
    data: {
      entityType,
      entityId,
      action,
      userId,
      metadata: { changes },
    },
  })
}
```

---

## 🚀 Quick Start Implementation

### **Step 1: Create Admin Route Protection**
```typescript
// lib/middleware/admin.ts
export function requireAdmin(session: Session | null) {
  if (!session?.user?.roles?.includes("admin")) {
    throw new Error("Unauthorized")
  }
}
```

### **Step 2: Create Admin Layout**
```typescript
// app/admin/layout.tsx
export default function AdminLayout({ children }) {
  const { data: session } = useSession()
  
  if (!session?.user?.roles?.includes("admin")) {
    return <AccessDenied />
  }
  
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

### **Step 3: Create Institution Edit Page**
```typescript
// app/admin/institutions/[id]/page.tsx
// Form with all institution fields
// Save button calls API
// Success redirect to list
```

### **Step 4: Create API Endpoint**
```typescript
// app/api/admin/institutions/[id]/route.ts
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)
  
  // Update institution
  // Log change
  // Return updated data
}
```

---

## 📊 Success Metrics

- **Data Completeness**: % of institutions with websites
- **Data Quality**: Average data quality score
- **Admin Activity**: Number of edits per week
- **Time to Fix**: Average time to fix data quality issues

---

## 🔄 Next Steps

1. **Review and approve this plan**
2. **Start with Phase 1** (Foundation)
3. **Prioritize Institution Management** (most requested feature)
4. **Iterate based on usage**

---

**Status**: Ready for Implementation  
**Estimated Time**: 3-4 weeks for full implementation  
**Priority**: HIGH - Critical for data quality and completeness

