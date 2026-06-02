"""Aligned with browser window.arborito ask.json error codes."""

AI_TIMEOUT = "AI_TIMEOUT"
AI_SAGE_ERROR = "AI_SAGE_ERROR"
AI_PARSE_ERROR = "AI_PARSE_ERROR"
AI_EMPTY_RESPONSE = "AI_EMPTY_RESPONSE"
AI_NETWORK = "AI_NETWORK"

ERROR_CODES = {
    "TIMEOUT": AI_TIMEOUT,
    "SAGE": AI_SAGE_ERROR,
    "PARSE": AI_PARSE_ERROR,
    "EMPTY": AI_EMPTY_RESPONSE,
    "NETWORK": AI_NETWORK,
}


class ArboritoError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
