FROM python:3.11

# Install necessary system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libhdf5-dev \
    cmake \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install HDF5 from source
ENV HDF5_VERSION=1.10.6
RUN cd /tmp && \
    wget https://support.hdfgroup.org/ftp/HDF5/releases/hdf5-1.10/hdf5-${HDF5_VERSION}/src/hdf5-${HDF5_VERSION}.tar.gz && \
    tar -xzvf hdf5-${HDF5_VERSION}.tar.gz && \
    cd hdf5-${HDF5_VERSION} && \
    ./configure --prefix=/usr/local/hdf5 && \
    make && make install && \
    rm -rf /tmp/*

# Set environment variable for HDF5
ENV HDF5_DIR=/usr/local/hdf5

# Install Python dependencies
COPY requirements.txt /app/
WORKDIR /app
RUN pip install --no-binary=h5py h5py && \
    pip install -r requirements.txt

# Copy the application
COPY . /app

# Expose port 8080 for the application
EXPOSE 8080

# Use ENTRYPOINT to specify the command for starting the Flask server
ENTRYPOINT ["python"]
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:8080", "app:socketio"]


