import { randomBytes, scryptSync } from "node:crypto";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";
import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";

loadEnvConfig(process.cwd());

function ask(question) {
  const readline = createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => readline.question(question, (answer) => {
    readline.close();
    resolve(answer.trim());
  }));
}

function askHidden(question) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("شغّل الأمر من نافذة طرفية تفاعلية لإدخال كلمة السر بأمان.");
  }

  stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  return new Promise((resolve, reject) => {
    let password = "";
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("تم إلغاء العملية."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          stdout.write("\n");
          resolve(password);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (password.length) {
            password = password.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        if (character >= " ") {
          password += character;
          stdout.write("*");
        }
      }
    };
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };
    stdin.on("data", onData);
  });
}

try {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL مش متظبط في .env.local.");
  const email = (await ask("البريد الإلكتروني: ")).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("البريد الإلكتروني غير صالح.");
  }
  const password = await askHidden("كلمة السر (12 حرفًا على الأقل): ");
  if (password.length < 12) throw new Error("كلمة السر لازم تكون 12 حرفًا على الأقل.");

  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  const passwordHash = `${salt.toString("base64url")}.${hash.toString("base64url")}`;
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`
    INSERT INTO user_accounts (email, password_hash)
    VALUES (${email}, ${passwordHash})
    ON CONFLICT (email) DO NOTHING
    RETURNING id
  `;
  if (!rows.length) throw new Error("يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.");
  console.log(`تم إنشاء الحساب: ${email}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
