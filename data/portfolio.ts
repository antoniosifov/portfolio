export type Project = {
  index: string;
  title: string;
  shortTitle: string;
  year: string;
  type: string;
  status: string;
  description: string;
  statement: string;
  presentation: "web" | "mobile" | "dashboard";
  stack: string[];
  highlights: string[];
  live?: string;
  github?: string;
  cover?: string;
  coverAlt?: string;
  gallery?: { src: string; alt: string }[];
  accent: "coral" | "lime" | "blue" | "violet" | "amber" | "mint" | "rose";
};

export const navigation = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Stack", href: "#stack" },
  { label: "Contact", href: "#contact" },
];

export const stackGroups = [
  {
    label: "Frontend",
    items: ["TypeScript", "React", "Next.js", "React Native", "Redux", "Tailwind CSS"],
  },
  {
    label: "Backend & data",
    items: ["Node.js", "Express", "FastAPI", "REST APIs", "PostgreSQL", "Supabase", "MongoDB", "SQL"],
  },
  {
    label: "Cloud & delivery",
    items: ["AWS", "Docker", "GitHub Actions", "Vercel", "Sentry", "Automated testing"],
  },
  {
    label: "Applied AI",
    items: ["OpenAI API", "AI agents", "RAG", "LangChain", "Vector search", "Agentic workflows"],
  },
];

export const projects: Project[] = [
  {
    index: "01",
    title: "Ceru — Multilingual Expense Sharing",
    shortTitle: "Ceru",
    year: "2026",
    type: "Independent mobile product",
    status: "Live on the App Store · Android in development",
    description:
      "A six-language, multi-currency expense-sharing app that I independently planned, designed, architected, developed, and launched on the App Store.",
    statement: "Six languages. Multiple currencies. One shared version of the truth.",
    presentation: "mobile",
    stack: ["React Native", "Expo", "TypeScript", "Supabase", "PostgreSQL", "SQLite", "OpenAI", "Sentry"],
    highlights: [
      "Flexible group expenses, balances, settlements, analytics, notifications, and PDF/Excel exports.",
      "AI-powered voice and receipt input with offline-first local storage and resilient synchronization.",
      "Authentication, localization, automated testing, production monitoring, subscriptions, and end-to-end App Store release delivery.",
    ],
    live: "https://ceruapp.com/",
    cover: "/img/projects/ceru/cover.webp",
    coverAlt: "Ceru expense-sharing app with voice expense input on an iPhone",
    gallery: [
      { src: "/img/projects/splitai/IMG_8857.webp", alt: "Ceru group expense overview" },
      { src: "/img/projects/splitai/IMG_8858.webp", alt: "Ceru expense entry flow" },
      { src: "/img/projects/splitai/IMG_8859.webp", alt: "Ceru balances and settlements" },
      { src: "/img/projects/splitai/IMG_8860.webp", alt: "Ceru multilingual mobile interface" },
    ],
    accent: "lime",
  },
  {
    index: "02",
    title: "Sea’cret Residences — Real Estate Platform",
    shortTitle: "Sea’cret Residences",
    year: "2026",
    type: "Commercial client platform",
    status: "Live · Greece",
    description:
      "A production four-language marketing and lead-generation platform for a luxury coastal real-estate development, delivered from requirements through launch.",
    statement: "Four languages, one clear path from discovery to enquiry.",
    presentation: "web",
    stack: ["Next.js", "React", "TypeScript", "Sanity", "Resend", "Vercel", "PostHog"],
    highlights: [
      "Four-language localization, CMS-managed content, responsive property discovery, and structured enquiry workflows.",
      "Localized SEO and Generative Engine Optimization, analytics, accessibility, and privacy-conscious consent flows.",
      "Production deployment with image optimization, security headers, bot protection, and post-launch iteration.",
    ],
    live: "https://www.seacret-residence.com/",
    cover: "/img/projects/seacret/og-hero.webp",
    coverAlt: "Aerial view of Sea’cret Residences on the Greek coast",
    gallery: [
      { src: "/img/projects/seacret/seacret1.webp", alt: "Sea’cret Residences landing page" },
      { src: "/img/projects/seacret/seacret2.webp", alt: "Sea’cret Residences property discovery" },
      { src: "/img/projects/seacret/seacret3.webp", alt: "Sea’cret Residences multilingual content" },
      { src: "/img/projects/seacret/seacret4.webp", alt: "Sea’cret Residences development details" },
    ],
    accent: "blue",
  },
  {
    index: "03",
    title: "Campus42 — Student Housing Platform",
    shortTitle: "Campus42",
    year: "2026",
    type: "Commercial client platform",
    status: "Live · Greece",
    description:
      "A bilingual student-housing and lead-generation platform for an 83-studio development in Patras, independently delivered from planning through production.",
    statement: "A building with a story, translated into an interactive digital experience.",
    presentation: "web",
    stack: ["Next.js", "React", "TypeScript", "Sanity", "Resend", "Vercel"],
    highlights: [
      "Interactive floor and studio selection with availability, layouts, photography, and 3D tours.",
      "CMS-managed content, transactional enquiries, localized SEO and GEO, analytics, and accessibility.",
      "A custom browser-based arcade game designed as an interactive engagement feature.",
    ],
    live: "https://campus42.gr/en",
    cover: "/img/projects/campus42/cover.webp",
    coverAlt: "Campus42 student housing website in Patras, Greece",
    accent: "violet",
  },
  {
    index: "04",
    title: "AWS EC2 Observability Dashboard",
    shortTitle: "EC2 Observability",
    year: "2026",
    type: "Cloud engineering project",
    status: "Live interactive demo",
    description:
      "An interactive observability dashboard for exploring EC2 CPU, network, disk I/O, credit, and health metrics from Amazon CloudWatch.",
    statement: "CloudWatch telemetry made readable before it becomes urgent.",
    presentation: "dashboard",
    stack: ["React", "AWS EC2", "CloudWatch", "AWS SDK", "Chart.js", "Vercel"],
    highlights: [
      "Turns raw CloudWatch telemetry into a focused operations view with time-range and instance controls.",
      "Surfaces CPU pressure, burst-credit risk, network throughput, disk activity, and instance health in one workflow.",
      "Built as a practical cloud-metrics project and extended beyond the original technical brief.",
    ],
    live: "https://aws-cpu-utilization-metrics-six.vercel.app/",
    github: "https://github.com/antoniosifov/aws-cpu-utilization-metrics",
    cover: "/img/projects/aws/cover.webp",
    coverAlt: "AWS EC2 observability dashboard project cover",
    accent: "amber",
  },
  {
    index: "05",
    title: "Agentic RAG Knowledge Assistant",
    shortTitle: "RAG Assistant",
    year: "2026",
    type: "AI engineering project",
    status: "Live full-stack deployment",
    description:
      "An agentic knowledge assistant that retrieves, cites, and reasons over an indexed enterprise knowledge base while disclosing general-knowledge fallback.",
    statement: "Grounded answers, visible sources, and honest fallback behavior.",
    presentation: "dashboard",
    stack: ["Next.js", "TypeScript", "FastAPI", "LangChain", "OpenAI", "MongoDB Atlas Vector Search"],
    highlights: [
      "Multi-turn chat with grounded answers, cited sources, relevance scores, and explicit fallback status.",
      "FastAPI backend with an agentic retrieval pipeline, vector search, ingestion utilities, and typed contracts.",
      "Separately deployed frontend and backend with production-oriented documentation and error states.",
    ],
    live: "https://rag-chat-frontend-sigma.vercel.app/",
    github: "https://github.com/antoniosifov/rag-chat-backend",
    accent: "mint",
  },
  {
    index: "06",
    title: "Ski Shop — Full-Stack E-Commerce",
    shortTitle: "Ski Shop",
    year: "2026",
    type: "Full-stack product project",
    status: "Live demo",
    description:
      "A winter-sports commerce platform with separate customer and admin workflows, advanced catalog filtering, analytics, and AI-powered recommendations.",
    statement: "One product surface for customers, inventory, operations, and recommendations.",
    presentation: "web",
    stack: ["React", "Redux Toolkit", "Node.js", "Express", "MongoDB", "JWT", "OpenAI"],
    highlights: [
      "Product discovery, cart, checkout, order history, customer profiles, and protected admin operations.",
      "Layered REST API, JWT and Google authentication, stock control, and MongoDB aggregation analytics.",
      "AI-assisted cart recommendations with separately deployed frontend, API, and database services.",
    ],
    live: "https://e-commerce-ski.vercel.app/",
    github: "https://github.com/antoniosifov/e-commerce-ski",
    cover: "/img/projects/ecommerce/home.webp",
    coverAlt: "Ski Shop e-commerce home page",
    gallery: [
      { src: "/img/projects/ecommerce/catalog.webp", alt: "Ski Shop product catalog and filters" },
      { src: "/img/projects/ecommerce/cart&recommendations.webp", alt: "Ski Shop cart and AI recommendations" },
      { src: "/img/projects/ecommerce/my-orders.webp", alt: "Ski Shop customer order history" },
    ],
    accent: "rose",
  },
];

export const additionalProjects = [
  {
    year: "2026",
    title: "LiveBetter",
    type: "Commercial real-estate platform",
    description: "A production customer-facing platform for a Greek real-estate developer and its property portfolio.",
    href: "https://livebettergr.com/en",
  },
  {
    year: "2026",
    title: "UK Bright Future",
    type: "Commercial business website",
    description: "A responsive production website for a UK-based education and consulting client.",
    href: "https://ukbrightfuture.com/",
  },
  {
    year: "2025",
    title: "Factory Management System",
    type: "Full-stack operations platform",
    description: "Employee, department, shift, reporting, and AI-assisted scheduling workflows.",
    href: "https://factory-management-system-eight.vercel.app/",
  },
  {
    year: "2025",
    title: "Popcorn Palace",
    type: "Java / Spring Boot backend",
    description: "A tested REST API for movie catalog management and seat-level ticket booking.",
    href: "https://github.com/antoniosifov/popcorn-palace",
  },
];

export const experience = [
  {
    period: "Feb 2026 — Present",
    role: "Freelance Full-Stack Developer",
    company: "Freelance",
    meta: "Client & independent products · Israel / Remote",
    bullets: [
      "Build and ship client and independent products across web, mobile, cloud, and AI-enabled systems.",
      "Delivered multilingual production platforms for real-estate and student-housing clients, including CMS-managed content, localized SEO/GEO, analytics, accessibility, and enquiry flows.",
      "Architecting a custom CRM for a Greek real-estate developer, replacing fragmented Excel-based operations with structured data and centralized workflows.",
      "Building an AI agent for a dental business and contributing to a confidential multi-tenant SaaS platform for a healthcare client.",
      "Work directly with clients from requirements and system design through testing, deployment, iteration, and production support.",
    ],
  },
  {
    period: "Sep 2025 — Feb 2026",
    role: "Full-Stack Development Program",
    company: "Yaniv Arad — Tech Training Labs",
    meta: "250 hours · Israel / Remote",
    bullets: [
      "Built production-style applications with React, TypeScript, Node.js, Express, MongoDB, REST APIs, authentication, and AI integrations.",
      "Applied modular architecture, database modeling, automated workflows, Docker, and collaborative Git-based delivery.",
    ],
  },
  {
    period: "Dec 2024 — Apr 2025",
    role: "Full-Stack Developer",
    company: "Platforma365",
    meta: "Product startup · Israel / Remote",
    bullets: [
      "Worked across internal SaaS products, developing JavaScript frontend features, REST APIs, Laravel backend services, and MySQL-based data workflows.",
      "Implemented authentication, business logic, external API integrations, and parsing and normalization of unstructured legal and business data.",
      "Collaborated through debugging, code review, sprint planning, and iterative feature delivery in an Agile team.",
    ],
  },
];

export const education = [
  {
    period: "2021 — 2024",
    title: "B.Sc. in Computer Science",
    institution: "Holon Institute of Technology (HIT)",
    detail: "Grade 90 · Algorithms, data structures, OOP, databases, software engineering, and web development",
  },
  {
    period: "Issued Feb 2026",
    title: "Full Stack Development (250 Hours)",
    institution: "Yaniv Arad — Tech Training Labs",
    detail: "React, TypeScript, Node.js, REST APIs, databases, testing, Docker, and AI integration",
  },
];

export const contactLinks = [
  { label: "Email", value: "iosifov.a.14@gmail.com", href: "mailto:iosifov.a.14@gmail.com" },
  { label: "LinkedIn", value: "in/anton-iosifov", href: "https://www.linkedin.com/in/anton-iosifov/" },
  { label: "GitHub", value: "antoniosifov", href: "https://github.com/antoniosifov" },
  { label: "WhatsApp", value: "+972 53 422 3948", href: "https://wa.me/972534223948" },
];
