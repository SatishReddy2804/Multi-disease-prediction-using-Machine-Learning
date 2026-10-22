.PHONY: setup install migrate run train evaluate test clean frontend-install frontend-dev docker-up docker-down

# ===== Backend Setup =====
setup:
	python -m venv venv
	@echo "Activate venv: source venv/bin/activate (Linux/Mac) or venv\\Scripts\\activate (Windows)"

install:
	pip install -r requirements.txt

migrate:
	python manage.py makemigrations
	python manage.py migrate

createsuperuser:
	python manage.py createsuperuser

run:
	python manage.py runserver

run-gunicorn:
	gunicorn backend.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# ===== ML Pipeline =====
train-all:
	python -m ml.src.train_models --disease heart
	python -m ml.src.train_models --disease diabetes
	python -m ml.src.train_models --disease parkinsons
	python -m ml.src.train_models --disease liver

train-heart:
	python -m ml.src.train_models --disease heart

train-diabetes:
	python -m ml.src.train_models --disease diabetes

train-parkinsons:
	python -m ml.src.train_models --disease parkinsons

train-liver:
	python -m ml.src.train_models --disease liver

evaluate:
	python -m ml.src.evaluate_models

# ===== Testing =====
test:
	pytest --cov=apps --cov=ml --cov-report=html -v

test-ml:
	pytest ml/tests/ -v

test-backend:
	pytest apps/ -v

# ===== Code Quality =====
lint:
	flake8 apps/ ml/ backend/
	black --check apps/ ml/ backend/

format:
	black apps/ ml/ backend/

# ===== Frontend =====
frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

# ===== Docker =====
docker-up:
	docker-compose up --build

docker-down:
	docker-compose down

docker-clean:
	docker-compose down -v

# ===== Cleanup =====
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf htmlcov .coverage
