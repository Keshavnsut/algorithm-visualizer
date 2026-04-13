# Deploy For Resume Link (Render)

This project is now configured for a single-service deployment (frontend + backend on one URL).

## 1. Push to GitHub

Push the latest code to your GitHub repository.

## 2. Create Render Blueprint

1. Open Render Dashboard.
2. Click New + -> Blueprint.
3. Connect your GitHub repo.
4. Render will detect `render.yaml` automatically.
5. Click Apply.

## 3. Set Secret Environment Variables

In the Render service environment settings, set:

- `GROQ_API_KEY` (required if `AI_PROVIDER=groq`)
- `OPENAI_API_KEY` (required only if `AI_PROVIDER=openai`)

`AI_PROVIDER` is set to `groq` by default in `render.yaml`.

## 4. Wait For First Deploy

Render will build the Docker image and start the service.

Health check endpoint:

- `/health`

AI status endpoint:

- `/api/ai/status`

## 5. Copy Your Resume Link

Use your Render service URL as the project link in your resume, for example:

- `https://algorithm-visualizer.onrender.com`

## Notes

- This setup serves frontend and backend from one domain, so no CORS issues for the deployed app.
- SQLite data is persisted on Render Disk at `/var/data/ai.db`.
- On free plans, Render may sleep when idle and cold-start on the first request.
