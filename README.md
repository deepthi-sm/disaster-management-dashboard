# 🚨 Disaster Management Dashboard

A real-time disaster response system that monitors incidents, manages rescue teams, and streams live updates using NoSQL technologies.

---

## 📸 Dashboard Preview

*(Add your screenshot here later)*

---

## 📌 Overview

This project is a real-time Disaster Response Command Center designed to monitor and manage disaster situations efficiently. It provides a centralized system where incidents, rescue teams, and live updates are tracked in one place.

The system uses a NoSQL database (CouchDB) to handle dynamic and unstructured disaster data, along with Redis for caching and real-time event streaming. A web-based dashboard displays live updates, statistics, and visual insights using charts.

The goal is to simulate how modern disaster management systems work using scalable and real-time technologies.

---

## ❗ Problem Statement

In disaster situations, information is often scattered across multiple sources, making coordination slow and inefficient. Rescue teams may not have real-time updates, and decision-making becomes delayed.

Traditional systems struggle with:
- handling rapidly changing data  
- providing real-time updates  
- scaling during large disasters  
- coordinating multiple teams and incidents  

This project solves these issues by creating a centralized, real-time system that tracks incidents, manages team deployment, and streams live updates instantly.

---

## 🚀 Key Features

- Live dashboard displaying all ongoing disaster incidents  
- Incident tracking with severity, status, and location  
- Rescue team monitoring with real-time status updates  
- CouchDB-based flexible NoSQL data model  
- Redis caching for improved performance  
- Real-time updates using Redis Pub/Sub + Socket.io  

### Dashboard Includes:
- Live statistics (active incidents, deployed teams, rescued people)  
- Dynamic incident table with real-time updates  
- Rescue team tracking and assignment details  
- Charts for rescue progress and team distribution  
- Live event feed showing system activity  

---

## 🎥 Demonstration

- The system starts by seeding the database with predefined incidents and teams  
- Backend server loads and serves data to the dashboard  
- Simulation script generates real-time updates:
  - Incident status changes (active → in-progress → resolved)  
  - Team assignments and availability updates  
  - Rescue count updates  

- Updates are published via Redis and pushed to frontend using Socket.io  
- Dashboard updates instantly with:
  - refreshed tables  
  - updated charts  
  - live event logs  

---

## 📊 Results

- Real-time disaster monitoring with accurate updates  
- Efficient handling of dynamic data using CouchDB  
- Reduced latency using Redis caching  
- Instant communication using Pub/Sub mechanism  
- Clear visualization of rescue operations through charts  

---

## 🎯 Conclusion

This project demonstrates how modern technologies can be used to build a scalable and real-time disaster management system.

CouchDB enables flexible data modeling, while Redis improves performance and enables real-time communication. The integration of APIs, caching, and live updates creates a system that closely simulates real-world disaster response workflows.

---

## ⚙️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: Node.js / Python  
- **Database**: CouchDB (NoSQL)  
- **Caching & Messaging**: Redis  
- **Realtime Communication**: Socket.io  
- **Charts**: Chart.js  

---

## ⚡ Setup Instructions

```bash
# Install dependencies
npm install

# Start CouchDB
http://localhost:5984

# Start Redis
redis-server

# Seed database
node seed.js

# Start server
node server.js

# Run simulation
node simulate.js