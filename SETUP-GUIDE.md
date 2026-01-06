# Visual Effects Pro - Code Quality Setup Guide

Complete toolchain for linting, formatting, and validating HTML/CSS/JS code.

---

## 🚀 Quick Start

### 1. Install Dependencies

Navigate to the `visual-effects-pro` directory and run:

```bash
cd /path/to/visual-effects-pro
npm install
```

This installs:

- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Stylelint** - CSS linting
- **HTMLHint** - HTML validation

---

## 📦 Installation Commands

### macOS/Linux:

```bash
npm install --save-dev eslint@^9.17.0 \
  @eslint/js@^9.17.0 \
  globals@^15.13.0 \
  eslint-config-prettier@^9.1.0 \
  prettier@^3.4.2 \
  stylelint@^16.12.0 \
  stylelint-config-standard@^36.0.1 \
  stylelint-prettier@^5.0.2 \
  htmlhint@^1.1.4
```

### Windows (PowerShell):

```powershell
npm install --save-dev eslint@^9.17.0 `
  @eslint/js@^9.17.0 `
  globals@^15.13.0 `
  eslint-config-prettier@^9.1.0 `
  prettier@^3.4.2 `
  stylelint@^16.12.0 `
  stylelint-config-standard@^36.0.1 `
  stylelint-prettier@^5.0.2 `
  htmlhint@^1.1.4
```

### Or simply:

```bash
npm install
```

(uses package.json devDependencies)

---

## 🎯 Available Scripts

| Command                | Description                        |
| ---------------------- | ---------------------------------- |
| `npm run lint`         | Run all linters (JS, CSS, HTML)    |
| `npm run lint:js`      | Lint JavaScript files only         |
| `npm run lint:css`     | Lint CSS files only                |
| `npm run lint:html`    | Lint HTML files only               |
| `npm run lint:fix`     | Auto-fix all issues where possible |
| `npm run format`       | Format all code with Prettier      |
| `npm run format:check` | Check if code is formatted (CI)    |
| `npm run validate`     | Run format check + all linters     |
| `npm run precommit`    | Fix and format before commit       |

---

## 💻 How to Use

### Before Committing Code:

```bash
npm run lint:fix
```

This will:

1. Auto-fix ESLint issues
2. Auto-fix Stylelint issues
3. Format all code with Prettier

### Check Code Quality (CI/CD):

```bash
npm run validate
```

This will:

1. Verify code is formatted
2. Run all linters (fail if errors)

### Manual Linting:

```bash
# Check specific file
npx eslint effects-pro/js/core/App.js

# Fix specific file
npx eslint effects-pro/js/core/App.js --fix

# Format specific file
npx prettier --write effects-pro/effects-dashboard.html
```

---

## 📁 Project Structure

```
visual-effects-pro/
├── effects-pro/           # Source code
│   ├── js/               # JavaScript modules
│   ├── css/              # Stylesheets
│   └── *.html            # HTML files
├── node_modules/          # Dependencies (ignored)
├── .vscode/              # VS Code settings
│   ├── settings.json
│   └── extensions.json
├── package.json          # Dependencies & scripts
├── eslint.config.js      # ESLint rules (flat config)
├── .prettierrc           # Prettier options
├── .prettierignore       # Files to skip formatting
├── .stylelintrc.json     # Stylelint rules
├── .htmlhintrc           # HTMLHint rules
├── .editorconfig         # Editor consistency
└── .gitignore            # Git ignore patterns
```

---

## 🛠️ VS Code Setup

### Required Extensions:

1. **ESLint** (`dbaeumer.vscode-eslint`)
2. **Prettier** (`esbenp.prettier-vscode`)
3. **Stylelint** (`stylelint.vscode-stylelint`)
4. **EditorConfig** (`editorconfig.editorconfig`)
5. **HTMLHint** (`htmlhint.vscode-htmlhint`)

### Install All at Once:

Open VS Code Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

```
> Extensions: Show Recommended Extensions
```

Click "Install All"

### Verify Setup:

1. Open a `.js` file → ESLint should show warnings/errors
2. Save file → Prettier should auto-format
3. Hover over CSS → Stylelint should show issues

---

## ⚙️ Configuration Files Explained

### `eslint.config.js`

- **Purpose**: JavaScript code quality rules
- **Config**: ESLint 9 flat config format
- **Highlights**:
  - Prevents common bugs (`no-unreachable`, `no-use-before-define`)
  - Enforces best practices (`eqeqeq`, `no-eval`)
  - Browser environment globals
  - Compatible with Prettier

### `.prettierrc`

- **Purpose**: Code formatting consistency
- **Settings**:
  - 100 character line width
  - 2 spaces indentation
  - Double quotes for strings
  - LF line endings (Unix-style)
  - Trailing commas in ES5 style

### `.stylelintrc.json`

- **Purpose**: CSS code quality
- **Config**: Standard rules + Prettier integration
- **Highlights**:
  - Prevents duplicate selectors
  - Enforces modern CSS (color functions, etc.)
  - Limits nesting depth (max 4)
  - Validates CSS syntax

### `.htmlhintrc`

- **Purpose**: HTML validation
- **Checks**:
  - DOCTYPE present
  - Unique IDs
  - Required alt attributes
  - Proper tag pairing
  - No duplicate attributes

### `.editorconfig`

- **Purpose**: Cross-editor consistency
- **Enforces**:
  - UTF-8 encoding
  - LF line endings
  - 2-space indentation
  - Trim trailing whitespace

---

## 🔧 Troubleshooting

### ESLint Not Working?

```bash
# Clear cache
rm -rf node_modules/.cache
npx eslint --cache-file .eslintcache effects-pro/js/**/*.js

# Verify config
npx eslint --print-config effects-pro/js/main.js
```

### Prettier Not Formatting?

```bash
# Check file is not ignored
npx prettier --check effects-pro/effects-dashboard.html

# Verify config
npx prettier --find-config-path effects-pro/effects-dashboard.html
```

### Stylelint Errors?

```bash
# Clear cache
rm .stylelintcache

# Check specific file
npx stylelint effects-pro/css/dashboard.css
```

### VS Code Not Auto-Fixing?

1. Check `.vscode/settings.json` exists
2. Restart VS Code
3. Check Output panel → ESLint/Prettier logs
4. Verify extensions are enabled

---

## 📋 Pre-Production Checklist

Before deploying to production:

- [ ] Run `npm run validate` (all checks pass)
- [ ] Run `npm run lint:fix` (auto-fix all issues)
- [ ] Check browser console (no errors)
- [ ] Test in target browsers (Chrome, Firefox, Safari)
- [ ] Verify no `console.log()` statements (ESLint warns)
- [ ] Check file sizes (minify if needed)
- [ ] Review .gitignore (no sensitive files)

---

## 🎨 Customization

### Add Custom ESLint Rules:

Edit `eslint.config.js`:

```javascript
rules: {
  'no-magic-numbers': ['warn', { ignore: [0, 1, -1] }],
  // Add more...
}
```

### Change Prettier Settings:

Edit `.prettierrc`:

```json
{
  "printWidth": 120,
  "singleQuote": true
}
```

### Add Stylelint Rules:

Edit `.stylelintrc.json`:

```json
{
  "rules": {
    "declaration-no-important": true
  }
}
```

---

## 🚨 Common Issues

### "Cannot find module '@eslint/js'"

```bash
rm -rf node_modules package-lock.json
npm install
```

### "Prettier is not defined"

```bash
npm install --save-dev prettier
```

### "ESLint couldn't determine plugin"

- Using ESLint 9 flat config (no `.eslintrc`)
- Ensure `eslint.config.js` is at project root

### Windows Line Ending Issues

- `.editorconfig` enforces LF
- Git may convert to CRLF
- Set Git config:

```bash
git config core.autocrlf false
```

---

## 📚 Resources

- [ESLint Docs](https://eslint.org/docs/latest/)
- [Prettier Docs](https://prettier.io/docs/en/)
- [Stylelint Docs](https://stylelint.io/)
- [HTMLHint Rules](https://htmlhint.com/docs/user-guide/list-rules)
- [EditorConfig](https://editorconfig.org/)

---

## 🎯 CI/CD Integration

### GitHub Actions Example:

```yaml
name: Code Quality

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run validate
```

### Pre-commit Hook (Husky):

```bash
npm install --save-dev husky
npx husky init
echo "npm run precommit" > .husky/pre-commit
```

---

**Now your codebase is production-ready! 🚀**
