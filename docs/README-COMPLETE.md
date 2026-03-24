# Prolog Tutor - Complete Documentation

## Overview
Prolog Tutor is an interactive educational tool inspired by Python Tutor, designed to visualize Prolog execution with step-by-step trace visualization, educational agents, and performance optimizations.

## Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   SWI-Prolog    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Engine       │
│   • Tree viz    │    │   • Process pool│    │   • Execution   │
│   • Code editor │    │   • Query cache │    │   • Trace gen   │
│   • Agent panel │    │   • File mgmt   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features
1. **Interactive Tree Visualization**: SLD tree visualization with step-by-step execution
2. **Performance Optimized**: 200ms response time target with caching and pooling
3. **Educational Agents**: Rule-based agents for hints and explanations
4. **Knowledge Base Management**: Save, load, and manage Prolog programs
5. **Responsive Design**: Mobile-friendly interface with dark/light themes

## Setup Instructions

### Prerequisites
- Node.js 18.0.0+
- SWI-Prolog 8.4.0+
- 2GB RAM minimum
- 10GB disk space

### 1. Backend Setup
```bash
cd Backend
npm install
npm start
```

**Backend Services**:
- Server: http://localhost:3000
- Health check: http://localhost:3000/api/health
- Stats: http://localhost:3000/api/stats

### 2. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

**Frontend**:
- Development: http://localhost:5173
- Production build: `npm run build`

### 3. Environment Configuration
Create `.env` file in Backend directory:
```env
NODE_ENV=development
PORT=3000
SWIPL_PATH=/usr/bin/swipl
CACHE_MAX_SIZE=100
POOL_SIZE=5
```

## Performance Optimization

### Achieved Optimizations
1. **Process Pooling**: Reusable SWI-Prolog processes (80-100ms saved per request)
2. **Query Caching**: LRU cache with compression (30%+ hit rate target)
3. **File Management**: Automatic cleanup of temporary files
4. **Response Compression**: Gzip compression for API responses

### Monitoring
- Response time metrics at `/api/stats`
- Cache hit rates and pool utilization
- Memory usage and cleanup statistics

## Educational Agents

### Available Agents
1. **Explanation Agent**: Step-by-step execution explanations
2. **Hint Agent**: Context-aware hints for failed queries
3. **Debugging Agent**: Logic error detection and suggestions
4. **Optimization Agent**: Code improvement suggestions

### Agent Configuration
```javascript
// Enable/disable agents
{
  "explanation": { "enabled": true, "detailLevel": "detailed" },
  "hint": { "enabled": true, "autoTrigger": false },
  "debugging": { "enabled": true, "severity": "all" }
}
```

## API Documentation

### Main Endpoints

#### Execute Query
```http
POST /api/execute
Content-Type: application/json

{
  "code": "father(john, mary).\nparent(X,Y):-father(X,Y).",
  "query": "parent(john, X)"
}
```

Response:
```json
{
  "success": true,
  "tree": { /* SLD tree structure */ },
  "executionTime": 150,
  "cached": false
}
```

#### Health Check
```http
GET /api/health
```

#### Statistics
```http
GET /api/stats
```

## Development

### Project Structure
```
Prolog-Tutor/
├── Backend/
│   ├── app.js                 # Main server
│   ├── fileManager.js        # Temporary file management
│   ├── prologPool.js         # SWI-Prolog process pool
│   ├── queryCache.js         # Query result caching
│   ├── prologParser.js       # Trace parsing
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom hooks
│   │   └── App.jsx          # Main app
│   └── package.json
├── task-backend.md          # Backend implementation tasks
├── task-frontend.md         # Frontend implementation tasks
├── agents.md               # Agent specifications
├── ARCHITECTURE.md         # System architecture
└── PERFORMANCE.md          # Optimization strategies
```

### Testing
```bash
# Backend tests
cd Backend
npm test

# Frontend tests
cd Frontend
npm test
```

### Code Style
- ESLint for JavaScript/React
- Prettier for code formatting
- Husky for git hooks

## Deployment

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY Backend/package*.json ./
RUN npm install
COPY Backend/ .
EXPOSE 3000
CMD ["node", "app.js"]
```

### Production Considerations
1. **Load Balancing**: Multiple backend instances
2. **Redis Cache**: External cache for distributed deployment
3. **Database**: PostgreSQL for knowledge base persistence
4. **Monitoring**: Prometheus + Grafana for metrics

## Performance Targets

### Response Times
- 95th percentile: <200ms
- Average: <100ms
- Cache hits: <50ms

### Resource Usage
- Memory: <500MB under load
- Concurrent users: 100+
- Requests per second: 50+

### Cache Performance
- Hit rate: >30%
- Compression ratio: 1.5x+
- Eviction rate: <5%

## Troubleshooting

### Common Issues

1. **SWI-Prolog not found**
   ```bash
   # Install SWI-Prolog
   sudo apt-get install swi-prolog
   # Verify installation
   which swipl
   ```

2. **Port already in use**
   ```bash
   # Change port in .env or
   PORT=3001 npm start
   ```

3. **Memory issues**
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=1024" npm start
   ```

### Logs
- Backend logs to console with timestamps
- File manager logs file operations
- Process pool logs process lifecycle
- Cache logs hit/miss statistics

## Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

### Commit Guidelines
- Use atomic commits
- Follow conventional commits format
- Include tests for new features
- Update documentation as needed

### Code Review
- All changes require review
- Performance impact assessment
- Security review for new dependencies
- Documentation updates

## License
MIT License - see LICENSE file for details

## Support
- Issues: https://github.com/your-org/prolog-tutor/issues
- Documentation: https://prolog-tutor/docs
- Email: support@prolog-tutor.example.com

## Acknowledgments
- Inspired by Python Tutor
- Built with Node.js, React, and SWI-Prolog
- Educational agent system based on rule-based AI

---

*Last updated: March 2024*