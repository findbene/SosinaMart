#!/usr/bin/env node

/**
 * Sosina Mart - Self-Checking System
 * Validates project structure, dependencies, and configuration
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}\n`),
};

let errors = 0;
let warnings = 0;

// Check if file exists
function checkFile(filePath, description) {
  const fullPath = path.join(ROOT_DIR, filePath);
  if (fs.existsSync(fullPath)) {
    log.success(`${description}: ${filePath}`);
    return true;
  } else {
    log.error(`Missing ${description}: ${filePath}`);
    errors++;
    return false;
  }
}

// Check if directory exists
function checkDirectory(dirPath, description) {
  const fullPath = path.join(ROOT_DIR, dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    log.success(`${description}: ${dirPath}`);
    return true;
  } else {
    log.error(`Missing ${description}: ${dirPath}`);
    errors++;
    return false;
  }
}

// Check package.json for required dependencies
function checkDependencies() {
  const packagePath = path.join(ROOT_DIR, "package.json");
  if (!fs.existsSync(packagePath)) {
    log.error("package.json not found");
    errors++;
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const requiredDeps = [
    "next",
    "react",
    "react-dom",
    "@supabase/supabase-js",
    "tailwindcss",
    "lucide-react",
  ];

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  requiredDeps.forEach((dep) => {
    if (allDeps[dep]) {
      log.success(`Dependency found: ${dep} (${allDeps[dep]})`);
    } else {
      log.error(`Missing dependency: ${dep}`);
      errors++;
    }
  });
}

// Check environment variables
function checkEnvVars() {
  const envPath = path.join(ROOT_DIR, ".env.local");
  const envExamplePath = path.join(ROOT_DIR, ".env.example");

  if (fs.existsSync(envPath)) {
    log.success("Environment file found: .env.local");

    const envContent = fs.readFileSync(envPath, "utf8");
    const hasSupabaseUrl = envContent.includes("NEXT_PUBLIC_SUPABASE_URL");
    const hasSupabaseKey = envContent.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    if (hasSupabaseUrl) {
      log.success("NEXT_PUBLIC_SUPABASE_URL is set");
    } else {
      log.warning("NEXT_PUBLIC_SUPABASE_URL not found (optional - will use mock mode)");
      warnings++;
    }

    if (hasSupabaseKey) {
      log.success("NEXT_PUBLIC_SUPABASE_ANON_KEY is set");
    } else {
      log.warning("NEXT_PUBLIC_SUPABASE_ANON_KEY not found (optional - will use mock mode)");
      warnings++;
    }
  } else {
    log.warning(".env.local not found - Supabase will run in mock mode");
    warnings++;
  }
}

// Check TypeScript configuration
function checkTypeScript() {
  const tsconfigPath = path.join(ROOT_DIR, "tsconfig.json");
  if (!fs.existsSync(tsconfigPath)) {
    log.error("tsconfig.json not found");
    errors++;
    return;
  }

  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));

  if (tsconfig.compilerOptions?.strict) {
    log.success("TypeScript strict mode enabled");
  } else {
    log.warning("TypeScript strict mode not enabled");
    warnings++;
  }

  if (tsconfig.compilerOptions?.paths?.["@/*"]) {
    log.success("Path aliases configured");
  } else {
    log.error("Path aliases not configured");
    errors++;
  }
}

// Check component exports
function checkComponents() {
  const components = [
    "src/components/layout/Navbar.tsx",
    "src/components/layout/Footer.tsx",
    "src/components/layout/CartSidebar.tsx",
    "src/components/sections/Hero.tsx",
    "src/components/sections/Carousel.tsx",
    "src/components/sections/ProductSection.tsx",
    "src/components/products/ProductCard.tsx",
    "src/components/products/AllProductsModal.tsx",
    "src/components/checkout/CheckoutModal.tsx",
    "src/components/ui/button.tsx",
  ];

  components.forEach((comp) => {
    checkFile(comp, "Component");
  });
}

// Check core files
function checkCoreFiles() {
  const coreFiles = [
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/globals.css",
    "src/context/CartContext.tsx",
    "src/lib/data.ts",
    "src/lib/supabase.ts",
    "src/lib/utils.ts",
    "src/types/index.ts",
  ];

  coreFiles.forEach((file) => {
    checkFile(file, "Core file");
  });
}

// Check public assets
function checkAssets() {
  const assets = [
    "public/images/logo.jpeg",
    "public/images/Hero_Background.png",
  ];

  assets.forEach((asset) => {
    checkFile(asset, "Asset");
  });
}

// Main function
function main() {
  console.log(`
╔═══════════════════════════════════════════╗
║    SOSINA MART - Self-Checking System     ║
╚═══════════════════════════════════════════╝
`);

  log.header("Checking Project Structure");
  checkDirectory("src", "Source directory");
  checkDirectory("src/app", "App directory");
  checkDirectory("src/components", "Components directory");
  checkDirectory("src/lib", "Library directory");
  checkDirectory("src/context", "Context directory");
  checkDirectory("src/types", "Types directory");
  checkDirectory("public", "Public directory");
  checkDirectory("public/images", "Images directory");

  log.header("Checking Configuration Files");
  checkFile("package.json", "Package config");
  checkFile("tsconfig.json", "TypeScript config");
  checkFile("tailwind.config.ts", "Tailwind config");
  checkFile("next.config.ts", "Next.js config");
  checkFile("postcss.config.mjs", "PostCSS config");

  log.header("Checking Dependencies");
  checkDependencies();

  log.header("Checking TypeScript Configuration");
  checkTypeScript();

  log.header("Checking Environment Variables");
  checkEnvVars();

  log.header("Checking Core Files");
  checkCoreFiles();

  log.header("Checking Components");
  checkComponents();

  log.header("Checking Assets");
  checkAssets();

  // Summary
  console.log(`
╔═══════════════════════════════════════════╗
║              CHECK SUMMARY                ║
╚═══════════════════════════════════════════╝
`);

  if (errors === 0 && warnings === 0) {
    log.success("All checks passed! Project is ready.");
  } else {
    if (errors > 0) {
      log.error(`${errors} error(s) found`);
    }
    if (warnings > 0) {
      log.warning(`${warnings} warning(s) found`);
    }
  }

  console.log("");

  // Exit with error code if there are errors
  process.exit(errors > 0 ? 1 : 0);
}

main();
