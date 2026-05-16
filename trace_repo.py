# Re-export from ticket_repo for import compatibility
from backend.repositories.ticket_repo import TraceRepository, CustomerRepository, UserRepository

__all__ = ["TraceRepository", "CustomerRepository", "UserRepository"]
