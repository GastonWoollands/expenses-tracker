FROM python:3.11-slim as builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VERSION=1.8.2 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip install poetry poetry-plugin-export

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN poetry export -f requirements.txt --without-hashes -o /tmp/requirements.txt

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/src \
    PORT=8000 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    && pip install --no-cache-dir --upgrade pip

RUN pip install --no-cache-dir poetry poetry-plugin-export

WORKDIR /app

COPY pyproject.toml poetry.lock ./

RUN poetry install --without dev && \
    rm -rf /root/.cache/pypoetry

RUN apt-get purge -y build-essential && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash app

COPY src/ ./src/

RUN chown -R app:app /app

USER app

EXPOSE 8000

CMD poetry run uvicorn expenses_bot.backend_:app --host 0.0.0.0 --port ${PORT:-8000}
