# How to Upload this Project to GitHub

Follow these steps to upload your project to a new GitHub repository:

### Step 1: Create a Repository on GitHub
1. Sign in to your GitHub account (or your friend's account) at [github.com](https://github.com).
2. Click the **+** icon in the top right and select **New repository**.
3. Give it a name (e.g., `excel-dashboard`).
4. Keep it **Public** or **Private** as desired.
5. Do NOT initialize with a README (we already have one).
6. Click **Create repository**.
7. Copy the **HTTPS** URL (it looks like `https://github.com/username/repo.git`).

### Step 2: Link the Local Project to GitHub
Open your terminal in this project folder and run:
```bash
git remote add origin YOUR_COPIED_URL
```
*(Replace `YOUR_COPIED_URL` with the one you copied in Step 1)*

### Step 3: Push the Code
Run this command to upload your files:
```bash
git push -u origin master
```

### Important: Authentication
When you run `git push`, you will need:
- **Username**: Your GitHub username.
- **Password**: You MUST use a **Personal Access Token (PAT)** instead of your account password.
- **To create a token**: 
  - Go to **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
  - Generate a new token with at least the `repo` permission.
  - Copy and save this token somewhere safe! It is your "password" for the terminal.

---

### Tips
- If you want to update the project later, just run:
  ```bash
  git add .
  git commit -m "Your update message"
  git push
  ```
- **.gitignore**: I have already added a `.gitignore` file to ensure that your local database (`data.json`) and temporary uploads do not get uploaded to GitHub.
