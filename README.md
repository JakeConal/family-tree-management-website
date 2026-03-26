# Family Tree Management Website

A web-based platform for preserving family history, organizing genealogy data, and sharing a family tree with relatives through a modern interface.

This project was created as a university software engineering project and is currently structured around a Next.js frontend with a Prisma data model for family tree management.

## Project Overview

The goal of this project is to help families document their legacy in one place. Instead of storing information across notebooks, spreadsheets, and scattered messages, the platform provides a central system to:

- create and manage family trees
- record family members and their background
- preserve achievements and important life events
- track origins, occupations, and relationship history
- share controlled access with other family members

## Current Features

The repository currently includes:

- a landing page introducing the platform
- onboarding screens for sign in and sign up
- guest access flow using an access code
- UI previews for dashboard, family tree, achievements, and reports
- a Prisma schema designed for family tree ownership and genealogy records

## Data Model Highlights

The Prisma schema supports the main entities needed for a family tree management system, including:

- `TreeOwner` for account ownership
- `FamilyTree` for organizing each tree
- `FamilyMember` for individual profiles
- `SpouseRelationship` for relationship history
- `Occupation`, `Achievement`, and `AchievementType`
- `PassingRecord` and `CauseOfDeath`
- `PlaceOfOrigin` and related location history
- `GuestEditor` for access-code based sharing

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM
- MySQL
- Lucide React

## Project Structure

```text
family-tree-management-website/
├── README.md
├── LICENSE
└── app/
    ├── app/                 # Next.js App Router pages
    ├── public/images/       # Project screenshots and visual assets
    ├── src/components/      # Reusable UI components
    ├── src/prisma/          # Prisma schema
    └── package.json
```

## Getting Started

### 1. Install dependencies

```bash
cd app
npm install
```

### 2. Configure environment variables

Create an `.env` file inside the `app` directory and define at least:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
```

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Start the development server

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Available Scripts

From the `app` directory:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:push
npm run prisma:migrate
npm run prisma:studio
```

## Current Status

This repository is currently in an early stage. The UI and database schema are in place, but some business logic is still scaffolded or placeholder-only, such as:

- authentication handling
- Google sign-in integration
- access code verification
- API and database-connected workflows

That means the project already communicates the product direction clearly, but it is not yet a fully completed production system.

## License

This project is distributed under the terms described in [LICENSE](LICENSE).
