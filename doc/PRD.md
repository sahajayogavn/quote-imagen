# Product Requirements Document (PRD)

## Quote Imagen - Self-Hosted Image Generation Platform

**Version:** 1.0  
**Date:** 2026-01-22  
**Status:** Draft - Pending Review

---

## 1. Executive Summary

Quote Imagen is a self-hosted, API-first image generation platform that enables bulk creation of branded images from pre-defined templates. The system prioritizes **automated image generation** over interactive design, targeting API consumers who need programmatic image creation with text placeholders.

### Key Decisions

| Decision         | Choice                                                              | Rationale                             |
| ---------------- | ------------------------------------------------------------------- | ------------------------------------- |
| Base Repository  | [ajpgtech/design-editor](https://github.com/ajpgtech/design-editor) | Simpler codebase, easier to modernize |
| Primary Use Case | Bulk API Generation                                                 | ~10 pre-defined templates, API-first  |
| Deployment       | Docker Compose                                                      | Simple, localhost-only operation      |
| Authentication   | API Key only                                                        | No user auth, single-tenant           |

---

## 2. Goals & Non-Goals

### Goals

1. **Template Editor**: Web-based editor to create/edit ~10 image templates with text placeholders (`{{input1}}`, `{{headline}}`, etc.)
2. **Image Gen API**: REST API endpoint (`/image-gen`) for bulk image generation from templates
3. **Pixel-Perfect Rendering**: Server-side rendering using Puppeteer to match browser output exactly
4. **Simple Deployment**: Single Docker Compose setup for localhost operation

### Non-Goals (Out of Scope for MVP)

- ❌ User authentication / multi-tenancy
- ❌ Dynamic image placeholders
- ❌ Conditional visibility / data looping
- ❌ Real-time preview during generation
- ❌ External integrations (Google Sheets, S3, webhooks)
- ❌ Public-facing deployment / cloud hosting

---

## 3. User Stories

### Template Creator (Admin)

| ID  | Story                                                                              | Priority |
| --- | ---------------------------------------------------------------------------------- | -------- |
| U1  | As an admin, I can create a new template with text, shapes, and images on a canvas | P0       |
| U2  | As an admin, I can mark text elements as dynamic using `{{variable}}` syntax       | P0       |
| U3  | As an admin, I can save templates and receive a `template_id`                      | P0       |
| U4  | As an admin, I can load and edit existing templates                                | P0       |
| U5  | As an admin, I can preview how a template renders with sample data                 | P1       |

### API Consumer

| ID  | Story                                                                                 | Priority |
| --- | ------------------------------------------------------------------------------------- | -------- |
| A1  | As a consumer, I can call `/image-gen` with a template_id and data to generate images | P0       |
| A2  | As a consumer, I can generate multiple images in a single batch request               | P0       |
| A3  | As a consumer, I receive generated images as base64 or file URLs                      | P0       |
| A4  | As a consumer, I can specify output format (PNG/JPEG)                                 | P1       |

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Compose                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Frontend   │    │   Backend    │    │   Renderer   │   │
│  │  (Vite/React)│───▶│  (Node.js)   │───▶│  (Puppeteer) │   │
│  │  Port: 5173  │    │  Port: 3000  │    │   In-Process │   │
│  └──────────────┘    └──────┬───────┘    └──────────────┘   │
│                             │                                │
│                      ┌──────▼───────┐                       │
│                      │   MongoDB    │                       │
│                      │  Port: 27017 │                       │
│                      └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Technology Stack

| Layer        | Technology     | Version | Notes                                  |
| ------------ | -------------- | ------- | -------------------------------------- |
| **Frontend** | React          | 18+     | With Server Components consideration   |
|              | Vite           | 5.x     | Build tool                             |
|              | TailwindCSS    | 3.x     | Styling                                |
|              | Zustand        | 4.x     | State management (lightweight, simple) |
|              | Fabric.js      | 6.x     | Canvas manipulation                    |
| **Backend**  | Node.js        | 20 LTS  | Runtime                                |
|              | Express.js     | 4.x     | API framework                          |
|              | Puppeteer      | Latest  | Headless Chrome rendering              |
| **Database** | MongoDB        | 7.x     | Template + Job storage                 |
| **DevOps**   | Docker Compose | 2.x     | Container orchestration                |

### 4.3 State Management Choice: Zustand

**Why Zustand over alternatives:**

- **Simpler than Redux**: No boilerplate, no actions/reducers
- **Lighter than Jotai**: Better for canvas state (single store vs many atoms)
- **TypeScript-first**: Excellent type inference
- **Devtools support**: Redux DevTools compatible
- **Persist middleware**: Easy localStorage persistence for templates

---

## 5. API Specification

### 5.1 Template Management

#### `POST /api/templates`

Create a new template.

```json
// Request
{
  "name": "Quote Template 1",
  "width": 1080,
  "height": 1080,
  "fabricJson": { /* Fabric.js canvas JSON */ }
}

// Response (201 Created)
{
  "templateId": "tmpl_abc123",
  "name": "Quote Template 1",
  "variables": ["headline", "author", "date"],
  "createdAt": "2026-01-22T10:00:00Z"
}
```

#### `GET /api/templates`

List all templates.

#### `GET /api/templates/:id`

Get template by ID.

#### `PUT /api/templates/:id`

Update template.

#### `DELETE /api/templates/:id`

Delete template.

---

### 5.2 Image Generation

#### `POST /api/image-gen`

Generate images from template.

```json
// Request
{
  "templateId": "tmpl_abc123",
  "format": "png",
  "data": [
    { "headline": "Believe in yourself", "author": "Unknown" },
    { "headline": "Stay hungry, stay foolish", "author": "Steve Jobs" }
  ]
}

// Response (200 OK)
{
  "jobId": "job_xyz789",
  "status": "completed",
  "images": [
    {
      "index": 0,
      "url": "/output/job_xyz789_0.png",
      "base64": "iVBORw0KGgo..."
    },
    {
      "index": 1,
      "url": "/output/job_xyz789_1.png",
      "base64": "iVBORw0KGgo..."
    }
  ]
}
```

**Headers:**

- `X-API-Key: <your-api-key>` (required)

**Rate Limits:**

- 100 images/hour (configurable)

---

## 6. Data Models

### 6.1 Template Schema (MongoDB)

```javascript
{
  _id: ObjectId,
  templateId: "tmpl_abc123",      // Human-readable ID
  name: "Quote Template 1",
  width: 1080,
  height: 1080,
  fabricJson: {
    version: "6.0.0",
    objects: [
      {
        type: "textbox",
        text: "{{headline}}",
        data: {
          isDynamic: true,
          variableName: "headline"
        },
        // ... other Fabric.js properties
      }
    ]
  },
  variables: ["headline", "author"],  // Extracted for validation
  previewUrl: "/previews/tmpl_abc123.png",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 6.2 Job Schema (MongoDB)

```javascript
{
  _id: ObjectId,
  jobId: "job_xyz789",
  templateId: "tmpl_abc123",
  status: "queued" | "processing" | "completed" | "failed",
  format: "png" | "jpeg",
  totalItems: 10,
  processedItems: 5,
  outputPaths: ["/output/job_xyz789_0.png", ...],
  errors: [],
  createdAt: ISODate,
  completedAt: ISODate
}
```

---

## 7. Frontend Components

### 7.1 Page Structure

```
/                     → Template List (Home)
/editor/:id?          → Template Editor (create/edit)
/preview/:id          → Template Preview with sample data
```

### 7.2 Editor Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Toolbar: Save | Undo | Redo | Zoom | Export                │
├────────────┬────────────────────────────────┬───────────────┤
│            │                                │               │
│  Assets    │                                │  Properties   │
│  Panel     │         Canvas Area            │  Panel        │
│            │                                │               │
│  - Text    │      ┌──────────────┐          │  - Position   │
│  - Shapes  │      │   Template   │          │  - Size       │
│  - Images  │      │   Canvas     │          │  - Font       │
│  - Upload  │      │              │          │  - Variable   │
│            │      └──────────────┘          │    Name       │
│            │                                │               │
└────────────┴────────────────────────────────┴───────────────┘
```

### 7.3 Key Components

| Component         | Responsibility                         |
| ----------------- | -------------------------------------- |
| `TemplateList`    | Display saved templates, create new    |
| `CanvasEditor`    | Fabric.js canvas wrapper               |
| `Toolbar`         | Save, undo/redo, zoom controls         |
| `AssetsPanel`     | Add text, shapes, images               |
| `PropertiesPanel` | Edit selected object properties        |
| `VariableInput`   | Assign `{{variable}}` names to objects |

---

## 8. Rendering Pipeline

### 8.1 Server-Side Rendering Flow

```
1. API receives /image-gen request
           ↓
2. Validate API key & template existence
           ↓
3. Create job record in MongoDB (status: processing)
           ↓
4. For each data row (synchronous):
   a. Launch Puppeteer page
   b. Load render.html with Fabric.js
   c. Inject template JSON
   d. Replace {{variables}} with data
   e. Wait for fonts: document.fonts.ready
   f. Screenshot canvas element
   g. Save to /output directory
           ↓
5. Update job record (status: completed)
           ↓
6. Return image URLs/base64 in response
```

### 8.2 Render Harness (`render.html`)

A minimal HTML page loaded by Puppeteer containing:

- Fabric.js library
- All supported fonts (pre-loaded via `@font-face`)
- Canvas element matching template dimensions
- JavaScript to load JSON and render

---

## 9. Project Structure

```
quote-imagen/
├── docker-compose.yml
├── .env.example
├── packages/
│   ├── frontend/              # Vite + React app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── canvas/
│   │   │   │   ├── panels/
│   │   │   │   └── ui/
│   │   │   ├── stores/        # Zustand stores
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── backend/               # Node.js API
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   │   ├── template.service.ts
│       │   │   └── renderer.service.ts
│       │   ├── workers/
│       │   │   └── render.worker.ts
│       │   ├── models/
│       │   └── app.ts
│       ├── assets/
│       │   ├── fonts/
│       │   └── render.html
│       └── package.json
│
├── output/                    # Generated images (volume mount)
└── doc/
    ├── PRD.md
    └── Web App Plan...md
```

---

## 10. Configuration

### 10.1 Environment Variables

```env
# API
API_PORT=3000
API_KEY=your-secret-api-key

# MongoDB
MONGO_URI=mongodb://mongo:27017/quote-imagen

# Rendering
RENDER_TIMEOUT_MS=30000

# Output
OUTPUT_DIR=/app/output
```

### 10.2 Docker Compose Services

| Service    | Image         | Ports | Purpose                |
| ---------- | ------------- | ----- | ---------------------- |
| `frontend` | Custom (Vite) | 5173  | Template editor UI     |
| `backend`  | Custom (Node) | 3000  | API + Puppeteer render |
| `mongo`    | mongo:7       | 27017 | Template + Job storage |

---

## 11. Success Metrics

| Metric              | Target          | Measurement                         |
| ------------------- | --------------- | ----------------------------------- |
| Template Save/Load  | < 500ms         | API response time                   |
| Single Image Render | < 3s            | Puppeteer screenshot time           |
| Batch (10 images)   | < 20s           | Total job completion                |
| Throughput          | 100 images/hour | Sustained load                      |
| Rendering Fidelity  | 100% match      | Visual comparison browser vs server |

---

## 12. Milestones & Phases

### Phase 1: Foundation (MVP) ✓ Target

- [ ] Fork and modernize `ajpgtech/design-editor`
- [ ] Set up Vite + React 18 + TailwindCSS
- [ ] Implement basic canvas editor with Fabric.js 6
- [ ] Template CRUD API with MongoDB
- [ ] Docker Compose setup

### Phase 2: Variable System

- [ ] `{{variable}}` detection in text objects
- [ ] Properties panel: Variable Name input
- [ ] Template validation (extract variables on save)

### Phase 3: Rendering Engine

- [ ] Puppeteer render harness (`render.html`)
- [ ] `/api/image-gen` endpoint
- [ ] Variable injection & text replacement
- [ ] Output to local filesystem

### Phase 4: Polish & Production

- [ ] API key authentication
- [ ] Error handling & validation
- [ ] Font management system
- [ ] Documentation

---

## 13. Risks & Mitigations

| Risk                         | Impact | Mitigation                                 |
| ---------------------------- | ------ | ------------------------------------------ |
| Fabric.js 6 breaking changes | High   | Pin version, test thoroughly               |
| Font rendering mismatch      | High   | Use identical fonts in browser & Puppeteer |
| Puppeteer memory leaks       | Medium | Implement page pooling, restart workers    |
| Complex cropping fails       | Medium | Test clipPath rendering early              |

---

## 14. Open Questions

> [!NOTE]
> These items may need clarification before implementation:

1. **Font Selection**: Which specific fonts should be supported? (Google Fonts list?)
2. **Template Dimensions**: What are the target image sizes? (1080x1080, 1200x630, etc.)
3. **Output Storage**: Keep images in filesystem or return base64 only?
4. **API Key Management**: Single hardcoded key or environment-based rotation?

---

## 15. Appendix

### A. Reference Links

- [ajpgtech/design-editor](https://github.com/ajpgtech/design-editor) - Base repository
- [Fabric.js Documentation](https://fabricjs.com/docs/)
- [Puppeteer API](https://pptr.dev/)

### B. Related Documents

- [Web App Plan: Canva Clone & Image Generation](./Web%20App%20Plan_%20Canva%20Clone%20&%20Image%20Generation.md)
