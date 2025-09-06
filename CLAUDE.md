# DocValidator Project - Claude Code Context

## Project Overview
DocValidator is a Next.js-based document validation platform built with React, TypeScript, and Supabase. It provides AI-powered document analysis using Azure AI Content Understanding technology with enterprise-grade security.

## Tech Stack
- **Framework**: Next.js 15.5.2 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database/Auth**: Supabase
- **Cloud Storage**: Azure Blob Storage
- **Linting**: ESLint

## Project Structure
```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── anaylze/           # Document analysis endpoint
│   │   └── get-sas-url/       # Azure Blob Storage SAS URL generation
│   ├── auth/                   # Authentication pages
│   ├── components/             # React components
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # shadcn/ui components
│   ├── dashboard/             # Dashboard pages
│   ├── hooks/                 # Custom React hooks
│   ├── integrations/          # External service integrations
│   ├── lib/                   # Utility libraries and configurations
│   └── pages/                 # Additional pages
```

## Key Features
- **Secure Authentication**: Enterprise-grade security with Supabase
- **Document Upload**: Azure Blob Storage integration
- **AI-Powered Validation**: Document analysis using Azure AI
- **Real-time Processing**: Instant feedback on document validation
- **Responsive UI**: Built with Tailwind CSS and shadcn/ui

## Development Commands

### Start Development Server
```bash
npm run dev
```
- Runs Next.js development server with Turbopack
- Available at http://localhost:3000

### Build for Production
```bash
npm run build
```
- Creates optimized production build with Turbopack

### Start Production Server
```bash
npm run start
```
- Starts the production server

### Lint Code
```bash
npm run lint
```
- Runs ESLint to check code quality

### Type Checking
```bash
npx tsc --noEmit
```
- Run TypeScript type checking without emitting files

## Configuration Files
- `tsconfig.json` - TypeScript configuration with path mapping (`@/*` → `./src/*`)
- `tailwind.config.js` - Tailwind CSS configuration
- `components.json` - shadcn/ui components configuration
- `eslint.config.mjs` - ESLint configuration
- `next.config.ts` - Next.js configuration
- `.env.local` - Environment variables (Supabase, Azure credentials)

## Key Dependencies
- **UI Components**: @radix-ui components, lucide-react icons
- **Cloud Services**: @azure/storage-blob, @supabase/supabase-js
- **Styling**: tailwindcss, class-variance-authority, clsx, tailwind-merge
- **Development**: TypeScript, ESLint, Autoprefixer

## Environment Setup
The project requires environment variables in `.env.local`:
- Supabase configuration
- Azure Blob Storage credentials

## Notes for Claude Code
- This is a client-side heavy application with authentication
- Uses App Router pattern with TypeScript
- Integrates with Azure and Supabase services
- UI built with modern shadcn/ui component system
- Follows Next.js 15 best practices with Turbopack optimization