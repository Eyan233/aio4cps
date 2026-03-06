# AIO4CPS Group Website (aio4cps.top)

This is a static website for the AIO4CPS research group (CQU).

## Deploy on GitHub Pages

1. Push all files to the `main` branch.
2. Go to **Settings → Pages**.
3. Set **Build and deployment** to **Deploy from a branch**.
4. Choose **Branch: main** and **/(root)**.
5. Custom domain: `aio4cps.top` (GitHub will create/update the `CNAME` file).

## DNS (AliDNS)

For apex domain `aio4cps.top`:
- Add **A** records to:
  - 185.199.108.153
  - 185.199.109.153
  - 185.199.110.153
  - 185.199.111.153

For `www.aio4cps.top`:
- Add **CNAME**: `www` → `<your-github-username>.github.io`

Then in GitHub Pages, enable **Enforce HTTPS**.

## SEO

- `robots.txt` and `sitemap.xml` are included.
- Submit sitemap to Google/Bing/Baidu webmaster platforms.
