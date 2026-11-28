/**
 * Runs after `npm run build`. Writes build/robots.txt and build/sitemap.xml for the
 * public pages, using REACT_APP_SITE_URL (the site's real address) so the sitemap
 * always matches the domain being deployed.
 */
const fs = require("fs");
const path = require("path");

// Same files CRA reads, in the same order of precedence (later files don't override earlier ones).
const loadEnv = (file) => {
  const full = path.join(__dirname, "..", file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
};
[".env.production.local", ".env.local", ".env.production", ".env"].forEach(loadEnv);

const site = (process.env.REACT_APP_SITE_URL || "").replace(/\/+$/, "");
const buildDir = path.join(__dirname, "..", "build");

// Public, indexable pages. Signed-in areas are excluded: they need an account and have no public content.
const PAGES = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/register", priority: "0.8", changefreq: "monthly" },
  { loc: "/login", priority: "0.5", changefreq: "yearly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  { loc: "/terms", priority: "0.3", changefreq: "yearly" },
];

if (!fs.existsSync(buildDir)) {
  console.error("generate-seo-files: build/ not found. Run the production build first.");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(
  (p) => `  <url>
    <loc>${site}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
).join("\n")}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /user-profile
Disallow: /user-request
Disallow: /my-requests
Disallow: /volunteer-home
Disallow: /volunteer-opportunities
Disallow: /contact
Disallow: /admin-dashboard
Disallow: /create-opportunity
Disallow: /edit-opportunity/
Disallow: /logout

Sitemap: ${site}/sitemap.xml
`;

fs.writeFileSync(path.join(buildDir, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(buildDir, "robots.txt"), robots);
console.log(`generate-seo-files: wrote sitemap.xml (${PAGES.length} pages) and robots.txt for ${site || "(no REACT_APP_SITE_URL set)"}`);
if (!/^https:\/\//.test(site)) {
  console.warn("generate-seo-files: REACT_APP_SITE_URL is not an https:// address. Set it to the real domain for production builds.");
}
