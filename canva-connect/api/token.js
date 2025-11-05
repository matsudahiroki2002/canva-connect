// api/token.js
export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error:{ code:"405", message:"Method Not Allowed" } }),
        { status:405, headers:{ "content-type":"application/json" } });
    }

    const id     = process.env.CANVA_CLIENT_ID;
    const secret = process.env.CANVA_CLIENT_SECRET;  // Public なら空でOK
    const mode   = (process.env.CANVA_APP_TYPE || "").toLowerCase(); // "public" or "confidential"
    if (!id) {
      return new Response(JSON.stringify({ error:{ code:"500", message:"Missing env: CANVA_CLIENT_ID" } }),
        { status:500, headers:{ "content-type":"application/json" } });
    }

    let body; try { body = await req.json(); } catch { body = {}; }
    const { grant_type, code, redirect_uri, code_verifier } = body || {};
    if (!grant_type || !code || !redirect_uri) {
      return new Response(JSON.stringify({ error:{ code:"400", message:"missing parameters", got: body } }),
        { status:400, headers:{ "content-type":"application/json" } });
    }

    // ✅ 正しいトークンエンドポイント
    const endpoint = "https://api.canva.com/rest/v1/oauth/token";

    // Public/Confidential を自動判定（環境変数で上書き可）
    const isPublic = (mode === "public") || (!mode && !secret);

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (!isPublic) {
      const basic = btoa(`${id}:${secret}`);
      headers.Authorization = `Basic ${basic}`;
    }

    const form = new URLSearchParams({
      grant_type,
      code,
      redirect_uri,
      // Public+PKCE では client_id と code_verifier を送る
      ...(isPublic ? { client_id: id, code_verifier: code_verifier || "" }
                   : { code_verifier: code_verifier || "" })
    });

    const r = await fetch(endpoint, { method: "POST", headers, body: form });
    const text = await r.text();

    const debug = {
      upstream: { url: endpoint, status: r.status, mode: isPublic ? "public" : "confidential" },
      sent: {
        hasAuthHeader: !!headers.Authorization,
        has_code: !!code, has_verifier: !!code_verifier, grant_type, redirect_uri
      }
    };

    try {
      const json = JSON.parse(text);
      return new Response(JSON.stringify({ debug, ...json }), { status: r.status, headers: { "content-type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ debug, raw: text.slice(0, 400) }), { status: r.status, headers: { "content-type": "application/json" } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error:{ code:"500", message:"proxy exception", detail:String(e) } }),
      { status:500, headers:{ "content-type":"application/json" } });
  }
}