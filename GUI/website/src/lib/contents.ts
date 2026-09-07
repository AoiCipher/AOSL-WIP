// ============================================================
// Project AOSL — Mock Data Store (contents.ts)
// Single source of truth for all frontend state.
// Structured for future API middleware integration.
// ============================================================

export type UserRole = "ADMIN" | "USER";

export type Permission =
  | "can_add_knowledge"
  | "can_edit_knowledge"
  | "can_delete_knowledge"
  | "can_cancel_assessments"
  | "can_create_assessments"
  | "can_view_findings"
  | "can_export_findings"
  | "can_manage_users";

export interface MockUser {
  id: string;
  username: string;
  password: string; // plaintext for mock only
  role: UserRole;
  permissions: Permission[];
  createdAt: string;
}

export type AssessmentStatus = "running" | "queued" | "completed" | "error" | "canceled";

export type FocusArea =
  | "OWASP Top 10"
  | "API Security"
  | "Network Security"
  | "Authentication & Authorization"
  | "Injection Attacks"
  | "Cryptography"
  | "Cloud Security"
  | "Social Engineering";

export interface Assessment {
  id: string;
  name: string;
  domains: string[];
  outOfScope: string[];
  context: string;
  focusAreas: FocusArea[];
  goals: string;
  useKnowledgeBase: boolean;
  status: AssessmentStatus;
  createdAt: string;
  updatedAt: string;
  plannerLogs: string[];
  findingIds: string[];
}

export type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  id: string;
  assessmentId: string;
  title: string;
  severity: SeverityLevel;
  description: string;
  remediation: string;
  discoveredAt: string;
  cve?: string;
  affectedAsset: string;
}

export interface KnowledgeEntry {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Users
// ============================================================
export const mockUsers: MockUser[] = [
  {
    id: "usr_001",
    username: "admin",
    password: "admin123",
    role: "ADMIN",
    permissions: [
      "can_add_knowledge",
      "can_edit_knowledge",
      "can_delete_knowledge",
      "can_cancel_assessments",
      "can_create_assessments",
      "can_view_findings",
      "can_export_findings",
      "can_manage_users",
    ],
    createdAt: "2026-01-15T08:00:00Z",
  },
  {
    id: "usr_002",
    username: "jsmith",
    password: "pass1234",
    role: "USER",
    permissions: [
      "can_add_knowledge",
      "can_create_assessments",
      "can_view_findings",
      "can_cancel_assessments",
    ],
    createdAt: "2026-02-20T10:30:00Z",
  },
  {
    id: "usr_003",
    username: "mwilson",
    password: "secure99",
    role: "USER",
    permissions: ["can_view_findings", "can_create_assessments"],
    createdAt: "2026-03-05T14:15:00Z",
  },
  {
    id: "usr_004",
    username: "lchen",
    password: "hunter42",
    role: "USER",
    permissions: [
      "can_add_knowledge",
      "can_edit_knowledge",
      "can_view_findings",
      "can_export_findings",
    ],
    createdAt: "2026-04-10T09:45:00Z",
  },
];

// ============================================================
// Findings
// ============================================================
export const mockFindings: Finding[] = [
  {
    id: "fnd_001",
    assessmentId: "asm_001",
    title: "SQL Injection in Login Endpoint",
    severity: "critical",
    description:
      "The /api/auth/login endpoint is vulnerable to SQL injection via the username parameter. Unsanitized input is passed directly into a raw SQL query, allowing for authentication bypass and full database dump.",
    remediation:
      "Use parameterized queries or an ORM. Validate and sanitize all inputs. Implement WAF rules for SQL injection patterns.",
    discoveredAt: "2026-08-10T11:23:00Z",
    affectedAsset: "api.target-corp.com/api/auth/login",
    cve: "CVE-2021-44228",
  },
  {
    id: "fnd_002",
    assessmentId: "asm_001",
    title: "Broken Access Control on Admin Routes",
    severity: "high",
    description:
      "Admin API routes at /api/admin/* lack proper authorization checks. A standard user token can be used to access administrative functions including user deletion and configuration changes.",
    remediation:
      "Implement role-based access control (RBAC) on all sensitive routes. Enforce authorization at the server side, not only on the client.",
    discoveredAt: "2026-08-10T14:05:00Z",
    affectedAsset: "api.target-corp.com/api/admin/*",
  },
  {
    id: "fnd_003",
    assessmentId: "asm_001",
    title: "Cross-Site Scripting (Reflected XSS)",
    severity: "high",
    description:
      "The search functionality on the main portal reflects user input without encoding. An attacker can craft a malicious URL that executes arbitrary JavaScript in the victim's browser.",
    remediation:
      "Encode all user-controlled output. Implement a strict Content Security Policy (CSP). Use modern frameworks that auto-escape by default.",
    discoveredAt: "2026-08-11T09:00:00Z",
    affectedAsset: "portal.target-corp.com/search",
  },
  {
    id: "fnd_004",
    assessmentId: "asm_001",
    title: "Sensitive Data in HTTP Response Headers",
    severity: "medium",
    description:
      "Server version banners (Apache/2.4.41, PHP/7.4.3) are exposed in response headers, providing attackers with fingerprinting information to exploit known CVEs.",
    remediation:
      "Suppress version information in all server headers. Configure Server and X-Powered-By headers to be blank or misleading.",
    discoveredAt: "2026-08-11T10:30:00Z",
    affectedAsset: "portal.target-corp.com",
  },
  {
    id: "fnd_005",
    assessmentId: "asm_001",
    title: "Insecure Direct Object Reference (IDOR)",
    severity: "high",
    description:
      "The /api/users/{id}/profile endpoint allows enumeration of all user profiles by incrementing the id parameter without ownership validation.",
    remediation:
      "Validate that the requesting user owns or has permission to access the resource. Use UUIDs instead of sequential integers.",
    discoveredAt: "2026-08-11T15:45:00Z",
    affectedAsset: "api.target-corp.com/api/users/{id}/profile",
  },
  {
    id: "fnd_006",
    assessmentId: "asm_002",
    title: "Open Redirect Vulnerability",
    severity: "medium",
    description:
      "The ?redirect= parameter on the login page does not validate the destination URL, enabling phishing attacks via crafted redirect chains.",
    remediation:
      "Whitelist allowed redirect destinations. Validate the host portion of any redirect URL before processing.",
    discoveredAt: "2026-08-20T08:15:00Z",
    affectedAsset: "auth.sub.target-corp.com/login",
  },
  {
    id: "fnd_007",
    assessmentId: "asm_002",
    title: "JWT Algorithm Confusion Attack",
    severity: "critical",
    description:
      "The API accepts JWTs signed with the 'none' algorithm, allowing an attacker to forge arbitrary tokens without a signing key.",
    remediation:
      "Explicitly allowlist accepted JWT algorithms on the server. Reject tokens signed with 'none'. Use RS256 or ES256 for production.",
    discoveredAt: "2026-08-20T11:50:00Z",
    affectedAsset: "api.sub.target-corp.com",
    cve: "CVE-2022-21449",
  },
  {
    id: "fnd_008",
    assessmentId: "asm_002",
    title: "Missing Rate Limiting on Password Reset",
    severity: "medium",
    description:
      "The password reset endpoint allows unlimited requests, enabling brute-force OTP attacks and account enumeration.",
    remediation:
      "Implement rate limiting (e.g., 5 attempts/hour per IP). Add CAPTCHA after failed attempts. Log and alert on suspicious patterns.",
    discoveredAt: "2026-08-21T13:20:00Z",
    affectedAsset: "auth.sub.target-corp.com/reset-password",
  },
  {
    id: "fnd_009",
    assessmentId: "asm_003",
    title: "Default Credentials on Management Interface",
    severity: "critical",
    description:
      "The network device management interface at 10.0.1.1:8443 accepts the default credentials admin/admin, providing full administrative control.",
    remediation:
      "Change all default credentials immediately. Enforce a strong password policy. Restrict management interfaces to dedicated VLANs.",
    discoveredAt: "2026-09-01T07:00:00Z",
    affectedAsset: "10.0.1.1:8443",
  },
  {
    id: "fnd_010",
    assessmentId: "asm_003",
    title: "TLS 1.0/1.1 Enabled",
    severity: "low",
    description:
      "Legacy TLS versions 1.0 and 1.1 are enabled on multiple endpoints, which are susceptible to BEAST and POODLE attacks.",
    remediation:
      "Disable TLS 1.0 and 1.1. Enforce TLS 1.2 as the minimum, TLS 1.3 preferred. Audit cipher suites and remove weak ones.",
    discoveredAt: "2026-09-01T10:00:00Z",
    affectedAsset: "*.target-corp.com",
  },
  {
    id: "fnd_011",
    assessmentId: "asm_003",
    title: "Verbose Error Messages",
    severity: "info",
    description:
      "Application error pages expose stack traces and internal file paths, which can assist attackers in understanding the application structure.",
    remediation:
      "Configure a generic error page for production. Log detailed errors server-side only. Never expose stack traces to end users.",
    discoveredAt: "2026-09-01T14:00:00Z",
    affectedAsset: "portal.target-corp.com",
  },
  {
    id: "fnd_012",
    assessmentId: "asm_004",
    title: "Server-Side Request Forgery (SSRF)",
    severity: "high",
    description:
      "The webhook configuration endpoint allows specifying arbitrary URLs that the server will fetch, enabling SSRF to internal services including the cloud metadata endpoint.",
    remediation:
      "Validate and sanitize URLs in webhook configs. Block RFC 1918 addresses and cloud metadata IPs (169.254.169.254). Use an allowlist of permitted domains.",
    discoveredAt: "2026-09-03T09:30:00Z",
    affectedAsset: "api.target-corp.com/api/webhooks/configure",
    cve: "CVE-2021-26085",
  },
];

// ============================================================
// Assessments
// ============================================================
export const mockAssessments: Assessment[] = [
  {
    id: "asm_001",
    name: "Target Corp — Full Web Application Pentest",
    domains: ["target-corp.com", "api.target-corp.com", "portal.target-corp.com"],
    outOfScope: ["mail.target-corp.com", "legacy.target-corp.com"],
    context:
      "External black-box pentest of the primary customer-facing web applications and their APIs. Focus on business logic flaws in the checkout and account management flows.",
    focusAreas: ["OWASP Top 10", "API Security", "Authentication & Authorization"],
    goals: "Identify all critical and high severity vulnerabilities before Q4 production release.",
    useKnowledgeBase: true,
    status: "completed",
    createdAt: "2026-08-09T08:00:00Z",
    updatedAt: "2026-08-11T18:30:00Z",
    plannerLogs: [
      "[2026-08-09 08:00:12] Assessment initialized. Loading knowledge base context...",
      "[2026-08-09 08:00:15] Knowledge base loaded: 24 entries relevant to OWASP Top 10.",
      "[2026-08-09 08:01:02] Phase 1: Reconnaissance — passive scanning initiated on target-corp.com",
      "[2026-08-09 08:05:33] Subdomains discovered: api.target-corp.com, portal.target-corp.com, mail.target-corp.com (out-of-scope, skipping)",
      "[2026-08-09 08:12:11] Technology stack fingerprinted: Apache/2.4.41, PHP/7.4.3, MySQL 8.0",
      "[2026-08-09 09:00:00] Phase 2: Active scanning — injecting payloads into login endpoint",
      "[2026-08-10 11:23:44] CRITICAL: SQL Injection detected in /api/auth/login (param: username)",
      "[2026-08-10 14:05:18] HIGH: Broken access control on /api/admin/* — privilege escalation confirmed",
      "[2026-08-11 09:00:02] HIGH: Reflected XSS in /search?q= parameter",
      "[2026-08-11 10:30:45] MEDIUM: Server version disclosure in response headers",
      "[2026-08-11 15:45:33] HIGH: IDOR vulnerability in /api/users/{id}/profile",
      "[2026-08-11 18:30:00] Phase 3: Report generation complete. 5 findings documented.",
      "[2026-08-11 18:30:01] Assessment COMPLETED. Total findings: 5 (1 critical, 3 high, 1 medium)",
    ],
    findingIds: ["fnd_001", "fnd_002", "fnd_003", "fnd_004", "fnd_005"],
  },
  {
    id: "asm_002",
    name: "Subdomain API Security Assessment",
    domains: ["sub.target-corp.com", "api.sub.target-corp.com", "auth.sub.target-corp.com"],
    outOfScope: ["cdn.target-corp.com"],
    context: "Grey-box assessment of newly deployed subdomain infrastructure. Credentials for a standard user account provided.",
    focusAreas: ["API Security", "Authentication & Authorization"],
    goals: "Validate JWT implementation, session management, and API authorization controls.",
    useKnowledgeBase: true,
    status: "completed",
    createdAt: "2026-08-19T09:00:00Z",
    updatedAt: "2026-08-21T16:00:00Z",
    plannerLogs: [
      "[2026-08-19 09:00:05] Assessment initialized with grey-box credentials.",
      "[2026-08-19 09:00:20] Mapping API surface from OpenAPI spec at /api/docs",
      "[2026-08-19 09:15:00] 47 API endpoints discovered and queued for testing.",
      "[2026-08-20 08:15:22] MEDIUM: Open redirect in ?redirect= parameter on /login",
      "[2026-08-20 11:50:09] CRITICAL: JWT 'none' algorithm accepted — token forgery confirmed",
      "[2026-08-21 13:20:55] MEDIUM: No rate limiting on /reset-password endpoint",
      "[2026-08-21 16:00:00] Assessment COMPLETED. Total findings: 3 (1 critical, 2 medium)",
    ],
    findingIds: ["fnd_006", "fnd_007", "fnd_008"],
  },
  {
    id: "asm_003",
    name: "Internal Network Infrastructure Scan",
    domains: ["10.0.1.0/24", "10.0.2.0/24"],
    outOfScope: ["10.0.1.100-200"],
    context: "Internal network assessment targeting management interfaces and network devices in the primary datacenter segment.",
    focusAreas: ["Network Security", "Authentication & Authorization"],
    goals: "Identify exposed management interfaces, unpatched services, and misconfigurations.",
    useKnowledgeBase: false,
    status: "completed",
    createdAt: "2026-09-01T06:00:00Z",
    updatedAt: "2026-09-01T18:00:00Z",
    plannerLogs: [
      "[2026-09-01 06:00:10] Network scan initiated on 10.0.1.0/24 and 10.0.2.0/24",
      "[2026-09-01 06:05:44] 142 live hosts discovered.",
      "[2026-09-01 07:00:00] CRITICAL: Default credentials on management interface at 10.0.1.1:8443",
      "[2026-09-01 10:00:15] LOW: TLS 1.0/1.1 enabled on multiple endpoints",
      "[2026-09-01 14:00:33] INFO: Verbose error messages on portal.target-corp.com",
      "[2026-09-01 18:00:00] Assessment COMPLETED. Total findings: 3 (1 critical, 1 low, 1 info)",
    ],
    findingIds: ["fnd_009", "fnd_010", "fnd_011"],
  },
  {
    id: "asm_004",
    name: "Cloud Infrastructure & API Webhook Review",
    domains: ["api.target-corp.com", "webhooks.target-corp.com"],
    outOfScope: [],
    context: "Targeted review of the new webhook configuration feature and its cloud infrastructure interaction. Assess for SSRF and cloud metadata exposure.",
    focusAreas: ["Cloud Security", "API Security"],
    goals: "Determine if the webhook system can be abused to pivot to internal cloud resources.",
    useKnowledgeBase: true,
    status: "running",
    createdAt: "2026-09-06T07:00:00Z",
    updatedAt: "2026-09-06T22:00:00Z",
    plannerLogs: [
      "[2026-09-06 07:00:08] Assessment initialized. Cloud security focus selected.",
      "[2026-09-06 07:00:25] Knowledge base loaded: 18 entries relevant to cloud security and SSRF.",
      "[2026-09-06 07:15:00] Mapping webhook configuration API endpoints...",
      "[2026-09-06 08:00:12] Testing URL validation on POST /api/webhooks/configure...",
      "[2026-09-06 09:30:44] HIGH: SSRF confirmed — server fetched internal metadata endpoint (169.254.169.254)",
      "[2026-09-06 22:00:00] Phase 2: Attempting lateral movement via SSRF. Analysis in progress...",
    ],
    findingIds: ["fnd_012"],
  },
  {
    id: "asm_005",
    name: "Q4 Pre-Release Security Validation",
    domains: ["staging.target-corp.com", "staging-api.target-corp.com"],
    outOfScope: ["staging-legacy.target-corp.com"],
    context: "Pre-production assessment of the staging environment ahead of Q4 release. Validate fixes from previous assessment asm_001.",
    focusAreas: ["OWASP Top 10", "Injection Attacks"],
    goals: "Confirm all critical findings from asm_001 have been remediated. Identify any new issues introduced.",
    useKnowledgeBase: true,
    status: "queued",
    createdAt: "2026-09-06T22:50:00Z",
    updatedAt: "2026-09-06T22:50:00Z",
    plannerLogs: [
      "[2026-09-06 22:50:01] Assessment queued. Awaiting available planner slot...",
    ],
    findingIds: [],
  },
];

// ============================================================
// Knowledge Base
// ============================================================
export const mockKnowledgeBase: KnowledgeEntry[] = [
  {
    id: "kb_001",
    name: "SQL Injection Payload Library",
    description:
      "Comprehensive collection of SQL injection payloads covering error-based, blind boolean, time-based, and out-of-band techniques. Includes database-specific variants for MySQL, MSSQL, PostgreSQL, Oracle, and SQLite. Contains bypass techniques for common WAF signatures.",
    tags: ["injection", "database", "owasp"],
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-07-15T14:30:00Z",
  },
  {
    id: "kb_002",
    name: "JWT Attack Vectors",
    description:
      "Reference guide covering all known JWT vulnerability classes: algorithm confusion (RS256→HS256), none algorithm acceptance, weak secret brute-forcing, claim injection, key confusion attacks. Includes PoC code and detection guidance for each variant.",
    tags: ["authentication", "api", "jwt"],
    createdAt: "2026-01-15T09:00:00Z",
    updatedAt: "2026-08-01T11:00:00Z",
  },
  {
    id: "kb_003",
    name: "OWASP Top 10 2021 — Testing Checklist",
    description:
      "Structured checklist aligned to the OWASP Top 10 2021 categories. Each category includes specific test cases, expected behaviors, and evidence collection guidance. Covers A01 (Broken Access Control) through A10 (Server-Side Request Forgery).",
    tags: ["owasp", "checklist", "web"],
    createdAt: "2026-02-01T08:00:00Z",
    updatedAt: "2026-06-20T16:00:00Z",
  },
  {
    id: "kb_004",
    name: "SSRF — Cloud Metadata Endpoints",
    description:
      "Catalog of cloud provider metadata service endpoints exploitable via SSRF. Covers AWS (169.254.169.254/latest/meta-data/), GCP (metadata.google.internal), Azure (169.254.169.254/metadata/instance), DigitalOcean, Linode. Includes filter bypass techniques (IPv6, decimal notation, DNS rebinding).",
    tags: ["ssrf", "cloud", "aws", "gcp", "azure"],
    createdAt: "2026-02-20T11:00:00Z",
    updatedAt: "2026-09-01T09:00:00Z",
  },
  {
    id: "kb_005",
    name: "XSS Payload Contexts and Bypasses",
    description:
      "Extensive XSS payload collection organized by injection context: HTML body, HTML attribute, JavaScript string, URL, CSS, and JSON. Includes CSP bypass techniques, mutation XSS vectors, and polyglot payloads. Browser-specific variants for Chrome, Firefox, and Safari.",
    tags: ["xss", "owasp", "web", "csp"],
    createdAt: "2026-03-05T10:00:00Z",
    updatedAt: "2026-07-30T15:00:00Z",
  },
  {
    id: "kb_006",
    name: "API Security — Authorization Testing Guide",
    description:
      "Methodical guide for testing API authorization flaws including BOLA/IDOR, function-level access control, mass assignment, and privilege escalation via parameter tampering. Contains test case templates for REST and GraphQL APIs.",
    tags: ["api", "authorization", "idor", "graphql"],
    createdAt: "2026-03-15T13:00:00Z",
    updatedAt: "2026-08-10T12:00:00Z",
  },
  {
    id: "kb_007",
    name: "Network Reconnaissance Techniques",
    description:
      "Active and passive reconnaissance methodologies for internal and external networks. Covers Nmap scan strategies, service fingerprinting, OS detection, firewall/IDS evasion, and network topology mapping. Includes tool configurations for nmap, masscan, and zmap.",
    tags: ["network", "recon", "scanning"],
    createdAt: "2026-04-01T08:00:00Z",
    updatedAt: "2026-05-10T10:00:00Z",
  },
  {
    id: "kb_008",
    name: "Cryptographic Weakness Evaluation",
    description:
      "Reference material for identifying weak cryptographic implementations: RC4, MD5, SHA1 usage, ECB mode encryption, predictable IVs, improper key derivation, and certificate misconfigurations. Includes testssl.sh command references and scoring criteria.",
    tags: ["cryptography", "tls", "ssl"],
    createdAt: "2026-04-20T14:00:00Z",
    updatedAt: "2026-08-05T09:00:00Z",
  },
];

// ============================================================
// In-memory runtime state (mutated by app actions)
// ============================================================
let _users = [...mockUsers];
let _assessments = [...mockAssessments];
let _findings = [...mockFindings];
let _knowledgeBase = [...mockKnowledgeBase];

// --- User CRUD ---
export function getUsers(): MockUser[] {
  return _users;
}

export function getUserById(id: string): MockUser | undefined {
  return _users.find((u) => u.id === id);
}

export function getUserByUsername(username: string): MockUser | undefined {
  return _users.find((u) => u.username === username);
}

export function createUser(data: Omit<MockUser, "id" | "createdAt">): MockUser {
  const user: MockUser = {
    ...data,
    id: `usr_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  _users = [..._users, user];
  return user;
}

export function updateUser(id: string, data: Partial<MockUser>): MockUser | null {
  const idx = _users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  _users = _users.map((u) => (u.id === id ? { ...u, ...data } : u));
  return _users[idx];
}

export function deleteUser(id: string): boolean {
  const before = _users.length;
  _users = _users.filter((u) => u.id !== id);
  return _users.length < before;
}

// --- Assessment CRUD ---
export function getAssessments(): Assessment[] {
  return _assessments;
}

export function getAssessmentById(id: string): Assessment | undefined {
  return _assessments.find((a) => a.id === id);
}

export function createAssessment(data: Omit<Assessment, "id" | "createdAt" | "updatedAt" | "plannerLogs" | "findingIds">): Assessment {
  const assessment: Assessment = {
    ...data,
    id: `asm_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    plannerLogs: [`[${new Date().toISOString()}] Assessment queued. Awaiting available planner slot...`],
    findingIds: [],
  };
  _assessments = [assessment, ..._assessments];
  return assessment;
}

export function updateAssessmentStatus(id: string, status: AssessmentStatus): void {
  _assessments = _assessments.map((a) =>
    a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
  );
}

// --- Findings ---
export function getFindings(): Finding[] {
  return _findings;
}

export function getFindingsByAssessment(assessmentId: string): Finding[] {
  return _findings.filter((f) => f.assessmentId === assessmentId);
}

// --- Knowledge Base CRUD ---
export function getKnowledgeBase(): KnowledgeEntry[] {
  return _knowledgeBase;
}

export function createKnowledgeEntry(data: Omit<KnowledgeEntry, "id" | "createdAt" | "updatedAt">): KnowledgeEntry {
  const entry: KnowledgeEntry = {
    ...data,
    id: `kb_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  _knowledgeBase = [entry, ..._knowledgeBase];
  return entry;
}

export function updateKnowledgeEntry(id: string, data: Partial<KnowledgeEntry>): KnowledgeEntry | null {
  const idx = _knowledgeBase.findIndex((k) => k.id === id);
  if (idx === -1) return null;
  _knowledgeBase = _knowledgeBase.map((k) =>
    k.id === id ? { ...k, ...data, updatedAt: new Date().toISOString() } : k
  );
  return _knowledgeBase.find((k) => k.id === id) ?? null;
}

export function deleteKnowledgeEntry(id: string): boolean {
  const before = _knowledgeBase.length;
  _knowledgeBase = _knowledgeBase.filter((k) => k.id !== id);
  return _knowledgeBase.length < before;
}

// All focus area options
export const FOCUS_AREA_OPTIONS: FocusArea[] = [
  "OWASP Top 10",
  "API Security",
  "Network Security",
  "Authentication & Authorization",
  "Injection Attacks",
  "Cryptography",
  "Cloud Security",
  "Social Engineering",
];

export const ALL_PERMISSIONS: { key: Permission; label: string; description: string }[] = [
  { key: "can_create_assessments", label: "Create Assessments", description: "Start new pentest assessments" },
  { key: "can_cancel_assessments", label: "Cancel Assessments", description: "Cancel running or queued assessments" },
  { key: "can_view_findings", label: "View Findings", description: "Access the findings and vulnerability data" },
  { key: "can_export_findings", label: "Export Findings", description: "Export findings reports" },
  { key: "can_add_knowledge", label: "Add Knowledge", description: "Add entries to the knowledge database" },
  { key: "can_edit_knowledge", label: "Edit Knowledge", description: "Edit existing knowledge database entries" },
  { key: "can_delete_knowledge", label: "Delete Knowledge", description: "Remove entries from the knowledge database" },
  { key: "can_manage_users", label: "Manage Users", description: "Create, edit, and delete user accounts (Admin only)" },
];
