FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY ai_service/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY ai ./ai
COPY ai_service ./ai_service
COPY *.pt ./


EXPOSE 8001

CMD ["uvicorn", "ai_service.app:app", "--host", "0.0.0.0", "--port", "8001"]
