pipeline {
    parameters {
      choice(name: 'app', choices: ['control-center', 'control-center-analytics'], description: 'Which app to build')
  }

  agent {
    kubernetes {
      label 'dind-agent'
    }
  }
  environment {
    IMAGE_NAME = params.app
    
    // Account 1: Master/Staging
    ACCOUNT_ID_1 = '463356420488'
    API_URL_1 = 'https://dashboard.integ.moving.tech'
    
    // Account 2: Production
    ACCOUNT_ID_2 = '147728078333'
    API_URL_2 = 'https://dashboard.moving.tech'
  }
  stages {
    stage('Initialize') {
      steps {
        script {
          env.LAST_COMMIT_HASH = sh(script: "git rev-parse HEAD", returnStdout: true).trim().substring(0,6)
        }
      }
    }

    stage('Deploy to Master (4633...)') {
      steps {
          withCredentials([string(credentialsId: 'pk_docker_hub', variable: 'DOCKER_PASSWORD')]) {
            script {
                echo "Building for Master/Staging Account: ${env.ACCOUNT_ID_1}"
                echo "API URL: ${env.API_URL_1}"
                if (env.IMAGE_NAME == 'control-center') {
                  // Build with Staging URL
                sh "docker build --no-cache --build-arg VITE_API_URL=${env.API_URL_1} -t ${env.IMAGE_NAME}:staging ."
                } else {
                  // Build server with Staging URL
                sh "cd server && docker build --no-cache --build-arg VITE_API_URL=${env.API_URL_1} -t ${env.IMAGE_NAME}:staging ."
                }

                // Login
                sh "aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ${env.ACCOUNT_ID_1}.dkr.ecr.ap-south-1.amazonaws.com"
                
                // Tag and Push
                sh "docker tag ${env.IMAGE_NAME}:staging ${env.ACCOUNT_ID_1}.dkr.ecr.ap-south-1.amazonaws.com/${env.IMAGE_NAME}:${env.LAST_COMMIT_HASH}"
                sh "docker push ${env.ACCOUNT_ID_1}.dkr.ecr.ap-south-1.amazonaws.com/${env.IMAGE_NAME}:${env.LAST_COMMIT_HASH}"
                
                // Latest tag
                sh "docker tag ${env.IMAGE_NAME}:staging ${env.ACCOUNT_ID_1}.dkr.ecr.ap-south-1.amazonaws.com/${env.IMAGE_NAME}:latest"
                sh "docker push ${env.ACCOUNT_ID_1}.dkr.ecr.ap-south-1.amazonaws.com/${env.IMAGE_NAME}:latest"
            }
        }
      }
    }

    stage('Deploy to Production (1477...)') {
      steps {
          withCredentials([string(credentialsId: 'pk_docker_hub', variable: 'DOCKER_PASSWORD')]) {
            script {
                echo "Building for Production Account: ${env.ACCOUNT_ID_2}"
                echo "API URL: ${env.API_URL_2}"
                
                // Build with Production URL
                if (env.IMAGE_NAME == 'control-center') {
                  sh "docker build --no-cache --build-arg VITE_API_URL=${env.API_URL_2} -t ${env.IMAGE_NAME}:prod ."
                } else {
                  sh "cd server && docker build --no-cache --build-arg VITE_API_URL=${env.API_URL_2} -t ${env.IMAGE_NAME}:prod ."
                }

                // Login
                sh "aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ${env.ACCOUNT_ID_2}.dkr.ecr.ap-south-1.amazonaws.com"
                
                // Tag and Push
                sh "docker tag ${env.IMAGE_NAME}:prod ${env.ACCOUNT_ID_2}.dkr.ecr.ap-south-1.amazonaws.com/${env.IMAGE_NAME}:${env.LAST_COMMIT_HASH}"
                sh "docker push ${env.ACCOUNT_ID_2}.dkr.ecr.ap-south-1.amazonaws.com/${env.IMAGE_NAME}:${env.LAST_COMMIT_HASH}"
                
                // Latest tag
                sh "docker tag ${env.IMAGE_NAME}:prod ${env.ACCOUNT_ID_2}.dkr.ecr.ap-south-1.amazonaws.com/${env.IMAGE_NAME}:latest"
                sh "docker push ${env.ACCOUNT_ID_2}.dkr.ecr.ap-south-1.amazonaws.com/${env.IMAGE_NAME}:latest"
            }
        }
      }
    }
  }
}
