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
                 start "" /b node simulate.js
                 ping -n 10 127.0.0.1 > nul
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
        if exist deploy rmdir /s /q deploy
        mkdir deploy
        xcopy backend deploy\\backend /E /I /Y
        xcopy frontend deploy\\frontend /E /I /Y
        exit 0
        '''
    }
}
    }
}