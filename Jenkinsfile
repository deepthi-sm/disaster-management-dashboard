// Cross-platform CI/CD pipeline. Every stage runs through Docker via the host
// socket, so it behaves identically whether Jenkins runs on macOS or Windows
// Docker Desktop. The agent needs only the Docker CLI + Compose plugin.
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    // Stable project names so the deployed stack is replaced (not duplicated)
    // on every run, and the ephemeral test stack stays isolated from it.
    PROD = 'docker compose -p dmd'
    TEST = 'docker compose -p dmd-test -f docker-compose.test.yml'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Lint') {
      // ESLint runs inside the frontend-test image (built with devDependencies).
      steps {
        sh '$TEST run --rm --build frontend-tests npm run lint'
      }
    }

    stage('Test') {
      steps {
        // Deterministic, throwaway databases on the compose network.
        sh '$TEST up -d --wait couchdb-test redis-test'
        // Backend integration tests (node:test + supertest) reach the DBs by
        // service name; frontend unit tests (vitest) need no DBs.
        sh '$TEST run --rm tests'
        sh '$TEST run --rm frontend-tests'
      }
      post {
        always {
          sh '$TEST down -v || true'
        }
      }
    }

    stage('Build') {
      // Multi-stage build: compiles the React app and bakes it into the API image.
      steps {
        sh '$PROD build'
      }
    }

    stage('Deploy') {
      // Recreate the app stack; healthchecks gate readiness, seed runs idempotently.
      steps {
        sh '$PROD up -d --wait'
      }
    }

    stage('Smoke') {
      // Verify the live deployment from inside the container network.
      steps {
        sh '$PROD exec -T backend wget -qO- http://localhost:3001/api/health'
      }
    }
  }

  post {
    success { echo 'Pipeline green — app deployed and healthy at http://localhost:3001' }
    failure { echo 'Pipeline failed — check the stage logs above.' }
  }
}
