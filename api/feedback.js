export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return res.status(500).json({ success: false, message: "Missing WEB3FORMS_ACCESS_KEY" });
  }

  const { category = "bug", mode = "", road = "", contact = "Anonymous", message = "", viewport = "" } = req.body || {};
  if (!String(message).trim()) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  try {
    const upstream = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `[Turbo Lane 3] ${String(category).toUpperCase()} (${mode} - ${road})`,
        from_name: contact,
        category,
        mode,
        road,
        viewport,
        message,
      }),
    });
    const data = await upstream.json();
    return res.status(upstream.ok && data.success ? 200 : 502).json({ success: Boolean(upstream.ok && data.success) });
  } catch {
    return res.status(502).json({ success: false, message: "Failed to reach email service" });
  }
}
