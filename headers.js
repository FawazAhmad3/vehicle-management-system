// headers.js - Security headers for Netlify
function addSecurityHeaders() {
  // Meta tags for additional security
  const metaTags = [
    {
      name: "viewport",
      content:
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    },
    {
      "http-equiv": "Content-Security-Policy",
      content:
        "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self';",
    },
    {
      "http-equiv": "X-Content-Type-Options",
      content: "nosniff",
    },
    {
      "http-equiv": "X-Frame-Options",
      content: "DENY",
    },
    {
      "http-equiv": "X-XSS-Protection",
      content: "1; mode=block",
    },
    {
      name: "referrer",
      content: "strict-origin-when-cross-origin",
    },
  ];

  // Add meta tags to head
  metaTags.forEach((tag) => {
    const meta = document.createElement("meta");
    Object.keys(tag).forEach((key) => {
      meta.setAttribute(key, tag[key]);
    });
    document.head.appendChild(meta);
  });
}

// Call when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addSecurityHeaders);
} else {
  addSecurityHeaders();
}
