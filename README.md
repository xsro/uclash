Clash Utilities
===============================

Some Utilities to manage clash

### File Structure

![](./overview.png)

```zsh
src/ # Source files written in TypeScript
  - moduleA.ts
  - moduleB.ts
  - index.ts
lib/ # CommonJS format (`module.exports/require`) JS files
  - moduleA.js
  - moduleB.js
  - index.js
esm/ # ES Modules format (`import/export`) JS files
  - moduleA.js
  - moduleB.js
  - index.js
umd/ # UMD format, bundled JS file
  - my-typescript-package.js
```

### How to Develop

```zsh
$ pnpm install
$ pnpm run build # generates `lib`, `esm`, and `umd`
```
