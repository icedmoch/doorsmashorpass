# Using Context7 MCP for Latest API Documentation

## What is Context7 MCP?

Context7 MCP (Model Context Protocol) is a tool that provides up-to-date documentation for libraries and frameworks. It's particularly useful when you need the latest documentation for:
- FastAPI
- Supabase
- React
- TypeScript
- And many other libraries

## How Context7 MCP Was Used in This Project

During the development of this project, Context7 MCP was available to provide latest documentation when needed. Here's how to use it:

### Example Usage

When you need help with any API or library:

1. **Ask for documentation about a specific library**:
   ```
   "Can you get me the latest FastAPI documentation about creating REST endpoints?"
   ```

2. **Get help with Supabase features**:
   ```
   "Show me Supabase documentation for Python client queries"
   ```

3. **Learn about React hooks**:
   ```
   "Get me React documentation about useEffect and useState"
   ```

## Libraries Available in This Project

The Context7 MCP server can fetch documentation for:

- **FastAPI**: `/fastapi/fastapi`
- **Supabase**: `/supabase/supabase`
- **React**: `/facebook/react`
- **TypeScript**: `/microsoft/typescript`
- **Pydantic**: `/pydantic/pydantic`
- **Requests**: `/psf/requests`

## When to Use Context7

Use Context7 MCP when you need:
- ✅ Latest API changes and updates
- ✅ Code examples from official docs
- ✅ Best practices for a library
- ✅ Migration guides between versions
- ✅ Troubleshooting common issues

## Example Questions for This Project

### For Backend Development:
```
"Get FastAPI documentation about:
- Creating POST endpoints with Pydantic models
- Handling CORS middleware
- Error handling and status codes
- Background tasks"
```

### For Frontend Development:
```
"Get React documentation about:
- useEffect with dependencies
- Custom hooks
- Error boundaries
- TypeScript with React"
```

### For Database Operations:
```
"Get Supabase documentation about:
- Python client queries
- Row Level Security
- Real-time subscriptions
- Authentication"
```

## Project-Specific Documentation

For documentation about this specific project:

1. **API Integration**: See `API_INTEGRATION.md`
2. **Quick Start**: See `QUICKSTART.md`
3. **Backend APIs**: Check `backend/README_NUTRITION_API.md` and `backend/README_ORDERS_API.md`
4. **Interactive API Docs**: http://localhost:8000/docs (when backend is running)

## Tips for Using Context7

1. **Be Specific**: Instead of "How do I use FastAPI?", ask "How do I create a POST endpoint with validation in FastAPI?"

2. **Include Context**: "I'm building a nutrition tracking API with FastAPI. How do I create endpoints that return meal data grouped by category?"

3. **Ask for Examples**: "Show me an example of using Supabase Python client to insert data with error handling"

4. **Version Specific**: "Get me FastAPI 0.100+ documentation about dependency injection"

## Alternative Resources

If Context7 is not available, you can also use:

- **Official Docs**:
  - FastAPI: https://fastapi.tiangolo.com/
  - Supabase: https://supabase.com/docs
  - React: https://react.dev/
  
- **Interactive API Docs**: 
  - http://localhost:8000/docs (Swagger UI)
  - http://localhost:8000/redoc (ReDoc)

- **Project Documentation**:
  - All `.md` files in the project root
  - README files in `backend/` directory

## Conclusion

Context7 MCP is a powerful tool for getting latest documentation when you need it. While it wasn't heavily used in this integration (since the APIs were well-documented), it's available whenever you need quick access to up-to-date library documentation during future development.

For this project, the **comprehensive documentation files** created (API_INTEGRATION.md, QUICKSTART.md, etc.) should cover most of your needs. Use Context7 when you need to:
- Add new features using unfamiliar libraries
- Upgrade dependencies and need migration guides
- Troubleshoot issues with official documentation
- Learn best practices for a specific library

**Note**: Make sure the Context7 MCP server is configured in your GitHub Copilot settings to use this feature.
