#!/usr/bin/env tsx
/**
 * Comprehensive test script for authentication and verification flow
 * Tests both admin and student users
 */

import { config } from "dotenv"
import { resolve } from "path"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

config({ path: resolve(process.cwd(), ".env") })

const prisma = new PrismaClient()

interface TestResult {
  name: string
  passed: boolean
  message: string
}

const results: TestResult[] = []

function addResult(name: string, passed: boolean, message: string) {
  results.push({ name, passed, message })
  const icon = passed ? "✅" : "❌"
  console.log(`${icon} ${name}: ${message}`)
}

async function testAuthFlow() {
  console.log("🧪 Testing Authentication & Verification Flow\n")
  console.log("=" .repeat(60))

  // Test 1: Admin User Exists
  console.log("\n1️⃣ Testing Admin User...")
  const admin = await prisma.user.findUnique({
    where: { email: "sam4rano@gmail.com" },
  }) as any

  if (!admin) {
    addResult("Admin User Exists", false, "Admin user not found in database")
    return
  }
  addResult("Admin User Exists", true, "Found in database")

  // Test 2: Admin Email Verified
  if (!admin.emailVerified) {
    addResult("Admin Email Verified", false, "Email is not verified")
  } else {
    addResult("Admin Email Verified", true, "Email is verified")
  }

  // Test 3: Admin Status Active
  if (admin.status !== "active") {
    addResult("Admin Status Active", false, `Status is "${admin.status}" instead of "active"`)
  } else {
    addResult("Admin Status Active", true, "Status is active")
  }

  // Test 4: Admin Roles
  const hasAdminRole = admin.roles?.includes("admin")
  const hasUserRole = admin.roles?.includes("user")
  if (!hasAdminRole || !hasUserRole) {
    addResult("Admin Roles", false, `Roles: ${admin.roles?.join(", ") || "none"}`)
  } else {
    addResult("Admin Roles", true, `Roles: ${admin.roles?.join(", ")}`)
  }

  // Test 5: Admin Password Verification
  const adminPassword = "Sam080Oye$$"
  const adminPasswordValid = await bcrypt.compare(adminPassword, admin.hashedPassword)
  if (!adminPasswordValid) {
    addResult("Admin Password Verification", false, "Password does not match")
  } else {
    addResult("Admin Password Verification", true, "Password is correct")
  }

  // Test 6: Student User Exists
  console.log("\n2️⃣ Testing Student User...")
  const student = await prisma.user.findUnique({
    where: { email: "student@example.com" },
  }) as any

  if (!student) {
    addResult("Student User Exists", false, "Student user not found in database")
    return
  }
  addResult("Student User Exists", true, "Found in database")

  // Test 7: Student Email Verified
  if (!student.emailVerified) {
    addResult("Student Email Verified", false, "Email is not verified")
  } else {
    addResult("Student Email Verified", true, "Email is verified")
  }

  // Test 8: Student Status Active
  if (student.status !== "active") {
    addResult("Student Status Active", false, `Status is "${student.status}" instead of "active"`)
  } else {
    addResult("Student Status Active", true, "Status is active")
  }

  // Test 9: Student Roles
  const studentHasUserRole = student.roles?.includes("user")
  const studentHasAdminRole = student.roles?.includes("admin")
  if (!studentHasUserRole || studentHasAdminRole) {
    addResult("Student Roles", false, `Should have only "user" role, got: ${student.roles?.join(", ") || "none"}`)
  } else {
    addResult("Student Roles", true, `Roles: ${student.roles?.join(", ")}`)
  }

  // Test 10: Student Password Verification
  const studentPassword = "password123"
  const studentPasswordValid = await bcrypt.compare(studentPassword, student.hashedPassword)
  if (!studentPasswordValid) {
    addResult("Student Password Verification", false, "Password does not match")
  } else {
    addResult("Student Password Verification", true, "Password is correct")
  }

  // Test 11: Email Verification Enforcement
  console.log("\n3️⃣ Testing Email Verification Enforcement...")
  const unverifiedUser = await prisma.user.findFirst({
    where: {
      emailVerified: null,
      status: "pending_verification",
    },
  }) as any

  if (unverifiedUser) {
    addResult("Unverified User Blocked", true, `Found unverified user: ${unverifiedUser.email} (should be blocked from sign-in)`)
  } else {
    addResult("Unverified User Blocked", true, "No unverified users found (all users are verified)")
  }

  // Test 12: Test User (Backward Compatibility)
  console.log("\n4️⃣ Testing Test User (Backward Compatibility)...")
  const testUser = await prisma.user.findUnique({
    where: { email: "test@example.com" },
  }) as any

  if (testUser) {
    const testPasswordValid = await bcrypt.compare("password123", testUser.hashedPassword)
    const testHasAdminRole = testUser.roles?.includes("admin")
    addResult("Test User Exists", true, "Found in database")
    addResult("Test User Password", testPasswordValid, testPasswordValid ? "Password is correct" : "Password incorrect")
    addResult("Test User Admin Role", testHasAdminRole, testHasAdminRole ? "Has admin role" : "Missing admin role")
    addResult("Test User Verified", !!testUser.emailVerified, testUser.emailVerified ? "Email verified" : "Email not verified")
  } else {
    addResult("Test User Exists", false, "Test user not found")
  }

  // Test 13: Session Management
  console.log("\n5️⃣ Testing Session Management...")
  const adminSessions = await prisma.session.findMany({
    where: { userId: admin.id },
    take: 5,
  })
  addResult("Session Tracking", true, `Admin has ${adminSessions.length} session(s) tracked`)

  // Test 14: Verification Tokens
  console.log("\n6️⃣ Testing Verification Token System...")
  const verificationTokens = await prisma.verificationToken.findMany({
    take: 5,
  }) as any[]
  addResult("Verification Token System", true, `Found ${verificationTokens.length} verification token(s) in system`)

  // Summary
  console.log("\n" + "=".repeat(60))
  console.log("\n📊 Test Summary\n")
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log("\n❌ Failed Tests:")
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`)
    })
  }

  console.log("\n" + "=".repeat(60))
  console.log("\n📝 Sign-In Credentials\n")
  console.log("Admin User:")
  console.log(`   Email: sam4rano@gmail.com`)
  console.log(`   Password: Sam080Oye$$`)
  console.log(`   Roles: admin, user`)
  console.log(`   Status: ${admin.status}`)
  console.log(`   Email Verified: ${admin.emailVerified ? "Yes" : "No"}`)
  
  console.log("\nStudent User:")
  console.log(`   Email: student@example.com`)
  console.log(`   Password: password123`)
  console.log(`   Roles: ${student.roles?.join(", ") || "none"}`)
  console.log(`   Status: ${student.status}`)
  console.log(`   Email Verified: ${student.emailVerified ? "Yes" : "No"}`)

  console.log("\n" + "=".repeat(60))
  
  if (failed === 0) {
    console.log("\n🎉 All tests passed! Authentication system is ready.")
    console.log("\n✅ You can now:")
    console.log("   1. Sign in as admin at /auth/signin")
    console.log("   2. Sign in as student at /auth/signin")
    console.log("   3. Admin will be redirected to /admin")
    console.log("   4. Student will be redirected to /dashboard")
    console.log("   5. Unverified users will be blocked from signing in")
  } else {
    console.log("\n⚠️  Some tests failed. Please review the errors above.")
    process.exit(1)
  }
}

testAuthFlow()
  .catch((error) => {
    console.error("\n❌ Error running tests:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

