export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: { code: "405", message: "Method Not Allowed" } }),
        { status: 405, headers: { "content-type": "application/json" } }
      );
    }

    const id = process.env.CANVA_CLIENT_ID;
    const secret = process.env.CANVA_CLIENT_SECRET;
    if (!id || !secret) {
      return new Response(
        JSON.stringify({ error: { code: "500", message: "Missing env: CANVA_CLIENT_ID/SECRET" } }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { grant_type, code, redirect_uri, code_verifier } = body || {};
    if (!grant_type || !code || !redirect_uri || !code_verifier) {
      return new Response(
        JSON.stringify({ error: { code: "400", message: "missing parameters", got: body } }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const basic = btoa(`${id}:${secret}`);

    const form = new URLSearchParams({
      grant_type,
      code,
      redirect_uri,
      code_verifier
    });

    const r = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        Origin: "https://www.canva.com",
        Referer: "https://www.canva.com/"
      },
      body: form
    });

    const text = await r.text();
    console.log("Canva /oauth/token ->", r.status, text.slice(0, 200));

    return new Response(text, {
      status: r.status,
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    console.error("proxy exception:", e);
    return new Response(
      JSON.stringify({ error: { code: "500", message: "proxy exception", detail: String(e) } }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
