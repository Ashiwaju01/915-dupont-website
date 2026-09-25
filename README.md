# 915 Dupont — Website Project

This is your website, structured the way real web projects are organized.

## What's in here

```
915-dupont-website/
├── index.html      ← the page content & structure (HTML)
├── css/
│   └── style.css   ← all the styling — colors, fonts, layout (CSS)
├── js/
│   └── script.js   ← all the interactivity — cart, tabs, forms (JavaScript)
├── images/          ← every photo used on the site
└── README.md        ← this file
```

## Why split into separate files?

Earlier versions of this site had everything — HTML, CSS, JavaScript, and
even the images — crammed into one giant `index.html` file. That was useful
for a quick preview, but it's not how real websites are built, for a few
reasons:

- **Readability** — a 3,000-line file is hard for a human (or another
  developer) to navigate. Separate files mean each one has a single job.
- **Caching** — browsers can cache `style.css` and `script.js` separately
  from the page, so repeat visits load faster.
- **Collaboration** — if someone else works on your styling, they only need
  `style.css`, not the whole page.
- **Version control** — tools like Git (which we'll set up next) show you
  exactly *what* changed and *where* — much easier across multiple files
  than one massive one.

## How the three files talk to each other

Open `index.html` and look near the top and bottom:

```html
<link rel="stylesheet" href="css/style.css">   <!-- loads the styling -->
...
<script src="js/script.js"></script>            <!-- loads the interactivity -->
```

That's the entire connection. The browser reads `index.html` top to bottom,
and whenever it hits one of those two lines, it goes and fetches the linked
file.

## Opening this in VS Code

1. Open VS Code.
2. `File → Open Folder…` and select this `915-dupont-website` folder
   (not just the HTML file — the whole folder, so VS Code can see the
   `css/`, `js/`, and `images/` folders too).
3. You should see the file tree on the left with `index.html`, `css/`,
   `js/`, `images/`, and this `README.md`.

Next step: install the **Live Server** extension so you can preview the
site properly instead of double-clicking the HTML file.
