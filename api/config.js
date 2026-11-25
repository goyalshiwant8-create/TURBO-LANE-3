export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return res.status(500).json({ success: false, message: "Missing WEB3FORMS_ACCESS_KEY" });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ accessKey });
}
