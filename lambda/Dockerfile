FROM public.ecr.aws/lambda/python:3.12

# Install system dependencies for Chromium
RUN microdnf install -y \
    nss \
    atk \
    cups-libs \
    libdrm \
    libXcomposite \
    libXdamage \
    libXrandr \
    libgbm \
    alsa-lib \
    && microdnf clean all

# Install Python packages
RUN pip install playwright beautifulsoup4 soupsieve supabase httpx --no-cache-dir

# Install Chromium browser
RUN playwright install chromium

# Copy function code
COPY lambda_function.py scraper_utils.py ${LAMBDA_TASK_ROOT}/

CMD ["lambda_function.lambda_handler"]
