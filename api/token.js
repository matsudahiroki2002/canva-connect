// api/token.js
import fetch from "node-fetch";

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8") || "";
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.includes("application/json")) { try { return JSON.parse(raw || "{}"); } catch { return {}; } }
  if (ct.includes("application/x-www-form-urlencoded")) {
    const obj = {}; for (const [k,v] of new URLSearchParams(raw)) obj[k]=v; return obj;
  }
  return {};
}

export default async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error:{code:"405", message:"Method Not Allowed"} });

    const { CANVA_CLIENT_ID, CANVA_CLIENT_SECRET } = process.env;
    if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) {
      return res.status(500).json({ error:{code:"500", message:"Missing env: CANVA_CLIENT_ID/SECRET"} });
    }

    const body = await readBody(req);
    const { grant_type, code, redirect_uri, code_verifier } = body || {};
    if (!grant_type || !code || !redirect_uri || !code_verifier) {
      return res.status(400).json({ error:{code:"400", message:"missing parameters", got: body} });
    }

    const basic = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString("base64");
    const form = new URLSearchParams({ grant_type, code, redirect_uri, code_verifier });

    const r = await fetch("https://www.canva.com/api/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        Origin: "https://www.canva.com",
        Referer: "https://www.canva.com/"
      },
      body: form,
    });

    const text = await r.text();
    console.log("Canva /oauth/token ->", r.status, text.slice(0, 500)); // ★本文先頭をログ
    res.status(r.status).type("application/json").send(text);            // ★そのまま透過
  } catch (e) {
    console.error("Proxy fatal:", e);
    res.status(500).json({ error:{code:"500", message:"proxy exception", detail:String(e)} });
  }
};
