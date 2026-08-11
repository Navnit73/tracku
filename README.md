This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
## ⚠️ Security Notice & Secret Rotation Warning

> **CRITICAL SECURITY REQUIREMENT BEFORE PRODUCTION DEPLOYMENT:**
> If any database connection string (MongoDB URI), Google OAuth Client Secret, or NextAuth secret was previously hardcoded or committed to git history during early development, **those values remain accessible in git history**.
> 
> **You MUST immediately perform the following secret rotation steps:**
> 1. **MongoDB Atlas**: Rotate database user passwords in MongoDB Atlas Security settings and generate a new connection string.
> 2. **Google Cloud Console**: Reset/regenerate your Google OAuth Client Secret under Credentials.
> 3. **NextAuth Secret**: Generate a brand-new random 32+ character secret string (e.g. `openssl rand -base64 32`) for `NEXTAUTH_SECRET`.
> 4. Ensure `.env` and `.env.local` files are NEVER committed to version control (`.gitignore` protects all `.env*` files). Use `.env.example` as a template.

