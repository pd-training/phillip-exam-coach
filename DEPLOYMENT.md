# Finance Ready (Phillip Exam Coach): deployment guide

A Next.js 14 web app for CMFAS exam practice. Students practise questions, sit exam simulations and see AI study advice. Admins manage papers, questions, users and access.

## 1. What you are deploying

| Part | Technology |
|---|---|
| Web app and API | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Login | NextAuth (credentials, email and password) |
| Database | PostgreSQL, accessed through Prisma 5 |
| AI study advice | Amazon Bedrock (Amazon Nova Lite), called over HTTPS |
| Hosting used so far | AWS Amplify Hosting (Next.js SSR) with Amazon RDS for PostgreSQL |

Source code lives in the repository. Build output and `node_modules` are not included.

## 2. Requirements

- Node.js 18 or newer, and npm.
- A PostgreSQL 14 or newer database (Amazon RDS is what we use).
- An AWS account with Amazon Bedrock access in the region you choose, if you want AI features.

## 3. Environment variables

Set these in your hosting platform. Never commit real values to the repository. For local development, create a `.env` file (it is git-ignored) based on `.env.example`.

| Name | Required | Example | Purpose |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://USER:PASSWORD@HOST:5432/DATABASE` | Database connection |
| `NEXTAUTH_SECRET` | Yes | a long random string | Signs login sessions. Generate with `openssl rand -hex 32` |
| `NEXTAUTH_URL` | Yes | `https://your-domain` | The public address of the site |
| `BEDROCK_API_KEY` | For AI features | Bedrock API key | Bearer token for Bedrock |
| `BEDROCK_REGION` | For AI features | `ap-southeast-2` | Region where Bedrock is enabled |
| `BEDROCK_MODEL_ID` | For AI features | `amazon.nova-lite-v1:0` | Model used for advice and feedback |

Notes:
- Names must not start with `AWS_` on Amplify. This is why the Bedrock key is called `BEDROCK_API_KEY`.
- If `DATABASE_URL` or `NEXTAUTH_SECRET` is missing, the app will not work. The code no longer contains fallback values.
- The hosting build must copy these variables into `.env.production` so the server can read them. See section 5.

## 4. Database setup

1. Create a PostgreSQL database and a user with rights to it.
2. Set `DATABASE_URL`.
3. Apply the schema. From the project folder, run:
   ```
   npm install
   npx prisma migrate deploy
   ```
   If the database already has tables and Prisma reports error P3005, use `node scripts/migrate.js` instead. It marks the existing migrations as applied.
4. Some tables and columns are also created automatically the first time they are needed (for example the change log, paper short names and chapter weights). This is handled in code, so no extra step is needed.

## 5. Build and deploy on AWS Amplify

The build settings are in `amplify.yml`. In summary:
- The build installs packages, runs `npm run build` (Prisma generate, migrate deploy, Next.js build), and writes the environment variables to `.env.production`.
- The published folder is `.next`.

Steps:
1. In Amplify, connect the repository and choose the main branch.
2. Under **Environment variables**, add the variables from section 3. Use **All branches** unless you need separate values per branch.
3. Save, then start a build. Changing variables needs a new build, not just a redeploy of the old one.
4. When the build is green, open the site and sign in with the admin account (section 6).

Amplify ignores variables whose names start with `AWS_`. Use the names in section 3.

## 6. First admin account

The app has no sign-up page for admins. Create the first admin with one of these methods:
- **Option A (quickest):** insert a user with a bcrypt-hashed password and role `ADMIN` into the `User` table.
- **Option B:** the route `app/api/admin/prisma-seed` creates demo accounts with fixed passwords. **Do not use it on a company system.** Delete it before going live (see section 9).

Students can create their own accounts from the landing page. Admins can then approve paper access from the admin portal.

## 7. Feature overview

**Landing page:** introduction, available papers, financial advisor papers, example previews, comparison with traditional prep, and sign-up.

**Student portal:**
- Dashboard: How to use the portal, "How prepared are you for the exam?" (readiness per paper and AI study advice), and papers.
- Paper page: modes (Full Practice, Quick Quiz, Practice by Chapter, Exam Simulation) and AI recommended focus chapters.
- Exam review: AI personalised feedback for each exam simulation.
- Progress: attempts and results over time.
- Account: name and mobile number.

**Admin portal:**
- Papers: create papers, set short name and part label, upload questions (CSV), set exam parts and chapter weights, approve access, and view the change history.
- Users: list, detail, papers assigned, phone numbers.
- Attempts and practice runs.
- Team overview.

**AI features (Amazon Bedrock):**
- Readiness and study advice (dashboard). Uses chapter accuracy and exam simulation scores. No names or emails are sent.
- Focus chapters on each paper page.
- Personalised feedback on each exam simulation review.
If Bedrock is not configured or fails, the app shows a fallback based on the rules.

## 8. Uploading questions (CSV)

On the admin paper page, **Questions > Upload Questions**.
- 8 columns: Chapter, Question, Option A, Option B, Option C, Option D, Answer (A to D), Explanation.
- 4 columns: Chapter, Question, Answer, Explanation (options are generated).
- Line breaks inside a cell are kept. In Excel, press Alt+Enter, then save as CSV.
- Rows that cannot be read are listed after the upload, with the reason.
- **Append** adds questions. **Replace all** deletes the paper's existing questions first.

## 9. Before going live: security checklist

1. **Rotate the database password.** The old password was in the code history, so treat it as exposed.
2. **Rotate `NEXTAUTH_SECRET`.** The old value was in the code history.
3. **Delete demo and debug routes.** Remove or lock down these (all under `app/api/admin/` unless noted): `prisma-seed`, `debug-users`, `test-env`, `cleanup-migration`, `init-db`, and `app/api/users/route.ts` if not needed. Check that each one requires an admin session.
4. **Check the Bedrock key.** Create a new key for the company account and set a spending limit.
5. **TLS:** the app connects to Bedrock over HTTPS with normal certificate checks. Keep it that way.
6. **Personal data:** student names, emails and mobile numbers are stored. Confirm the purpose and retention with your data protection officer (PDPA in Singapore).

## 10. Known limitations

- Some older admin pages use inline styles, so their look does not match the newer pages.
- Database tables and columns are created by the app at runtime in several places, not only through migrations. Test on a copy of the database first.
- The AI features depend on Bedrock access and cost money per call.
- Browser testing has been limited. Test the main flows (sign-up, practice, exam simulation, admin upload) on your own environment first.

## 11. Local development

```
npm install
cp .env.example .env     # then fill in the values
npm run dev
```
Open http://localhost:3000.
