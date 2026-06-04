const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  LevelFormat,
  BorderStyle,
  WidthType,
  ShadingType,
  PageBreak,
} = require("docx");
const fs = require("fs");

// ── Palette ──────────────────────────────────────────────────────────
const BLUE = "1B3A6B";
const MID_BLUE = "1F5C99";
const ACCENT = "E67E22"; // orange accent for design/methodology theme
const ACCENT2 = "2E75B6";
const BS = 22; // 11 pt body
const H1S = 36,
  H2S = 28,
  H3S = 24;

// ── Paragraph helpers ─────────────────────────────────────────────────
const h1 = (t) =>
  new Paragraph({
    children: [
      new TextRun({
        text: t,
        bold: true,
        size: H1S,
        color: BLUE,
        font: "Arial",
      }),
    ],
    spacing: { before: 360, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT2, space: 4 },
    },
  });
const h2 = (t) =>
  new Paragraph({
    children: [
      new TextRun({
        text: t,
        bold: true,
        size: H2S,
        color: MID_BLUE,
        font: "Arial",
      }),
    ],
    spacing: { before: 280, after: 100 },
  });
const h3 = (t) =>
  new Paragraph({
    children: [
      new TextRun({
        text: t,
        bold: true,
        size: H3S,
        color: "2E4057",
        font: "Arial",
      }),
    ],
    spacing: { before: 200, after: 80 },
  });
const body = (t) =>
  new Paragraph({
    children: [
      new TextRun({ text: t, size: BS, font: "Arial", color: "222222" }),
    ],
    spacing: { before: 60, after: 80 },
    alignment: AlignmentType.JUSTIFIED,
  });
const sp = () => new Paragraph({ spacing: { before: 100, after: 60 } });

const bul = (text, prefix = null) => {
  const kids = [];
  if (prefix) {
    kids.push(
      new TextRun({
        text: prefix + " ",
        bold: true,
        size: BS,
        font: "Arial",
        color: "1A1A1A",
      }),
    );
    kids.push(new TextRun({ text, size: BS, font: "Arial", color: "333333" }));
  } else {
    kids.push(new TextRun({ text, size: BS, font: "Arial", color: "333333" }));
  }
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: kids,
    spacing: { before: 40, after: 60 },
  });
};

const subbul = (t) =>
  new Paragraph({
    numbering: { reference: "subbullets", level: 0 },
    children: [
      new TextRun({ text: t, size: BS, font: "Arial", color: "444444" }),
    ],
    spacing: { before: 20, after: 40 },
  });

const numbered = (n, text, prefix = null) => {
  const kids = [
    new TextRun({
      text: `${n}.  `,
      bold: true,
      size: BS,
      font: "Arial",
      color: ACCENT,
    }),
  ];
  if (prefix)
    kids.push(
      new TextRun({
        text: prefix + " ",
        bold: true,
        size: BS,
        font: "Arial",
        color: "1A1A1A",
      }),
    );
  kids.push(new TextRun({ text, size: BS, font: "Arial", color: "333333" }));
  return new Paragraph({
    children: kids,
    spacing: { before: 80, after: 80 },
    indent: { left: 360 },
  });
};

const infoBox = (text, color = "EBF3FB", borderColor = ACCENT2) => {
  const cell = new TableCell({
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
      left: { style: BorderStyle.SINGLE, size: 14, color: borderColor },
      right: { style: BorderStyle.NONE },
    },
    shading: { fill: color, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 180, right: 120 },
    width: { size: 9360, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: BS,
            font: "Arial",
            color: "1A3A5C",
            italics: true,
          }),
        ],
        spacing: { before: 40, after: 40 },
      }),
    ],
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [cell] })],
    margins: { top: 120, bottom: 120 },
  });
};

const codeBox = (text) => {
  const lines = text.split("\n");
  const cell = new TableCell({
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" },
      left: { style: BorderStyle.SINGLE, size: 8, color: "555555" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" },
    },
    shading: { fill: "F4F4F4", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 160, right: 120 },
    width: { size: 9360, type: WidthType.DXA },
    children: lines.map(
      (l) =>
        new Paragraph({
          children: [
            new TextRun({
              text: l,
              size: 18,
              font: "Courier New",
              color: "1A1A1A",
            }),
          ],
          spacing: { before: 0, after: 0 },
        }),
    ),
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [cell] })],
    margins: { top: 100, bottom: 100 },
  });
};

const makeTable = (headers, rows, colWidths) => {
  const hdr = headers.map(
    (h, i) =>
      new TableCell({
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" },
          left: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" },
          right: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" },
        },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        width: { size: colWidths[i], type: WidthType.DXA },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: h,
                bold: true,
                size: 20,
                font: "Arial",
                color: "FFFFFF",
              }),
            ],
          }),
        ],
      }),
  );
  const dataRows = rows.map((row, ri) => {
    const fill = ri % 2 === 0 ? "F0F5FA" : "FFFFFF";
    const cells = row.map(
      (c, ci) =>
        new TableCell({
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: "CCDDEE" },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCDDEE" },
            left: { style: BorderStyle.SINGLE, size: 2, color: "CCDDEE" },
            right: { style: BorderStyle.SINGLE, size: 2, color: "CCDDEE" },
          },
          shading: { fill, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          width: { size: colWidths[ci], type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: c,
                  size: 19,
                  font: "Arial",
                  color: "222222",
                }),
              ],
            }),
          ],
        }),
    );
    return new TableRow({ children: cells });
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [new TableRow({ children: hdr }), ...dataRows],
  });
};

// ── Title Page ────────────────────────────────────────────────────────
const titlePage = () => [
  new Paragraph({ spacing: { before: 1440 } }),
  new Paragraph({
    children: [
      new TextRun({
        text: "MODULE 6",
        bold: true,
        size: 48,
        color: BLUE,
        font: "Arial",
        allCaps: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: "Comprehensive Study Notes",
        size: 36,
        color: MID_BLUE,
        font: "Arial",
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
  }),
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT2 } },
    spacing: { before: 80, after: 160 },
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: "IoT Design Methodology  |  Prototyping  |  Development Life Cycle",
        size: 24,
        color: "555555",
        font: "Arial",
        italics: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 120 },
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: "Source: Bahga & Madisetti — Internet of Things: A Hands-On Approach, Chapter 5",
        size: 20,
        color: "777777",
        font: "Arial",
        italics: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 400 },
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "subbullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u25E6",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  styles: { default: { document: { run: { font: "Arial", size: BS } } } },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: [
        ...titlePage(),

        // ════════════════════════════════════
        // PART 1 — IoT DESIGN METHODOLOGY
        // ════════════════════════════════════
        h1("PART 1: IoT DESIGN METHODOLOGY"),
        body(
          "Designing a robust IoT system is a multi-step, structured engineering process. Rather than treating IoT development as ad-hoc prototyping, the IoT Design Methodology — as defined by Bahga & Madisetti in Internet of Things: A Hands-On Approach (Chapter 5) — provides a formal, ten-step process that guides designers from initial requirements all the way through to a deployed, working application.",
        ),
        body(
          "This methodology ensures that every critical dimension of an IoT system — purpose, data, services, hardware, software, and deployment — is deliberately designed, documented, and validated before implementation begins.",
        ),
        sp(),

        // ── Overview of 10 Steps ─────────────────────────────────
        h2("1.1  Overview: The 10-Step IoT Design Methodology"),
        body(
          "The ten steps of the IoT Design Methodology follow a logical, sequential flow where each step builds on the outputs of the previous one:",
        ),
        sp(),
        makeTable(
          ["Step", "Name", "Primary Output"],
          [
            [
              "1",
              "Purpose & Requirements Specification",
              "System purpose, behaviour, data/security/UI requirements",
            ],
            [
              "2",
              "Process Specification",
              "Formal use cases derived from requirements",
            ],
            [
              "3",
              "Domain Model Specification",
              "Concepts, entities, objects, attributes, and relationships",
            ],
            [
              "4",
              "Information Model Specification",
              "Structure of all information — attributes and relations of virtual entities",
            ],
            [
              "5",
              "Service Specifications",
              "Service types, inputs/outputs, endpoints, schedules, and effects",
            ],
            [
              "6",
              "IoT Level Specification",
              "Selected IoT deployment level (1–5)",
            ],
            [
              "7",
              "Functional View Specification",
              "Mapping of IoT level to functional groups (FGs)",
            ],
            [
              "8",
              "Operational View Specification",
              "Concrete communication, storage, hosting, and device options",
            ],
            [
              "9",
              "Device & Component Integration",
              "Integrated hardware devices and software components",
            ],
            [
              "10",
              "Application Development",
              "Fully functional IoT application",
            ],
          ],
          [700, 3200, 5460],
        ),
        new Paragraph({ spacing: { before: 140 } }),
        sp(),

        // ── Step 1 ───────────────────────────────────────────────
        h2("1.2  Step 1: Purpose & Requirements Specification"),
        body(
          "The first and foundational step in the IoT design methodology is to clearly define the purpose and requirements of the system. Without this step, all subsequent design decisions lack grounding and direction.",
        ),
        body("In this step, the following are captured and documented:"),
        bul(
          "System Purpose: What is the IoT system intended to achieve? What problem does it solve?",
        ),
        bul(
          "System Behaviour: How should the system behave under normal and exceptional conditions?",
        ),
        bul(
          "Data Collection Requirements: What data needs to be collected, from which sensors, and at what frequency?",
        ),
        bul(
          "Data Analysis Requirements: What kind of analysis needs to be performed on the collected data — local, cloud-based, real-time, batch?",
        ),
        bul(
          "System Management Requirements: What remote monitoring and control functions are needed?",
        ),
        bul(
          "Data Privacy and Security Requirements: What level of authentication, authorization, and encryption is required?",
        ),
        bul(
          "User Interface Requirements: How will users interact with the system? Web app, mobile app, dashboard?",
        ),
        bul(
          "Application Deployment Requirements: Where will the application be deployed — locally on device, or on the cloud?",
        ),
        sp(),

        infoBox(
          "Home Automation Example — Purpose & Requirements:\nPurpose: A home automation system that allows controlling of lights in a home remotely via a web application.\nBehaviour: Auto mode — measures light level and switches on light when dark. Manual mode — user manually controls light on/off.\nSystem Management: Remote monitoring and control.\nData Analysis: Local analysis of sensor data.\nDeployment: Application deployed locally on device but accessible remotely.\nSecurity: Basic user authentication.",
        ),
        sp(),

        // ── Step 2 ───────────────────────────────────────────────
        h2("1.3  Step 2: Process Specification"),
        body(
          "The second step is to define the Process Specification — a formal description of the use cases of the IoT system. The use cases are derived directly from the purpose and requirement specifications established in Step 1.",
        ),
        body(
          "Process specification formally describes how the system transitions between states in response to inputs and conditions. It is typically represented as a process flow diagram or state machine that maps all possible states and the transitions between them.",
        ),
        body("Key elements captured in the process specification:"),
        bul(
          "Use Cases: Named scenarios describing how the system is used by actors (users, devices, external systems).",
        ),
        bul(
          "States: The distinct operational modes or conditions the system can be in.",
        ),
        bul(
          "Transitions: The conditions or inputs that cause the system to move from one state to another.",
        ),
        bul(
          "Decision Points: Branch conditions that determine which state or path the system follows.",
        ),
        sp(),
        infoBox(
          "Home Automation Example — Process Specification:\nThe process flow begins with a Mode decision node:\n- Auto Path: The system reads the Light-Level sensor. If Level = Low → Light State = On. If Level = High → Light State = Off.\n- Manual Path: The system reads the current Light-State. If State = On → Light = On. If State = Off → Light = Off.\nThis models all four possible operational states of the system.",
        ),
        sp(),

        // ── Step 3 ───────────────────────────────────────────────
        h2("1.4  Step 3: Domain Model Specification"),
        body(
          "The third step defines the Domain Model — an abstract representation of all the main concepts, entities, and objects in the IoT system domain, independent of any specific technology or platform. It provides IoT system designers with a clear, technology-agnostic understanding of the domain being designed for.",
        ),
        body("The domain model specifies:"),
        bul(
          "Physical Entities: Real-world physical objects (e.g., a room, a light appliance, a sensor).",
        ),
        bul(
          "Virtual Entities: Digital representations of physical entities within the system (e.g., a virtual Room object, a virtual Appliance object in software).",
        ),
        bul(
          "Devices: Physical computing and sensing hardware (e.g., Raspberry Pi as minicomputer, LDR as sensor, Relay as actuator).",
        ),
        bul(
          "Resources: Software components running on devices that provide access to device capabilities. Resources can be OnDevice Resources (running on the device itself) or Network Resources (accessible over the network).",
        ),
        bul(
          "Services: Software interfaces that expose the capabilities of resources to the application layer.",
        ),
        bul(
          "Attributes: Properties of entities and objects (e.g., light level, state).",
        ),
        bul(
          "Relationships: Associations between entities (one-way association, generalisation/specialisation, aggregation).",
        ),
        sp(),
        infoBox(
          "Home Automation Example — Domain Model Key Elements:\n- Physical Entities: Room (physical), Appliance (light appliance).\n- Virtual Entities: Room (virtual), Appliance (virtual) — digital counterparts.\n- Device: Minicomputer (Raspberry Pi), with attached Sensor (LDR) and Actuator (Relay).\n- Resources: OnDevice Resource (hosted on Raspberry Pi), Network Resource.\n- Services: Expose resource capabilities to the application.\n- Users: Human User interacts with the App (Active Digital Artefact). The App invokes/subscribes to Services.\n- Key Relationships: Virtual Entity 'relates to' Physical Entity; Device 'hosts' Resources; Service 'exposes' Resources; Device 'monitors' Physical Room; Device 'acts on' Physical Appliance.",
        ),
        sp(),

        // ── Step 4 ───────────────────────────────────────────────
        h2("1.5  Step 4: Information Model Specification"),
        body(
          "The fourth step defines the Information Model — the structure of all information in the IoT system. While the Domain Model identifies what entities exist, the Information Model specifies what data each entity holds and how entities relate to each other informationally.",
        ),
        body(
          "Important distinction: the Information Model describes the structure and relationships of information but does not describe how the information is stored or represented in a specific database or file format.",
        ),
        body("The process for defining the Information Model:"),
        bul("List all Virtual Entities defined in the Domain Model."),
        bul(
          "Define the attributes of each Virtual Entity (attribute names and types).",
        ),
        bul("Define the relationships between Virtual Entities."),
        bul("Define the possible values or states of each attribute."),
        sp(),
        infoBox(
          "Home Automation Example — Information Model:\nVirtual Entity: Room\n  - EntityType: Room\n  - ID: Room1\n  - Attribute: Light-Level (AttributeName: lightLevel, AttributeType: level)\n    - Values: Level:High, Level:Low\n\nVirtual Entity: LightAppliance\n  - EntityType: Appliance\n  - ID: Light1\n  - RoomID: Room1 (relationship: 'in room' — LightAppliance is in Room)\n  - Attribute: State (AttributeName: lightState, AttributeType: state)\n    - Values: State:On, State:Off",
        ),
        sp(),

        // ── Step 5 ───────────────────────────────────────────────
        h2("1.6  Step 5: Service Specifications"),
        body(
          "The fifth step maps the Process Specification and Information Model to services and formally documents each service's specification. Services are the software interfaces through which the IoT application interacts with the devices and data.",
        ),
        body(
          "A complete service specification defines the following for each service:",
        ),
        bul("Service Name: Unique identifier for the service."),
        bul(
          "Service Type: Categorises the service — Native (runs on the device itself) or REST (web service accessible via HTTP).",
        ),
        bul(
          "Service Inputs: The data the service accepts as input parameters.",
        ),
        bul("Service Output: The data the service returns after execution."),
        bul(
          "Service Endpoint: The URL path and protocol through which the service is accessed.",
        ),
        bul(
          "Service Schedule: How frequently the service runs (e.g., every 5 seconds).",
        ),
        bul(
          "Service Preconditions: Required states or conditions that must be true for the service to execute.",
        ),
        bul(
          "Service Effects: The state changes the service produces after execution.",
        ),
        sp(),
        infoBox(
          "Home Automation Example — Three Services:\n\n1. Controller Service (Type: Native)\n   - Input: Mode (Auto/Manual), State (On/Off)\n   - Output: State (On/Off)\n   - Schedule: Every 5 seconds\n   - Function: In auto mode, monitors light level and switches light on/off; updates status database. In manual mode, retrieves current state from database and switches light accordingly.\n\n2. Mode Service (Type: REST)\n   - Input: Set Mode (Auto/Manual)\n   - Output: Current Mode (Auto/Manual)\n   - Endpoint: /home/mode/ | Protocol: HTTP\n   - Function: Sets or retrieves the current operating mode.\n\n3. State Service (Type: REST)\n   - Input: State (On/Off)\n   - Output: State (On/Off)\n   - Endpoint: /home/state/ | Protocol: HTTP\n   - Function: Sets the light appliance state to on/off or retrieves current light state.",
        ),
        sp(),

        // ── Step 6 ───────────────────────────────────────────────
        h2("1.7  Step 6: IoT Level Specification"),
        body(
          "The sixth step selects the appropriate IoT Level for the system from five defined deployment levels. IoT Levels classify systems based on the complexity of the data flow, the number of nodes, and where analysis and storage occur.",
        ),
        sp(),
        makeTable(
          ["IoT Level", "Description", "Analysis Location", "Storage"],
          [
            [
              "Level 1",
              "Single node — device performs all functions",
              "On-device",
              "On-device",
            ],
            ["Level 2", "Single node with cloud storage", "On-device", "Cloud"],
            [
              "Level 3",
              "Single node, cloud analysis and storage",
              "Cloud",
              "Cloud",
            ],
            [
              "Level 4",
              "Multiple nodes, cloud analysis and storage",
              "Cloud",
              "Cloud",
            ],
            [
              "Level 5",
              "Coordinator node + end nodes",
              "Coordinator",
              "Cloud/Local",
            ],
          ],
          [1400, 3960, 2000, 2000],
        ),
        new Paragraph({ spacing: { before: 120 } }),
        sp(),
        infoBox(
          "Home Automation Example — IoT Level 1:\nThe home automation system is classified as IoT Level 1. All components reside locally on a single Raspberry Pi device:\n- The App communicates via REST.\n- REST Services handle Mode and State.\n- The Controller Service reads sensors and controls actuators.\n- A local Database stores current mode and state.\n- A single Monitoring Node performs analysis and stores data — all on the Raspberry Pi.\nNo cloud infrastructure is required for this system.",
        ),
        sp(),

        // ── Step 7 ───────────────────────────────────────────────
        h2("1.8  Step 7: Functional View Specification"),
        body(
          "The seventh step defines the Functional View (FV) — which maps the IoT Level to a set of Functional Groups (FGs). A Functional Group is a logical grouping of related functions that either: (a) provides functionalities for interacting with instances of concepts in the Domain Model, or (b) provides information related to those concepts.",
        ),
        body("The standard Functional Groups in an IoT system are:"),
        bul(
          "Device FG: Covers sensors, actuators, and computing devices — the physical hardware layer.",
        ),
        bul(
          "Communication FG: Covers communication APIs and communication protocols — how devices and services exchange data.",
        ),
        bul(
          "Services FG: Covers native services (running directly on devices) and web services (REST APIs accessible over the network).",
        ),
        bul(
          "Management FG: Covers application management, database management, and device management.",
        ),
        bul(
          "Security FG: Covers authentication (verifying identity) and authorization (controlling access).",
        ),
        bul(
          "Application FG: Covers the web application, application server, and database server.",
        ),
        sp(),
        infoBox(
          "Home Automation Example — Functional View Mappings:\n1. IoT Device → Device FG (sensors, actuators, computing devices) + Management FG (device management).\n2. Resources → Device FG (on-device resource) + Communication FG (communication APIs and protocols).\n3. Controller Service → Services FG (native service). Web Services → Services FG (web services).\n4. REST Web Services → Services FG (web services).\n5. Database → Management FG (database management) + Security FG (database security).\n6. Application → Application FG (web app, application server, database server) + Management FG (app management) + Security FG (app security).",
        ),
        sp(),

        // ── Step 8 ───────────────────────────────────────────────
        h2("1.9  Step 8: Operational View Specification"),
        body(
          "The eighth step translates the abstract Functional View into concrete, specific technology choices. In this step, every Functional Group is given real technology implementations — selecting specific products, platforms, protocols, and hosting options.",
        ),
        body("The Operational View covers:"),
        bul(
          "Service Hosting Options: Where will services run — on-device, on-premises server, or cloud?",
        ),
        bul("Storage Options: What database or storage system will be used?"),
        bul(
          "Device Options: What specific hardware devices, sensors, and actuators will be deployed?",
        ),
        bul(
          "Application Hosting Options: How will the application be served to users?",
        ),
        bul(
          "Communication Options: What specific protocols and network layers will be used?",
        ),
        bul(
          "Security Implementation: What specific authentication and authorization mechanisms will be deployed?",
        ),
        sp(),
        infoBox(
          "Home Automation Example — Operational View Specifics:\n\nDevices:\n- Computing Device: Raspberry Pi\n- Sensor: LDR (Light Dependent Resistor)\n- Actuator: Relay Switch\n\nServices:\n- Native Service: Controller Service (Python script running on Raspberry Pi)\n- Web Services: Mode REST Service, State REST Service\n\nApplication Layer:\n- Web App: Django Web Application\n- Application Server: Django App Server\n- Database Server: MySQL\n\nManagement:\n- Application Management: Django App Management\n- Database Management: MySQL DB Management\n- Device Management: Raspberry Pi Device Management\n\nSecurity:\n- Authentication: Web App + Database\n- Authorization: Web App + Database\n\nCommunication:\n- Communication APIs: REST APIs\n- Communication Protocols: Link Layer: 802.11 (Wi-Fi), Network Layer: IPv4/IPv6, Transport: TCP, Application: HTTP",
        ),
        sp(),

        // ── Step 9 ───────────────────────────────────────────────
        h2("1.10  Step 9: Device & Component Integration"),
        body(
          "The ninth step involves the physical and logical integration of all devices and components. This is where the hardware is assembled and wired, the software components are configured, and the entire system is connected together for the first time.",
        ),
        body("Integration activities include:"),
        bul(
          "Hardware Setup: Physically connecting sensors and actuators to the computing device (e.g., wiring LDR and Relay to Raspberry Pi GPIO pins via a breadboard).",
        ),
        bul(
          "Operating System Setup: Configuring the OS on the computing device.",
        ),
        bul(
          "Software Component Deployment: Installing and configuring the framework, database, and application dependencies.",
        ),
        bul(
          "Service Deployment: Deploying and starting REST services and native services on the device.",
        ),
        bul(
          "Database Setup: Creating the database schema and populating initial data.",
        ),
        bul(
          "Integration Testing: Verifying that all components communicate correctly.",
        ),
        sp(),
        infoBox(
          "Home Automation Example — Hardware Integration:\nThe Raspberry Pi (model B) is connected to a breadboard containing:\n- LDR (Light Dependent Resistor): Connected to GPIO Pin 18 to measure ambient light levels.\n- Relay Switch: Connected to GPIO Pin 25 to physically switch the light appliance on or off.\n- ULN2003A driver IC: Used to interface the low-power GPIO signal with the higher-power relay.\nAll connections are made through the Raspberry Pi GPIO header via jumper wires on the breadboard.",
        ),
        sp(),

        // ── Step 10 ──────────────────────────────────────────────
        h2("1.11  Step 10: Application Development"),
        body(
          "The final step is to develop the IoT application — the user-facing interface through which operators and users interact with the IoT system. The application integrates all the services defined in Step 5 and provides the controls and displays defined in the UI requirements of Step 1.",
        ),
        sp(),

        h3("1.11.1  Application Features"),
        body(
          "The home automation web application provides two primary controls:",
        ),
        bul(
          "Auto Toggle: Enables or disables automatic mode. When Auto is ON, the system automatically controls the light based on ambient light level readings from the LDR sensor.",
        ),
        bul(
          "Light Toggle: In Manual mode, directly controls the light appliance on/off. In Auto mode, reflects (read-only) the current state of the light appliance.",
        ),
        sp(),

        h3("1.11.2  Implementation Using Django REST Framework"),
        body(
          "The application is implemented using the Django web framework with the Django REST Framework (DRF) for the REST services. The implementation follows four layers:",
        ),
        sp(),

        h3("Layer 1: Models (models.py) — Database Schema"),
        body(
          "Services are mapped to Django ORM models. Model fields store the system states:",
        ),
        codeBox(
          "# models.py\nfrom django.db import models\n\nclass Mode(models.Model):\n    name = models.CharField(max_length=50)   # 'auto' or 'manual'\n\nclass State(models.Model):\n    name = models.CharField(max_length=50)   # 'on' or 'off'",
        ),
        sp(),

        h3("Layer 2: Serializers (serializers.py) — Data Conversion"),
        body(
          "Serializers convert complex model instances into native Python data types that can be rendered as JSON or XML for REST API responses:",
        ),
        codeBox(
          "# serializers.py\nfrom myapp.models import Mode, State\nfrom rest_framework import serializers\n\nclass ModeSerializer(serializers.HyperlinkedModelSerializer):\n    class Meta:\n        model = Mode\n        fields = ('url', 'name')\n\nclass StateSerializer(serializers.HyperlinkedModelSerializer):\n    class Meta:\n        model = State\n        fields = ('url', 'name')",
        ),
        sp(),

        h3("Layer 3: ViewSets (views.py) — Request Handling"),
        body(
          "ViewSets combine all the logic for a set of related views (GET, POST, PUT, DELETE) into a single class:",
        ),
        codeBox(
          "# views.py\nfrom myapp.models import Mode, State\nfrom rest_framework import viewsets\nfrom myapp.serializers import ModeSerializer, StateSerializer\n\nclass ModeViewSet(viewsets.ModelViewSet):\n    queryset = Mode.objects.all()\n    serializer_class = ModeSerializer\n\nclass StateViewSet(viewsets.ModelViewSet):\n    queryset = State.objects.all()\n    serializer_class = StateSerializer",
        ),
        sp(),

        h3("Layer 4: URL Configuration (urls.py) — Routing"),
        body(
          "URL patterns are automatically generated by registering ViewSets with a Router. The router maps incoming HTTP requests to the correct ViewSet method:",
        ),
        codeBox(
          "# urls.py\nfrom rest_framework import routers\nfrom myapp import views\n\nrouter = routers.DefaultRouter()\nrouter.register(r'mode', views.ModeViewSet)\nrouter.register(r'state', views.StateViewSet)\n\nurlpatterns = [\n    url(r'^', include(router.urls)),\n    url(r'^api-auth/', include('rest_framework.urls')),\n    url(r'^admin/', include(admin.site.urls)),\n    url(r'^home/', 'myapp.views.home'),\n]",
        ),
        sp(),

        h3("1.11.3  Controller Native Service"),
        body(
          "The native Controller Service is a Python script that runs directly on the Raspberry Pi. It operates in an infinite loop, checking the current mode every 5 seconds and controlling the light accordingly:",
        ),
        codeBox(
          "# Key logic from controller service\nimport RPi.GPIO as GPIO\nimport sqlite3 as lite\n\nLDR_PIN = 18        # GPIO pin for LDR sensor\nLIGHT_PIN = 25      # GPIO pin for Relay/Light\nthreshold = 1000    # Light level threshold\n\ndef runAutoMode():\n    ldr_reading = readldr(LDR_PIN)\n    if ldr_reading < threshold:\n        switchOnLight(LIGHT_PIN)\n        setCurrentState('on')\n    else:\n        switchOffLight(LIGHT_PIN)\n        setCurrentState('off')\n\ndef runManualMode():\n    state = getCurrentState()       # Read from database\n    if state == 'on':\n        switchOnLight(LIGHT_PIN)\n    elif state == 'off':\n        switchOffLight(LIGHT_PIN)\n\n# Main loop — runs every 5 seconds\nwhile True:\n    currentMode = getCurrentMode()\n    if currentMode == 'auto':   runAutoMode()\n    elif currentMode == 'manual': runManualMode()\n    time.sleep(5)",
        ),
        sp(),

        h3("1.11.4  System Integration Summary"),
        body(
          "The complete integrated system for the Home Automation Case Study consists of:",
        ),
        bul(
          "Django Application: The web application with HTML templates providing the user dashboard.",
        ),
        bul(
          "REST Services: Django REST Framework Mode and State services accessible via HTTP.",
        ),
        bul(
          "Controller Native Service: Python script running on Raspberry Pi, controlling GPIO.",
        ),
        bul(
          "SQLite Database: Stores current mode and state; shared between REST services and controller.",
        ),
        bul("Raspberry Pi: Computing device hosting all software components."),
        bul(
          "LDR Sensor: Measures ambient light level, connected to GPIO Pin 18.",
        ),
        bul(
          "Relay Switch: Physically switches the light appliance, connected to GPIO Pin 25.",
        ),
        bul("OS: Raspbian Linux running on the Raspberry Pi."),
        sp(),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════
        // PART 2 — PROTOTYPING & DEV LIFECYCLE
        // ════════════════════════════════════
        h1("PART 2: IoT PROTOTYPING AND PRODUCT DEVELOPMENT LIFE CYCLE"),
        body(
          "The Internet of Things is moving from speculation to widespread adoption. In the last five years alone, businesses using IoT technologies have nearly doubled — growing to 25% of organisations. With an estimated 73 billion connected devices expected by 2025, and nearly two-thirds of enterprise companies planning to adopt IoT to reduce expenses, optimise assets, and improve safety and security, the ability to build IoT products effectively has become a critical competency.",
        ),
        body(
          "Building products in this era of connected devices requires a strategic and focused product development cycle. The IoT product development cycle is divided into three high-level phases: Thinking, Planning, and Building new smart product plans.",
        ),
        sp(),

        // ── 2.1 Development Goals ────────────────────────────────
        h2("2.1  Goals of the IoT Product Development Phase"),
        body(
          "Before beginning the technical work, the development team must clearly understand what the phase is intended to produce. The desired outcomes of a structured IoT product development engagement include:",
        ),
        bul(
          "A succinct product vision — a clear, agreed-upon statement of what the product does and who it serves.",
        ),
        bul(
          "A technical product architecture — covering mechanical, electrical, firmware, cloud, mobile, and database layers.",
        ),
        bul(
          "At least one physical design concept — a tangible model or mockup of the product form factor.",
        ),
        bul(
          "Pricing estimates for production — preliminary cost modelling for hardware components, manufacturing, and operations.",
        ),
        bul(
          "A detailed product development plan — timelines, milestones, team assignments, and dependencies.",
        ),
        sp(),

        // ── 2.2 Development Strategy Steps ──────────────────────
        h2("2.2  IoT Product Development Strategy"),
        body(
          "The development strategy consists of five sequential activities that transform an idea into a ready-to-build specification:",
        ),
        sp(),

        h3("2.2.1  Initial Study"),
        body(
          "The initial study is the critical first step that turns an idea into a validated, directional plan. It involves reviewing marketing research, analysing similar existing products, identifying user needs, assessing the available team and timeline, and preparing a feasibility report.",
        ),
        body(
          "The feasibility report provides both direction and a technical strategy for product development. This step is important for two reasons: it serves as the foundation for all subsequent steps, and it can prevent the team from pursuing costly and time-consuming paths that are not technically or commercially viable.",
        ),

        h3("2.2.2  Technical Architecture"),
        body(
          "The technical architecture step creates the full technology blueprint for the product across all system layers:",
        ),
        bul(
          "Mechanical architecture: Physical form factor, enclosure design, assembly.",
        ),
        bul(
          "Electrical architecture: Circuit design, power supply, PCB layout.",
        ),
        bul(
          "Firmware architecture: Embedded software running on the device microcontroller or processor.",
        ),
        bul(
          "Cloud architecture: Cloud services, APIs, data pipelines, and back-end processing.",
        ),
        bul(
          "Mobile architecture: Mobile application design and interface with cloud services.",
        ),
        bul(
          "Database architecture: Data schema, storage strategy, and query design.",
        ),
        body(
          "This step is a common stumbling block for new IoT initiatives because it uncovers the full technology stack needed to realise the product. The multidisciplinary nature of IoT — spanning hardware, firmware, connectivity, and software — significantly increases technical complexity.",
        ),

        h3("2.2.3  Prototyping"),
        body(
          "Prototyping involves the rapid development of an early functional model of the product, generally using off-the-shelf hardware and software components. The primary purpose of prototyping is to answer key 'gating' questions around technology feasibility, feature functionality, user interface usability, and unit cost.",
        ),
        body("Prototypes progress through stages of increasing fidelity:"),
        bul(
          "Looks-Like Prototype: A physical mockup that represents the product's form factor and appearance, without full functionality. Used for user feedback on ergonomics and visual design.",
        ),
        bul(
          "Works-Like Prototype: A functional prototype that demonstrates the core technical capabilities, without necessarily matching the final form factor.",
        ),
        bul(
          "Alpha Prototype: An early integrated prototype that combines form and function. Used for more comprehensive testing.",
        ),
        body(
          "Low-fidelity, quick-turnaround prototypes allow potential pitfalls to surface early in the project — before significant resources have been committed. This approach can financially save a project by identifying fundamental problems before they become expensive to fix.",
        ),

        h3("2.2.4  Product Requirements Document (PRD)"),
        body(
          "The Product Requirements Document (PRD) is a formal written specification that clearly describes the product's appearance, usability, function, and functionality. It serves as the authoritative reference document that guides all product development activities throughout the process.",
        ),
        body(
          "A well-formed PRD for an IoT product must address several specific considerations:",
        ),
        bul(
          "Fast and secure connectivity: Define the required communication protocols, speed, and security standards.",
        ),
        bul(
          "Advanced data management: Specify how data is collected, processed, stored, and accessed.",
        ),
        bul(
          "Robust device management: Define how devices are provisioned, monitored, updated, and maintained.",
        ),
        bul(
          "Monitoring requirements: Define what metrics and health indicators must be tracked to keep products operational.",
        ),
        bul(
          "Test cases: Define appropriate test cases for each feature, reviewed and approved by all key stakeholders, to ensure all core requirements are intact and consistent in the final product.",
        ),
        sp(),

        infoBox(
          "The PRD is the single source of truth for the product. It provides templates to guide product development throughout the process and ensures that all team members — hardware engineers, firmware developers, cloud architects, and UX designers — share a common understanding of what is being built.",
        ),
        sp(),

        // ── 2.3 IoT Development Stack ────────────────────────────
        h2("2.3  The IoT Development Stack — Five Layers"),
        body(
          "A complete IoT solution requires five technology layers, each building on the layer below. Understanding all five layers is essential to creating a full end-to-end IoT product:",
        ),
        sp(),

        h3("Layer 1: IoT Hardware Device"),
        body(
          "The hardware device is the first and foundational layer of the IoT technology stack. It defines the digital and physical parts of the smart connected product. Key considerations at this layer include:",
        ),
        bul(
          "Size and form factor: Does the device fit within the required physical dimensions?",
        ),
        bul(
          "Implementation: What computing platform is appropriate — microcontroller, system-on-chip (SoC), or single-board computer (SBC)?",
        ),
        bul(
          "Cost: What is the unit cost of the hardware, and does it meet production pricing targets?",
        ),
        bul(
          "Operational life: How long must the device operate without maintenance or replacement?",
        ),
        bul(
          "Reliability: What environmental conditions must the device survive?",
        ),
        body(
          "For small devices such as smartwatches, only a single System-on-Chip (SoC) may be available. For more capable devices, common platforms include:",
        ),
        bul(
          "Raspberry Pi — a full single-board computer running Linux, suitable for complex applications.",
        ),
        bul("BeagleBone — another Linux-capable SBC with extensive I/O."),
        bul(
          "Artik module — Samsung's IoT module platform for connected devices.",
        ),

        h3("Layer 2: Device Software"),
        body(
          "Device software transforms device hardware into a smart, programmable device. At this layer, the development team identifies the sensors that can provide the needed data and writes the firmware or software that drives the device's behaviour.",
        ),
        body("Device software encompasses:"),
        bul(
          "Sensor drivers: Software that reads data from attached sensors (temperature, pressure, light, etc.).",
        ),
        bul(
          "Actuator control: Software that sends control signals to actuators (motors, relays, LEDs).",
        ),
        bul(
          "Device logic: The on-device processing and decision-making algorithms.",
        ),
        bul(
          "Communication stack: Software that manages network connectivity and data transmission.",
        ),
        body(
          "Device software allows each device to provide different applications depending on the software it is running — enabling software-defined device behaviour.",
        ),

        h3("Layer 3: Connectivity"),
        body(
          "Connectivity is the layer that links the device and its sensors to the cloud, and determines which network communication platform and protocol the application will use. This is a critical design decision as it impacts power consumption, range, bandwidth, latency, and cost.",
        ),
        body("The most common IoT connectivity types are:"),
        bul(
          "Bluetooth: Short-range, low-power communication for personal area networks and wearables.",
        ),
        bul(
          "Wi-Fi: Medium-range, high-bandwidth communication for home and enterprise environments.",
        ),
        bul(
          "Radio (Sub-GHz): Long-range, low-power communication for outdoor and industrial IoT.",
        ),
        bul(
          "Cellular (4G/LTE/5G): Wide-area communication for mobile and remote deployments.",
        ),
        bul(
          "Satellite: Global coverage for extremely remote deployments where no terrestrial network exists.",
        ),
        bul(
          "RFID: Short-range radio identification, used for asset tracking and access control.",
        ),
        bul("GPS: For location tracking and geofencing applications."),
        body(
          "The connectivity decision covers both the physical network type and the communication protocol being used at higher layers (e.g., MQTT, CoAP, HTTP).",
        ),

        h3("Layer 4: Data Transmission and Connectivity Services"),
        body(
          "This layer focuses on the secure, reliable transmission of data from IoT devices to the cloud and back. Top priorities for IoT product development teams at this layer include:",
        ),
        bul(
          "Real-time data transmission: Data must reach the cloud or processing system with minimal latency.",
        ),
        bul(
          "Security and privacy: All transmissions must be protected against interception and tampering.",
        ),
        bul(
          "Wireless control integration: Adding secure wireless control to mobile phones, Wi-Fi devices, RFID readers, GPS trackers, and Bluetooth accessories.",
        ),
        bul(
          "Protocol selection: Choosing between MQTT (publish/subscribe, lightweight), HTTP/REST (request/response), CoAP (constrained devices), and other protocols based on device capability and network conditions.",
        ),

        h3("Layer 5: Software and Cloud Integration"),
        body(
          "The top layer of the IoT development stack brings together cloud platforms, software applications, and integration services to deliver the full IoT product experience. This layer is responsible for:",
        ),
        bul(
          "Web and mobile applications: Building user-facing interfaces for controlling and monitoring IoT devices in real time.",
        ),
        bul(
          "Cloud-hosted backend: Custom software applications hosted on cloud servers to manage controlling, monitoring, optimising, and autonomous operation of product functions.",
        ),
        bul(
          "M2M (Machine-to-Machine) Communication: Enabling two or more devices to communicate and exchange data without human interaction — including power line connections, serial connections, and wireless IIoT communications.",
        ),
        bul(
          "Cloud platform integration: Connecting to cloud IoT platforms such as Google Cloud IoT, Azure IoT Hub, and AWS IoT.",
        ),
        bul(
          "Data analytics: Cloud-based analysis of IoT data streams for business intelligence and automated decision-making.",
        ),
        sp(),

        // ── 2.4 Hardware Identification ─────────────────────────
        h2("2.4  Hardware Identification in IoT Product Development"),
        body(
          "Hardware identification is one of the most important parts of IoT product development. Selecting the right hardware sensors and actuators determines whether the product can achieve its functional requirements. Two categories of hardware components are fundamental:",
        ),
        bul(
          "Sensor Elements: Convert physical phenomena into electrical signals that can be measured and processed.",
        ),
        bul(
          "Actuator Elements: Convert electrical signals into physical actions or results.",
        ),
        body("Examples of commonly used IoT sensors:"),
        bul(
          "Temperature Sensor: Measures ambient temperature for HVAC, industrial, and environmental monitoring.",
        ),
        bul(
          "Smoke Sensor: Detects combustion gases for fire safety and industrial safety monitoring.",
        ),
        bul(
          "Pressure Sensor: Measures atmospheric, hydraulic, or pneumatic pressure for process monitoring.",
        ),
        bul(
          "Gyroscope: Measures angular velocity and orientation for navigation, gesture recognition, and robotics.",
        ),
        bul(
          "LDR (Light Dependent Resistor): Measures ambient light level — low resistance in bright light, high resistance in darkness.",
        ),
        bul("PIR Sensor: Passive infrared sensor for motion detection."),
        bul(
          "Ultrasonic Sensor: Measures distance using sound waves for proximity sensing and level measurement.",
        ),
        sp(),

        // ── 2.5 IoT Product Development Stages ──────────────────
        h2("2.5  IoT Product Development Stages"),
        body(
          "The full IoT product development process from concept to market involves the following sequential stages:",
        ),
        sp(),
        makeTable(
          ["Stage", "Description", "Key Output"],
          [
            [
              "1. Concept & Ideation",
              "Define the product concept, target market, and initial use cases.",
              "Product concept document",
            ],
            [
              "2. Initial Study / Feasibility",
              "Review market research, user needs, and technical feasibility.",
              "Feasibility report",
            ],
            [
              "3. Technical Architecture",
              "Design the full hardware, firmware, cloud, and software stack.",
              "Architecture document",
            ],
            [
              "4. Prototyping",
              "Build rapid prototypes to validate technology and UX.",
              "Alpha/Beta prototypes",
            ],
            [
              "5. PRD Creation",
              "Document appearance, usability, function, and test cases.",
              "Product Requirements Document",
            ],
            [
              "6. Hardware Identification",
              "Select sensors, actuators, microcontrollers, and computing platforms.",
              "Hardware BOM",
            ],
            [
              "7. Firmware Development",
              "Develop embedded software for device control and communication.",
              "Device firmware",
            ],
            [
              "8. Connectivity Setup",
              "Implement communication protocols and cloud connectivity.",
              "Connected device",
            ],
            [
              "9. Software & Cloud Integration",
              "Build web/mobile apps and cloud backend.",
              "Full-stack application",
            ],
            [
              "10. Testing & QA",
              "Test all features against PRD test cases, approved by stakeholders.",
              "Test report",
            ],
            [
              "11. Production & Deployment",
              "Manufacturing, provisioning, and deployment at scale.",
              "Deployed IoT product",
            ],
          ],
          [2200, 3760, 3400],
        ),
        new Paragraph({ spacing: { before: 120 } }),
        sp(),

        new Paragraph({ children: [new PageBreak()] }),

        // ════════════════════════════════════
        // PART 3 — QUICK REVISION SUMMARY
        // ════════════════════════════════════
        h1("PART 3: QUICK REVISION SUMMARY"),

        h2("3.1  IoT Design Methodology — Key Points"),
        bul(
          "10-step formal process: Purpose → Process → Domain Model → Information Model → Service Specs → IoT Level → Functional View → Operational View → Device Integration → Application Development.",
        ),
        bul(
          "Step 1 — Purpose & Requirements: Define system purpose, behaviour, data, analysis, management, security, UI, and deployment requirements.",
        ),
        bul(
          "Step 2 — Process Specification: Formally describe use cases and system state diagrams derived from requirements.",
        ),
        bul(
          "Step 3 — Domain Model: Technology-agnostic model of Physical Entities, Virtual Entities, Devices, Resources, Services, and their relationships.",
        ),
        bul(
          "Step 4 — Information Model: Defines structure of all information — Virtual Entity attributes, types, and inter-entity relations. Does NOT specify storage format.",
        ),
        bul(
          "Step 5 — Service Specifications: Defines service name, type (Native/REST), inputs, outputs, endpoints, schedule, preconditions, and effects.",
        ),
        bul(
          "Step 6 — IoT Level: Select from 5 levels based on system complexity, data volume, and where analysis/storage occurs. Home Automation = Level 1 (single node, all local).",
        ),
        bul(
          "Step 7 — Functional View: Maps IoT level to 6 Functional Groups: Device, Communication, Services, Management, Security, Application.",
        ),
        bul(
          "Step 8 — Operational View: Concrete technology choices — e.g., Raspberry Pi, LDR, Relay, Django, MySQL, REST APIs, IEEE 802.11, TCP/IP/HTTP.",
        ),
        bul(
          "Step 9 — Device Integration: Physical hardware wiring (LDR→GPIO18, Relay→GPIO25) + OS and software deployment.",
        ),
        bul(
          "Step 10 — Application Development: Django REST Framework (Models → Serializers → ViewSets → URLs), Controller Native Service (Python, SQLite, RPi.GPIO), Dashboard (Auto/Light toggles).",
        ),

        h2("3.2  Prototyping & Development Life Cycle — Key Points"),
        bul(
          "IoT adoption: 25% of businesses use IoT; 73B+ devices by 2025; 2/3 of enterprises to adopt IoT.",
        ),
        bul("Development cycle phases: Thinking → Planning → Building."),
        bul(
          "Goal outputs: Product vision, technical architecture, physical design concept, pricing estimates, development plan.",
        ),
        bul(
          "Initial Study: Market research, feasibility report — prevents costly wrong paths.",
        ),
        bul(
          "Technical Architecture: Covers mechanical, electrical, firmware, cloud, mobile, database.",
        ),
        bul(
          "Prototyping stages: Looks-Like → Works-Like → Alpha. Low-fidelity prototypes surface problems early.",
        ),
        bul(
          "PRD: Documents appearance, usability, function, test cases — the single source of truth.",
        ),
        bul(
          "5-Layer IoT Stack: (1) Hardware Device, (2) Device Software, (3) Connectivity, (4) Data Transmission, (5) Software & Cloud Integration.",
        ),
        bul(
          "Key connectivity types: Bluetooth, Wi-Fi, Radio, Cellular, Satellite, RFID, GPS.",
        ),
        bul(
          "Hardware: Two types — Sensor elements (input, measure) and Actuator elements (output, control). Common sensors: temperature, smoke, pressure, gyroscope, LDR, PIR, ultrasonic.",
        ),
        bul(
          "M2M: Machine-to-machine communication without human interaction — power lines, serial, wireless IIoT.",
        ),
        bul("Cloud platforms: Google Cloud IoT, Azure IoT Hub, AWS IoT."),
        bul(
          "11 development stages: Concept → Feasibility → Architecture → Prototype → PRD → Hardware → Firmware → Connectivity → Cloud Integration → Testing → Deployment.",
        ),

        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: "End of Module 6 Notes",
              size: 20,
              color: "888888",
              italics: true,
              font: "Arial",
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(
    "K:\Projects\Resume Curator\Module_6_Comprehensive_Notes.docx",
    buf,
  );
  console.log("Done!");
});
