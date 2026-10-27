import type { JSX, SVGProps } from "react";
import type { SimpleIcon } from "simple-icons";
import {
  Code2,
  Container,
  Database,
  Medal,
  Palette,
  Server,
  Table,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  siReact,
  siVuedotjs,
  siTailwindcss,
  siHtml5,
  siCss,
  siJavascript,
  siTypescript,
  siPython,
  siFastapi,
  siDjango,
  siNodedotjs,
  siExpress,
  siPhp,
  siLaravel,
  siGo,
  siMysql,
  siPostgresql,
  siMongodb,
  siRedis,
  siDocker,
  siKubernetes,
  siGit,
  siGithub,
  siGitlab,
  siFigma,
  siCoreldraw,
  siSqlite,
} from "simple-icons";

/**
 * Brand logos are provided by the `simple-icons` npm package
 * (https://simpleicons.org, CC0 licensed). Each icon ships its official
 * SVG path and brand color, rendered into a viewBox 0 0 24 24.
 * For a handful of brands Simple Icons omits due to trademark policy
 * (Microsoft Excel, Adobe Photoshop/Illustrator, AWS, Canva, Java),
 * we ship hand-crafted approximations in the same style.
 * Skills without a brand logo fall back to category icons from
 * `lucide-react`, tinted with the category color (gray for soft skills).
 */

type IconProps = SVGProps<SVGSVGElement>;

/* ---------- Category colors for skills without a brand icon ---------- */

type Category =
  | "frontend"
  | "backend"
  | "database"
  | "devops"
  | "design"
  | "data"
  | "soft";

const CATEGORY_COLORS: Record<Category, string> = {
  frontend: "#3b82f6",
  backend: "#10b981",
  database: "#f59e0b",
  devops: "#8b5cf6",
  design: "#ec4899",
  data: "#06b6d4",
  soft: "#6b7280",
};

/* ---------- Lucide icons for skills without a brand logo ---------- */

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  frontend: Code2,
  backend: Server,
  database: Database,
  devops: Container,
  design: Palette,
  data: Table,
  soft: Medal,
};

/* ---------- Registry + lookup ---------- */

type BrandComponent = (props: IconProps) => JSX.Element;

interface SkillMeta {
  Icon?: BrandComponent;
  color?: string;
  category?: Category;
}

/** Wrap a simple-icons entry as a React component using its official brand color. */
function fromLibrary(icon: SimpleIcon): {
  Icon: BrandComponent;
  color: string;
} {
  const color = `#${icon.hex}`;
  const Icon = (props: IconProps) => (
    <svg viewBox="0 0 24 24" fill={color} aria-hidden="true" {...props}>
      <path d={icon.path} />
    </svg>
  );
  return { Icon, color };
}

/* ---------- Custom icons (trademark-restricted, not on Simple Icons) ---------- */

function ExcelLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#185C37"
        d="M12 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7l-4-4z"
        opacity=".22"
      />
      <path fill="#185C37" d="M12 3 8 7h4z" opacity=".35" />
      <path fill="#107C41" d="M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path
        fill="#fff"
        d="M12 10.5 8.7 14 12 17.5l3.3-3.5zM12 12l1.6 2-1.6 2-1.6-2z"
      />
    </svg>
  );
}

function PhotoshopLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#001E24" />
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="3"
        fill="none"
        stroke="#31A8FF"
        strokeOpacity=".35"
      />
      <text
        x="7"
        y="16.5"
        fontSize="10"
        fontWeight="700"
        fill="#31A8FF"
        fontFamily="sans-serif"
      >
        Ps
      </text>
    </svg>
  );
}

function IllustratorLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#330000" />
      <text
        x="8"
        y="16.5"
        fontSize="10"
        fontWeight="700"
        fill="#FF9A00"
        fontFamily="sans-serif"
      >
        Ai
      </text>
    </svg>
  );
}

function AwsLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#FF9900"
        d="M6.6 9.6c0-.4.1-.8.2-1.1.1-.3.3-.6.5-.9.2-.3.4-.5.7-.7.3-.2.6-.3.9-.4.3-.1.7-.1 1.1-.1.4 0 .8.1 1.2.2.4.1.7.3.9.5.2.3.4.6.4 1v4.8c0 .4.1.7.3 1 .2.2.5.4.9.4v.9h-5.4v-.9c.4 0 .7-.2.9-.4.2-.3.3-.6.3-1V9.6zm8.4 0c0-.4.1-.8.2-1.1.1-.3.3-.6.5-.9.2-.3.4-.5.7-.7.3-.2.6-.3.9-.4.3-.1.7-.1 1.1-.1.4 0 .8.1 1.2.2.4.1.7.3.9.5.2.3.4.6.4 1v4.8c0 .4.1.7.3 1 .2.2.5.4.9.4v.9h-5.4v-.9c.4 0 .7-.2.9-.4.2-.3.3-.6.3-1V9.6z"
        opacity=".95"
      />
      <path
        fill="#FF9900"
        d="M3 18c3 2 7 3 11 3 3 0 6-.8 8-2l-1-2c-2 1-4 1.5-7 1.5s-5-.5-7-1.5z"
      />
    </svg>
  );
}

function CanvaLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" fill="#00C4CC" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="#fff"
        fontFamily="sans-serif"
      >
        C
      </text>
    </svg>
  );
}

function JavaLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="#007396" aria-hidden="true" {...props}>
      <path d="M11.915 0 11.7.215C9.515 2.4 7.47 6.39 6.046 10.483c-1.064 1.024-3.633 2.81-3.711 3.551-.093.87 1.746 2.611 1.55 3.235-.198.625-1.304 1.408-1.014 1.939.1.188.823.011 1.277-.491a13.389 13.389 0 0 0-.017 2.14c.076.906.27 1.668.643 2.232.372.563.956.911 1.667.911.397 0 .727-.114 1.024-.264.298-.149.571-.33.91-.5.68-.34 1.634-.666 3.53-.604 1.903.062 2.872.39 3.559.704.687.314 1.15.664 1.925.664.767 0 1.395-.336 1.807-.9.412-.563.631-1.33.72-2.24.06-.623.055-1.32 0-2.066.454.45 1.117.604 1.213.424.29-.53-.816-1.314-1.013-1.937-.198-.624 1.642-2.366 1.549-3.236-.08-.748-2.707-2.568-3.748-3.586C16.428 6.374 14.308 2.394 12.13.215zm.175 6.038a2.95 2.95 0 0 1 2.943 2.942 2.95 2.95 0 0 1-2.943 2.943A2.95 2.95 0 0 1 9.148 8.98a2.95 2.95 0 0 1 2.942-2.942z" />
    </svg>
  );
}

// Lowercase keys. Aliases all map to the same library icon + official brand color.
const SKILL_MAP: Record<string, SkillMeta> = {
  react: { ...fromLibrary(siReact), category: "frontend" },
  "react.js": { ...fromLibrary(siReact), category: "frontend" },
  vue: { ...fromLibrary(siVuedotjs), category: "frontend" },
  "vue.js": { ...fromLibrary(siVuedotjs), category: "frontend" },
  tailwind: { ...fromLibrary(siTailwindcss), category: "frontend" },
  "tailwind css": { ...fromLibrary(siTailwindcss), category: "frontend" },
  html: { ...fromLibrary(siHtml5), category: "frontend" },
  html5: { ...fromLibrary(siHtml5), category: "frontend" },
  css: { ...fromLibrary(siCss), category: "frontend" },
  css3: { ...fromLibrary(siCss), category: "frontend" },
  javascript: { ...fromLibrary(siJavascript), category: "frontend" },
  js: { ...fromLibrary(siJavascript), category: "frontend" },
  typescript: { ...fromLibrary(siTypescript), category: "frontend" },
  ts: { ...fromLibrary(siTypescript), category: "frontend" },

  python: { ...fromLibrary(siPython), category: "backend" },
  fastapi: { ...fromLibrary(siFastapi), category: "backend" },
  django: { ...fromLibrary(siDjango), category: "backend" },
  node: { ...fromLibrary(siNodedotjs), category: "backend" },
  nodejs: { ...fromLibrary(siNodedotjs), category: "backend" },
  "node.js": { ...fromLibrary(siNodedotjs), category: "backend" },
  express: { ...fromLibrary(siExpress), category: "backend" },
  php: { ...fromLibrary(siPhp), category: "backend" },
  laravel: { ...fromLibrary(siLaravel), category: "backend" },
  java: { Icon: JavaLogo, color: "#007396", category: "backend" },
  go: { ...fromLibrary(siGo), category: "backend" },
  golang: { ...fromLibrary(siGo), category: "backend" },
  "rest api": { ...fromLibrary(siFastapi), category: "backend" },

  sql: { ...fromLibrary(siMysql), category: "database" },
  postgres: { ...fromLibrary(siPostgresql), category: "database" },
  postgresql: { ...fromLibrary(siPostgresql), category: "database" },
  mysql: { ...fromLibrary(siMysql), category: "database" },
  sqlite: { ...fromLibrary(siSqlite), category: "database" },
  mongodb: { ...fromLibrary(siMongodb), category: "database" },
  "mongo db": { ...fromLibrary(siMongodb), category: "database" },
  redis: { ...fromLibrary(siRedis), category: "database" },

  docker: { ...fromLibrary(siDocker), category: "devops" },
  kubernetes: { ...fromLibrary(siKubernetes), category: "devops" },
  k8s: { ...fromLibrary(siKubernetes), category: "devops" },
  aws: { Icon: AwsLogo, color: "#FF9900", category: "devops" },
  "amazon web services": {
    Icon: AwsLogo,
    color: "#FF9900",
    category: "devops",
  },
  git: { ...fromLibrary(siGit), category: "devops" },
  github: { ...fromLibrary(siGithub), category: "devops" },
  gitlab: { ...fromLibrary(siGitlab), category: "devops" },

  figma: { ...fromLibrary(siFigma), category: "design" },
  photoshop: { Icon: PhotoshopLogo, color: "#31A8FF", category: "design" },
  "adobe photoshop": {
    Icon: PhotoshopLogo,
    color: "#31A8FF",
    category: "design",
  },
  illustrator: { Icon: IllustratorLogo, color: "#FF9A00", category: "design" },
  "adobe illustrator": {
    Icon: IllustratorLogo,
    color: "#FF9A00",
    category: "design",
  },
  coreldraw: { ...fromLibrary(siCoreldraw), category: "design" },
  canva: { Icon: CanvaLogo, color: "#00C4CC", category: "design" },
  "desain konten": { category: "design" },

  excel: { Icon: ExcelLogo, color: "#185C37", category: "data" },
  "microsoft excel": { Icon: ExcelLogo, color: "#185C37", category: "data" },

  // Soft skills / general Indonesian terms — gray lucide icon.
  komunikasi: { category: "soft" },
  administrasi: { category: "soft" },
  pengarsipan: { category: "soft" },
  negosiasi: { category: "soft" },
  disiplin: { category: "soft" },
  kebersihan: { category: "soft" },
  "fisik kuat": { category: "soft" },
  pelayanan: { category: "soft" },
  "pelayanan pelanggan": { category: "soft" },
  "admin toko": { category: "soft" },
  inventaris: { category: "soft" },
  "pos system": { category: "soft" },
  "perawatan pasien": { category: "soft" },
  "farmasi klinis": { category: "soft" },
  "sop rumah sakit": { category: "soft" },
};

function lookup(name: string): SkillMeta | undefined {
  return SKILL_MAP[name.trim().toLowerCase()];
}

/**
 * Renders a skill badge. Falls back to a category icon (lucide-react,
 * tinted gray for soft/general skills) when no brand icon exists.
 * Pass `onRemove` to turn the badge into a dismissible chip (post form).
 */
export function SkillBadge({
  name,
  onRemove,
}: {
  name: string;
  onRemove?: () => void;
}) {
  const meta = lookup(name);
  const category = meta?.category ?? "soft";
  const color = meta?.color ?? CATEGORY_COLORS[category];
  const Icon = meta?.Icon ?? CATEGORY_ICONS[category];

  return (
    <li
      className={`skill-badge skill-cat-${category}${onRemove ? " skill-badge-removable" : ""}`}
      style={{ ["--skill-color" as string]: color }}
      title={name}
    >
      <span className="skill-badge-icon" aria-hidden="true">
        <Icon width={18} height={18} />
      </span>
      <span className="skill-badge-label">{name.trim()}</span>
      {onRemove && (
        <button
          type="button"
          className="skill-badge-remove"
          aria-label={`Hapus ${name.trim()}`}
          onClick={onRemove}
        >
          <X width={11} height={11} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}

export const CATEGORY_PALETTE = CATEGORY_COLORS;

/**
 * Curated suggestion list for the job-posting skill picker — one canonical
 * name per distinct skill (aliases in SKILL_MAP stay display-only).
 */
export const SUGGESTED_SKILLS: string[] = [
  // Frontend
  "React",
  "Vue",
  "Tailwind CSS",
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  // Backend
  "Python",
  "FastAPI",
  "Django",
  "Node.js",
  "Express",
  "PHP",
  "Laravel",
  "Java",
  "Go",
  "REST API",
  // Database
  "SQL",
  "PostgreSQL",
  "MySQL",
  "SQLite",
  "MongoDB",
  "Redis",
  // DevOps
  "Docker",
  "Kubernetes",
  "AWS",
  "Git",
  "GitHub",
  "GitLab",
  // Design
  "Figma",
  "Photoshop",
  "Illustrator",
  "CorelDRAW",
  "Canva",
  "Desain Konten",
  // Data
  "Microsoft Excel",
  // Soft / general (Indonesian, matching the sample listings)
  "Komunikasi",
  "Administrasi",
  "Pengarsipan",
  "Negosiasi",
  "Disiplin",
  "Kebersihan",
  "Fisik Kuat",
  "Pelayanan Pelanggan",
  "Admin Toko",
  "Inventaris",
  "POS System",
  "Perawatan Pasien",
  "Farmasi Klinis",
  "SOP Rumah Sakit",
];
