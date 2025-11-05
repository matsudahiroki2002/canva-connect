export const config = { runtime: "edge" };

export default async function handler() {
  const hasID = !!process.env.CANVA_CLIENT_ID;
  const hasSecret = !!process.env.CANVA_CLIENT_SECRET;
  const ok = hasID && hasSecret;

  return new Response(
    JSON.stringify({ ok, hasID, hasSecret }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
