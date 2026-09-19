"""Typed domain errors. Handlers must never leak internals to clients."""

from __future__ import annotations


class DomainException(Exception):
    def __init__(self, message: str, *, status_code: int = 400, code: str = "domain_error"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class ValidationException(DomainException):
    def __init__(self, message: str):
        super().__init__(message, status_code=400, code="validation_error")


class AuthorizationException(DomainException):
    def __init__(self, message: str = "You are not allowed to do that."):
        super().__init__(message, status_code=403, code="authorization_error")


class NotFoundException(DomainException):
    def __init__(self, message: str = "Not found."):
        super().__init__(message, status_code=404, code="not_found")


class ExternalServiceException(DomainException):
    def __init__(self, message: str = "A helper service is unavailable. Please try again."):
        super().__init__(message, status_code=502, code="external_service")
