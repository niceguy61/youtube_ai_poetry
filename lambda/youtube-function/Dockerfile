FROM public.ecr.aws/lambda/python:3.12

# Install system dependencies for librosa and audio processing
RUN yum install -y \
    gcc \
    gcc-c++ \
    make \
    libsndfile \
    libsndfile-devel \
    ffmpeg \
    && yum clean all

# Copy requirements and install Python dependencies
# Amazon Linux 2023 has gcc 11.x, so soxr compilation works
COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        librosa==0.10.1 \
        numpy==1.24.3 \
        scipy==1.11.4 \
        soundfile==0.12.1

# Download yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

# Copy function code
COPY handler.py ${LAMBDA_TASK_ROOT}
COPY audio_analyzer.py ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD [ "handler.lambda_handler" ]
