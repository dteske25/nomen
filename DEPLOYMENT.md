# Deployment Guide: Cloudflare Workers + D1

This guide documents how to deploy the "Nomen" baby name picker to Cloudflare using the Cloudflare Dashboard's Git Integration.

## Prerequisites

1.  **Cloudflare Account**: You must have an active account.
2.  **GitHub Repository**: Ensure your code is pushed to GitHub.
3.  **Wrangler CLI** (Optional but recommended for migrations): Installed via `npm install -g wrangler` or run with `npx`.

---

## Step 1: Create the D1 Database

Before capturing the configuration in code, creating the database resources is necessary:

1.  Log in to the **Cloudflare Dashboard**.
2.  Navigate to **Workers & Pages** > **D1**.
3.  Click **Create Database**.
4.  Name it `baby-names-db`.
5.  Click **Create**.
6.  **Copy the Database ID** shown in the dashboard (it looks like a UUID, e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

## Step 2: Update Project Configuration

1.  Open `wrangler.toml` in your local project.
2.  Replace the placeholder `database_id` with the real ID you just copied:

    ```toml
    [[d1_databases]]
    binding = "DB"
    database_name = "baby-names-db"
    database_id = "YOUR-REAL-DATABASE-ID-HERE"
    migrations_dir = "drizzle"
    ```

3.  **Commit and Push** this change to GitHub.

---

## Step 3: Connect Git Repository

1.  Go to **Workers & Pages** > **Overview** in the Cloudflare Dashboard.
2.  Click **Create Application** > **Connect to Git**.
3.  Select your GitHub repository (`nomen`).
4.  **Configure the build**:
    - **Project Name**: `nomen` (or your preference).
    - **Production Branch**: `main`.
    - **Framework Preset**: `None` (Custom).
    - **Build Command**: `npm run build`
      - _Note_: This runs `tsc -b && vite build` as defined in package.json.
    - **Build Output Directory**: `dist`
      - _Note_: Important for serving the static assets.
5.  Click **Save and Deploy**.

_The initial deployment might pass the build but fail at runtime or have DB errors because we haven't set secrets or migrations yet. This is expected._

---

## Step 4: Configure Secrets & Variables

1.  In your new Cloudflare Project, go to **Settings** > **Variables and Secrets**.
2.  Add the following **Environment Secret**:
    - **Variable name**: `GOOGLE_API_KEY`
    - **Value**: Your Google GenAI API Key.
    - Click **Encrypt**.

_Note: The `DB` binding is automatically handled because it is defined in `wrangler.toml`, which Cloudflare reads during the build._

---

## Step 5: Database Migrations

Cloudflare's automatic build process does **not** automatically run database migrations (to prevent accidental data loss). You must run them manually from your local machine once.

1.  Open your local terminal.
2.  Login to Cloudflare if you haven't already:
    ```sh
    npx wrangler login
    ```
3.  Apply the migrations to the remote production database:
    ```sh
    npx wrangler d1 migrations apply baby-names-db --remote
    ```

    - Confirm `Yes` when prompted.

---

## Step 6: Custom Domain

1.  In the Cloudflare Project, go to **Settings** > **Triggers**.
2.  Under **Custom Domains**, click **Add Custom Domain**.
3.  Enter `nomen.dteske.dev`.
4.  Click **Add Custom Domain**.
    - Cloudflare will automatically handle the DNS records if your domain `dteske.dev` is managed by Cloudflare.
    - Verify the SSL certificate initializes (may take a few minutes).

---

## Verification

1.  Visit `https://nomen.dteske.dev`.
2.  Verify the app loads (Static Assets working).
3.  Test adding a name (switches to Backend/DB working).
4.  Test Generating Alternatives (AI/Secrets working).
