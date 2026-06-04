# Jenkins controller with the Docker CLI + Compose plugin baked in, so the
# pipeline can build/run containers via the mounted host Docker socket. The CLI
# is the Linux build (installed here) — never bind-mount the host's docker
# binary, which is a different OS/arch on Mac/Windows Docker Desktop.
FROM jenkins/jenkins:lts-jdk17

USER root
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
      > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y docker-ce-cli docker-compose-plugin && \
    rm -rf /var/lib/apt/lists/*

# Install the plugins the pipeline needs (Pipeline, Git) plus Configuration as
# Code + Job DSL used to auto-provision the job.
COPY jenkins/plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugins -f /usr/share/jenkins/ref/plugins.txt

# Configuration as Code lives outside JENKINS_HOME (which is a runtime volume).
COPY jenkins/casc.yaml /var/jenkins_conf/casc.yaml
ENV CASC_JENKINS_CONFIG=/var/jenkins_conf/casc.yaml

# Skip the setup wizard — security + the pipeline job come from casc.yaml.
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"
USER jenkins
