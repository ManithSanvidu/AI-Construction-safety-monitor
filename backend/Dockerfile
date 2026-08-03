FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 ffmpeg
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "run.py"]