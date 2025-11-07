# Admin Dashboard Testing Guide

**Date**: 2025-01-27  
**Status**: Ready for Testing

---

## 🎯 What Was Implemented

### ✅ Complete Features

1. **Admin Foundation**
   - Admin layout with sidebar navigation
   - Role-based access control (admin-only)
   - Admin dashboard home page

2. **Institution Management**
   - List view with filters (type, ownership, missing websites)
   - Edit form (all fields including website)
   - API endpoints (GET, POST, PUT, DELETE)
   - Audit logging

3. **Program Management**
   - List view with filters (degree type, missing cutoff, missing description)
   - Edit form with cutoff history editor
   - API endpoints (GET, POST, PUT, DELETE)
   - Audit logging

4. **Data Quality Dashboard**
   - Overall data quality score
   - Website coverage metrics
   - Cutoff data coverage metrics
   - Description coverage metrics
   - Issues lists with direct edit links
   - Quick actions

5. **Cutoff History Editor**
   - Add/edit/delete cutoff entries
   - Year, cutoff, mode, confidence tracking
   - Source URL tracking
   - Sortable table view

---

## 🧪 Testing Checklist

### **Prerequisites**

1. **Grant Admin Access**
   ```sql
   UPDATE users SET roles = array_append(roles, 'admin') WHERE email = 'your-email@example.com';
   ```
   
   Or via Prisma Studio:
   - Open Prisma Studio
   - Find your user
   - Add "admin" to the roles array

2. **Start the Application**
   ```bash
   npm run dev
   ```

---

### **Test 1: Access Control**

- [ ] Navigate to `/admin` without being logged in
  - Should redirect to sign in page

- [ ] Sign in as a regular user (without admin role)
  - Should show "Access Denied" message

- [ ] Sign in as admin user
  - Should show admin dashboard

---

### **Test 2: Admin Dashboard Home**

- [ ] Navigate to `/admin`
  - Should show overview cards with stats
  - Should show total institutions count
  - Should show total programs count
  - Should show data quality score
  - Should show issues count

- [ ] Check "Recent Changes" section
  - Should show latest audit log entries

- [ ] Click "View All" on data quality issues
  - Should navigate to data quality dashboard

- [ ] Test quick action buttons
  - "Add New Institution" → Should navigate to new institution page
  - "Add New Program" → Should navigate to new program page
  - "Manage Institutions" → Should navigate to institutions list
  - "Manage Programs" → Should navigate to programs list

---

### **Test 3: Institution Management**

#### **List Page** (`/admin/institutions`)

- [ ] View institutions list
  - Should show table with all institutions
  - Should show name, type, ownership, location, website status, programs count

- [ ] Test search
  - Type institution name → Should filter results

- [ ] Test filters
  - Select type (e.g., "university") → Should filter by type
  - Select ownership (e.g., "federal") → Should filter by ownership
  - Check "Missing Website" → Should show only institutions without websites

- [ ] Test pagination
  - Click "Next" → Should go to next page
  - Click "Previous" → Should go to previous page

- [ ] Click edit button on an institution
  - Should navigate to edit page

#### **Edit Page** (`/admin/institutions/[id]`)

- [ ] View institution details
  - Should show all fields pre-filled

- [ ] Edit institution name
  - Change name → Click "Save Changes" → Should update successfully

- [ ] Add missing website
  - Enter website URL (e.g., "example.com") → Should auto-add https://
  - Click "Save Changes" → Should update successfully
  - Verify website link works

- [ ] Edit contact information
  - Add email, phone, address → Save → Should update successfully

- [ ] View associated programs
  - Should show list of programs for this institution
  - Click program → Should navigate to program edit page

- [ ] Test cancel button
  - Click "Cancel" → Should navigate back to list without saving

---

### **Test 4: Program Management**

#### **List Page** (`/admin/programs`)

- [ ] View programs list
  - Should show table with all programs
  - Should show name, institution, degree type, cutoff status, description status

- [ ] Test search
  - Type program name → Should filter results
  - Type institution name → Should filter by institution

- [ ] Test filters
  - Select degree type → Should filter by degree type
  - Check "Missing Cutoff" → Should show only programs without cutoff data
  - Check "Missing Description" → Should show only programs without descriptions

- [ ] Test pagination
  - Click "Next" → Should go to next page
  - Click "Previous" → Should go to previous page

- [ ] Click edit button on a program
  - Should navigate to edit page

#### **Edit Page** (`/admin/programs/[id]`)

- [ ] View program details
  - Should show all fields pre-filled

- [ ] Edit basic information
  - Change name, degree type, duration → Save → Should update successfully

- [ ] Add description
  - Enter program description → Save → Should update successfully

- [ ] Test Cutoff History Editor
  - Click "Add" → Enter year, cutoff, mode, confidence → Should add entry
  - Click edit icon on an entry → Should allow editing
  - Click delete icon → Should remove entry
  - Add multiple entries → Should sort by year (newest first)
  - Save → Should persist cutoff history

- [ ] Manage UTME Subjects
  - Add subject → Should add to list
  - Click X on subject → Should remove from list

- [ ] Manage O-level Subjects
  - Add subject → Should add to list
  - Click X on subject → Should remove from list

- [ ] Manage Career Prospects
  - Add career → Should add to list
  - Click X on career → Should remove from list

- [ ] Set application deadline
  - Select date → Save → Should update successfully

---

### **Test 5: Data Quality Dashboard**

#### **Overview** (`/admin/data-quality`)

- [ ] View overall metrics
  - Should show overall score (0-100%)
  - Should show website coverage score
  - Should show cutoff data coverage score
  - Should show description coverage score

- [ ] Check score colors
  - Green (≥80%) = Excellent
  - Yellow (≥60%) = Good
  - Red (<60%) = Needs Improvement

#### **Missing Websites Tab**

- [ ] View institutions without websites
  - Should show table with all institutions missing websites
  - Should show institution name, type, ownership, location, programs count

- [ ] Click "Add Website" button
  - Should navigate to institution edit page
  - Should be able to add website URL

#### **Missing Cutoffs Tab**

- [ ] View programs without cutoff data
  - Should show table with all programs missing cutoff data
  - Should show program name, institution, degree type, location

- [ ] Click "Add Cutoff" button
  - Should navigate to program edit page
  - Should be able to add cutoff history

#### **Missing Descriptions Tab**

- [ ] View programs without descriptions
  - Should show table with all programs missing descriptions
  - Should show program name, institution, degree type, location

- [ ] Click "Add Description" button
  - Should navigate to program edit page
  - Should be able to add description

#### **Quick Actions**

- [ ] Click "View All Institutions Missing Websites"
  - Should navigate to institutions list with "Missing Website" filter active

- [ ] Click "View All Programs Missing Cutoff Data"
  - Should navigate to programs list with "Missing Cutoff" filter active

- [ ] Click "View All Programs Missing Descriptions"
  - Should navigate to programs list with "Missing Description" filter active

---

### **Test 6: Audit Logging**

- [ ] Make changes to an institution
  - Edit institution → Save
  - Check audit log (via dashboard or database)
  - Should show: user, action, entity type, entity ID, timestamp

- [ ] Make changes to a program
  - Edit program → Save
  - Check audit log
  - Should show: user, action, entity type, entity ID, changes metadata

- [ ] View recent changes on dashboard
  - Should show latest 5 audit log entries
  - Should show user email, action, entity type, timestamp

---

### **Test 7: Edge Cases**

- [ ] Test with empty data
  - Institutions with no programs
  - Programs with no cutoff history
  - Programs with no description

- [ ] Test validation
  - Try to save institution without name → Should show error
  - Try to save program without institution → Should show error
  - Try to add cutoff with invalid year → Should validate

- [ ] Test URL normalization
  - Add website without https:// → Should auto-add https://
  - Add website with http:// → Should keep as is

- [ ] Test large datasets
  - Institutions list with pagination
  - Programs list with pagination
  - Data quality dashboard with many issues

---

## 🐛 Common Issues & Solutions

### **Issue: "Unauthorized" Error**
- **Solution**: Make sure user has "admin" in roles array
- **Check**: `SELECT roles FROM users WHERE email = 'your-email@example.com';`

### **Issue: Can't See Admin Panel**
- **Solution**: Clear browser cache and cookies, sign in again
- **Check**: Verify session includes admin role

### **Issue: Cutoff History Not Saving**
- **Solution**: Check that cutoff is a number > 0
- **Check**: Verify year is valid (2000-current year)

### **Issue: Website URL Not Working**
- **Solution**: Make sure URL includes protocol (http:// or https://)
- **Check**: URL should be valid format

---

## ✅ Success Criteria

All tests should pass:
- ✅ Admin access control works
- ✅ Institution CRUD operations work
- ✅ Program CRUD operations work
- ✅ Cutoff history editor works
- ✅ Data quality dashboard shows correct metrics
- ✅ Audit logging tracks all changes
- ✅ Filters and search work correctly
- ✅ Pagination works correctly
- ✅ Direct links from data quality dashboard work

---

## 📝 Notes

- All changes are logged to `AuditEvent` table
- Website URLs are automatically normalized
- Cutoff history is sorted by year (newest first)
- Data quality scores update in real-time
- All admin routes are protected

---

**Ready for Testing!** 🚀

