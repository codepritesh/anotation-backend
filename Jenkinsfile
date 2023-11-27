pipeline {
    agent any
    options {
        // This is required if you want to clean before build
        skipDefaultCheckout(true)
    }
    stages {
        stage('remove') { 
            steps {
                sh '''
                echo 'docker remove and path-------------------------'
                pwd
                docker compose -f anotation-backend-dockercompose.yml down
                docker rm -f anotaion-tool-backend
                docker rmi anotaion-tool-backend-docker-image
                '''
            }
        }
        stage('build') { 
            steps {
                // Clean before build
                cleanWs()
                // We need to explicitly checkout from SCM here
                checkout scm
                sh '''
                docker compose -f anotation-backend-dockercompose.yml up -d
                '''
            }
        }
        stage('deploy') { 
            steps {
                sh '''
                docker ps
                '''
            }
        }
    }
    post {
        // Clean after build
        always {
            cleanWs(cleanWhenNotBuilt: false,
                    deleteDirs: true,
                    disableDeferredWipeout: true,
                    notFailBuild: true,
                    patterns: [[pattern: '.gitignore', type: 'INCLUDE'],
                               [pattern: '.propsfile', type: 'EXCLUDE']])
        }
    }
}