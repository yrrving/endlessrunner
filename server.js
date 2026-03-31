require("dotenv").config({ quiet: true });

const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");
const path = require("path");
const { Resend } = require("resend");

const app = express();
const port = Number(process.env.PORT || 3000);
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");
const scoreFile = path.join(dataDir, "scores.json");
const submissionsDir = path.join(dataDir, "submissions");

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(submissionsDir, { recursive: true });

if (!fs.existsSync(scoreFile)) {
  fs.writeFileSync(scoreFile, "[]\n", "utf8");
}

app.use(
  express.json({
    limit: "15mb",
  }),
);
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "endlessrunner",
  });
});

function readScores() {
  try {
    const raw = fs.readFileSync(scoreFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read scores:", error);
    return [];
  }
}

function writeScores(scores) {
  fs.writeFileSync(scoreFile, `${JSON.stringify(scores, null, 2)}\n`, "utf8");
}

function getTopScores(limit = 20) {
  return readScores()
    .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt))
    .slice(0, limit);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function createMailer() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpService = process.env.SMTP_SERVICE;
  const smtpHost = process.env.SMTP_HOST;

  if (smtpUser && smtpPass) {
    if (smtpService === "gmail") {
      return {
        mode: "smtp",
        client: nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        }),
      };
    }

    if (!smtpHost) {
      throw new Error("SMTP_HOST saknas i .env nar egen SMTP-server anvands.");
    }

    return {
      mode: "smtp",
      client: nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      }),
    };
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Varken SMTP eller RESEND_API_KEY ar konfigurerat.");
  }

  return {
    mode: "resend",
    client: new Resend(apiKey),
  };
}

function sanitizeFileName(value) {
  return String(value || "spelare")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function dataUrlToPngBuffer(dataUrl) {
  const matches = /^data:image\/png;base64,(.+)$/.exec(dataUrl || "");

  if (!matches) {
    throw new Error("Bildformatet kunde inte tolkas.");
  }

  return Buffer.from(matches[1], "base64");
}

function validateMailConfig() {
  if (!process.env.MAIL_FROM) {
    throw new Error("MAIL_FROM saknas. Ange en verifierad avsandaradress i .env.");
  }
}

async function sendScoreEmail(entry) {
  validateMailConfig();

  const mailer = createMailer();
  const recipient = process.env.MAIL_TO || "accounts@trainstation.se";
  const pngBuffer = dataUrlToPngBuffer(entry.photoDataUrl);
  const fileName = `monterspel_${sanitizeFileName(entry.name)}_${Date.now()}.png`;
  const subjectTag = process.env.GAME_MAIL_TAG || "[ENDLESSRUNNER][ARSMOTE 2026]";
  const from = process.env.MAIL_FROM;
  const subject = `${subjectTag} ${entry.name} (${entry.score} poang)`;
  const text = [
    "Ny spelare inskickad fran endlessrunner-spelet.",
    "",
    `Namn: ${entry.name}`,
    `E-post: ${entry.email}`,
    `Poang: ${entry.score}`,
    `Tid: ${entry.createdAt}`,
  ].join("\n");

  if (mailer.mode === "smtp") {
    await mailer.client.sendMail({
      from,
      to: recipient,
      replyTo: entry.email,
      subject,
      text,
      attachments: [
        {
          filename: fileName,
          content: pngBuffer,
          contentType: "image/png",
        },
      ],
    });
  } else {
    await mailer.client.emails.send({
      from,
      to: recipient,
      replyTo: entry.email,
      subject,
      text,
      attachments: [
        {
          filename: fileName,
          content: pngBuffer.toString("base64"),
          contentType: "image/png",
        },
      ],
    });
  }

  fs.writeFileSync(path.join(submissionsDir, fileName), pngBuffer);

  return {
    delivered: true,
    fileName,
  };
}

app.get("/api/mail-health", (_req, res) => {
  res.json({
    configured: Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM),
    mailFrom: process.env.MAIL_FROM || null,
    mailTo: process.env.MAIL_TO || "nicklas@trainstation.se",
  });
});

app.get("/api/scores", (_req, res) => {
  res.json({
    scores: getTopScores(),
  });
});

app.post("/api/scores/reset", (_req, res) => {
  writeScores([]);

  return res.json({
    ok: true,
    scores: [],
  });
});

app.post("/api/submit", async (req, res) => {
  const { name, email, score, photoDataUrl } = req.body || {};

  if (!name || !email || typeof score !== "number" || !photoDataUrl) {
    return res.status(400).json({
      error: "Missing required fields.",
    });
  }

  if (!isValidEmail(email || "")) {
    return res.status(400).json({
      error: "Ogiltig e-postadress.",
    });
  }

  const entry = {
    id: crypto.randomUUID(),
    name: String(name).trim().slice(0, 60),
    email: String(email).trim().slice(0, 120),
    score: Math.max(0, Math.round(score)),
    photoDataUrl,
    createdAt: new Date().toISOString(),
  };

  const scores = readScores();
  scores.push(entry);
  writeScores(scores);

  let emailStatus = {
    delivered: false,
    reason: "Not attempted",
  };

  try {
    emailStatus = await sendScoreEmail(entry);
  } catch (error) {
    console.error("Email delivery failed:", error);
    emailStatus = {
      delivered: false,
      reason: error.message,
    };
  }

  return res.json({
    ok: true,
    entry: {
      id: entry.id,
      name: entry.name,
      score: entry.score,
      createdAt: entry.createdAt,
    },
    emailStatus,
  });
});

app.get("/tv", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "tv.html"));
});

app.listen(port, () => {
  console.log(`Monterspel igang pa http://localhost:${port}`);
});
