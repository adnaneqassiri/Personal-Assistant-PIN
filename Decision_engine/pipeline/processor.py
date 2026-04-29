from abc import ABC, abstractmethod
import logging
from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from Decision_engine.llm.base import LLMClient, fallback_unknown_interpretation
from Decision_engine.models.decision import Action, Decision
from Decision_engine.models.llm_interpretation import LLMInterpretation
from Decision_engine.models.meeting import Meeting
from Decision_engine.models.normalized_context import NormalizedContext
from Decision_engine.models.user_state import UserState
from Decision_engine.pipeline.context_transformer import transform_context
from Decision_engine.pipeline.context_validator import validate_raw_context
from Decision_engine.pipeline.decision_builder import DecisionBuilder
from Decision_engine.pipeline.meeting_manager import MeetingManager
from Decision_engine.pipeline.rule_engine import RuleEngine
from Decision_engine.pipeline.significance_detector import detect_significance
from Decision_engine.pipeline.state_manager import StateManager
from Decision_engine.utils.pydantic import model_to_dict
from Decision_engine.utils.text import clean_text

logger = logging.getLogger(__name__)


class ProcessingResult(BaseModel):
    status: str
    context_id: Optional[str] = None
    significant: bool = False
    decision_id: Optional[str] = None
    error: Optional[str] = None


class StoragePort(ABC):
    @abstractmethod
    def save_raw_context_event(self, payload: Dict[str, Any], status: str) -> str:
        raise NotImplementedError

    @abstractmethod
    def mark_raw_context_event_invalid(
        self, raw_event_ref: str, errors: List[str]
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    def save_normalized_context(self, context: NormalizedContext) -> None:
        raise NotImplementedError

    @abstractmethod
    def get_user_state(self, user_id: str) -> Optional[UserState]:
        raise NotImplementedError

    @abstractmethod
    def save_user_state(self, state: UserState) -> None:
        raise NotImplementedError

    @abstractmethod
    def get_last_significant_context(
        self, user_id: str
    ) -> Optional[NormalizedContext]:
        raise NotImplementedError

    @abstractmethod
    def get_active_meeting(
        self, user_id: str, meeting_id: Optional[str]
    ) -> Optional[Meeting]:
        raise NotImplementedError

    @abstractmethod
    def save_decision_history(self, history_document: Dict[str, Any]) -> None:
        raise NotImplementedError

    @abstractmethod
    def save_notification(self, decision: Decision, action: Action) -> None:
        raise NotImplementedError

    @abstractmethod
    def save_activity_update(self, decision: Decision, action: Action) -> None:
        raise NotImplementedError

    @abstractmethod
    def save_meeting(self, meeting: Meeting) -> None:
        raise NotImplementedError


class VectorStorePort(ABC):
    @abstractmethod
    def index_memory(self, text: str, metadata: Dict[str, Any]) -> None:
        raise NotImplementedError


class NotificationProducerPort(ABC):
    @abstractmethod
    def publish_action(self, decision: Decision, action: Action) -> None:
        raise NotImplementedError


class EventProcessor(object):
    def __init__(
        self,
        storage: StoragePort,
        llm_client: LLMClient,
        vector_store: VectorStorePort,
        notification_producer: NotificationProducerPort,
        state_manager: Optional[StateManager] = None,
        meeting_manager: Optional[MeetingManager] = None,
        rule_engine: Optional[RuleEngine] = None,
        decision_builder: Optional[DecisionBuilder] = None,
    ):
        self.storage = storage
        self.llm_client = llm_client
        self.vector_store = vector_store
        self.notification_producer = notification_producer
        self.state_manager = state_manager or StateManager()
        self.meeting_manager = meeting_manager or MeetingManager()
        self.rule_engine = rule_engine or RuleEngine()
        self.decision_builder = decision_builder or DecisionBuilder()

    def process_event(self, payload: Dict[str, Any]) -> ProcessingResult:
        context_id = self._context_id_from_payload(payload)
        user_id = payload.get("user_id") if isinstance(payload, dict) else None
        logger.info("Start process_event context_id=%s user_id=%s", context_id, user_id)
        raw_event_ref = self.storage.save_raw_context_event(payload, status="received")
        logger.info(
            "Raw event saved context_id=%s user_id=%s raw_event_ref=%s",
            context_id,
            user_id,
            raw_event_ref,
        )
        validation_result = validate_raw_context(payload)
        logger.info(
            "Validation result context_id=%s user_id=%s is_valid=%s errors_count=%s",
            context_id,
            user_id,
            validation_result.is_valid,
            len(validation_result.errors),
        )

        if not validation_result.is_valid:
            self.storage.mark_raw_context_event_invalid(
                raw_event_ref,
                validation_result.errors,
            )
            logger.info(
                "Stopping invalid event context_id=%s user_id=%s errors=%s",
                context_id,
                user_id,
                validation_result.errors,
            )
            return ProcessingResult(
                status="invalid",
                context_id=self._context_id_from_payload(payload),
                significant=False,
                error="; ".join(validation_result.errors),
            )

        raw_context = validation_result.raw_context
        normalized_context = transform_context(raw_context)
        self.storage.save_normalized_context(normalized_context)
        logger.info(
            "Normalized context saved context_id=%s user_id=%s context_timestamp=%s",
            normalized_context.context_id,
            normalized_context.user_id,
            normalized_context.context_timestamp,
        )

        user_state = self.storage.get_user_state(normalized_context.user_id)
        if user_state is None:
            user_state = UserState(user_id=normalized_context.user_id)

        last_significant_context = self.storage.get_last_significant_context(
            normalized_context.user_id
        )
        significance_result = detect_significance(
            normalized_context,
            user_state,
            last_significant_context,
        )
        logger.info(
            "Significance result context_id=%s user_id=%s should_call_llm=%s reason=%s reasons=%s",
            normalized_context.context_id,
            normalized_context.user_id,
            significance_result.should_call_llm,
            significance_result.reason,
            significance_result.reasons,
        )

        if not significance_result.should_call_llm:
            updated_state = self.state_manager.update_state(
                user_state,
                normalized_context,
                fallback_unknown_interpretation(),
                significance_result,
            )
            self.storage.save_user_state(updated_state)
            logger.info(
                "Skipping low-signal event context_id=%s user_id=%s last_seen_at=%s",
                normalized_context.context_id,
                normalized_context.user_id,
                updated_state.last_seen_at,
            )
            return ProcessingResult(
                status="not_significant",
                context_id=normalized_context.context_id,
                significant=False,
            )

        logger.info(
            "Calling LLM context_id=%s user_id=%s",
            normalized_context.context_id,
            normalized_context.user_id,
        )
        interpretation = self._interpret_or_fallback(
            normalized_context,
            user_state,
            last_significant_context,
        )
        logger.info(
            "LLM completed context_id=%s user_id=%s activity=%s confidence=%s memory_worthy=%s",
            normalized_context.context_id,
            normalized_context.user_id,
            interpretation.activity,
            interpretation.confidence,
            interpretation.memory_worthy,
        )
        updated_state = self.state_manager.update_state(
            user_state,
            normalized_context,
            interpretation,
            significance_result,
        )
        logger.info(
            "State updated context_id=%s user_id=%s current_activity=%s session_minutes=%s in_meeting=%s",
            normalized_context.context_id,
            normalized_context.user_id,
            updated_state.current_activity,
            updated_state.current_session_duration_minutes,
            updated_state.in_meeting,
        )

        active_meeting = self.storage.get_active_meeting(
            normalized_context.user_id,
            updated_state.active_meeting_id,
        )
        meeting_result = self.meeting_manager.process(
            updated_state,
            normalized_context,
            interpretation,
            active_meeting,
        )
        updated_state = meeting_result.state
        logger.info(
            "Meeting result context_id=%s user_id=%s action=%s summary_required=%s meeting_id=%s",
            normalized_context.context_id,
            normalized_context.user_id,
            meeting_result.action,
            meeting_result.summary_required,
            meeting_result.meeting.meeting_id if meeting_result.meeting else None,
        )

        rule_results = self.rule_engine.evaluate(
            normalized_context,
            interpretation,
            updated_state,
        )
        triggered_rules = [
            result.rule_name for result in rule_results if result.triggered
        ]
        logger.info(
            "Rule engine completed context_id=%s user_id=%s triggered_rules=%s",
            normalized_context.context_id,
            normalized_context.user_id,
            triggered_rules,
        )
        decision = self.decision_builder.build(
            normalized_context=normalized_context,
            llm_interpretation=interpretation,
            user_state=updated_state,
            rule_results=rule_results,
            significance_result=significance_result,
            meeting_result=meeting_result,
        )

        self.storage.save_user_state(updated_state)
        self.storage.save_decision_history(
            self._build_decision_history_document(
                decision=decision,
                significance_result=significance_result,
                llm_interpretation=interpretation,
                state_snapshot=updated_state,
                rule_results=rule_results,
                meeting_result=meeting_result,
            )
        )
        logger.info(
            "Decision saved context_id=%s user_id=%s decision_id=%s decision_type=%s actions_count=%s",
            normalized_context.context_id,
            normalized_context.user_id,
            decision.decision_id,
            decision.decision_type,
            len(decision.actions),
        )
        self._save_side_effect_records(decision, meeting_result)
        self._publish_actions(decision)
        self._index_memory_if_needed(normalized_context, interpretation, decision)

        return ProcessingResult(
            status="processed",
            context_id=normalized_context.context_id,
            significant=True,
            decision_id=decision.decision_id,
        )

    def _interpret_or_fallback(
        self,
        normalized_context: NormalizedContext,
        user_state: UserState,
        last_significant_context: Optional[NormalizedContext],
    ) -> LLMInterpretation:
        try:
            return self.llm_client.interpret_context(
                normalized_context,
                user_state,
                last_significant_context,
            )
        except Exception as exc:
            logger.exception(
                "LLM failed, using fallback context_id=%s user_id=%s error=%s",
                normalized_context.context_id,
                normalized_context.user_id,
                exc,
            )
            return fallback_unknown_interpretation(
                "LLM interpretation failed; fallback unknown. %s" % exc
            )

    def _save_side_effect_records(
        self,
        decision: Decision,
        meeting_result,
    ) -> None:
        for action in decision.actions:
            if action.type == "notification":
                self.storage.save_notification(decision, action)
            elif action.type == "activity_update":
                self.storage.save_activity_update(decision, action)

        if meeting_result is not None and meeting_result.meeting is not None:
            self.storage.save_meeting(meeting_result.meeting)

    def _publish_actions(self, decision: Decision) -> None:
        published_count = 0
        for action in decision.actions:
            if self._should_publish_action(action):
                self.notification_producer.publish_action(decision, action)
                published_count += 1
                logger.info(
                    "Action published decision_id=%s context_id=%s action_type=%s",
                    decision.decision_id,
                    decision.source_context_id,
                    action.type,
                )
            else:
                logger.debug(
                    "Action not published decision_id=%s context_id=%s action_type=%s",
                    decision.decision_id,
                    decision.source_context_id,
                    action.type,
                )
        logger.info(
            "Publish actions completed decision_id=%s context_id=%s published_count=%s",
            decision.decision_id,
            decision.source_context_id,
            published_count,
        )

    def _should_publish_action(self, action: Action) -> bool:
        if action.type == "notification":
            return True
        if action.type == "close_meeting" and action.payload.get("summary_required"):
            return True
        return False

    def _index_memory_if_needed(
        self,
        context: NormalizedContext,
        interpretation: LLMInterpretation,
        decision: Decision,
    ) -> None:
        summary = clean_text(interpretation.summary)
        should_index = interpretation.memory_worthy or self._summary_is_useful(summary)
        if not should_index:
            logger.info(
                "Vector indexing skipped context_id=%s user_id=%s memory_worthy=%s summary_length=%s",
                context.context_id,
                context.user_id,
                interpretation.memory_worthy,
                len(summary),
            )
            return

        self.vector_store.index_memory(
            summary,
            {
                "user_id": context.user_id,
                "context_id": context.context_id,
                "decision_id": decision.decision_id,
                "activity": interpretation.activity,
                "decision_type": decision.decision_type,
            },
        )
        logger.info(
            "Vector memory indexed context_id=%s user_id=%s decision_id=%s",
            context.context_id,
            context.user_id,
            decision.decision_id,
        )

    def _summary_is_useful(self, summary: str) -> bool:
        if not summary:
            return False
        if summary == "The context could not be interpreted.":
            return False
        if summary.startswith("LLM interpretation failed; fallback unknown."):
            return False
        return len(summary) >= 20

    def _build_decision_history_document(
        self,
        decision: Decision,
        significance_result,
        llm_interpretation: LLMInterpretation,
        state_snapshot: UserState,
        rule_results,
        meeting_result,
    ) -> Dict[str, Any]:
        meeting_payload = None
        if meeting_result is not None:
            meeting_payload = {
                "action": meeting_result.action,
                "summary_required": meeting_result.summary_required,
                "meeting": model_to_dict(meeting_result.meeting),
            }

        return {
            "decision": model_to_dict(decision),
            "significance_result": model_to_dict(significance_result),
            "llm_interpretation": model_to_dict(llm_interpretation),
            "state_snapshot": model_to_dict(state_snapshot),
            "rule_results": [model_to_dict(result) for result in rule_results],
            "meeting_result": meeting_payload,
        }

    def _context_id_from_payload(self, payload: Dict[str, Any]) -> Optional[str]:
        context_id = payload.get("context_id") if isinstance(payload, dict) else None
        if isinstance(context_id, str) and context_id.strip():
            return context_id
        return None
