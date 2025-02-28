# Microservices Project

A robust microservices architecture using NestJS, MongoDB, Redis, and MQTT.

## Tech Stack

- **Backend Framework**: NestJS with TypeScript
- **Database**: MongoDB
- **Cache & Time Series**: Redis/RedisTimeSeries
- **Message Broker**: Mosquitto (MQTT)
- **Containerization**: Docker & Docker Compose
- **API Documentation**: Swagger
- **PDF Generation**: PDFKit

## Project Structure

The project consists of two microservices:

1. **Service A**:
   - Fetches data from external APIs
   - Uploads and processes JSON/Excel files
   - Provides search functionality
   - Publishes events to Service B

2. **Service B**:
   - Logs events from Service A
   - Provides time series analytics
   - Generates PDF reports with charts

## Shared Libraries

- **Database**: MongoDB connection and utilities
- **Redis**: Redis connection and TimeSeries utilities
- **MQTT**: Message broker connection and utilities
- **DTOs**: Shared data transfer objects

## API Documentation

Each service exposes Swagger documentation at `/api`:

- Service A: http://localhost:3000/api
- Service B: http://localhost:3001/api

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Running the Application

1. Clone the repository
2. Start the services:

```bash
docker-compose up
```

3. Access the services:
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