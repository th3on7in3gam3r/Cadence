# How to post content from Cadence

This guide covers getting a **blog post** from Cadence onto **WordPress**. That’s the most common “how do I publish?” question.

Social posts and emails are usually copied into Kerygma, Mailchimp, Kit, or your scheduler — not “posted” from Cadence directly.

---

## Blog post → WordPress (recommended path)

### What you’ll need

- A finished **Blog post** in Campaign Studio
- Access to your WordPress admin (`yoursite.com/wp-admin`)
- Optional: a **Kit** signup URL in **Settings → General** (adds a Subscribe button to blog exports only)

---

## Method A — Copy & paste (works on all plans)

Best if you host WordPress yourself or use WordPress.com and prefer manual control.

### 1. Generate the blog in Cadence

1. **Dashboard** → **Blog post** → **Generate**
2. Wait for Campaign Studio to open with your draft
3. Read and edit the copy in the editor
4. Optional: click **Generate image** for a hero image, then **Download image**

### 2. Copy WordPress HTML

1. In Campaign Studio, click **Copy WordPress HTML** (top toolbar)
2. Cadence copies Gutenberg-ready block markup to your clipboard
3. If you generated an image, it also **downloads** the hero file (e.g. `blog_post-hero.png`)

### 3. Paste into WordPress

1. Open WordPress → **Posts** → **Add New**
2. Switch the editor to **Code editor** (⋮ menu → Code editor, or `/code` block)
3. **Paste** the HTML from Cadence
4. Switch back to **Visual editor** to preview

### 4. Set the featured image

Generated images are **not** embedded in the HTML (WordPress needs them in the Media Library).

1. **Media** → **Add New** → upload the downloaded hero PNG
2. In the post sidebar → **Featured image** → select that upload
3. Cadence may include a green reminder block in the paste — delete it before publishing if you want

### 5. SEO fields

Cadence may include a **SEO reference** section at the bottom of the paste:

- Meta description
- Suggested slug
- Focus keyword hints

Copy those into **Yoast**, **Rank Math**, or WordPress **Excerpt** / permalink, then delete the reference section before going live.

### 6. Publish

1. Set status to **Publish** (or **Schedule**)
2. Preview on mobile
3. Publish

---

## Method B — Direct publish (cloud + WordPress connected)

Best if you’ve connected self-hosted WordPress in Cadence.

### 1. Connect WordPress once

1. Sign in to Cadence (cloud)
2. **Settings** → **Integrations**
3. **WordPress (Self-Hosted)** → enter:
   - Site URL (`https://yoursite.com`)
   - WordPress username
   - Application password (from WP Users → Profile → Application Passwords)
4. Click **Connect WordPress**

### 2. Approve, then publish

1. Generate and edit your blog in Campaign Studio
2. Open the **approval** control and set status to **Approved**
3. Click **Save draft** to push a WordPress draft, or **Publish** to go live

> **Note:** Live publish requires **Approved** status. Drafts can be saved without it.

---

## Subscribe button on blog posts

Only **blog post** exports include a Subscribe CTA (not SEO playbooks or social posts).

1. **Settings** → **General**
2. Paste your **Kit** (ConvertKit) form or landing page URL
3. Regenerate or re-export the blog with **Copy WordPress HTML**

The export adds a styled Subscribe block that links to your Kit URL.

---

## Other content types

| Content type | How to “post” |
|--------------|----------------|
| **Social posts** | Copy from studio → paste into Kerygma Social, Buffer, or native apps |
| **Email series** | Copy into Kit, Mailchimp, etc. |
| **Lead magnet** | Use copy on a landing page or PDF; link from your site |
| **Keywords** | Reference while writing; paste into SEO plugin or content brief |
| **SEO playbook** | Internal strategy doc — use **Share** or export PDF, not WordPress HTML |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Paste looks like raw HTML in WordPress | Use **Code editor**, not a single Custom HTML block in visual mode |
| No featured image on the live post | Download from Cadence → upload to Media Library → set Featured image |
| No Subscribe button | Must be a **blog post** export + Kit URL in Settings → General |
| “Sign in and connect WordPress” | Method B only — use Method A, or connect in Settings → Integrations |
| Publish button greyed out | Set approval to **Approved** first |
| Wrong brand’s content after switching sites | Use the **brand dropdown** (top right); each site saves separately — wait for cloud sync before switching |

---

## Checklist before you hit Publish

- [ ] Proofread in Campaign Studio
- [ ] Copied WordPress HTML or connected publish succeeded
- [ ] Featured image uploaded and set
- [ ] Meta description / slug set in SEO plugin
- [ ] Removed Cadence helper blocks (hero reminder, SEO reference) if you don’t want them visible
- [ ] Preview on phone
- [ ] Publish or schedule

---

## Related guides

- [Getting started](./GETTING_STARTED.md)
- [Site map](./SITE_MAP.md)
