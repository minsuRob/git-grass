# Git Grass Monorepo

This is a [Turborepo](https://turbo.build/repo) monorepo containing the Git Grass project.

## What's inside?

This monorepo uses [pnpm](https://pnpm.io) as a package manager and includes the following apps:

- `apps/rn` - React Native app built with Expo

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Start the React Native app

   ```bash
   pnpm --filter @gitgrass/rn start
   ```

   Or use turbo:

   ```bash
   pnpm dev
   ```

## Available Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps
- `pnpm lint` - Lint all apps
- `pnpm start` - Start all apps

## Project Structure

```
.
├── apps/
│   └── rn/          # React Native app (Expo)
├── packages/        # Shared packages (future)
├── turbo.json       # Turborepo configuration
└── pnpm-workspace.yaml
```

## Learn more

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [pnpm Documentation](https://pnpm.io/)
