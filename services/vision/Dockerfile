FROM python:3.12-slim

WORKDIR /app

RUN apt-get update --allow-releaseinfo-change \
    && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download rembg model at build time so it's cached in the image
RUN python -c "from rembg import new_session; new_session('u2net_human_seg'); new_session('u2net')" || true

COPY . .

RUN mkdir -p /app/uploads

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
