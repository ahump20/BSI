FROM mcr.microsoft.com/devcontainers/python:3.11-bullseye

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive \
    TZ=America/Chicago

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Build essentials
    build-essential \
    cmake \
    pkg-config \
    # Python development
    python3-dev \
    python3-pip \
    python3-venv \
    # Computer Vision dependencies
    libopencv-dev \
    python3-opencv \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    # Media processing
    ffmpeg \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    # Scientific computing
    libopenblas-dev \
    liblapack-dev \
    gfortran \
    # Database clients
    postgresql-client \
    redis-tools \
    # Network tools
    curl \
    wget \
    httpie \
    netcat \
    dnsutils \
    iputils-ping \
    # Development tools
    vim \
    nano \
    tmux \
    htop \
    tree \
    jq \
    zip \
    unzip \
    # Git LFS for large files
    git-lfs \
    # Cloudflare tools
    cloudflared \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 and npm packages
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g \
        wrangler \
        @cloudflare/workers-types \
        pnpm \
        yarn \
        npm-check-updates \
        lighthouse \
        prettier \
        eslint \
        typescript \
        ts-node \
        nodemon \
        concurrently \
        wait-on \
        cross-env \
    && npm cache clean --force

# Install Python packages
COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --upgrade pip setuptools wheel \
    && pip3 install -r /tmp/requirements.txt \
    && pip3 install \
        # Development tools
        ipython \
        jupyter \
        jupyterlab \
        notebook \
        # Testing
        pytest \
        pytest-cov \
        pytest-asyncio \
        pytest-mock \
        pytest-benchmark \
        # Linting and formatting
        black \
        flake8 \
        pylint \
        mypy \
        isort \
        autopep8 \
        # Documentation
        sphinx \
        mkdocs \
        mkdocs-material \
        # Debugging
        ipdb \
        pdbpp \
        # Profiling
        memory_profiler \
        line_profiler \
        py-spy \
        # Hot reload
        watchdog \
        python-dotenv \
        # Web frameworks
        flask \
        fastapi \
        uvicorn[standard] \
        gunicorn \
        # Data processing
        pandas \
        numpy \
        scipy \
        scikit-learn \
        # Computer Vision
        opencv-python-headless \
        mediapipe \
        ultralytics \
        # Visualization
        matplotlib \
        seaborn \
        plotly \
        # Database
        sqlalchemy \
        alembic \
        redis \
        asyncpg \
        # HTTP clients
        requests \
        httpx \
        aiohttp \
        # Task queue
        celery \
        # Monitoring
        prometheus-client \
        opentelemetry-api \
        opentelemetry-sdk \
    && rm -rf ~/.cache/pip

# Install Rust (for some Python packages that require it)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Go (for some development tools)
RUN wget -q https://go.dev/dl/go1.21.0.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz \
    && rm go1.21.0.linux-amd64.tar.gz
ENV PATH="/usr/local/go/bin:${PATH}"

# Install useful Go tools
RUN go install github.com/cosmtrek/air@latest \
    && go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest

# Setup ZSH with Oh My Zsh and plugins
RUN sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended \
    && git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions \
    && git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting \
    && git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k

# Configure ZSH
RUN echo 'export ZSH="$HOME/.oh-my-zsh"' >> ~/.zshrc \
    && echo 'ZSH_THEME="powerlevel10k/powerlevel10k"' >> ~/.zshrc \
    && echo 'plugins=(git docker docker-compose python node npm yarn golang rust zsh-autosuggestions zsh-syntax-highlighting)' >> ~/.zshrc \
    && echo 'source $ZSH/oh-my-zsh.sh' >> ~/.zshrc \
    && echo 'export PATH="/workspace/node_modules/.bin:$PATH"' >> ~/.zshrc \
    && echo 'export PYTHONPATH="/workspace:$PYTHONPATH"' >> ~/.zshrc \
    && echo 'alias ll="ls -la"' >> ~/.zshrc \
    && echo 'alias gs="git status"' >> ~/.zshrc \
    && echo 'alias gp="git pull"' >> ~/.zshrc \
    && echo 'alias gpu="git push"' >> ~/.zshrc \
    && echo 'alias dc="docker-compose"' >> ~/.zshrc \
    && echo 'alias py="python3"' >> ~/.zshrc \
    && echo 'alias ipy="ipython"' >> ~/.zshrc \
    && echo 'alias jlab="jupyter lab --ip=0.0.0.0 --allow-root"' >> ~/.zshrc

# Create workspace directory
WORKDIR /workspace

# Install pre-commit hooks globally
RUN pip3 install pre-commit && pre-commit --version

# Set up Git LFS
RUN git lfs install

# Create useful directories
RUN mkdir -p \
    /workspace/.vscode \
    /workspace/logs \
    /workspace/tmp \
    /workspace/cache \
    /home/vscode/.cache \
    /home/vscode/.local

# Set proper permissions
RUN chown -R vscode:vscode /home/vscode

# Switch to non-root user
USER vscode

# Set shell to ZSH
SHELL ["/bin/zsh", "-c"]

# Keep container running
CMD ["sleep", "infinity"]