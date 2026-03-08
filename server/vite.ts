import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const BASE_URL = "https://pillardrugclub.com";

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
}

const PAGE_META: Record<string, PageMeta> = {
  "/faq": {
    title: "Pillar Drug Club FAQ | Wholesale Generic Medications for $99/Year",
    description: "Questions about Pillar Drug Club? Learn how the $99 membership works, what medications cost at wholesale, how auto-refills work, fees, HIPAA compliance, and how to get started.",
    canonical: `${BASE_URL}/faq`,
  },
  "/pharmacy-membership-vs-goodrx": {
    title: "Pharmacy Membership vs GoodRx: Real Cost Comparison | Pillar Drug Club",
    description: "GoodRx offers coupons. Pillar Drug Club offers wholesale prices. See the real cost difference on generic medications for cash-pay patients.",
    canonical: `${BASE_URL}/pharmacy-membership-vs-goodrx`,
  },
  "/scriptco-alternative": {
    title: "Best ScriptCo Alternative 2025 | Pillar Drug Club",
    description: "ScriptCo has been around since 2019 but growth has been slow. See how Pillar Drug Club compares on price, service, and medication access.",
    canonical: `${BASE_URL}/scriptco-alternative`,
  },
  "/cost-calculator": {
    title: "Medication Cost Calculator | Pillar Drug Club",
    description: "See exactly what your medications cost at wholesale prices. $99/year membership — calculate your total annual savings before you join.",
    canonical: `${BASE_URL}/cost-calculator`,
  },
  "/medications": {
    title: "Wholesale Generic Medications | Pillar Drug Club",
    description: "Browse 1,800+ FDA-approved generic medications at true wholesale prices. Blood pressure, diabetes, cholesterol, thyroid, and more.",
    canonical: `${BASE_URL}/medications`,
  },
  "/blog": {
    title: "The Pillar Post | Pillar Drug Club",
    description: "News, education, and insights on generic medications, wholesale drug pricing, and cash-pay pharmacy from the Pillar Drug Club team.",
    canonical: `${BASE_URL}/blog`,
  },
  "/register": {
    title: "Join Pillar Drug Club | $99/Year Wholesale Pharmacy Membership",
    description: "Sign up for Pillar Drug Club and start accessing generic medications at true wholesale prices. $99/year. No insurance required.",
    canonical: `${BASE_URL}/register`,
  },
};

function injectPageMeta(template: string, pathname: string): string {
  const cleanPath = pathname.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  const meta = PAGE_META[cleanPath];
  if (!meta) return template;

  let result = template;

  // Replace title
  result = result.replace(
    /<title>[^<]*<\/title>/,
    `<title>${meta.title}</title>`,
  );

  // Replace description meta
  result = result.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${meta.description}"`,
  );

  // Replace canonical
  result = result.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${meta.canonical}"`,
  );

  // Replace OG title
  result = result.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${meta.title}"`,
  );

  // Replace OG description
  result = result.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${meta.description}"`,
  );

  // Replace OG url
  result = result.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${meta.canonical}"`,
  );

  // Replace Twitter title
  result = result.replace(
    /<meta property="twitter:title" content="[^"]*"/,
    `<meta property="twitter:title" content="${meta.title}"`,
  );

  // Replace Twitter description
  result = result.replace(
    /<meta property="twitter:description" content="[^"]*"/,
    `<meta property="twitter:description" content="${meta.description}"`,
  );

  return result;
}

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      template = injectPageMeta(template, url);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const raw = fs.readFileSync(indexPath, "utf-8");
    const html = injectPageMeta(raw, req.originalUrl);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  });
}
