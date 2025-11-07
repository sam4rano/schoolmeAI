# Security Fix: Exposed API Key

## ⚠️ CRITICAL: API Key Exposed in Git History

Your Gemini API key was exposed in commit `e5337dc` in the file `GEMINI_SETUP.md`. Even though the file has been deleted, **the key is still in your git history** and accessible to anyone who clones your repository.

## Immediate Actions Required

### 1. **REVOKE THE EXPOSED KEY** (Do this FIRST!)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Find the key: `AIzaSyCL3nkb0BeTwabP9R2FDAInaspCbIhMvTk`
3. **Delete/Revoke it immediately**
4. Generate a new API key
5. Update your `.env` file with the new key

### 2. Remove Key from Git History

The key is still in your git history. You need to remove it:

#### Option A: Using git filter-repo (Recommended)

```bash
# Install git-filter-repo if not installed
# macOS: brew install git-filter-repo
# Or: pip install git-filter-repo

# Remove the file from all commits
git filter-repo --path GEMINI_SETUP.md --invert-paths

# Force push (WARNING: This rewrites history!)
git push origin --force --all
```

#### Option B: Using BFG Repo-Cleaner (Easier)

```bash
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
# Or: brew install bfg

# Create a file with the key to remove
echo "AIzaSyCL3nkb0BeTwabP9R2FDAInaspCbIhMvTk" > keys.txt

# Remove from history
bfg --replace-text keys.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

#### Option C: Manual Git History Rewrite

```bash
# Remove the file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch GEMINI_SETUP.md" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

### 3. Verify .gitignore is Correct

Make sure `.gitignore` includes:
```
.env
.env*.local
.env.local
```

### 4. Check for Other Exposed Secrets

```bash
# Search for any other API keys in git history
git log --all --source -p | grep -E "(api[_-]?key|secret|password|token)" -i

# Check current files
grep -r "AIzaSy\|sk-\|ghp_" --include="*.md" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" .
```

### 5. Update Your Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your **NEW** API keys to `.env` (never commit this file!)

3. Restart your development server

## Prevention

### ✅ DO:
- ✅ Use `.env` files for secrets (already in `.gitignore`)
- ✅ Use `.env.example` for documentation (with placeholders)
- ✅ Use environment variables in production
- ✅ Use secret management services (Vercel, AWS Secrets Manager, etc.)

### ❌ DON'T:
- ❌ Commit API keys to git
- ❌ Put real keys in documentation files
- ❌ Share keys in screenshots or images
- ❌ Hardcode keys in source code

## After Fixing

1. ✅ Revoke the old key
2. ✅ Generate a new key
3. ✅ Remove from git history
4. ✅ Update `.env` with new key
5. ✅ Test that everything works
6. ✅ Monitor for any unauthorized usage

## Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [GitGuardian: How to remove secrets from git](https://www.gitguardian.com/docs/gitguardian/security-features/secret-detection/removing-secrets-from-git-history)

---

**Status**: ⚠️ Action Required - Key must be revoked and removed from git history

