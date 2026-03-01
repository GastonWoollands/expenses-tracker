"""
Main chatbot service orchestrating all components.
"""

import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field

from .intent_detector import IntentDetector, IntentType
from .query_generator import QueryGenerator
from .security import SecurityValidator
from .query_executor import QueryExecutor
from .response_formatter import ResponseFormatter

logger = logging.getLogger(__name__)


@dataclass
class ChatResponse:
    """Response from chatbot service."""

    answer: str = ""
    intent: IntentType = "unknown"
    should_log_expense: bool = False
    data: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    sql: Optional[str] = None


class ChatbotService:
    """Main service for expense query chatbot."""

    GREETING_RESPONSE = (
        "Hello! I can help you understand your expenses. Try asking me:\n"
        "- How much did I spend this month?\n"
        "- What are my top spending categories?\n"
        "- Show me my food expenses\n"
        "- Compare this month to last month\n\n"
        "Or just tell me about an expense to log it!"
    )

    def __init__(self, neon_client=None):
        self.intent_detector = IntentDetector()
        self.query_generator = QueryGenerator()
        self.security = SecurityValidator()
        self.formatter = ResponseFormatter()

        if neon_client:
            self.executor = QueryExecutor(neon_client)
        else:
            self.executor = None

        self._neon_client = neon_client

    def _get_executor(self):
        """Lazy initialization of executor."""
        if self.executor is None:
            from database.neon_client import get_neon

            self._neon_client = get_neon()
            self.executor = QueryExecutor(self._neon_client)
        return self.executor

    async def process_message(
        self,
        text: str,
        user_id: str,
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> ChatResponse:
        """
        Process a user message and return appropriate response.

        Args:
            text: User's message text
            user_id: User ID for data filtering
            history: Optional conversation history

        Returns:
            ChatResponse with answer or intent
        """
        if not text or not text.strip():
            return ChatResponse(
                answer="Please send a message.",
                intent="unknown",
            )

        text = text.strip()
        logger.info(f"Processing message for user {user_id[:8]}...")

        is_valid, error = self.security.validate_input(text)
        if not is_valid:
            logger.warning(f"Input validation failed: {error}")
            return ChatResponse(
                answer="I couldn't process that message. Please try rephrasing.",
                intent="unknown",
                error=error,
            )

        intent = self.intent_detector.detect(text, history)
        logger.info(f"Detected intent: {intent}")

        if intent == "greeting":
            return ChatResponse(
                answer=self.GREETING_RESPONSE,
                intent="greeting",
            )

        if intent == "expense":
            return ChatResponse(
                answer="",
                intent="expense",
                should_log_expense=True,
            )

        if intent == "unknown":
            return ChatResponse(
                answer="I'm not sure what you're asking. You can:\n"
                "- Ask about your expenses (e.g., 'How much did I spend this month?')\n"
                "- Log an expense (e.g., 'Spent 25 on lunch')",
                intent="unknown",
            )

        return await self._handle_query(text, user_id, history)

    async def _handle_query(
        self,
        question: str,
        user_id: str,
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> ChatResponse:
        """Handle a query intent."""
        try:
            sql = await self.query_generator.generate(question, history)

            if not sql:
                return ChatResponse(
                    answer="I couldn't understand your question. Could you try rephrasing it?",
                    intent="query",
                    error="Failed to generate query",
                )

            is_valid, error = self.security.validate_sql(sql, user_id)
            if not is_valid:
                logger.warning(f"SQL validation failed: {error}")
                return ChatResponse(
                    answer="I couldn't process that query safely. Please try a different question.",
                    intent="query",
                    error=error,
                )

            executor = self._get_executor()
            results = await executor.execute(sql, user_id)

            answer = await self.formatter.format(results, question)

            return ChatResponse(
                answer=answer,
                intent="query",
                data=results,
                sql=sql,
            )

        except TimeoutError:
            return ChatResponse(
                answer="The query took too long. Please try a simpler question.",
                intent="query",
                error="Query timeout",
            )
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return ChatResponse(
                answer="Sorry, I encountered an error processing your request. Please try again.",
                intent="query",
                error=str(e),
            )


chatbot_service: Optional[ChatbotService] = None


def get_chatbot_service() -> ChatbotService:
    """Get or create chatbot service instance."""
    global chatbot_service
    if chatbot_service is None:
        chatbot_service = ChatbotService()
    return chatbot_service
