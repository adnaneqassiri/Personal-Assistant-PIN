from backend.services.context_service import (
    get_latest_context,
    get_context_by_id,
    get_all_contexts
)

from backend.services.decision_service import (
    get_decision_by_context_id,
    get_all_decisions
)

from backend.services.notification_service import get_notification_by_context_id

from backend.services.prompt_service import (
    build_system_prompt,
    build_user_prompt
)

from backend.services.groq_service import (
    detect_intent_with_groq,
    generate_answer_with_groq
)


def process_chat_request(user_id: str, question: str, context_id: str | None = None):
    intent = detect_intent_with_groq(question)

    if context_id:
        context = get_context_by_id(user_id=user_id, context_id=context_id)
    else:
        context = get_latest_context(user_id=user_id)

    if not context:
        raise ValueError("Aucun contexte trouvé pour cet utilisateur.")

    selected_context_id = context["context_id"]

    decision = get_decision_by_context_id(
        user_id=user_id,
        context_id=selected_context_id
    )

    notification = get_notification_by_context_id(
        user_id=user_id,
        context_id=selected_context_id
    )

    all_contexts = []
    all_decisions = []

    if intent == "daily_summary":
        all_contexts = get_all_contexts(user_id)
        all_decisions = get_all_decisions(user_id)

    system_prompt = build_system_prompt()

    user_prompt = build_user_prompt(
        question=question,
        intent=intent,
        context=context,
        decision=decision,
        notification=notification,
        all_contexts=all_contexts,
        all_decisions=all_decisions
    )

    answer = generate_answer_with_groq(
        system_prompt=system_prompt,
        user_prompt=user_prompt
    )

    return {
        "status": "success",
        "answer": answer,
        "intent": intent,
        "context_id": selected_context_id
    }