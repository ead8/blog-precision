This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app)

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Proxy/Scraping Configuration

If you encounter network connectivity issues (ECONNREFUSED, ETIMEDOUT), you can configure proxy support by adding these environment variables to `.env.local`:

### Option 1: Standard HTTP/HTTPS Proxy
```bash
HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=http://proxy.example.com:8080
```

### Option 2: ScraperAPI (Recommended)
Automatically handles bot detection and CAPTCHAs. Get your API key from https://www.scraperapi.com/
```bash
SCRAPER_API_KEY=your_scraperapi_key_here
```

### Option 3: Bright Data (Enterprise)
```bash
BRIGHT_DATA_USER=your_username
BRIGHT_DATA_PASS=your_password
```

### Crawling Configuration
```bash
CRAWL_CONCURRENCY=5  # Number of parallel requests
```
