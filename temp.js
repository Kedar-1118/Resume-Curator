const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  LevelFormat,
  BorderStyle,
  WidthType,
  ShadingType,
  PageNumber,
  PageBreak,
  TabStopType,
  TabStopPosition,
} = require("docx");
const fs = require("fs");

const CONTENT_WIDTH = 9360;
const COL_HALF = 4680;
const COL_THIRD = 3120;
const COL_QTR = 2340;

const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
};
const cellMargins = { top: 80, bottom: 80, left: 140, right: 140 };

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 28, color: "1F3864" })],
    spacing: { before: 300, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: "1F3864", space: 4 },
    },
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 24, color: "2E5090" })],
    spacing: { before: 200, after: 80 },
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: "1F3864" })],
    spacing: { before: 160, after: 60 },
  });
}

function para(text, options = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, ...options })],
    spacing: { before: 60, after: 60 },
    indent: options.indent ? { left: 360 } : undefined,
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text, size: 22 })],
    spacing: { before: 40, after: 40 },
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    children: [new TextRun({ text, size: 22 })],
    spacing: { before: 40, after: 40 },
  });
}

function tip(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: "📝 Exam Tip: " + text,
        size: 20,
        italics: true,
        color: "7B3F00",
      }),
    ],
    spacing: { before: 80, after: 80 },
    indent: { left: 200 },
    border: {
      left: { style: BorderStyle.THICK, size: 12, color: "D4860A", space: 8 },
    },
  });
}

function conclusion(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: "Conclusion: ",
        bold: true,
        size: 22,
        color: "1F3864",
      }),
      new TextRun({ text, size: 22 }),
    ],
    spacing: { before: 100, after: 60 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
  });
}

function emptyLine() {
  return new Paragraph({
    children: [new TextRun("")],
    spacing: { before: 40, after: 40 },
  });
}

function makeTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    children: headers.map(
      (h, i) =>
        new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: "1F3864", type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: h, bold: true, size: 20, color: "FFFFFF" }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
    ),
  });
  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell, i) =>
            new TableCell({
              borders,
              width: { size: colWidths[i], type: WidthType.DXA },
              shading: {
                fill: i === 0 ? "E8EDF5" : "FFFFFF",
                type: ShadingType.CLEAR,
              },
              margins: cellMargins,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: cell, size: 20, bold: i === 0 }),
                  ],
                  alignment: AlignmentType.LEFT,
                }),
              ],
            }),
        ),
      }),
  );
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Calibri", color: "1F3864" },
        paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Calibri", color: "2E5090" },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 },
      },
    ],
  },
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
            style: { paragraph: { indent: { left: 540, hanging: 280 } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: "\u25E6",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 900, hanging: 280 } } },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 280 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1260 },
        },
      },
      children: [
        // ====== TITLE PAGE ======
        new Paragraph({
          children: [new TextRun("")],
          spacing: { before: 1800, after: 200 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "INFORMATION SECURITY",
              bold: true,
              size: 56,
              color: "1F3864",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Comprehensive Examination Notes",
              size: 36,
              color: "2E5090",
            }),
          ],
        }),
        new Paragraph({
          children: [new TextRun("")],
          spacing: { before: 200, after: 200 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Cryptography  |  Network Security  |  Malware & System Defense",
              size: 24,
              italics: true,
              color: "555555",
            }),
          ],
        }),
        new Paragraph({
          children: [new TextRun("")],
          spacing: { before: 1400, after: 200 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Covers: OSI Security, Classical & Modern Cryptography, AES/DES/RSA, TLS/SSL, IPSec, VPN, Malware",
              size: 20,
              color: "666666",
            }),
          ],
        }),
        pageBreak(),

        // ====== Q1: OSI Security Architecture ======
        heading1("1. OSI Security Architecture and Security Services"),
        para(
          "OSI (Open Systems Interconnection) Security Architecture is an ITU-T standard (X.800) that provides a systematic framework for defining security requirements and solutions in networked communication systems.",
        ),
        emptyLine(),
        heading2("Core Objective — The CIA Triad"),
        makeTable(
          ["Property", "Definition", "Example"],
          [
            [
              "Confidentiality",
              "Ensures data is accessible only to authorized parties",
              "Encrypted communication",
            ],
            [
              "Integrity",
              "Ensures data is not altered during transmission",
              "Hash verification",
            ],
            [
              "Availability",
              "Ensures systems and data are accessible when needed",
              "DDoS protection",
            ],
          ],
          [2400, 4080, 2880],
        ),
        emptyLine(),
        heading2("Security Services (ITU-T X.800)"),
        numbered(
          "Authentication — Verifies the identity of communicating entities (peer entity & data origin authentication).",
        ),
        numbered("Access Control — Prevents unauthorized use of resources."),
        numbered(
          "Data Confidentiality — Protects data from unauthorized disclosure (connection, connectionless, selective field, and traffic flow).",
        ),
        numbered(
          "Data Integrity — Ensures messages are received exactly as sent, with no modification, insertion, deletion, or replay.",
        ),
        numbered(
          "Non-Repudiation — Provides proof of origin and delivery so neither party can deny the transaction.",
        ),
        numbered(
          "Availability — Ensures services are available to authorized users; protects against denial-of-service (DoS) attacks.",
        ),
        emptyLine(),
        heading2("Security Mechanisms"),
        bullet("Encipherment (encryption)"),
        bullet("Digital signatures"),
        bullet("Access control mechanisms"),
        bullet("Data integrity mechanisms"),
        bullet("Authentication exchange"),
        bullet("Traffic padding and routing control"),
        emptyLine(),
        tip(
          "Exams often ask: 'List and explain security services of OSI.' Answer with all 6 services using the CIA Triad as foundation.",
        ),
        conclusion(
          "OSI Security Architecture provides a structured approach to network security by defining attacks, mechanisms, and services. It underpins all modern security protocol design.",
        ),

        pageBreak(),

        // ====== Q2: Substitution vs Transposition ======
        heading1("2. Substitution and Transposition Techniques"),
        para(
          "Classical cryptography relies on two fundamental operations for encrypting plaintext: substitution and transposition. Modern ciphers combine both for stronger security.",
        ),
        emptyLine(),
        heading2("Comparison Table"),
        makeTable(
          ["Feature", "Substitution", "Transposition"],
          [
            [
              "Definition",
              "Replaces each character with another character/symbol",
              "Rearranges the positions of characters",
            ],
            [
              "Characters",
              "Original characters are changed",
              "Original characters are preserved",
            ],
            [
              "Positions",
              "Positions may remain same",
              "Positions are completely changed",
            ],
            ["Key Concept", "Confusion", "Diffusion"],
            [
              "Example",
              "Caesar Cipher, Vigenere Cipher",
              "Rail Fence, Columnar Transposition",
            ],
            [
              "Weakness",
              "Vulnerable to frequency analysis",
              "Vulnerable to anagramming attacks",
            ],
          ],
          [2200, 3580, 3580],
        ),
        emptyLine(),
        heading2("Substitution Technique"),
        para(
          "In substitution, each plaintext character is replaced by a different character according to a fixed rule or key.",
        ),
        para("Example — Caesar Cipher (shift +3):"),
        para("Plaintext:   H  E  L  L  O", { bold: true }),
        para("Ciphertext:  K  H  O  O  R", { bold: true }),
        para(
          "The identity (value) of symbols is changed, but their order is preserved.",
        ),
        emptyLine(),
        heading2("Transposition Technique"),
        para(
          "In transposition, the characters of plaintext are rearranged according to a permutation, without altering the characters themselves.",
        ),
        para("Example — Rail Fence Cipher:"),
        para("Plaintext: HELLO  →  Written diagonally across 2 rails:"),
        para("Rail 1: H _ L _ O   →  HLO"),
        para("Rail 2: _ E _ L _   →  EL"),
        para("Ciphertext: HLOELL"),
        emptyLine(),
        tip(
          "Key distinction: Substitution changes 'what' the letter is. Transposition changes 'where' the letter is. Modern ciphers like AES use both (confusion + diffusion — Shannon's principles).",
        ),
        conclusion(
          "Substitution and transposition are the two building blocks of classical cryptography. Modern encryption algorithms use products of these operations to achieve both confusion and diffusion.",
        ),

        pageBreak(),

        // ====== Q3: Caesar Cipher ======
        heading1("3. Caesar Cipher — Encryption of 'NETWORK' (Shift = 3)"),
        para(
          "Caesar Cipher is a monoalphabetic substitution cipher in which each letter in the plaintext is shifted a fixed number of positions down the alphabet.",
        ),
        emptyLine(),
        heading2("Formula"),
        para("Encryption: C = (P + K) mod 26", { bold: true }),
        para("Decryption: P = (C - K + 26) mod 26", { bold: true }),
        para(
          "Where: P = plaintext position (A=0), K = key (shift value), C = ciphertext position",
        ),
        emptyLine(),
        heading2("Step-by-Step Encryption"),
        makeTable(
          [
            "Plaintext Letter",
            "Position (0-25)",
            "Position + 3",
            "Ciphertext Letter",
          ],
          [
            ["N", "13", "16", "Q"],
            ["E", "4", "7", "H"],
            ["T", "19", "22", "W"],
            ["W", "22", "25", "Z"],
            ["O", "14", "17", "R"],
            ["R", "17", "20", "U"],
            ["K", "10", "13", "N"],
          ],
          [2600, 2200, 2200, 2360],
        ),
        emptyLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Plaintext:   N  E  T  W  O  R  K",
              bold: true,
              size: 24,
              color: "1F3864",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Ciphertext:  Q  H  W  Z  R  U  N",
              bold: true,
              size: 24,
              color: "C0392B",
            }),
          ],
        }),
        emptyLine(),
        heading2("Decryption Verification"),
        para(
          "Apply shift -3 to QHWZRUN:  Q(16-3=13=N)  H(7-3=4=E)  W(22-3=19=T) ... → NETWORK  ✓",
        ),
        emptyLine(),
        heading2("Properties and Limitations"),
        bullet(
          "Key space: only 25 possible keys — extremely vulnerable to brute-force",
        ),
        bullet(
          "Vulnerable to frequency analysis — letter frequency patterns are preserved",
        ),
        bullet(
          "Monoalphabetic — same plaintext letter always maps to same ciphertext letter",
        ),
        emptyLine(),
        tip(
          "Exam shortcut: Memorize A=0, Z=25. For shift +3: A→D, N→Q, X→A (wraps around: 23+3=26 mod 26=0=A).",
        ),
        conclusion(
          "Caesar Cipher encrypts 'NETWORK' as 'QHWZRUN' with shift +3. Though historically significant, it is trivially breakable and serves only as an educational cipher.",
        ),

        pageBreak(),

        // ====== Q4: Steganography vs Cryptography ======
        heading1("4. Steganography vs. Cryptography"),
        para(
          "Both steganography and cryptography are techniques used for secure communication, but they achieve security through fundamentally different approaches.",
        ),
        emptyLine(),
        heading2("Comparison Table"),
        makeTable(
          ["Feature", "Cryptography", "Steganography"],
          [
            [
              "Goal",
              "Protect content of a message",
              "Conceal the existence of a message",
            ],
            [
              "Approach",
              "Transforms data into unreadable form",
              "Hides data within a cover medium",
            ],
            [
              "Detectability",
              "Ciphertext is visible but unreadable",
              "Secret message is completely invisible",
            ],
            [
              "Key Required",
              "Yes (encryption/decryption key)",
              "Optional (steganographic key/technique)",
            ],
            [
              "Output",
              "Ciphertext (appears garbled)",
              "Stego-object (appears normal/innocent)",
            ],
            [
              "Examples",
              "AES, RSA, DES, 3DES",
              "LSB in images, whitespace in text",
            ],
            [
              "Limitation",
              "Existence of communication is known",
              "Once detected, message is exposed",
            ],
          ],
          [2200, 3580, 3580],
        ),
        emptyLine(),
        heading2("Cryptography"),
        para(
          "Cryptography uses mathematical algorithms and keys to transform plaintext into ciphertext. An eavesdropper can see the ciphertext but cannot understand it without the key.",
        ),
        para(
          "Example: 'HELLO' encrypted with AES → '4A7F3C...' (unintelligible ciphertext)",
        ),
        emptyLine(),
        heading2("Steganography"),
        para(
          "Steganography hides the secret message inside a carrier (cover medium) such that no one suspects a message exists. Common carriers include:",
        ),
        bullet(
          "Images (hiding text in least significant bits of pixel values)",
        ),
        bullet("Audio files (echo hiding, phase coding)"),
        bullet("Video files"),
        bullet("Text documents (whitespace manipulation)"),
        emptyLine(),
        heading2("Combined Use (Stegano-Cryptography)"),
        para(
          "For maximum security, both techniques are often combined: the secret message is first encrypted (cryptography) and then hidden inside a cover medium (steganography). This provides both confidentiality AND concealment.",
        ),
        emptyLine(),
        tip(
          "Remember: Cryptography says 'I'm sending a secret, but you can't read it.' Steganography says 'I'm not sending any secret at all.' — This is the key philosophical difference.",
        ),
        conclusion(
          "Cryptography protects message content through encryption, while steganography hides the very existence of a message. Combined, they offer the strongest form of secure communication.",
        ),

        pageBreak(),

        // ====== Q5: Classical Encryption Strengths & Weaknesses ======
        heading1(
          "5. Strengths and Weaknesses of Classical Encryption Techniques",
        ),
        para(
          "Classical encryption techniques include Caesar Cipher, Vigenere Cipher, Playfair Cipher, and Rail Fence Cipher. They were used extensively in military and diplomatic communications before the digital era.",
        ),
        emptyLine(),
        heading2("Major Classical Techniques"),
        makeTable(
          ["Technique", "Type", "Key", "Vulnerability"],
          [
            [
              "Caesar Cipher",
              "Substitution",
              "Single shift value (0-25)",
              "Brute force (only 25 keys)",
            ],
            [
              "Vigenere Cipher",
              "Polyalphabetic Substitution",
              "Keyword",
              "Kasiski test, Index of Coincidence",
            ],
            [
              "Playfair Cipher",
              "Digraph Substitution",
              "5x5 keyword matrix",
              "Frequency analysis of digraphs",
            ],
            [
              "Rail Fence Cipher",
              "Transposition",
              "Number of rails",
              "Anagramming",
            ],
          ],
          [2400, 2200, 2400, 2360],
        ),
        emptyLine(),
        heading2("Strengths"),
        numbered(
          "Simple to understand and implement — require no computational technology.",
        ),
        numbered(
          "Historically effective — adequate for the speed of information exchange in their era.",
        ),
        numbered("Low computational overhead — can be performed manually."),
        numbered(
          "Foundational importance — established the core principles of confusion and diffusion used in modern ciphers.",
        ),
        numbered(
          "Educational value — help understand cryptographic concepts clearly.",
        ),
        emptyLine(),
        heading2("Weaknesses"),
        numbered(
          "Small key space — Caesar Cipher has only 25 possible keys, easily exhausted by brute force.",
        ),
        numbered(
          "Vulnerable to frequency analysis — letter frequency patterns in ciphertext reveal plaintext.",
        ),
        numbered(
          "Monoalphabetic ciphers — same plaintext letter always maps to same ciphertext letter.",
        ),
        numbered(
          "No diffusion — changes in plaintext affect only corresponding ciphertext characters.",
        ),
        numbered(
          "Easily broken by modern computers — brute-force attacks take milliseconds.",
        ),
        emptyLine(),
        heading2("Attacks on Classical Ciphers"),
        makeTable(
          ["Attack", "Description", "Effective Against"],
          [
            [
              "Brute Force",
              "Try every possible key until correct plaintext found",
              "Caesar, simple substitution",
            ],
            [
              "Frequency Analysis",
              "Match letter frequencies in ciphertext to known language frequencies",
              "All monoalphabetic ciphers",
            ],
            [
              "Kasiski Test",
              "Find repeated sequences to determine key length",
              "Vigenere Cipher",
            ],
            [
              "Known Plaintext",
              "Use known plaintext-ciphertext pairs to deduce key",
              "Most classical ciphers",
            ],
          ],
          [2400, 4000, 2960],
        ),
        emptyLine(),
        tip(
          "Exams frequently ask to compare 2 classical ciphers OR explain why they are insecure. Always mention frequency analysis and brute-force as the two primary weaknesses.",
        ),
        conclusion(
          "Classical ciphers formed the foundation of cryptography and introduced key concepts still used today. However, they are cryptographically insecure against modern computational attacks and have been replaced by algorithms like AES.",
        ),

        pageBreak(),

        // ====== Q6: Product Cryptosystem ======
        heading1(
          "6. Simple Product Cryptosystem (Substitution + Transposition)",
        ),
        para(
          "A product cryptosystem combines multiple encryption operations — typically substitution and transposition — in sequence to achieve stronger security than either technique alone. This concept, introduced by Claude Shannon, combines confusion (substitution) and diffusion (transposition).",
        ),
        emptyLine(),
        heading2("Shannon's Principles"),
        makeTable(
          ["Principle", "Achieved By", "Effect"],
          [
            [
              "Confusion",
              "Substitution",
              "Obscures relationship between plaintext and ciphertext",
            ],
            [
              "Diffusion",
              "Transposition / Permutation",
              "Spreads plaintext statistics throughout ciphertext",
            ],
          ],
          [2400, 3000, 3960],
        ),
        emptyLine(),
        heading2("Step-by-Step Example"),
        heading3("Step 1 — Plaintext"),
        para("Message: SECURITY", { bold: true }),
        heading3("Step 2 — Apply Caesar Cipher (Substitution, Shift +3)"),
        makeTable(
          ["S", "E", "C", "U", "R", "I", "T", "Y"],
          [["V", "H", "F", "X", "U", "L", "W", "B"]],
          [1170, 1170, 1170, 1170, 1170, 1170, 1170, 1170],
        ),
        para("After substitution: VHFXULWB"),
        heading3("Step 3 — Apply Columnar Transposition"),
        para("Write 'VHFXULWB' in a 2-row grid (key = 2 columns):"),
        makeTable(
          ["Col 1", "Col 2", "Col 3", "Col 4"],
          [
            ["V", "H", "F", "X"],
            ["U", "L", "W", "B"],
          ],
          [2340, 2340, 2340, 2340],
        ),
        para("Read column-by-column: VU  HL  FW  XB  →  VUHLF WXB"),
        para("After transposition: VUHLF WXB  (or VUHLFWXB)", { bold: true }),
        emptyLine(),
        heading2("Why Product Ciphers Are Stronger"),
        bullet("Substitution alone — vulnerable to frequency analysis"),
        bullet(
          "Transposition alone — anagram attacks can reconstruct plaintext",
        ),
        bullet(
          "Combined — frequency patterns are scattered AND positions are changed, defeating both attack types",
        ),
        emptyLine(),
        heading2("Real-World Application"),
        para(
          "DES and AES both use product cipher concepts: multiple rounds of substitution (S-boxes) and permutation (P-boxes) are applied iteratively.",
        ),
        emptyLine(),
        tip(
          "Exams may ask you to perform the actual cipher steps. Practice: write out the substitution first, then show the transposition grid. Show your working clearly.",
        ),
        conclusion(
          "Product cryptosystems achieve higher security by combining confusion (substitution) and diffusion (transposition). This principle forms the basis of all modern block cipher designs including DES and AES.",
        ),

        pageBreak(),

        // ====== Q7: Block Cipher and DES ======
        heading1(
          "7. Block Cipher Principles and DES (Data Encryption Standard)",
        ),
        para(
          "A block cipher encrypts fixed-size blocks of plaintext into ciphertext using a symmetric key. Unlike stream ciphers that encrypt one bit at a time, block ciphers process an entire block simultaneously.",
        ),
        emptyLine(),
        heading2("Block Cipher Design Principles"),
        numbered(
          "Substitution (S-boxes) — provides confusion, making relationship between key and ciphertext complex.",
        ),
        numbered(
          "Permutation (P-boxes) — provides diffusion, spreading the influence of plaintext bits across ciphertext.",
        ),
        numbered(
          "Multiple Rounds — repeated application of substitution and permutation increases security.",
        ),
        numbered(
          "Key Scheduling — generates different subkeys for each round from the master key.",
        ),
        emptyLine(),
        heading2("DES — Data Encryption Standard"),
        makeTable(
          ["Parameter", "Value"],
          [
            ["Developed by", "IBM, standardized by NIST (1977)"],
            ["Block Size", "64 bits"],
            ["Key Size", "56 bits (64-bit key with 8 parity bits)"],
            ["Number of Rounds", "16"],
            ["Structure", "Feistel Cipher"],
            ["Subkey Size", "48 bits per round"],
            ["Status", "Obsolete — replaced by AES (broken in <24 hours)"],
          ],
          [4000, 5360],
        ),
        emptyLine(),
        heading2("Feistel Structure"),
        para(
          "DES uses a Feistel network where the plaintext block is split into two halves (L and R), and only one half is processed per round:",
        ),
        para("L(i) = R(i-1)", { bold: true }),
        para("R(i) = L(i-1) XOR f(R(i-1), K(i))", { bold: true }),
        para("Where f() is the round function using S-box substitution."),
        emptyLine(),
        heading2("DES Round Operations"),
        numbered("Expansion Permutation (E) — expands 32-bit R to 48 bits."),
        numbered(
          "XOR with Round Key — 48-bit expanded R is XORed with 48-bit round subkey.",
        ),
        numbered(
          "S-Box Substitution — 8 S-boxes each take 6 bits in, produce 4 bits out (48 → 32 bits). This is where DES gets its security.",
        ),
        numbered("P-Box Permutation — rearranges the 32 output bits."),
        numbered(
          "XOR with Left Half — L XOR P-box output becomes new R; old R becomes new L.",
        ),
        emptyLine(),
        tip(
          "DES key size is 56 bits (NOT 64). The 64-bit key has 8 bits used for parity checking. This is a common exam trick question.",
        ),
        conclusion(
          "DES was a landmark in cryptography, introducing the Feistel structure and formal cipher standards. Its 56-bit key is insufficient for modern security, leading to its replacement by AES.",
        ),

        pageBreak(),

        // ====== Q8: Block Cipher Modes ======
        heading1("8. Block Cipher Modes of Operation"),
        para(
          "Block ciphers encrypt fixed-size blocks (e.g., 128-bit for AES), but real-world messages are usually much larger. Modes of operation define how a block cipher is applied repeatedly to encrypt data of arbitrary length securely.",
        ),
        emptyLine(),
        heading2("Why Modes Are Necessary — The ECB Problem"),
        para(
          "Without modes, a block cipher in Electronic Codebook (ECB) mode encrypts each block independently. This means identical plaintext blocks produce identical ciphertext blocks — revealing patterns in the data, a serious security flaw.",
        ),
        emptyLine(),
        heading2("Modes of Operation Comparison"),
        makeTable(
          [
            "Mode",
            "Full Name",
            "How It Works",
            "Error Propagation",
            "Parallelizable",
          ],
          [
            [
              "ECB",
              "Electronic Codebook",
              "Each block encrypted independently",
              "None (isolated)",
              "Yes (weak)",
            ],
            [
              "CBC",
              "Cipher Block Chaining",
              "Each block XORed with previous ciphertext block before encryption",
              "Yes (2 blocks)",
              "Decryption only",
            ],
            [
              "CFB",
              "Cipher Feedback",
              "Converts block cipher to stream cipher; encrypts previous ciphertext",
              "Yes (limited)",
              "Decryption only",
            ],
            [
              "OFB",
              "Output Feedback",
              "Keystream generated independently of plaintext",
              "None",
              "No",
            ],
            [
              "CTR",
              "Counter Mode",
              "Counter value encrypted to generate keystream",
              "None",
              "Yes (both)",
            ],
          ],
          [720, 1600, 2800, 1800, 1440],
        ),
        emptyLine(),
        heading2("CBC — Most Important Mode (Exam Focus)"),
        para("CBC Formula:"),
        para("Encryption: C(i) = E_K [ P(i) XOR C(i-1) ]", { bold: true }),
        para("Decryption: P(i) = D_K [ C(i) ] XOR C(i-1)", { bold: true }),
        para(
          "Initialization Vector (IV) is used for C(0) to ensure different ciphertexts for same plaintext.",
        ),
        emptyLine(),
        heading2("Applications"),
        bullet(
          "ECB — Simple applications, encrypted single blocks (NOT recommended for multi-block data)",
        ),
        bullet("CBC — File encryption, disk encryption (AES-CBC widely used)"),
        bullet("CTR — High-performance applications, stream encryption, TLS"),
        bullet(
          "OFB — Noisy communication channels where errors must not propagate",
        ),
        emptyLine(),
        tip(
          "Remember: ECB is insecure for multi-block data. CBC is the standard for most applications. CTR offers parallelism. The IV in CBC must be random and unpredictable.",
        ),
        conclusion(
          "Modes of operation extend block ciphers to handle arbitrary-length data securely. CBC and CTR are the most widely used modes in modern cryptographic applications such as TLS, VPNs, and disk encryption.",
        ),

        pageBreak(),

        // ====== Q9: One Round of DES ======
        heading1("9. One Round of DES Encryption — Detailed Analysis"),
        para(
          "DES performs 16 rounds of encryption using the Feistel structure. Each round uses a different 48-bit subkey derived from the original 56-bit master key.",
        ),
        emptyLine(),
        heading2("Input to Each Round"),
        bullet(
          "64-bit data block split into: Left Half L(0) = 32 bits, Right Half R(0) = 32 bits",
        ),
        bullet("Round subkey K(i) = 48 bits"),
        emptyLine(),
        heading2("Round Operations in Sequence"),
        makeTable(
          ["Step", "Operation", "Input → Output", "Purpose"],
          [
            [
              "1",
              "Expansion Permutation (E)",
              "32 bits → 48 bits",
              "Expands R to match key size; provides diffusion",
            ],
            [
              "2",
              "XOR with Round Key",
              "48 bits XOR 48-bit key → 48 bits",
              "Introduces key-dependent variation",
            ],
            [
              "3",
              "S-Box Substitution",
              "48 bits → 32 bits (8 S-boxes × 6→4 bits)",
              "Core of DES security; provides confusion (non-linear)",
            ],
            [
              "4",
              "P-Box Permutation",
              "32 bits → 32 bits (rearranged)",
              "Spreads S-box output; provides diffusion",
            ],
            [
              "5",
              "XOR with L(i-1)",
              "32 bits XOR 32 bits → 32 bits",
              "Combines round function output with left half",
            ],
            [
              "6",
              "Swap Halves",
              "L(i) = R(i-1), R(i) = XOR result",
              "Sets up next round input",
            ],
          ],
          [720, 2000, 2400, 3240],
        ),
        emptyLine(),
        heading2("Mathematical Representation"),
        para("L(i) = R(i-1)", { bold: true }),
        para("R(i) = L(i-1) ⊕ f(R(i-1), K(i))", { bold: true }),
        para("Where f(R, K) = P [ S [ E(R) ⊕ K ] ]"),
        emptyLine(),
        heading2("S-Box Detail (Critical for Exams)"),
        para(
          "Each of the 8 S-boxes takes a 6-bit input and produces a 4-bit output:",
        ),
        bullet("First and last bits of the 6-bit input → select the row (0-3)"),
        bullet("Middle 4 bits → select the column (0-15)"),
        bullet("The S-box value at that row/column is the 4-bit output"),
        para(
          "S-boxes are the ONLY non-linear component in DES and provide resistance against differential cryptanalysis.",
        ),
        emptyLine(),
        tip(
          "Exams often ask: 'What is the purpose of S-boxes in DES?' Answer: S-boxes are the only non-linear component; they provide confusion and are responsible for DES's cryptographic strength.",
        ),
        conclusion(
          "Each DES round applies expansion, XOR with subkey, S-box substitution, and P-box permutation to progressively increase confusion and diffusion. The 16-round Feistel structure ensures decryption uses the same hardware with reversed key schedule.",
        ),

        pageBreak(),

        // ====== Q10 & Q11: DES vs AES ======
        heading1(
          "10 & 11. DES vs. AES — Comparison and DES Strengths/Limitations",
        ),
        emptyLine(),
        heading2("DES vs. AES Comparison"),
        makeTable(
          ["Feature", "DES", "AES"],
          [
            [
              "Full Name",
              "Data Encryption Standard",
              "Advanced Encryption Standard",
            ],
            ["Developed By", "IBM", "Joan Daemen & Vincent Rijmen"],
            ["Standardized", "1977 (NIST)", "2001 (NIST, FIPS 197)"],
            ["Block Size", "64 bits", "128 bits"],
            ["Key Sizes", "56 bits", "128, 192, or 256 bits"],
            ["Number of Rounds", "16", "10, 12, or 14 (based on key size)"],
            [
              "Structure",
              "Feistel Network",
              "Substitution-Permutation Network (SPN)",
            ],
            [
              "Security Status",
              "Broken / Obsolete",
              "Secure / Current Standard",
            ],
            ["Speed", "Slower", "Faster (hardware/software optimized"],
          ],
          [2800, 3280, 3280],
        ),
        emptyLine(),
        heading2("Strengths of DES"),
        numbered(
          "Simple and efficient hardware implementation — widely deployed in the 1970s-1990s.",
        ),
        numbered(
          "Introduced the Feistel structure — a design still used in modern ciphers.",
        ),
        numbered(
          "Established formal cipher standardization — created framework for NIST cryptographic standards.",
        ),
        numbered(
          "Foundation for Triple-DES (3DES) — extends DES life by applying it 3 times (112-bit effective security).",
        ),
        emptyLine(),
        heading2("Limitations of DES"),
        numbered(
          "56-bit key is too small — can be brute-forced in under 24 hours (EFF 'Deep Crack' broke DES in 1998 in 22 hours).",
        ),
        numbered(
          "64-bit block size — too small for large data; same key should not encrypt more than 2^32 blocks.",
        ),
        numbered(
          "Weak keys — 4 weak keys and 12 semi-weak keys that reduce security.",
        ),
        numbered(
          "Vulnerable to differential and linear cryptanalysis — theoretical attacks exist.",
        ),
        emptyLine(),
        heading2("AES Advantages"),
        numbered(
          "128/192/256-bit keys — 2^128 key space is computationally infeasible to brute-force.",
        ),
        numbered(
          "128-bit block size — handles modern data volumes efficiently.",
        ),
        numbered(
          "No Feistel structure — all bytes are equally processed in an SPN structure.",
        ),
        numbered(
          "Highly optimized — hardware AES-NI instructions in modern CPUs provide near-zero overhead.",
        ),
        emptyLine(),
        tip(
          "Key exam fact: DES was cracked in 22 hours in 1998 by EFF. 3DES was used as a transition. AES replaced DES in 2001. Remember: DES = 56-bit key, 16 rounds, 64-bit block. AES = 128-256 bit key, 10-14 rounds, 128-bit block.",
        ),
        conclusion(
          "DES was historically important but its 56-bit key is insufficient for modern security. AES provides significantly stronger security with larger key and block sizes, efficient implementation, and resistance to all known practical attacks.",
        ),

        pageBreak(),

        // ====== Q12: Secure Communication with AES-CBC ======
        heading1(
          "12. Secure Communication Model Using AES and Block Cipher Mode",
        ),
        para(
          "A secure communication model must ensure confidentiality, integrity, and authentication. Using AES with CBC mode provides industry-standard encryption for secure data transmission.",
        ),
        emptyLine(),
        heading2("System Design"),
        makeTable(
          ["Component", "Choice", "Reason"],
          [
            [
              "Algorithm",
              "AES-256",
              "Maximum key length; computationally infeasible to brute-force",
            ],
            [
              "Mode",
              "CBC (Cipher Block Chaining)",
              "Prevents identical blocks from producing identical ciphertext",
            ],
            [
              "Key Exchange",
              "Diffie-Hellman",
              "Secure key exchange over insecure channel",
            ],
            [
              "Authentication",
              "HMAC-SHA256",
              "Ensures integrity and authenticates the sender",
            ],
            [
              "IV",
              "Random 128-bit IV",
              "Ensures different ciphertext even for identical messages",
            ],
          ],
          [2200, 3000, 4160],
        ),
        emptyLine(),
        heading2("Communication Steps"),
        numbered(
          "Key Setup: Both parties generate a 256-bit shared secret key using Diffie-Hellman key exchange.",
        ),
        numbered(
          "IV Generation: Sender generates a cryptographically random 128-bit Initialization Vector.",
        ),
        numbered(
          "Encryption: Each plaintext block P(i) is XORed with the previous ciphertext block, then encrypted:",
        ),
        para("C(i) = AES_K [ P(i) XOR C(i-1) ]    (C(0) = IV)", {
          bold: true,
          indent: true,
        }),
        numbered(
          "MAC Generation: HMAC-SHA256 is computed over ciphertext + IV to ensure integrity.",
        ),
        numbered("Transmission: Sender transmits IV + Ciphertext + MAC."),
        numbered("Decryption: Receiver verifies MAC first, then decrypts:"),
        para("P(i) = AES^-1_K [ C(i) ] XOR C(i-1)", {
          bold: true,
          indent: true,
        }),
        emptyLine(),
        heading2("Security Properties Achieved"),
        bullet(
          "Confidentiality — AES-256 encryption makes data unreadable to unauthorized parties",
        ),
        bullet("Integrity — HMAC-SHA256 detects any tampering with ciphertext"),
        bullet("Authentication — MAC verifies sender identity"),
        bullet(
          "Semantic Security — random IV ensures same plaintext produces different ciphertext each time",
        ),
        emptyLine(),
        tip(
          "Exam questions often ask to 'design a secure communication system.' Always include: algorithm (AES), mode (CBC/CTR), key exchange (DH), integrity (HMAC), and IV/nonce. This covers all security goals.",
        ),
        conclusion(
          "AES-256 with CBC mode, combined with HMAC for integrity, provides a complete secure communication solution meeting the CIA Triad requirements for modern networked applications.",
        ),

        pageBreak(),

        // ====== Q13: RSA ======
        heading1("13. RSA Cryptosystem — Public/Private Key Infrastructure"),
        para(
          "RSA (Rivest-Shamir-Adleman, 1977) is the most widely used asymmetric encryption algorithm. Its security is based on the computational difficulty of factoring the product of two large prime numbers.",
        ),
        emptyLine(),
        heading2("Key Generation Algorithm"),
        makeTable(
          ["Step", "Operation", "Formula / Notes"],
          [
            ["1", "Choose two large prime numbers", "p and q (kept secret)"],
            ["2", "Compute modulus", "n = p × q  (n is public)"],
            [
              "3",
              "Compute Euler's totient",
              "φ(n) = (p-1)(q-1)  (kept secret)",
            ],
            [
              "4",
              "Choose public exponent",
              "e: 1 < e < φ(n), gcd(e, φ(n)) = 1",
            ],
            [
              "5",
              "Compute private exponent",
              "d: d × e ≡ 1 (mod φ(n))  — modular inverse",
            ],
            ["6", "Public key", "(e, n) — shared openly"],
            ["7", "Private key", "(d, n) — kept secret"],
          ],
          [720, 2800, 5840],
        ),
        emptyLine(),
        heading2("Encryption and Decryption"),
        makeTable(
          ["Operation", "Formula", "Who Performs It"],
          [
            [
              "Encryption",
              "C = M^e mod n",
              "Sender (uses recipient's public key)",
            ],
            ["Decryption", "M = C^d mod n", "Recipient (uses own private key)"],
          ],
          [2200, 3000, 4160],
        ),
        emptyLine(),
        heading2("RSA Security Basis"),
        para(
          "RSA security rests on the integer factorization problem: given n (a large semi-prime), it is computationally infeasible to find p and q. Current RSA key sizes:",
        ),
        bullet("1024-bit — deprecated (insecure)"),
        bullet("2048-bit — minimum recommended today"),
        bullet("4096-bit — high security applications"),
        emptyLine(),
        heading2("Applications of RSA"),
        numbered("Digital signatures (signing documents and software)"),
        numbered("Key exchange (encrypting symmetric session keys)"),
        numbered("SSL/TLS certificate authentication"),
        numbered("Secure email (S/MIME, PGP)"),
        emptyLine(),
        tip(
          "RSA is slow — it is NOT used to encrypt bulk data. Instead, RSA encrypts a symmetric key (e.g., AES key), which then encrypts the data. This hybrid approach is used in TLS.",
        ),
        conclusion(
          "RSA provides asymmetric encryption based on integer factorization hardness, enabling secure key exchange, digital signatures, and authentication without requiring prior shared secrets.",
        ),

        pageBreak(),

        // ====== Q14 & Q15: Diffie-Hellman and RSA Example ======
        heading1("14 & 15. Diffie-Hellman Key Exchange and RSA Worked Example"),
        emptyLine(),
        heading2("Diffie-Hellman Key Exchange"),
        para(
          "Diffie-Hellman (DH) allows two parties to establish a shared secret over an insecure public channel, without ever transmitting the secret itself. Security is based on the discrete logarithm problem.",
        ),
        emptyLine(),
        makeTable(
          ["Step", "Alice", "Bob", "Shared / Public"],
          [
            [
              "1. Agree on parameters",
              "",
              "",
              "Prime p, generator g (both public)",
            ],
            [
              "2. Choose private key",
              "Chooses secret: a",
              "Chooses secret: b",
              "(private, never transmitted)",
            ],
            [
              "3. Compute public value",
              "A = g^a mod p",
              "B = g^b mod p",
              "Exchange A and B publicly",
            ],
            [
              "4. Compute shared key",
              "K = B^a mod p",
              "K = A^b mod p",
              "Both get same K = g^(ab) mod p",
            ],
          ],
          [2000, 2000, 2000, 3360],
        ),
        emptyLine(),
        para(
          "Why it works:  K = B^a = (g^b)^a = g^(ab) = (g^a)^b = A^b  (mod p)",
          { bold: true },
        ),
        para(
          "An eavesdropper knows g, p, A, B but cannot compute K without solving the discrete logarithm problem (finding a from g^a mod p).",
        ),
        emptyLine(),
        heading2("DH Vulnerabilities"),
        bullet(
          "Vulnerable to Man-in-the-Middle (MITM) attacks without authentication — must combine with RSA or certificates.",
        ),
        bullet(
          "Small primes are insecure — modern DH uses 2048-bit or larger primes.",
        ),
        emptyLine(),
        heading2("RSA Worked Example (Numerical)"),
        numbered("Choose primes: p = 11,  q = 13"),
        numbered("n = p × q = 11 × 13 = 143"),
        numbered("φ(n) = (p-1)(q-1) = 10 × 12 = 120"),
        numbered("Choose e = 7  (gcd(7, 120) = 1  ✓)"),
        numbered(
          "Find d: d × 7 ≡ 1 (mod 120) → d = 103  (check: 103 × 7 = 721 = 6×120 + 1 ✓)",
        ),
        emptyLine(),
        makeTable(
          ["Key Component", "Value"],
          [
            ["Public Key (e, n)", "(7, 143)"],
            ["Private Key (d, n)", "(103, 143)"],
          ],
          [4680, 4680],
        ),
        emptyLine(),
        heading3("Encryption  (Message M = 9)"),
        para("C = M^e mod n = 9^7 mod 143"),
        para(
          "9^2 = 81,  9^4 = 81^2 = 6561 mod 143 = 6561 - 45×143 = 6561 - 6435 = 126",
        ),
        para("9^7 = 9^4 × 9^2 × 9^1 = 126 × 81 × 9 mod 143"),
        para(
          "= 126 × 81 mod 143 = 10206 mod 143 = 10206 - 71×143 = 10206 - 10153 = 53 ... = 48",
        ),
        para("Ciphertext C = 48", { bold: true }),
        heading3("Decryption  (C = 48)"),
        para("M = C^d mod n = 48^103 mod 143  →  M = 9  ✓", { bold: true }),
        emptyLine(),
        tip(
          "For exam calculations with RSA: use repeated squaring to avoid huge numbers. Always verify by checking decryption recovers original message. Show all intermediate steps.",
        ),
        conclusion(
          "Diffie-Hellman provides secure key exchange based on discrete logarithm hardness. RSA numerical example confirms that correct key generation allows successful encrypt-decrypt with M=9 → C=48 → M=9.",
        ),

        pageBreak(),

        // ====== Q16: ElGamal vs ECC ======
        heading1(
          "16. ElGamal Cryptosystem vs. Elliptic Curve Cryptography (ECC)",
        ),
        para(
          "Both ElGamal and ECC are public-key cryptographic algorithms. ElGamal is based on discrete logarithms over finite fields, while ECC uses the algebraic structure of elliptic curves.",
        ),
        emptyLine(),
        heading2("Comparison Table"),
        makeTable(
          ["Feature", "ElGamal", "ECC"],
          [
            [
              "Security Basis",
              "Discrete Logarithm Problem (DLP)",
              "Elliptic Curve Discrete Logarithm (ECDLP)",
            ],
            ["Key Size (128-bit equiv.)", "~3072 bits", "~256 bits"],
            [
              "Performance",
              "Slower (large computations)",
              "Faster (smaller numbers)",
            ],
            ["Memory Usage", "High", "Low"],
            ["Ciphertext Size", "2× plaintext size", "Compact"],
            [
              "Best For",
              "Legacy systems, large infrastructure",
              "Mobile, IoT, TLS, smart cards",
            ],
            ["Example Use", "PGP (historically)", "TLS 1.3, Bitcoin, SSH"],
          ],
          [2200, 3580, 3580],
        ),
        emptyLine(),
        heading2("ElGamal Cryptosystem"),
        para(
          "Based on Diffie-Hellman key exchange. Uses a public key (g, p, g^x mod p) and private key x.",
        ),
        bullet(
          "Encryption: produces two values (C1, C2) — doubles message size",
        ),
        bullet(
          "Randomized encryption — same plaintext produces different ciphertext each time (non-deterministic)",
        ),
        bullet("Used in PGP and GNU Privacy Guard"),
        emptyLine(),
        heading2("Elliptic Curve Cryptography (ECC)"),
        para(
          "ECC uses points on an elliptic curve y^2 = x^3 + ax + b over a finite field. The difficulty of solving ECDLP (finding k given P and kP) provides security.",
        ),
        bullet(
          "256-bit ECC ≈ 3072-bit RSA in security level — dramatic key size reduction",
        ),
        bullet("Faster computations, lower bandwidth, less storage"),
        bullet(
          "Used in: TLS 1.3, HTTPS, Bitcoin/blockchain, SSH, mobile authentication",
        ),
        emptyLine(),
        tip(
          "ECC is preferred for modern systems because equivalent security requires far smaller keys. 'ECDH' (Elliptic Curve Diffie-Hellman) is used in TLS 1.3 for key exchange.",
        ),
        conclusion(
          "ECC provides equivalent or superior security to ElGamal and RSA with significantly smaller key sizes, making it the preferred choice for resource-constrained devices and modern internet protocols.",
        ),

        pageBreak(),

        // ====== Q17 & Q18: Key Management and RSA+DH Framework ======
        heading1(
          "17 & 18. Key Distribution, Key Management, and Secure Communication Framework",
        ),
        emptyLine(),
        heading2("Importance of Key Distribution"),
        para(
          "In asymmetric cryptography, the security of the entire system depends on the trustworthy distribution of public keys. If an attacker substitutes their own public key, all communications are compromised.",
        ),
        emptyLine(),
        heading2("Key Distribution Methods"),
        makeTable(
          ["Method", "Description", "Security Level"],
          [
            [
              "Manual Exchange",
              "Keys shared in person",
              "High (but impractical at scale)",
            ],
            [
              "Public Key Server",
              "Keys posted to a directory",
              "Medium (no authentication)",
            ],
            [
              "PKI / Certificates",
              "CA-signed X.509 certificates bind identity to public key",
              "High (scalable)",
            ],
            [
              "Web of Trust",
              "Users cross-sign each other's keys (PGP model)",
              "Medium-High",
            ],
          ],
          [2000, 4200, 3160],
        ),
        emptyLine(),
        heading2("Key Management Lifecycle"),
        numbered(
          "Key Generation — Use cryptographically secure random number generators (CSPRNG).",
        ),
        numbered(
          "Key Distribution — Securely deliver keys to authorized parties (via PKI or DH).",
        ),
        numbered(
          "Key Storage — Store private keys in HSMs (Hardware Security Modules) or encrypted keystores.",
        ),
        numbered("Key Usage — Enforce access control; log all key usage."),
        numbered(
          "Key Revocation — Revoke compromised keys via CRL (Certificate Revocation List) or OCSP.",
        ),
        numbered(
          "Key Destruction — Securely overwrite and destroy expired keys.",
        ),
        emptyLine(),
        heading2("Secure Communication Framework: RSA + Diffie-Hellman"),
        para(
          "A complete secure communication system combines RSA for authentication with DH for key exchange:",
        ),
        emptyLine(),
        makeTable(
          ["Phase", "Protocol", "Purpose"],
          [
            [
              "1. Authentication",
              "RSA + X.509 Certificates",
              "Verify identities of both parties",
            ],
            [
              "2. Key Exchange",
              "Diffie-Hellman (DHE)",
              "Establish shared session key without transmitting it",
            ],
            [
              "3. Session Encryption",
              "AES-256-GCM",
              "Encrypt all session data with shared key",
            ],
            [
              "4. Integrity",
              "HMAC-SHA256 / GCM",
              "Verify data not tampered with in transit",
            ],
          ],
          [2000, 3200, 4160],
        ),
        emptyLine(),
        heading2("Perfect Forward Secrecy (PFS)"),
        para(
          "Using Ephemeral DH (DHE or ECDHE) provides Perfect Forward Secrecy — each session uses a fresh DH key pair. Even if the long-term RSA private key is later compromised, past session keys cannot be recovered.",
        ),
        emptyLine(),
        tip(
          "TLS 1.3 mandates ECDHE for key exchange and removes RSA key exchange entirely. Always mention Perfect Forward Secrecy when discussing modern secure communication frameworks.",
        ),
        conclusion(
          "Combining RSA authentication with Diffie-Hellman key exchange creates a robust framework providing authentication, forward secrecy, and confidentiality. This hybrid approach underlies modern TLS, HTTPS, and VPN protocols.",
        ),

        pageBreak(),

        // ====== Q19-24: Hash Functions ======
        heading1(
          "19-24. Hash Functions, MD5, SHA, HMAC, and Digital Signatures",
        ),
        emptyLine(),
        heading2("Hash Functions — Definition and Properties"),
        para(
          "A cryptographic hash function H maps an input of arbitrary size to a fixed-length output (digest/hash) with the following required properties:",
        ),
        emptyLine(),
        makeTable(
          ["Property", "Definition", "Why Important"],
          [
            [
              "Deterministic",
              "Same input always produces same output",
              "Required for verification",
            ],
            [
              "Fixed Output Size",
              "Output length is constant regardless of input size",
              "Predictable structure",
            ],
            [
              "Pre-image Resistance",
              "Given H(x), impossible to find x",
              "One-way function property",
            ],
            [
              "Second Pre-image Resistance",
              "Given x, impossible to find y ≠ x with H(x) = H(y)",
              "Prevents targeted forgery",
            ],
            [
              "Collision Resistance",
              "Computationally infeasible to find any H(x) = H(y)",
              "Prevents birthday attacks",
            ],
            [
              "Avalanche Effect",
              "Small change in input causes large change in output",
              "Prevents pattern analysis",
            ],
          ],
          [2400, 3000, 3960],
        ),
        emptyLine(),
        heading2("MD2, MD5, and SHA — Comparison"),
        makeTable(
          ["Algorithm", "Digest Size", "Security Status", "Typical Use"],
          [
            ["MD2", "128 bits", "Broken / Obsolete", "Legacy systems only"],
            [
              "MD5",
              "128 bits",
              "Broken (collision attacks)",
              "File checksums (non-security)",
            ],
            ["SHA-1", "160 bits", "Deprecated (2017)", "Legacy TLS only"],
            [
              "SHA-256 (SHA-2)",
              "256 bits",
              "Secure — Current Standard",
              "TLS, code signing, certificates",
            ],
            [
              "SHA-512 (SHA-2)",
              "512 bits",
              "Secure — High Security",
              "High-assurance applications",
            ],
            [
              "SHA-3",
              "224/256/384/512 bits",
              "Secure — Newest Standard",
              "Alternative to SHA-2",
            ],
          ],
          [2000, 1800, 2600, 2960],
        ),
        emptyLine(),
        heading2("HMAC — Keyed Hash Functions"),
        para(
          "HMAC (Hash-based Message Authentication Code) combines a secret key with a hash function to provide both message integrity AND authentication.",
        ),
        para("HMAC(K, M) = H[ (K ⊕ opad) || H[ (K ⊕ ipad) || M ] ]", {
          bold: true,
        }),
        para(
          "Where K = secret key, M = message, opad/ipad = fixed padding constants.",
        ),
        emptyLine(),
        heading2("Digital Signatures using Hash + RSA"),
        numbered("Sender computes: digest = SHA256(message)"),
        numbered(
          "Sender creates signature: S = RSA_encrypt(digest, private_key)",
        ),
        numbered("Sender transmits: message + signature"),
        numbered("Receiver computes: digest' = SHA256(received_message)"),
        numbered(
          "Receiver verifies: digest'' = RSA_decrypt(signature, sender_public_key)",
        ),
        numbered("If digest' == digest'' → signature valid, message authentic"),
        emptyLine(),
        heading2("Hash Attack Types"),
        makeTable(
          ["Attack", "Description", "Defence"],
          [
            [
              "Brute Force",
              "Try all inputs until matching hash found",
              "Large digest size (256+ bits)",
            ],
            [
              "Birthday Attack",
              "Find any collision using birthday paradox (O(2^n/2) operations)",
              "Large digest (256+ bits)",
            ],
            [
              "Length Extension",
              "Append data to message without knowing key",
              "Use HMAC; use SHA-3",
            ],
            [
              "Collision Attack",
              "Find two different inputs with same hash",
              "Avoid MD5/SHA-1; use SHA-2/3",
            ],
          ],
          [1800, 3400, 3160],
        ),
        emptyLine(),
        tip(
          "MD5 and SHA-1 are broken — state this clearly in exams. SHA-256 is the minimum for security-critical applications. HMAC-SHA256 is the industry standard for message authentication.",
        ),
        conclusion(
          "Cryptographic hash functions provide integrity verification. HMAC adds authentication. Digital signatures combine hashing with asymmetric cryptography to provide authentication, integrity, and non-repudiation.",
        ),

        pageBreak(),

        // ====== Q25-26: Kerberos and X.509 ======
        heading1("25 & 26. Kerberos Authentication vs. X.509 Certificates"),
        emptyLine(),
        heading2("Kerberos Authentication System"),
        para(
          "Kerberos is a network authentication protocol developed at MIT that uses symmetric key cryptography and a trusted third party (Key Distribution Center) to authenticate users.",
        ),
        emptyLine(),
        heading2("Kerberos Working Process"),
        numbered(
          "User requests authentication from Authentication Server (AS) with username.",
        ),
        numbered(
          "AS responds with: (a) Ticket Granting Ticket (TGT) encrypted with user's key, (b) Session key encrypted with user's key.",
        ),
        numbered(
          "User decrypts session key using password hash; presents TGT to Ticket Granting Server (TGS).",
        ),
        numbered("TGS issues Service Ticket for the requested service."),
        numbered(
          "User presents Service Ticket to the application server for access.",
        ),
        emptyLine(),
        heading2("X.509 Certificate Authentication"),
        para(
          "X.509 is an ITU-T standard for digital certificates used in PKI systems. Certificates bind a public key to an identity and are signed by a trusted Certificate Authority (CA).",
        ),
        emptyLine(),
        heading2("X.509 Certificate Contents"),
        makeTable(
          ["Field", "Content"],
          [
            ["Version", "X.509 version (v3 is current)"],
            ["Serial Number", "Unique certificate identifier from CA"],
            [
              "Signature Algorithm",
              "Algorithm used to sign certificate (e.g., SHA256withRSA)",
            ],
            ["Issuer", "CA that issued the certificate"],
            ["Validity Period", "Not Before and Not After dates"],
            ["Subject", "Entity the certificate belongs to (DN format)"],
            ["Subject Public Key", "The public key being certified"],
            ["Extensions", "Key usage, SAN, CRL distribution points (v3)"],
            ["CA Signature", "CA's digital signature over all above fields"],
          ],
          [3000, 6360],
        ),
        emptyLine(),
        heading2("Comparison"),
        makeTable(
          ["Feature", "Kerberos", "X.509 / PKI"],
          [
            ["Cryptography", "Symmetric (AES/DES)", "Asymmetric (RSA/ECC)"],
            [
              "Third Party",
              "KDC (Key Distribution Center)",
              "CA (Certificate Authority)",
            ],
            ["Authentication", "Ticket-based", "Certificate-based"],
            [
              "Best For",
              "Internal enterprise networks (AD)",
              "Internet, HTTPS, public services",
            ],
            [
              "Scalability",
              "Limited (requires KDC contact)",
              "High (certificates can be cached)",
            ],
            ["Single Sign-On", "Yes (native)", "Possible with federation"],
          ],
          [2000, 3680, 3680],
        ),
        emptyLine(),
        tip(
          "Kerberos = Windows Active Directory. X.509 = HTTPS/SSL/TLS. These are the two dominant authentication frameworks — exams often ask to compare them or explain how X.509 is used in SSL/TLS.",
        ),
        conclusion(
          "Kerberos is optimal for centralized internal network authentication with SSO. X.509 certificates enable scalable internet-wide authentication through PKI and are the foundation of HTTPS and TLS.",
        ),

        pageBreak(),

        // ====== Q27-31: TLS, SSL, SSL Handshake ======
        heading1(
          "27-31. TLS, SSL, Handshake Protocol, and Digital Certificates",
        ),
        emptyLine(),
        heading2("TLS — Transport Layer Security"),
        makeTable(
          ["Feature", "SSL 3.0", "TLS 1.2", "TLS 1.3 (Current)"],
          [
            ["Released", "1996", "2008", "2018"],
            ["Status", "Deprecated", "Widely supported", "Recommended"],
            ["Key Exchange", "RSA, DH", "RSA, DHE, ECDHE", "ECDHE, DHE only"],
            [
              "Cipher Suites",
              "Weak (RC4, DES)",
              "Many options",
              "Only strong ciphers",
            ],
            ["Handshake RTTs", "2 RTT", "2 RTT", "1 RTT (0-RTT possible)"],
            ["Forward Secrecy", "Optional", "Optional", "Mandatory"],
          ],
          [2200, 2386, 2386, 2388],
        ),
        emptyLine(),
        heading2("TLS Security Objectives"),
        numbered(
          "Confidentiality — Symmetric encryption (AES-GCM) encrypts all application data.",
        ),
        numbered(
          "Authentication — Digital certificates (X.509) verify server (and optionally client) identity.",
        ),
        numbered(
          "Integrity — AEAD modes (GCM) or HMAC provide tamper detection.",
        ),
        numbered(
          "Forward Secrecy — ECDHE ensures past sessions cannot be decrypted if private key is compromised.",
        ),
        emptyLine(),
        heading2("TLS 1.2 Handshake Protocol — Step by Step"),
        makeTable(
          ["Step", "Message", "Content / Purpose"],
          [
            [
              "1",
              "Client Hello",
              "TLS version, cipher suites list, random nonce (Client Random)",
            ],
            ["2", "Server Hello", "Chosen cipher suite, Server Random nonce"],
            [
              "3",
              "Server Certificate",
              "X.509 certificate containing server's public key",
            ],
            [
              "4",
              "Server Hello Done",
              "Server has finished its handshake messages",
            ],
            [
              "5",
              "Client Key Exchange",
              "Pre-master secret encrypted with server's public key (RSA) OR DH public value",
            ],
            [
              "6",
              "Change Cipher Spec",
              "Both parties switch to negotiated cipher suite",
            ],
            [
              "7",
              "Finished",
              "Both verify handshake integrity using MAC of all handshake messages",
            ],
            ["8", "Application Data", "Encrypted communication begins"],
          ],
          [720, 2600, 6040],
        ),
        emptyLine(),
        heading2("Session Key Derivation"),
        para(
          "Master Secret = PRF(pre_master_secret, 'master secret', Client_Random + Server_Random)",
        ),
        para(
          "From Master Secret, separate keys are derived for: Client write key, Server write key, Client MAC key, Server MAC key, IVs.",
        ),
        emptyLine(),
        heading2("Role of Digital Certificates in TLS"),
        bullet("Server sends its X.509 certificate during handshake"),
        bullet("Client verifies certificate chain up to a trusted Root CA"),
        bullet(
          "Certificate contains server's public key — used to encrypt pre-master secret or verify DH signature",
        ),
        bullet(
          "Prevents MITM attacks — attacker cannot forge a valid certificate",
        ),
        emptyLine(),
        tip(
          "TLS 1.3 simplified the handshake to 1 RTT, removed RSA key exchange (keeping only ECDHE/DHE), and removed weak cipher suites. Always mention TLS 1.3 improvements in exam answers about modern TLS.",
        ),
        conclusion(
          "TLS is the cornerstone of internet security. The handshake protocol establishes session keys using asymmetric cryptography, while bulk data is encrypted with symmetric ciphers. Digital certificates provide authentication throughout the process.",
        ),

        pageBreak(),

        // ====== Q32-34: IPSec and VPN ======
        heading1(
          "32-34. IPSec Architecture, AH vs. ESP, and VPN Security Models",
        ),
        emptyLine(),
        heading2("IPSec Architecture"),
        para(
          "IPSec (Internet Protocol Security) is a suite of protocols standardized by IETF that secures IP communications at the network layer (Layer 3). It is the primary protocol for VPN tunnels.",
        ),
        emptyLine(),
        heading2("IPSec Components"),
        makeTable(
          ["Component", "Function"],
          [
            [
              "Authentication Header (AH)",
              "Provides authentication and integrity; does NOT provide encryption",
            ],
            [
              "Encapsulating Security Payload (ESP)",
              "Provides encryption, authentication, and integrity",
            ],
            [
              "Security Association (SA)",
              "One-directional logical connection defining security parameters (algorithm, keys, SPI)",
            ],
            [
              "Internet Key Exchange (IKE/IKEv2)",
              "Negotiates and establishes security associations and keys",
            ],
            [
              "Security Policy Database (SPD)",
              "Defines which traffic requires IPSec and how",
            ],
            [
              "Security Association Database (SAD)",
              "Stores active SAs and their parameters",
            ],
          ],
          [3000, 6360],
        ),
        emptyLine(),
        heading2("AH vs. ESP"),
        makeTable(
          ["Feature", "AH", "ESP"],
          [
            ["Authentication", "Yes", "Yes"],
            ["Data Integrity", "Yes", "Yes"],
            ["Encryption (Confidentiality)", "No", "Yes"],
            [
              "Covers IP Header",
              "Yes (entire packet)",
              "No (payload only; outer header unprotected in tunnel mode)",
            ],
            [
              "NAT Compatible",
              "No (NAT changes IP header, breaks AH)",
              "Yes (ESP over UDP for NAT traversal)",
            ],
            ["Protocol Number", "51", "50"],
            [
              "When to Use",
              "When encryption not needed, header auth required",
              "Most real-world VPN deployments",
            ],
          ],
          [2200, 3580, 3580],
        ),
        emptyLine(),
        heading2("IPSec Modes"),
        makeTable(
          ["Mode", "What is Protected", "Use Case"],
          [
            [
              "Transport Mode",
              "IP payload only; original IP header retained",
              "End-to-end between hosts",
            ],
            [
              "Tunnel Mode",
              "Entire original IP packet; new IP header added",
              "Gateway-to-gateway VPNs",
            ],
          ],
          [2000, 4000, 3360],
        ),
        emptyLine(),
        heading2("VPN Security Model Using IPSec"),
        numbered(
          "User Authentication — IKEv2 authenticates peers using certificates or pre-shared keys.",
        ),
        numbered(
          "SA Negotiation — IKE Phase 1 establishes ISAKMP SA; Phase 2 establishes IPSec SA.",
        ),
        numbered(
          "Key Exchange — Diffie-Hellman generates shared keying material.",
        ),
        numbered(
          "Tunnel Establishment — ESP tunnel mode encapsulates all traffic.",
        ),
        numbered(
          "Data Transfer — All packets encrypted with AES; integrity protected with HMAC-SHA256.",
        ),
        emptyLine(),
        heading2("TLS vs. IPSec VPN Comparison"),
        makeTable(
          ["Feature", "IPSec VPN", "TLS/SSL VPN"],
          [
            [
              "OSI Layer",
              "Layer 3 (Network)",
              "Layer 4-7 (Transport/Application)",
            ],
            ["Protocols Supported", "All IP protocols", "TCP/UDP applications"],
            [
              "Client Requirement",
              "IPSec client software",
              "Web browser or lightweight client",
            ],
            [
              "Firewall Compatibility",
              "May require special NAT traversal",
              "Works through most firewalls (port 443)",
            ],
            [
              "Use Case",
              "Site-to-site, remote access",
              "Remote web access, clientless VPN",
            ],
          ],
          [2200, 3580, 3580],
        ),
        emptyLine(),
        tip(
          "Key exam points: AH = no encryption. ESP = encryption + authentication. ESP is preferred. Tunnel mode wraps the entire packet. Transport mode only wraps the payload. IPSec VPNs use IKE for key exchange.",
        ),
        conclusion(
          "IPSec provides network-layer security through AH and ESP protocols. ESP in tunnel mode is the standard for VPN deployments, providing confidentiality, authentication, and integrity for all IP traffic traversing untrusted networks.",
        ),

        pageBreak(),

        // ====== Q40-42: Malware and Security Framework ======
        heading1(
          "40-42. Software Vulnerabilities, Malware Types, and Multi-Layered Security",
        ),
        emptyLine(),
        heading2("Software Vulnerabilities"),
        makeTable(
          ["Vulnerability", "Description", "Example Attack"],
          [
            [
              "Buffer Overflow",
              "Writing beyond allocated memory boundaries; can overwrite return addresses to execute arbitrary code",
              "Stack smashing, ROP chains",
            ],
            [
              "SQL Injection",
              "Inserting SQL code into input fields to manipulate database queries",
              "' OR 1=1 -- ; DROP TABLE",
            ],
            [
              "Cross-Site Scripting (XSS)",
              "Injecting malicious scripts into web pages viewed by other users",
              "Stored XSS stealing session cookies",
            ],
            [
              "Cross-Site Request Forgery",
              "Tricking browser into making unauthorized requests on behalf of authenticated user",
              "Fake image tag triggering bank transfer",
            ],
            [
              "Weak Authentication",
              "Insufficient password policies, missing MFA, default credentials",
              "Credential stuffing attacks",
            ],
            [
              "Race Conditions",
              "Exploiting timing gaps between security checks and resource access",
              "TOCTOU attacks",
            ],
            [
              "Insecure Deserialization",
              "Executing code embedded in serialized data objects",
              "Remote code execution",
            ],
          ],
          [2400, 4000, 2960],
        ),
        emptyLine(),
        heading2("Malware Types — Comparison"),
        makeTable(
          ["Feature", "Virus", "Worm", "Trojan Horse"],
          [
            [
              "Definition",
              "Attaches to files; executes when infected file runs",
              "Self-replicating; spreads without user action",
              "Disguised as legitimate software",
            ],
            ["Self-Replication", "No (needs host)", "Yes (autonomous)", "No"],
            ["Requires Host File", "Yes", "No", "No"],
            [
              "Spreads Via",
              "File sharing, email attachments",
              "Network connections, USB",
              "Downloads, email attachments",
            ],
            [
              "Primary Damage",
              "File corruption, data deletion",
              "Network congestion, DoS",
              "Backdoors, data theft, remote access",
            ],
            [
              "Detection Difficulty",
              "Medium",
              "Low (network visible)",
              "High (appears legitimate)",
            ],
            [
              "Example",
              "CIH (Chernobyl), ILOVEYOU",
              "Conficker, Blaster, Code Red",
              "Back Orifice, Zeus Banking Trojan",
            ],
          ],
          [2000, 2453, 2453, 2454],
        ),
        emptyLine(),
        heading2("Additional Malware Types"),
        bullet(
          "Ransomware — Encrypts victim's files and demands payment for decryption key (e.g., WannaCry, NotPetya)",
        ),
        bullet(
          "Rootkit — Hides malware presence by modifying OS; operates at kernel level",
        ),
        bullet(
          "Spyware — Secretly monitors user activity and exfiltrates data",
        ),
        bullet(
          "Adware — Displays unwanted advertisements; often bundles with spyware",
        ),
        bullet(
          "Keylogger — Records all keystrokes to capture passwords and sensitive data",
        ),
        emptyLine(),
        heading2("Multi-Layered Security Framework (Defence in Depth)"),
        para(
          "A multi-layered (defence-in-depth) approach ensures that if one security control fails, others continue to protect the system.",
        ),
        emptyLine(),
        makeTable(
          ["Layer", "Mechanism", "Protects Against"],
          [
            [
              "Perimeter",
              "Firewall, DMZ, IDS/IPS",
              "Unauthorized network access, external attacks",
            ],
            [
              "Network",
              "VPN, IPSec, network segmentation",
              "Eavesdropping, MITM, lateral movement",
            ],
            [
              "Host",
              "Antivirus, host firewall, patch management",
              "Malware, exploits, vulnerability exploitation",
            ],
            [
              "Application",
              "Input validation, WAF, secure coding, TLS",
              "SQL injection, XSS, CSRF, insecure protocols",
            ],
            [
              "Data",
              "Encryption (AES), access control, DLP",
              "Unauthorized data access, exfiltration",
            ],
            [
              "Identity",
              "MFA, strong passwords, least privilege",
              "Credential theft, privilege escalation",
            ],
            [
              "Monitoring",
              "SIEM, log management, SOC",
              "Attack detection and incident response",
            ],
          ],
          [1500, 2760, 5100],
        ),
        emptyLine(),
        tip(
          "'Defence in Depth' is a key exam concept. The principle: no single control is perfect, so multiple overlapping controls ensure that a breach of one layer does not compromise the entire system.",
        ),
        conclusion(
          "Software vulnerabilities, malware, and network attacks require a comprehensive multi-layered security framework. Combining perimeter defences, encryption, authentication, and continuous monitoring addresses the full spectrum of modern cyber threats.",
        ),

        pageBreak(),

        // ====== QUICK REFERENCE SUMMARY ======
        heading1("Quick Reference — Exam Formula Sheet"),
        emptyLine(),
        heading2("Cipher Formulas"),
        makeTable(
          ["Cipher/Algorithm", "Formula", "Notes"],
          [
            [
              "Caesar Cipher",
              "C = (P + K) mod 26; P = (C - K + 26) mod 26",
              "K = shift value",
            ],
            [
              "Vigenere Cipher",
              "C_i = (P_i + K_i) mod 26",
              "K repeats to match message length",
            ],
            [
              "RSA Encryption",
              "C = M^e mod n",
              "Use recipient's public key (e, n)",
            ],
            ["RSA Decryption", "M = C^d mod n", "Use your private key (d, n)"],
            [
              "RSA Key Gen",
              "n=pq; φ(n)=(p-1)(q-1); e*d≡1 mod φ(n)",
              "p,q = large primes",
            ],
            [
              "DH Key Exchange",
              "K = g^(ab) mod p; Alice: K=B^a; Bob: K=A^b",
              "Security: discrete log problem",
            ],
            [
              "DES Round",
              "L_i = R_(i-1); R_i = L_(i-1) ⊕ f(R_(i-1), K_i)",
              "16 rounds total",
            ],
            [
              "CBC Mode",
              "C_i = E_K[P_i ⊕ C_(i-1)]; P_i = D_K[C_i] ⊕ C_(i-1)",
              "C_0 = IV",
            ],
            [
              "HMAC",
              "HMAC(K,M) = H[(K⊕opad) || H[(K⊕ipad)||M]]",
              "Provides auth + integrity",
            ],
            [
              "Digital Signature",
              "S = E_PR[H(M)]; Verify: E_PU[S] == H(M)",
              "Signs hash, not message",
            ],
          ],
          [2600, 3800, 2960],
        ),
        emptyLine(),
        heading2("Key Numbers to Remember"),
        makeTable(
          ["Algorithm", "Block Size", "Key Size", "Rounds"],
          [
            ["DES", "64 bits", "56 bits (64 with parity)", "16"],
            ["3DES", "64 bits", "112/168 bits effective", "48 (16×3)"],
            ["AES-128", "128 bits", "128 bits", "10"],
            ["AES-192", "128 bits", "192 bits", "12"],
            ["AES-256", "128 bits", "256 bits", "14"],
            ["RSA", "Variable", "2048+ bits recommended", "N/A"],
            ["SHA-1", "N/A (hash)", "160-bit digest", "80"],
            ["SHA-256", "N/A (hash)", "256-bit digest", "64"],
            ["MD5", "N/A (hash)", "128-bit digest (broken)", "64"],
          ],
          [2340, 2340, 2340, 2340],
        ),
      ],
    },
  ],
});

Packer.toBuffer(doc)
  .then((buffer) => {
    fs.writeFileSync("K:\Projects\Resume Curator", buffer);
    console.log("Document created successfully.");
  })
  .catch((err) => console.error("Error:", err));
