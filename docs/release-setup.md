# Release Setup Guide

Quick guide to set up automated releases and NPM publishing for FOA.

## 🎯 What Gets Automated

When you merge to `main`, GitHub Actions automatically:
1. ✅ Runs all tests and builds
2. ✅ Determines version bump from commit message
3. ✅ Updates `package.json` version
4. ✅ Creates Git tag (e.g., `v1.2.0`)
5. ✅ Commits version bump back to `main`
6. ✅ Creates GitHub Release
7. ✅ Publishes to NPM registry

## 📋 One-Time Setup

### Step 1: Create NPM Granular Access Token

1. Go to NPM website → Profile picture → **Access Tokens**
2. Click **"Generate New Token"**
3. Configure:
   - **Token name**: `flux-oriented-architecture-ci`
   - **Description**: "GitHub Actions automated publishing"
   - **Bypass 2FA**: ❌ Unchecked (more secure)
   - **Packages and scopes**:
     - Permissions: **Read and write**
     - Select: **Only select packages and scopes**
     - Choose: `flux-oriented-architecture`
   - **Expiration**: 1 year (or your preference)
4. **Generate Token** → Copy immediately!

### Step 2: Add NPM Token to GitHub

1. Repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `NPM_TOKEN`
4. Value: Paste your NPM token
5. **Add secret**

### Step 3: Create Personal Access Token (PAT)

For pushing version bumps to protected branches:

1. GitHub → Your profile → **Settings**
2. **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token (classic)**
4. Configure:
   - **Note**: `FOA Release Token`
   - **Expiration**: 1 year
   - **Scopes**: ✅ `repo` (full control of private repositories)
5. **Generate token** → Copy immediately!

### Step 4: Add PAT to GitHub Repository

1. Repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `PAT_TOKEN`
4. Value: Paste your PAT
5. **Add secret**

### Step 5: Configure GitHub Actions Permissions

1. Repository → **Settings** → **Actions** → **General**
2. Under **"Workflow permissions"**:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. **Save**

## 🚀 How to Release

Just commit with conventional commit format and push/merge to `main`:

### Version Bump Rules

| Commit Pattern | Bump | Example |
|---------------|------|---------|
| `feat:` or `feat(scope):` | **Minor** | 1.0.0 → 1.1.0 |
| `fix:` or `fix(scope):` | **Patch** | 1.0.0 → 1.0.1 |
| `feat!:` or `BREAKING CHANGE:` | **Major** | 1.0.0 → 2.0.0 |
| `docs:`, `chore:`, `refactor:` | **Patch** | 1.0.0 → 1.0.1 |

### Examples

```bash
# Minor version bump (new feature)
git commit -m "feat: add PostgreSQL plugin"
git push origin main
# Result: 1.0.0 → 1.1.0

# Patch version bump (bug fix)
git commit -m "fix: resolve memory leak"
git push origin main
# Result: 1.1.0 → 1.1.1

# Major version bump (breaking change)
git commit -m "feat!: change plugin interface"
git push origin main
# Result: 1.1.1 → 2.0.0
```

## 📊 Monitoring Releases

### Check Status

**GitHub Actions:**
- Repository → **Actions** tab
- Check **"Release & Publish"** workflow

**NPM Registry:**
- https://www.npmjs.com/package/flux-oriented-architecture

**GitHub Releases:**
- Repository → **Releases** tab

### Verify Installation

```bash
# Check latest version on NPM
npm view flux-oriented-architecture version

# Install latest
npm install flux-oriented-architecture@latest
```

## 🐛 Troubleshooting

### NPM Token Invalid

**Error:** `npm ERR! code ENEEDAUTH`

**Solution:**
1. Generate new NPM token
2. Update `NPM_TOKEN` secret
3. Re-run workflow

### PAT Token Expired

**Error:** `remote: Permission to ... denied`

**Solution:**
1. Generate new PAT
2. Update `PAT_TOKEN` secret
3. Re-run workflow

### Tests Failing

**Error:** Tests don't pass on `main`

**Solution:**
1. Fix failing tests
2. Commit and push
3. Workflow runs automatically

### Version Already Published

**Error:** `You cannot publish over previously published versions`

**Solution:**
This shouldn't happen with automation. If it does:
```bash
npm version patch --no-git-tag-version
git add package.json
git commit -m "chore: manual version bump [skip ci]"
git push origin main
```

## 🔒 Security Best Practices

- ✅ Never commit tokens to repository
- ✅ Use granular tokens (not classic)
- ✅ Restrict tokens to specific packages
- ✅ Set token expiration dates
- ✅ Rotate tokens before expiration
- ✅ Revoke old tokens immediately
- ✅ Don't bypass 2FA unless necessary
- ✅ Store tokens only in GitHub Secrets

## 📝 Workflow Details

The release workflow (`.github/workflows/release.yml`) runs on every push to `main` and:

1. Skips if commit contains `[skip ci]` or `chore(release)`
2. Runs tests and build
3. Analyzes commit message for version bump type
4. Runs `npm version major|minor|patch`
5. Pushes commit + tag to `main` (using PAT)
6. Creates GitHub Release with auto-generated notes
7. Publishes to NPM (using NPM token)

## ✅ Verification Checklist

After setup, verify:

- [ ] `NPM_TOKEN` added to GitHub secrets
- [ ] `PAT_TOKEN` added to GitHub secrets
- [ ] GitHub Actions has write permissions
- [ ] Test release by merging to main
- [ ] Verify new version on NPM
- [ ] Verify GitHub Release created
- [ ] Test installing new version

## 📚 Related Documentation

- [Release Process](./release-process.md) - Detailed release documentation
- [Plugins](./plugins.md) - Plugin system
- [Environment Variables](./environment-variables.md) - Configuration guide

---

**You're all set!** Every merge to `main` with a proper commit message will trigger an automated release. 🎉