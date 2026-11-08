export type Category = "web" | "mobile" | "ai" | "automation";

export type Project = {
  categories: Category[];
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
  devices?: { desktop: string; mobile?: string };
  accent: "coral" | "lime" | "blue" | "violet" | "amber" | "mint" | "rose";
};

export const navigation = [
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Education", href: "#education" },
  { label: "Skills", href: "#skills" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export type IconName =
  | "code"
  | "layers"
  | "sparkles"
  | "cloud"
  | "users"
  | "globe"
  | "star"
  | "arrow-right"
  | "arrow-up-right"
  | "menu"
  | "pause"
  | "play"
  | "check"
  | "circle-check"
  | "calendar"
  | "map-pin"
  | "external-link"
  | "database"
  | "graduation-cap"
  | "award"
  | "braces"
  | "bot"
  | "box"
  | "workflow"
  | "home"
  | "close";

export const capabilities: { icon: IconName; label: string; detail: string }[] = [
  { icon: "code", label: "Full-Stack", detail: "Development" },
  { icon: "layers", label: "Product", detail: "& Architecture" },
  { icon: "sparkles", label: "AI", detail: "Integration" },
  { icon: "cloud", label: "Deployment", detail: "& Automation" },
];

export const stats: { icon: IconName; value: string; label: string }[] = [
  { icon: "layers", value: "10+", label: "Products & projects shipped" },
  { icon: "users", value: "4", label: "Commercial platforms in production" },
  { icon: "globe", value: "3", label: "Languages · EN / HE / RU" },
  { icon: "star", value: "Grade 90", label: "B.Sc. Computer Science (HIT)" },
];


export const stackGroups: { label: string; icon: IconName; description: string; items: string[] }[] = [
  {
    label: "Frontend",
    icon: "code",
    description: "Building responsive, modern and scalable user interfaces.",
    items: ["TypeScript", "React", "Next.js", "React Native", "Expo", "Redux", "Tailwind CSS"],
  },
  {
    label: "Backend & data",
    icon: "database",
    description: "Building reliable APIs, integrations, and data-driven systems.",
    items: ["Node.js", "Express", "FastAPI", "Laravel", "Spring Boot", "REST APIs", "PostgreSQL", "MongoDB", "MySQL", "Supabase"],
  },
  {
    label: "Cloud & delivery",
    icon: "cloud",
    description: "Deploying, scaling, and maintaining production-ready apps.",
    items: ["AWS", "Docker", "GitHub Actions", "Vercel", "Render", "Sentry", "Automated testing"],
  },
  {
    label: "Applied AI",
    icon: "sparkles",
    description: "Integrating AI capabilities to automate, analyze, and enhance products.",
    items: ["OpenAI", "Anthropic", "LangChain", "RAG", "Vector search", "AI Agents", "Agentic workflows"],
  },
];

export const projects: Project[] = [
  {
    index: "01",
    categories: ["mobile", "ai"],
    title: "Ceru — Multilingual Expense-Sharing App",
    shortTitle: "Ceru",
    year: "2026",
    type: "Independent mobile product",
    status: "Live on the App Store · Android in development",
    description:
      "Independently built and launched a six-language, multi-currency expense-sharing app on the App Store.",
    statement: "Offline-first expense sharing with voice and receipt input.",
    presentation: "mobile",
    stack: ["React Native", "Expo", "TypeScript", "Supabase", "PostgreSQL", "SQLite", "Drizzle", "Zustand", "NativeWind", "OpenAI", "Sentry"],
    highlights: [
      "Built flexible group expenses, balances, settlements, analytics, notifications, and PDF/Excel exports.",
      "Implemented AI-powered voice and receipt input using OpenAI.",
      "Designed offline-first local storage with SQLite and Drizzle, synchronized with Supabase/PostgreSQL.",
      "Delivered authentication, localization, automated testing, Sentry error monitoring, subscriptions, and the App Store release.",
    ],
    live: "https://ceruapp.com/",
    cover: "/img/projects/ceru/cover.webp",
    coverAlt: "Ceru expense-sharing app with voice expense input on an iPhone",
    gallery: [
      {
        src: "/img/projects/ceru/ceru-home.webp",
        alt: "Ceru home screen with total balance, groups, and recent expenses",
      },
      { src: "/img/projects/ceru/ceru-launch.webp", alt: "Ceru launch screen" },
      {
        src: "/img/projects/ceru/ceru-analytics.webp",
        alt: "Ceru group analytics with spending by category",
      },
    ],
    accent: "lime",
  },
  {
    index: "02",
    categories: ["web"],
    title: "Sea’cret Residence — Multilingual Real Estate Platform",
    shortTitle: "Sea’cret Residence",
    year: "2026",
    type: "Commercial client platform",
    status: "Live · Greece",
    description: "Built and launched a production multilingual platform for a luxury coastal real-estate development in Greece.",
    statement: "Four languages, one clear path from discovery to inquiry.",
    presentation: "web",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Sanity", "Resend", "Vercel"],
    highlights: [
      "Built responsive pages and reusable UI components with Next.js, React, TypeScript, and Tailwind CSS.",
      "Implemented four-language localization, CMS-managed content with Sanity, and inquiry flows with transactional email delivery through Resend.",
      "Delivered localized SEO, Generative Engine Optimization (GEO), analytics integrations, accessibility improvements, and production deployment on Vercel.",
      "Worked directly with the client from requirements and content structure through launch and post-release iteration.",
    ],
    live: "https://www.seacret-residence.com/",
    cover: "/img/projects/seacret/og-hero.webp",
    coverAlt: "Sea’cret Residence website on a laptop",
    devices: { desktop: "/img/projects/seacret/laptop.webp", mobile: "/img/projects/seacret/phone.webp" },
    gallery: [
      { src: "/img/projects/seacret/seacret1.webp", alt: "Sea’cret Residence landing page" },
      { src: "/img/projects/seacret/seacret2.webp", alt: "Sea’cret Residence property discovery" },
      { src: "/img/projects/seacret/seacret3.webp", alt: "Sea’cret Residence multilingual content" },
      { src: "/img/projects/seacret/seacret4.webp", alt: "Sea’cret Residence development details" },
    ],
    accent: "blue",
  },
  {
    index: "03",
    categories: ["web"],
    title: "Campus42 — Interactive Student Housing Platform",
    shortTitle: "Campus42",
    year: "2026",
    type: "Commercial client platform",
    status: "Live · Greece",
    description: "Independently built and launched a bilingual student-housing platform for an 83-studio development in Patras, Greece.",
    statement: "Interactive floor and studio selection for an 83-studio student-housing development.",
    presentation: "web",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Sanity", "Resend"],
    highlights: [
      "Built an interactive floor and studio selection experience with availability, layouts, photos, and 3D tours.",
      "Implemented bilingual localization, CMS-managed content with Sanity, and inquiry flows with transactional email delivery through Resend.",
      "Delivered localized SEO, Generative Engine Optimization (GEO), analytics integrations, accessibility improvements, and production deployment.",
      "Developed a custom browser-based arcade game as an interactive engagement feature.",
      "Worked directly with the client from requirements and content architecture through launch and post-release iteration.",
    ],
    live: "https://campus42.gr/en",
    cover: "/img/projects/campus42/cover.webp",
    coverAlt: "Campus42 student housing website on a laptop",
    devices: { desktop: "/img/projects/campus42/laptop.webp", mobile: "/img/projects/campus42/phone.webp" },
    accent: "violet",
  },
  {
    index: "07",
    categories: ["web", "automation"],
    title: "ICU Shift Scheduling",
    shortTitle: "ICU Shift Scheduling",
    year: "2026",
    type: "Internal product",
    status: "In use at a public hospital",
    description:
      "A week of intensive-care shifts built from the nurses' own constraints, with a solver doing the arithmetic the head nurse used to do by hand.",
    statement: "Two days of deciphering handwriting, gone.",
    presentation: "web",
    stack: ["React", "Python", "OR-Tools", "PostgreSQL", "Supabase", "GitHub Actions"],
    highlights: [
      "Full weekly cycle for an intensive-care unit: constraint collection, generation, manual review and publishing.",
      "Reproducible OR-Tools solver with pinned versions, so the same input always produces the same roster.",
      "PostgreSQL row-level access isolation, automated schema and end-to-end checks, and a phone view for nurses. Shown with a fictional staff list.",
    ],
    cover: "/img/projects/icu/laptop.webp",
    coverAlt: "Weekly shift roster for an intensive care unit on a laptop",
    devices: { desktop: "/img/projects/icu/laptop.webp", mobile: "/img/projects/icu/phone.webp" },
    accent: "mint",
  },
  {
    index: "04",
    categories: ["web"],
    title: "AWS EC2 Observability Dashboard",
    shortTitle: "EC2 Observability",
    year: "2026",
    type: "Cloud engineering project",
    status: "Live interactive demo",
    description: "Designed and built a full-stack observability dashboard for Amazon EC2, resolving instances by private IP and retrieving CPU, network, disk I/O, credit balance, and status-check metrics from Amazon CloudWatch through AWS SDK v3.",
    statement: "CloudWatch telemetry made readable before it becomes urgent.",
    presentation: "dashboard",
    stack: ["React", "Node.js", "Express", "AWS SDK v3", "Amazon EC2", "CloudWatch", "Chart.js", "Three.js", "Vercel", "Render"],
    highlights: [
      "Built an interactive React and Chart.js interface with selectable time windows, sampling intervals, metric switching, and summary statistics.",
      "Added a zero-credential demo mode with realistic synthetic data for a publicly accessible deployment.",
      "Created an optimized Three.js exploded-view CPU visualization with reduced-motion support and graceful fallbacks.",
      "Deployed the frontend on Vercel and the Node.js/Express API on Render.",
    ],
    live: "https://aws-cpu-utilization-metrics-six.vercel.app/",
    github: "https://github.com/antoniosifov/aws-cpu-utilization-metrics",
    cover: "/img/projects/aws/cover.webp",
    coverAlt: "AWS EC2 observability dashboard project cover",
    accent: "amber",
  },
  {
    index: "05",
    categories: ["web", "ai"],
    title: "Agentic RAG Knowledge Assistant",
    shortTitle: "RAG Assistant",
    year: "2026",
    type: "AI engineering project",
    status: "Live full-stack deployment",
    description: "Built a full-stack RAG knowledge assistant that answers enterprise IT support questions using an internal knowledge base and shows the sources behind each grounded response.",
    statement: "Grounded answers, visible sources, and honest fallback behavior.",
    presentation: "dashboard",
    stack: ["Python", "FastAPI", "LangChain", "OpenAI", "MongoDB Atlas Vector Search", "Next.js", "React", "TypeScript", "Tailwind CSS"],
    highlights: [
      "Developed a FastAPI chat API with a LangChain tool-calling agent that decides when to retrieve company knowledge and when to use a clearly labeled general-knowledge fallback.",
      "Implemented CSV knowledge ingestion, OpenAI embeddings, and semantic retrieval with MongoDB Atlas Vector Search.",
      "Returned source topics and relevance scores with grounded answers while keeping conversation history client-controlled through a stateless API.",
      "Built a Next.js and TypeScript chat interface with suggested prompts, cited-source panels, fallback indicators, and loading and error states.",
    ],
    live: "https://rag-chat-frontend-sigma.vercel.app/",
    github: "https://github.com/antoniosifov/rag-chat-backend",
    accent: "mint",
  },
  {
    index: "06",
    categories: ["web", "ai"],
    title: "Ski Shop — Full-Stack E-Commerce Platform",
    shortTitle: "Ski Shop",
    year: "2026",
    type: "Full-stack product project",
    status: "Live demo",
    description: "Built a full-stack e-commerce platform for winter sports equipment with separate customer and admin experiences.",
    statement: "One product surface for customers, inventory, operations, and recommendations.",
    presentation: "web",
    stack: ["React", "Redux Toolkit", "Vite", "Node.js", "Express", "MongoDB", "Mongoose", "JWT", "Google OAuth", "Recharts", "OpenAI"],
    highlights: [
      "Implemented product discovery with search, sorting, category and attribute filters, shopping cart, order placement, order history, and customer profiles.",
      "Built protected admin workflows for category and product management, stock control, customer order visibility, and sales analytics.",
      "Developed a layered REST API with Node.js, Express, MongoDB/Mongoose, JWT authentication and role-based authorization, password hashing, and Google Sign-In.",
      "Added AI-powered cart recommendations with OpenAI and deployed the frontend, API, and database across Vercel, Render, and MongoDB Atlas.",
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

export const compactProjects: {
  title: string;
  kind: string;
  icon: IconName;
  description: string;
  categories: Category[];
  image?: string;
  href?: string;
  status?: string;
  tools?: string[];
}[] = [
  {
    title: "Sea’cret Residence",
    kind: "Web platform",
    icon: "layers",
    description: "Commercial real-estate marketing platform.",
    categories: ["web"],
    image: "/img/projects/seacret/laptop.webp",
    href: "https://www.seacret-residence.com/",
  },
  {
    title: "Campus42",
    kind: "Web platform",
    icon: "home",
    description: "Student housing platform (Patras, Greece).",
    categories: ["web"],
    image: "/img/projects/campus42/laptop.webp",
    href: "https://campus42.gr/en",
  },
  {
    title: "Factory Management",
    kind: "Web app",
    icon: "box",
    description: "Employees, shifts and AI-assisted weekly scheduling.",
    categories: ["web", "ai"],
    image: "/img/projects/factory/employees.webp",
    href: "https://factory-management-system-eight.vercel.app/",
  },
  {
    title: "Dental Clinic Automations",
    kind: "AI automation",
    icon: "sparkles",
    description: "WhatsApp → CRM (Monday) → Appointments (Optima).",
    categories: ["ai", "automation"],
    status: "In development",
    tools: ["WhatsApp", "monday.com", "Optima"],
  },
];

export const additionalProjects: { year: string; title: string; type: string; description: string; href?: string; categories: Category[] }[] = [
  {
    year: "2026",
    title: "FullFace",
    categories: ["web", "ai"],
    type: "Confidential multi-tenant SaaS platform",
    description: "Contributed to the development of a private multi-tenant SaaS platform for a commercial client.",
  },
  {
    year: "2026",
    title: "Real Estate CRM & Document Management",
    categories: ["web", "automation"],
    type: "CRM and document-management platform",
    description: "Developing a CRM and document-management platform to consolidate a real-estate developer's Excel-based operations.",
  },
  {
    year: "2026",
    title: "LiveBetter",
    categories: ["web"],
    type: "Commercial real-estate platform",
    description: "A production customer-facing platform for a Greek real-estate developer and its property portfolio.",
    href: "https://livebettergr.com/en",
  },
  {
    year: "2026",
    title: "UK Bright Future",
    categories: ["web"],
    type: "Commercial business website",
    description: "A responsive production website for a UK-based education and consulting client.",
    href: "https://ukbrightfuture.com/",
  },
  {
    year: "2025",
    title: "Popcorn Palace",
    categories: ["web"],
    type: "Movie ticket booking system",
    description: "A backend-focused movie ticket booking system with REST APIs for managing movies, showtimes, and seat reservations.",
    href: "https://github.com/antoniosifov/popcorn-palace",
  },
];

export const experience: {
  period: string;
  role: string;
  company: string;
  meta: string;
  summary: string;
  bullets: string[];
  stack: string[];
  current?: boolean;
  logo?: string;
  href?: string;
}[] = [
  {
    period: "Feb 2026 — Present",
    role: "Full-Stack Software Engineer",
    current: true,
    stack: ["Node.js", "React", "TypeScript", "Python", "Next.js", "React Native", "Supabase", "PostgreSQL", "OpenAI"],
    company: "Freelance · Self-employed",
    meta: "Israel · Remote",
    summary:
      "I build and ship client and independent products across web, mobile, and AI-enabled systems, taking ownership from requirements and system design through testing, deployment, and production support.",
    bullets: [
      "Delivered multilingual production platforms for real-estate and student-housing projects, including CMS-managed content, localized SEO, analytics, accessibility, and inquiry flows.",
      "Developing a custom CRM for a Greek real-estate developer, consolidating fragmented Excel-based operations into a centralized system for structured data and business workflows.",
      "Developing an AI agent for a dental business to support customer-facing and internal workflows.",
      "Built a six-language, multi-currency expense-sharing mobile app from concept to App Store release, with offline synchronization and an Android release in preparation.",
      "Work directly with clients to translate business needs into scoped releases, iterate on feedback, and maintain products after launch.",
    ],
  },
  {
    period: "Dec 2024 — May 2025",
    role: "Full-Stack Engineer",
    logo: "/img/brands/platforma365.webp",
    href: "https://platforma365.com",
    stack: ["PHP", "Laravel", "MySQL", "JavaScript", "Bootstrap", "Git"],
    company: "Platforma365 · Full-time",
    meta: "Israel · Remote",
    summary:
      "Built frontend features, Laravel/PHP APIs, and workflows for parsing and normalizing unstructured legal and business data for internal SaaS products.",
    bullets: [
      "Developed JavaScript frontend features and dynamic UI components using Blade and Bootstrap.",
      "Built and maintained REST API endpoints and backend business logic with Laravel and PHP.",
      "Integrated external APIs and developed workflows for parsing and normalizing unstructured legal and business data.",
      "Implemented authentication flows, improved MySQL database performance, and applied security best practices across internal systems.",
      "Collaborated in an Agile environment through debugging, code reviews, sprint planning, and feature delivery.",
    ],
  },
];

export const education: {
  period: string;
  title: string;
  institution: string;
  detail: string;
  logo?: string;
  grade?: string;
  degree?: string;
  stack?: string[];
}[] = [
  {
    period: "Oct 2021 — Nov 2024",
    title: "B.Sc. in Computer Science",
    institution: "Holon Institute of Technology (HIT)",
    logo: "/img/brands/hit.svg",
    grade: "90",
    degree: "B.Sc.",
    detail: "Relevant areas of study included algorithms and data structures, object-oriented programming, databases, software engineering, and web development.",
  },
  {
    period: "Professional development · Feb 2026",
    title: "Full Stack Development (250 Hours)",
    institution: "Yaniv Arad - Tech Training Labs",
    stack: ["React", "TypeScript", "Node.js", "Docker"],
    detail: "A 250-hour program covering REST APIs, databases, testing, and AI integration.",
  },
];

export const certificates = [
  {
    title: "B.Sc. Computer Science",
    meta: "HIT · 2025",
    src: "/img/certificates/hit-bsc.webp",
    alt: "Bachelor of Science in Computer Science degree certificate from Holon Institute of Technology, with the ID number concealed",
  },
  {
    title: "Full Stack Development",
    meta: "Training Labs · 2026",
    src: "/img/certificates/full-stack-250h.webp",
    alt: "Certificate of Achievement for the 250-hour Full Stack Development program at Yaniv Arad Training Labs",
  },
];

export const contactLinks = [
  { label: "Email", value: "iosifov.a.14@gmail.com", href: "mailto:iosifov.a.14@gmail.com" },
  { label: "LinkedIn", value: "in/anton-iosifov", href: "https://www.linkedin.com/in/anton-iosifov/" },
  { label: "GitHub", value: "antoniosifov", href: "https://github.com/antoniosifov" },
  { label: "WhatsApp", value: "+972 53 422 3948", href: "https://wa.me/972534223948" },
];
