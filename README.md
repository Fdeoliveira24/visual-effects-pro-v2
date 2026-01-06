# Visual Effects Pro (vNext)

This folder contains a rebuilt, modular ES6 version of **Effects Pro for 3DVista Tours** with **no build step** and **no external dependencies**.

## How to use in a 3DVista tour

1. Copy `visual-effects-pro/effects-pro/` into your tour folder as `effects-pro/` (same level as your tour HTML).
2. Add to your tour HTML:

```html
<script src="effects-pro/effects-core.js"></script>
```

3. Open the dashboard:

`effects-pro/effects-dashboard.html`

## Notes

- Public API is exposed as `window.effectsPro` and also aliased to `window.tourEffectsFunctions` for compatibility.
- Assets live in `effects-pro/effects-assets/`. Runtime resolves relative asset URLs against the script base URL to avoid path issues when your tour HTML is not inside `effects-pro/`.
