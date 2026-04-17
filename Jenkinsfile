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
                echo "Running simulation for demo..."
                bat '''
                cd backend
                timeout /t 10
                start /b node simulate.js
                timeout /t 10
                taskkill /f /im node.exe
                '''
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