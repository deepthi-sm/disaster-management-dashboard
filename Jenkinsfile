pipeline {
    agent any

    stages {

        stage('Install Dependencies') {
            steps {
                echo "Installing backend dependencies..."
                bat 'cd backend && npm install'
            }
        }

        stage('Run Simulation') {
            steps {
                echo "Running simulation..."
                bat 'cd backend && node simulate.js'
            }
        }

        stage('Build') {
            steps {
                echo "Build stage..."
            }
        }

        stage('Deploy') {
            steps {
                echo "Deploying..."
                bat '''
                if not exist deploy mkdir deploy
                xcopy /E /I /Y * deploy
                '''
            }
        }
    }
}