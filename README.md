# Description

A tiny microservices project built as a technical challenge for Comm-It.

## Tech Stack

- Node.js
- NestJS / TypeScript
- MongoDB
- Redis
- Mosquitto
- Swagger
- PDFKit / Chart.js / Canvas
- Docker

## Project Structure

The project consists of two microservices:

1. **Service A**:
   - Fetches data from external APIs
   - Uploads and processes the files
   - Provides search functionality
   - Publishes events to Service B

2. **Service B**:
   - Logs events from Service A
   - Provides queryable event logs
   - Provides time series analytics
   - Generates PDF reports with charts

## Shared Libraries

Under the `libs` directory, you'll find shared libraries used by both services:

- **Database**: MongoDB connection and utilities
- **Redis**: Redis connection and TimeSeries utilities
- **MQTT**: Message broker connection and utilities
- **DTOs**: Shared data transfer objects

## API Documentation

Each service exposes Swagger documentation at `/api`:

- Service A: http://localhost:3000/api
- Service B: http://localhost:3001/api

### Postman Collection
You can also import endpoint collection to your Postman from this [file](./Comm-It.postman_collection.json)

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Running the Application

Build process consists of two stages using intermediate images: compiling TypeScript code and creating the production image. The final images are optimized for production use.

There are two options to spin up the whole stack:

#### Option 1: Using the build script (recommended)

1. Clone the repository
2. Make the build script executable:

```bash
chmod +x build-and-start.sh
```

3. Build and run the services:

```bash
./build-and-start.sh
```

#### Option 2: Manual build and run

1. Clone the repository
2. Pre-build the TypeScript code:

```bash
docker-compose -f docker-compose-build.yml up service-a-build service-b-build
```

3. Build the Docker images:

```bash
docker-compose build
```

4. Start the services:

```bash
docker-compose up
```

### Accessing the Services

- Service A: http://localhost:3000
- Service B: http://localhost:3001

## Features

### Service A
- **Public API Integration**: Fetch and store large datasets from external APIs
- **File Processing**: Upload, parse, and efficiently store JSON/Excel files
- **Robust Search**: Optimized MongoDB queries with proper indexing and pagination

### Service B
- **Event Logging**: Captures and stores all events from Service A
- **Time Series Analytics**: Provides visualizations and analytics on API usage
- **PDF Reports**: Generates detailed PDF reports with charts and statistics

## Architecture

The microservices communicate through MQTT, with Service A publishing events and Service B consuming them. Redis TimeSeries is used for logging API performance metrics, and MongoDB stores the processed data.

## Docker Setup

The project includes Docker configurations for both services along with their dependencies:
- MongoDB for data storage
- Redis for caching and time series
- Mosquitto for MQTT messaging

### Docker Build Process

The Docker build process is structured in two stages:

1. **Build Stage**: 
   - Compiles TypeScript code
   - Uses a build environment with development dependencies
   - Creates mock implementations for native dependencies like canvas

2. **Production Stage**:
   - Uses a minimal runtime environment
   - Contains only production dependencies
   - Implements fallbacks for components with complex native dependencies

### Docker Optimization

To optimize the Docker build process, this project:

1. Separates the TypeScript compilation from the runtime container
2. Uses mock implementations for chart generation in production
3. Minimizes dependencies in the production container
4. Provides multiple fallback mechanisms for native modules
5. Uses a custom startup script that works in various environments

### Environment Configuration

The Docker containers respect the following environment variables:

- `NODE_ENV`: Set to "production" for the production environment
- `PORT`: The port each service listens on
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB`: MongoDB database name
- `REDIS_URI`: Redis connection string
- `MQTT_URI`: MQTT broker connection string
- `CANVAS_PREBUILT`: Flag to use prebuilt canvas binaries

You can customize these in the docker-compose.yml file.

## Development

### Service Development

To develop individual services without Docker:

1. Start dependencies using Docker Compose:

```bash
docker-compose up mongodb redis mosquitto
```

2. Install dependencies for the service you want to work on:

```bash
cd apps/service-a # or apps/service-b
npm install
```

3. Run the service in development mode, either:

```bash
npm run start:dev # Watch mode
npm run start:debug # Debug mode
```

## Testing

To run tests for a specific service:

```bash
cd apps/service-a # or apps/service-b
npm run test
npm run test:e2e
```

To run tests with coverage:

```bash
npm run test:cov
```

To run end-to-end tests:

```bash
npm run test:e2e
```

### Testing in Docker

You can run tests inside the Docker container:

```bash
docker-compose exec service-a npm run test
docker-compose exec service-a npm run test:e2e

docker-compose exec service-b npm run test
docker-compose exec service-b npm run test:e2e
```
