# **Architectural Blueprint for a Self-Hosted High-Fidelity Design Automation Platform**

## **1\. Executive Summary and Strategic Context**

The democratization of design, pioneered by platforms like Canva, has created a pervasive need for programmatic graphic generation. While SaaS solutions offer robust APIs, they introduce latency, recurring costs, and data sovereignty risks that are unacceptable for high-volume enterprise applications. This report outlines a comprehensive architectural strategy for building a self-hosted, web-based design platform capable of interactive template creation and high-throughput bulk image generation. The system is designed to operate without reliance on external generation APIs (such as Bannerbear or Cloudinary), ensuring complete autonomy and cost control.

The core technical challenge addressed in this document is the "rendering parity gap"—the difficulty of ensuring that a design created in a client-side browser renders pixel-perfectly when generated on a server. Most implementations fail here by attempting to use lightweight server-side canvas libraries that lack the sophisticated font rendering engines of modern browsers. To overcome this, this architecture mandates a "Headless Rendering" strategy using **Puppeteer** (Headless Chrome) controlled by a **Node.js** backend, coupled with a modified **Fabric.js** frontend.

The proposed solution forks the **salgum1114/react-design-editor** repository to leverage its mature React structure and Ant Design components, extending it with a custom templating engine. The backend infrastructure utilizes **MongoDB** for template persistence, **Redis** for managing bulk generation job queues, and a clustered Puppeteer worker pool to deliver the /image-gen API. This architecture supports dynamic text placeholders (e.g., {{input1}}), complex image manipulations like cropping, and high-volume throughput via asynchronous processing.1

## ---

**2\. Technology Stack Selection and Build-vs-Fork Analysis**

The selection of the technology stack is governed by three non-negotiable requirements: strictly open-source components, React-based frontend interactivity, and the capability for pixel-perfect server-side rendering.

### **2.1. The Canvas Engine: Fabric.js vs. Konva.js**

The heart of any web-based design tool is the HTML5 Canvas library. The two primary contenders in the open-source ecosystem are Fabric.js and Konva.js. A comparative analysis reveals why Fabric.js is the superior choice for this specific application.

| Feature | Fabric.js | Konva.js | Implication for Canva Clone |
| :---- | :---- | :---- | :---- |
| **Object Model** | Object-Oriented (Stateful objects) | Scene Graph (Nodes/Layers) | Fabric's model maps 1:1 with "design elements" (text, image), simplifying state management.4 |
| **Serialization** | Robust toObject / loadFromJSON | toJSON exists but less granular | Fabric's serialization captures advanced text properties (kerning, styles) essential for templates.5 |
| **Text Editing** | Native IText with cursor/selection | Basic, requires overlay DOM nodes | Fabric provides a built-in WYSIWYG text editing experience out of the box.6 |
| **Event Handling** | Object-level events (drag, scale) | Layer/Stage level events | Fabric's event system is optimized for direct manipulation of individual design assets.7 |
| **Performance** | Slower with 1000+ objects | Hardware accelerated | Konva is faster for high-node counts, but design templates rarely exceed 50-100 objects. |

**Decision:** **Fabric.js** is selected. Its IText class allows for rich in-place editing, and its serialization format is the industry standard for persisting canvas states. Konva's strengths lie in high-performance animations (e.g., games), whereas Fabric.js is tailored for document and vector manipulation, aligning perfectly with the "Canva-like" requirement.5

### **2.2. Repository Selection for Forking**

Developing a feature-rich editor from scratch is resource-intensive. Forking an existing repository accelerates the roadmap by providing the "scaffolding" (UI panels, zoom logic, keyboard shortcuts).

#### **Option A: ajpgtech/design-editor**

This repository offers a clean implementation of React and Fabric.js. It supports fundamental operations like grouping, resizing, and locking objects. However, its UI is rudimentary, and it lacks the sophisticated asset management interfaces required for a production-grade tool. It serves better as a proof-of-concept than a foundation for an enterprise app.

#### **Option B: salgum1114/react-design-editor**

This repository is a far more mature candidate.

* **UI Framework:** It integrates **Ant Design (AntD)**, providing a polished, professional sidebar and property panel structure immediately.  
* **Advanced Features:** It already implements **image cropping** (a notoriously difficult feature to build manually using clipPath), alignment guides, SVG support, and image filters.2  
* **Architecture:** It separates the CanvasHandler logic from the UI components, allowing for easier injection of the custom API logic.  
* **License:** It is licensed under MIT, permitting modification and commercial use without proprietary lock-in.8

**Decision:** Fork **salgum1114/react-design-editor**. The presence of pre-built image cropping and a structured UI framework saves estimated 300+ engineering hours.

### **2.3. The Backend Stack**

To support the /image-gen API without external services, the backend must handle heavy I/O and CPU-bound rendering tasks.

* **Runtime:** **Node.js**. JavaScript ubiquity allows code sharing (validation logic, types) between frontend and backend.  
* **Rendering:** **Puppeteer (Chrome Headless)**. As discussed in Section 5, this is the only way to guarantee font and layout fidelity.9  
* **Queue:** **Redis \+ Bull**. Bulk generation is asynchronous; a reliable queue is essential to manage backpressure and retries.10  
* **Database:** **MongoDB**. JSON document storage maps perfectly to the Fabric.js serialization format.11

## ---

**3\. Frontend Architecture: The Interactive Editor**

The frontend architecture serves two primary functions: enabling the user to design visual templates and defining the "contract" for the bulk generation API (i.e., specifying which elements are dynamic).

### **3.1. Extending the Object Model for Templating**

Standard Fabric.js objects store visual properties (left, top, color). To function as a template editor, the system must support **Variable Binding**. We will extend the Fabric.js object schema to include a data namespace.

In the forked react-design-editor, the CanvasHandler must be modified. When an object is selected, the "Properties Panel" (located in the repo's right sidebar components) will render a new input field labeled "Variable Name".

**Implementation Logic:**

When a user selects a text box containing "Summer Sale" and tags it with the variable name headline, the underlying Fabric object is updated:

JavaScript

// Conceptual extension within the React component  
const updateObjectVariable \= (variableName) \=\> {  
  const activeObject \= canvas.getActiveObject();  
  if (activeObject) {  
    // We utilize the 'data' property which is preserved during serialization  
    activeObject.set({  
      data: {  
       ...activeObject.data,  
        isDynamic: true,  
        variableName: variableName, // e.g., "input1"  
        placeholderText: activeObject.text  
      }  
    });  
    canvas.requestRenderAll();  
  }  
};

This ensures that when canvas.toJSON() is called, the output JSON includes this metadata, allowing the backend to identify which objects require text replacement.12

### **3.2. Dynamic Text Placeholder UX**

The user requirement specifies placeholders like {{input1}}. The frontend should support two modes of identification:

1. **Implicit:** The user types {{price}} directly into the text box. The system detects the mustache syntax and treats it as a variable.  
2. **Explicit:** The user uses the UI sidebar to manually assign the key price to a text object.

For the implicit mode, a listener on the text:changed event in Fabric.js is required.

JavaScript

canvas.on('text:changed', (e) \=\> {  
  const text \= e.target.text;  
  const match \= text.match(/{{(.\*?)}}/);  
  if (match) {  
    // Automatically flag as dynamic in metadata  
    e.target.set('data', { variableName: match, isDynamic: true });  
  }  
});

### **3.3. Advanced Image Manipulation: Cropping**

The user specifically requested "image cropping". The salgum1114 repository implements this using the clipPath functionality introduced in Fabric.js v2.4.

**Mechanism:**

1. **Cropping Interface:** When "Crop" is clicked, the editor enters a specialized mode. A fabric.Rect is created to represent the crop area.  
2. **Masking:** The image is set to have the clipPath property pointing to this rectangle.  
3. **Interaction:** The user moves the underlying image *relative* to the stationary crop rectangle (or moves the rectangle over the image).  
4. **Commit:** On apply, the coordinate delta is calculated, and the clipPath is permanently attached to the image object.

**Critical Insight for Backend:** The clipPath property is computationally expensive to render. When the backend receives a JSON with clipping paths, the headless browser must perform these boolean operations during the render cycle. This confirms the need for a full browser engine (Puppeteer) rather than a lightweight canvas implementation, as node-canvas often fails to render complex nesting of clipping paths correctly.

## ---

**4\. Backend Architecture: The Rendering Engine**

This section details the most critical architectural decision: how to convert the Fabric.js JSON into an image file on the server.

### **4.1. The "Canvas Parity" Problem**

A naive approach typically involves fabric.Canvas running on Node.js using node-canvas (a C++ Cairo binding). While performant, this approach is fundamentally flawed for a design tool aiming for "Canva quality."

**Why node-canvas Fails:**

1. **Text Metrics:** The algorithm used to calculate text width and line wrapping in Chrome (Skia engine) differs from Cairo. A text box that fits perfectly in the browser may wrap to a second line on the server, breaking the layout.9  
2. **Font Rendering:** Loading custom web fonts (Google Fonts) into node-canvas is brittle. It requires registering fonts with the operating system or using strict file paths, and often lacks support for advanced OpenType features.13  
3. **Filter Support:** Fabric.js image filters (blur, contrast) often rely on WebGL or specific browser canvas APIs that are either slow or unimplemented in node-canvas.15

### **4.2. The Solution: Headless Rendering via Puppeteer**

To guarantee that the output image is **identical** to what the user saw in the editor, the server must use the exact same rendering engine. We will use **Puppeteer** to launch a headless instance of Google Chrome.

**The Rendering Pipeline:**

1. **The Harness:** The server hosts a minimal HTML file (render.html) that imports the project's fabric.js library and all utilized fonts.  
2. **Injection:** The worker opens this page, executes JavaScript to initialize a canvas, loads the template JSON, applies the dynamic data, and renders the frame.  
3. **Capture:** The worker captures a screenshot of the DOM element containing the canvas.

This approach trades performance (RAM/CPU usage) for fidelity. Given the requirement for a "Canva clone," fidelity is paramount.3

## ---

**5\. The /image-gen Internal API**

The API layer is the gateway for bulk generation. It must handle request validation, job enqueuing, and status polling.

### **5.1. API Specification**

The API will not return the images directly (synchronously) because generating 100 images might take minutes. Instead, it follows the **Asynchronous Job Pattern**.

**Endpoint:** POST /api/v1/generate

**Request Body:**

JSON

{  
  "templateId": "tmpl\_12345abcdef",  
  "webhookUrl": "https://client.com/callback",  
  "exportFormat": "png",  
  "data":  
}

**Response (202 Accepted):**

JSON

{  
  "jobId": "job\_98765xyz",  
  "status": "queued",  
  "queuePosition": 12,  
  "estimatedWaitTime": "30s"  
}

### **5.2. Data Validation & Sanitization**

Before enqueuing, the API must validate the input data against the template schema.

* **Schema Check:** Retrieve the template from MongoDB. Check if it requires variables (e.g., input1). Verify the incoming payload contains these keys.  
* **Security:** Sanitize any inputs that will be rendered as text to prevent XSS (even though it's a headless browser, executing arbitrary scripts is a risk). Ensure image URLs in the payload point to allowed domains (SSRF protection).16

## ---

**6\. Bulk Processing Strategy: Redis and Bull**

To process requests for thousands of images without crashing the Node.js server, we implement a distributed queue system.

### **6.1. Queue Architecture**

We utilize **Bull**, a Redis-based queue for Node.js. It offers robust features required for production:

* **Persistence:** Jobs are saved in Redis, surviving server restarts.  
* **Rate Limiting:** Prevents overwhelming the Puppeteer cluster.  
* **Retries:** Automatically retries failed rendering attempts (e.g., if a network glitch causes an image load failure).10

### **6.2. Worker Implementation**

The worker process is separate from the API server. It subscribes to the Redis queue.

**Worker Logic Flow:**

1. **Job Pickup:** Worker grabs a job containing the Template ID and a batch of data rows.  
2. **Cluster Acquisition:** It requests a browser page from the **Puppeteer Cluster**.  
3. **Rendering Loop:** It iterates through the data rows. For each row:  
   * Calls page.evaluate(renderFunction, json, rowData).  
   * Waits for the canvas.renderAll() hook.  
   * Takes a screenshot (page.screenshot).  
   * Uploads the image to storage (MinIO).  
4. **Aggregation:** Once all rows are processed, it compiles the image URLs (or zips them) and updates the Job status in MongoDB.18

### **6.3. Dynamic Text Replacement Logic**

The logic to replace {{input1}} happens inside the browser context (Puppeteer). This requires specific attention to **Copy Fitting** (Auto-resizing text).

**The Challenge:** If the template says "Sale", but the dynamic input is "Super Massive Clearance Event", the text will overflow the box.

**The Solution:** Implement an auto-scaling algorithm in the render script.

JavaScript

// Inside Puppeteer page.evaluate()  
const objects \= canvas.getObjects();  
objects.forEach(obj \=\> {  
  if (obj.data && obj.data.variableName && rowData\[obj.data.variableName\]) {  
    // 1\. Update text  
    obj.set('text', rowData\[obj.data.variableName\]);

    // 2\. Auto-Scale Logic  
    // If text width exceeds the fixed box width, scale it down  
    if (obj.width \> obj.fixedWidth) {  
       obj.scaleToWidth(obj.fixedWidth);  
    }  
      
    // 3\. Re-center if needed  
    if (obj.originX \=== 'center') {  
       obj.centerH();  
    }  
  }  
});  
canvas.renderAll();

This logic ensures that regardless of the input length, the design integrity is maintained.6

## ---

**7\. Infrastructure and Performance Optimization**

Generating images is resource-intensive. To achieve high throughput, the infrastructure must be optimized.

### **7.1. Puppeteer Cluster Configuration**

Launching a browser takes time (\~200ms). We use puppeteer-cluster to manage a pool of persistent browser instances.

* **Concurrency Mode:** Cluster.CONCURRENCY\_CONTEXT. This uses Incognito Pages within a single Chrome instance. It is faster than launching full browsers (CONCURRENCY\_BROWSER) and provides sufficient isolation for this use case.18  
* **Max Concurrency:** Set to match the number of CPU cores. Rendering is CPU-bound (layout calculation) and memory-bound.

### **7.2. Request Interception for Speed**

To speed up rendering, we strip unnecessary weight from the page load.

* **Block Trackers:** The template.html might inherit scripts. We block requests to Google Analytics, Facebook Pixel, etc.  
* **Block Styles:** If the canvas is the only visual element, we can block loading of external CSS files that don't affect fonts.  
* **Implementation:**  
  JavaScript  
  await page.setRequestInterception(true);  
  page.on('request', (req) \=\> {  
      if (req.resourceType() \=== 'image' &&\!req.url().includes('allow-list')) {  
          req.abort(); // Block external images not part of design  
      } else {  
          req.continue();  
      }  
  });

.16

### **7.3. Database Schema Design (MongoDB)**

**1\. Templates Collection:**

JavaScript

{  
  "\_id": "ObjectId",  
  "ownerId": "ObjectId",  
  "name": "Summer Flyer",  
  "fabricJson": {... }, // The massive JSON object  
  "variables": \["headline", "price", "cta"\], // Cached for validation  
  "previewUrl": "https://minio.internal/previews/123.png",  
  "createdAt": "ISODate"  
}

**2\. Jobs Collection:**

JavaScript

{  
  "\_id": "ObjectId",  
  "templateId": "ObjectId",  
  "status": "processing", // queued, processing, completed, failed  
  "totalItems": 100,  
  "processedItems": 45,  
  "outputUrls": \["url1", "url2"\],  
  "errors":,  
  "webhookUrl": "..."  
}

## ---

**8\. Font Management System**

The most frequent failure mode in self-hosted design tools is "Flash of Unstyled Text" (FOUT) or missing fonts during server-side rendering.

### **8.1. The Synchronization Challenge**

Fabric.js does not embed font files in the JSON; it only stores the font family name (e.g., fontFamily: "Open Sans"). If the server does not have "Open Sans" installed, it renders Times New Roman.

### **8.2. Docker-Based Font Strategy**

We cannot rely on the host OS fonts. We must bake the fonts into the Docker container.

1. **Font Repository:** Create a directory assets/fonts in the project containing all .ttf or .woff files allowed in the editor.  
2. **Frontend Loading:** The React app loads these via CSS @font-face.  
3. **Backend Loading:** The template.html used by Puppeteer also loads these via CSS @font-face.  
4. **Wait Condition:** In the Puppeteer script, we must explicitly wait for fonts to be ready before screenshotting.  
   JavaScript  
   await page.evaluateHandle('document.fonts.ready');

   This promise resolves only when all layout-impacting fonts have loaded. This prevents the "blank text" glitch often seen in Puppeteer screenshots.21

### **8.3. Google Fonts Integration**

If using Google Fonts, the Docker container needs internet access. To optimize, we should download the Google Fonts used in the design to the local filesystem during the "Save Template" phase, or enforce a "Supported Fonts" list where all allowed fonts are pre-downloaded and baked into the Docker image.23

## ---

**9\. Deployment and Security**

### **9.1. Dockerfile for Rendering Worker**

The worker requires a specific environment to run Headless Chrome.

Dockerfile

FROM node:18\-slim

\# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)  
\# Note: This installs the necessary libs to make the bundled version of Chromium that Puppeteer installs, work.  
RUN apt-get update \\  
    && apt-get install \-y wget gnupg \\  
    && wget \-q \-O \- https://dl-ssl.google.com/linux/linux\_signing\_key.pub | apt-key add \- \\  
    && sh \-c 'echo "deb \[arch=amd64\] http://dl.google.com/linux/chrome/deb/ stable main" \>\> /etc/apt/sources.list.d/google.list' \\  
    && apt-get update \\  
    && apt-get install \-y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \\  
      \--no-install-recommends \\  
    && rm \-rf /var/lib/apt/lists/\*

\# Copy local font assets  
COPY./assets/fonts /usr/share/fonts/truetype/custom  
RUN fc-cache \-f \-v

WORKDIR /usr/src/app  
COPY package\*.json./  
RUN npm install  
COPY..  
CMD \[ "node", "worker.js" \]

This setup ensures the server environment mimics a desktop OS regarding font availability.24

### **9.2. Security Considerations**

* **Input Sanitization:** The data injected into placeholders must be treated as untrusted. While Fabric.js renders text on a canvas (preventing standard XSS), malicious strings could attempt to break the JSON structure if not properly escaped during injection.  
* **Resource Limits:** Docker containers must have memory limits (RAM). Puppeteer is memory hungry. If a container exceeds limits, it crashes. We use pm2 or Docker restart policies to handle these crashes gracefully, while the Bull queue ensures the job is retried by another worker.18

## ---

**10\. Conclusion and Roadmap**

This blueprint details a path to building a sovereign, high-fidelity design platform. By forking **salgum1114/react-design-editor**, we secure a robust UI foundation. By choosing **Fabric.js** over Konva, we ensure deep text editing capabilities. By leveraging **Puppeteer** instead of node-canvas, we solve the critical rendering parity issue.

**Implementation Roadmap:**

1. **Phase 1 (Frontend Fork):** Clone the repo. Implement the VariableBinding UI component. Establish the MongoDB connection for saving JSON.  
2. **Phase 2 (The Renderer):** Set up the Node.js/Puppeteer microservice. Create the render.html harness. Prove that a JSON saved in Phase 1 renders identically in Puppeteer.  
3. **Phase 3 (The Pipeline):** Implement Redis/Bull. Connect the API to the Queue. Build the Variable Injection logic in the Puppeteer script.  
4. **Phase 4 (Scale):** Dockerize the solution. Deploy multiple workers. Optimize font loading and request interception.

This architecture delivers the "Canva-like" experience requested, capable of powering enterprise-grade automated marketing workflows without external dependencies.

#### **Works cited**

1. ajpgtech/design-editor: Canva Clone Design Editor using ... \- GitHub, accessed January 22, 2026, [https://github.com/ajpgtech/design-editor](https://github.com/ajpgtech/design-editor)  
2. salgum1114/react-design-editor \- GitHub, accessed January 22, 2026, [https://github.com/salgum1114/react-design-editor](https://github.com/salgum1114/react-design-editor)  
3. How to Use Puppeteer Cluster to Scale Up Web Scraping? \- Medium, accessed January 22, 2026, [https://medium.com/@datajournal/how-to-use-puppeteer-cluster-to-scale-up-web-scraping-98de94c77ebe](https://medium.com/@datajournal/how-to-use-puppeteer-cluster-to-scale-up-web-scraping-98de94c77ebe)  
4. React: Comparison of JS Canvas Libraries (Konvajs vs Fabricjs) \- DEV Community, accessed January 22, 2026, [https://dev.to/lico/react-comparison-of-js-canvas-libraries-konvajs-vs-fabricjs-1dan](https://dev.to/lico/react-comparison-of-js-canvas-libraries-konvajs-vs-fabricjs-1dan)  
5. Konva.js vs Fabric.js: In-Depth Technical Comparison and Use Case Analysis \- Medium, accessed January 22, 2026, [https://medium.com/@www.blog4j.com/konva-js-vs-fabric-js-in-depth-technical-comparison-and-use-case-analysis-9c247968dd0f](https://medium.com/@www.blog4j.com/konva-js-vs-fabric-js-in-depth-technical-comparison-and-use-case-analysis-9c247968dd0f)  
6. Textbox | Docs and Guides \- Fabric.js, accessed January 22, 2026, [https://fabricjs.com/api/classes/textbox/](https://fabricjs.com/api/classes/textbox/)  
7. Fabric.js vs Konva.js to draw/move/resize objects on an image \- Observable Notebooks, accessed January 22, 2026, [https://observablehq.com/@gfoo/fabricjs-vs-konvajs](https://observablehq.com/@gfoo/fabricjs-vs-konvajs)  
8. MIT license \- salgum1114/react-design-editor \- GitHub, accessed January 22, 2026, [https://github.com/salgum1114/react-design-editor/blob/master/LICENSE](https://github.com/salgum1114/react-design-editor/blob/master/LICENSE)  
9. Using not-node-module FabricJs server side with Puppeteer \- GitHub, accessed January 22, 2026, [https://github.com/radiolondra/Server-side-FabricJs-using-Puppeteer](https://github.com/radiolondra/Server-side-FabricJs-using-Puppeteer)  
10. Building a Job Queue System with Node.js, Bull, and Neon Postgres \- Neon Guides, accessed January 22, 2026, [https://neon.com/guides/nodejs-queue-system](https://neon.com/guides/nodejs-queue-system)  
11. Storing a JSON schema in mongodb with spring \- Stack Overflow, accessed January 22, 2026, [https://stackoverflow.com/questions/42973756/storing-a-json-schema-in-mongodb-with-spring](https://stackoverflow.com/questions/42973756/storing-a-json-schema-in-mongodb-with-spring)  
12. How to create a JSON representation of an Image object using FabricJS? \- Tutorials Point, accessed January 22, 2026, [https://www.tutorialspoint.com/how-to-create-a-json-representation-of-an-image-object-using-fabricjs](https://www.tutorialspoint.com/how-to-create-a-json-representation-of-an-image-object-using-fabricjs)  
13. Node-canvas fonts · fabricjs fabric.js · Discussion \#10339 \- GitHub, accessed January 22, 2026, [https://github.com/fabricjs/fabric.js/discussions/10339](https://github.com/fabricjs/fabric.js/discussions/10339)  
14. FabricJS custom fonts render incorrectly on node-canvas \- Stack Overflow, accessed January 22, 2026, [https://stackoverflow.com/questions/62476433/fabricjs-custom-fonts-render-incorrectly-on-node-canvas](https://stackoverflow.com/questions/62476433/fabricjs-custom-fonts-render-incorrectly-on-node-canvas)  
15. Generating Image in Rails from JSON Data? · Issue \#4043 · fabricjs/fabric.js \- GitHub, accessed January 22, 2026, [https://github.com/fabricjs/fabric.js/issues/4043](https://github.com/fabricjs/fabric.js/issues/4043)  
16. Pro Tips for Optimizing Web Automation Using Puppeteer | BrowserStack, accessed January 22, 2026, [https://www.browserstack.com/guide/optimize-web-automation-with-puppeteer](https://www.browserstack.com/guide/optimize-web-automation-with-puppeteer)  
17. Scaling your Node.js app using distributed queues \- LogRocket Blog, accessed January 22, 2026, [https://blog.logrocket.com/scale-node-js-app-using-distributed-queues/](https://blog.logrocket.com/scale-node-js-app-using-distributed-queues/)  
18. Managing puppeteer for memory and performance \- Stack Overflow, accessed January 22, 2026, [https://stackoverflow.com/questions/51971760/managing-puppeteer-for-memory-and-performance](https://stackoverflow.com/questions/51971760/managing-puppeteer-for-memory-and-performance)  
19. Introduction to Fabric.js. Part 3 | Docs and Guides, accessed January 22, 2026, [https://fabricjs.com/docs/old-docs/fabric-intro-part-3/](https://fabricjs.com/docs/old-docs/fabric-intro-part-3/)  
20. 8 Tips for Faster Puppeteer Screenshots \- Bannerbear, accessed January 22, 2026, [https://www.bannerbear.com/blog/ways-to-speed-up-puppeteer-screenshots/](https://www.bannerbear.com/blog/ways-to-speed-up-puppeteer-screenshots/)  
21. Wait For Page to Load in Puppeteer: 4 Methods Compared \- Webshare, accessed January 22, 2026, [https://www.webshare.io/academy-article/puppeteer-wait-for-page-to-load](https://www.webshare.io/academy-article/puppeteer-wait-for-page-to-load)  
22. Wait for web fonts to finish loading before recording a page · Issue \#35 · tungs/timecut, accessed January 22, 2026, [https://github.com/tungs/timecut/issues/35](https://github.com/tungs/timecut/issues/35)  
23. A docker image of puppeteer with all Google Fonts installed. \- GitHub, accessed January 22, 2026, [https://github.com/seanghay/puppeteer-google-fonts](https://github.com/seanghay/puppeteer-google-fonts)  
24. Installing fonts on Docker Container running Ubuntu 18.04, accessed January 22, 2026, [https://askubuntu.com/questions/1084601/installing-fonts-on-docker-container-running-ubuntu-18-04](https://askubuntu.com/questions/1084601/installing-fonts-on-docker-container-running-ubuntu-18-04)