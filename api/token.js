import fetch from "node-fetch";

/**
 * POST /api/token
 * Body: grant_type, code, redirect_uri, code_verifier
 * 返り値: Canvaの /oauth/token のレスポンスをそのまま返す(JSON/ステータス)
 */
export default async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { grant_type, code, redirect_uri, code_verifier } = req.body || {};
  if (!grant_type || !code || !redirect_uri || !code_verifier) {
    return res.status(400).json({ error: "missing parameters" });
  }

  const basic = Buffer.from(
    `${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`
  ).toString("base64");

  const form = new URLSearchParams({
    grant_type,
    code,
    redirect_uri,
    code_verifier
  });

  const r = await fetch("https://www.canva.com/api/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      // ブラウザっぽいUA/参照元（保険）
      "User-Agent": "Mozilla/5.0",
      Origin: "https://www.canva.com",
      Referer: "https://www.canva.com/"
    },
    body: form
  });

  const text = await r.text();
  // Canvaのステータス/本文をそのまま返す
  res.status(r.status).type("application/json").send(text);
};
