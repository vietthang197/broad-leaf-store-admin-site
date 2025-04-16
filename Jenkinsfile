// Jenkinsfile
pipeline {
    agent {
            kubernetes {
                yaml '''
                    apiVersion: v1
                    kind: Pod
                    spec:
                      containers:
                      - name: node
                        image: node:22-alpine
                        command:
                        - cat
                        tty: true
                      - name: docker
                        image: docker:latest
                        command:
                        - cat
                        tty: true
                        volumeMounts:
                        - mountPath: /var/run/docker.sock
                          name: docker-sock
                      - name: kubectl
                        image: alpine/k8s:1.31.2
                        command:
                        - cat
                        tty: true
                        securityContext:
                          runAsUser: 0
                      serviceAccountName: jenkins
                      volumes:
                      - name: docker-sock
                        hostPath:
                          path: /var/run/docker.sock
                '''
                defaultContainer 'node'
            }
    }

    environment {
        DOCKER_IMAGE = 'registrydocker.devto.shop/broad-leaf-store-admin-site'
        DOCKER_TAG = "latest"
        KUBECONFIG = credentials('jenkins-k8s-credentials')
        PATH = "$PATH:/usr/local/bin"  // Đảm bảo các công cụ CLI có sẵn
    }

    stages {

        stage('Npm install') {
            steps {
                container('node') {
                    sh """
                      npm install
                      npm run build --configuration=production
                    """
                }
            }
        }

        stage('Build & Push Docker Image') {
              steps {
                  container('docker') {
                      script {
                          def dockerImage = "${DOCKER_IMAGE}:${DOCKER_TAG}"
                          sh """
                              docker build -t ${dockerImage} .
                              docker push ${dockerImage}
                          """
                      }
                  }
              }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    script {
                        kubeconfig(credentialsId: 'jenkins-k8s-credentials') {
                            sh '''
                                echo "Step: Kubectl apply config"
                                kubectl apply -f k8s/deployment.yaml -n default

                                echo "Step: Force rolling restart deployment"
                                kubectl rollout restart deployment broad-leaf-store-admin-site -n default

                                echo "Step: Waiting for rollout to complete"
                                kubectl rollout status deployment broad-leaf-store-admin-site -n default
                            '''
                        }
                    }
                }
            }
        }

    }

     post {
            success {
                echo 'Pipeline successfully completed'
            }
            failure {
                echo 'Pipeline failed'
            }
            always {
                echo 'Cleaning up workspace'
                cleanWs()
            }
     }
}
