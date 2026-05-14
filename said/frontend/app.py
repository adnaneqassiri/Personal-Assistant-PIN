import requests
import streamlit as st

API_BASE_URL = "http://127.0.0.1:8000"
api_url = "http://127.0.0.1:8000"

st.set_page_config(
    page_title="AI Life Companion Chatbot",
    page_icon="🤖",
    layout="centered"
)

st.title("🤖 AI Life Companion")
st.caption("Assistant personnel")

with st.sidebar:
    st.header("Configuration")
    user_id = st.text_input("User ID", value="said")
    api_url = st.text_input("Backend URL", value=API_BASE_URL)

    st.markdown("---")
    context_mode = st.radio(
        "Contexte",
        [
            "Dernier contexte automatique",
            "Contexte spécifique"
        ]
    )

    context_id = None
    if context_mode == "Contexte spécifique":
        context_id = st.text_input("Context ID", value="ctx_001")

    if st.button("🧹 Réinitialiser le chat"):
        st.session_state.messages = []
        st.rerun()


if "messages" not in st.session_state:
    st.session_state.messages = [
        {
            "role": "assistant",
            "content": "Bonjour 👋 Je suis ton assistant personnel intelligent. Pose-moi une question sur ton contexte, ta journée, tes réunions ou tes recommandations."
        }
    ]


def send_message_to_backend(question: str):
    payload = {
        "user_id": user_id,
        "question": question
    }

    if context_id:
        payload["context_id"] = context_id

    try:
        response = requests.post(
            f"{api_url}/api/chat",
            json=payload,
            timeout=90
        )

        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "answer": f"Erreur de connexion avec le backend : {e}"
        }


for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])


user_question = st.chat_input("Écris ta question ici...")

if user_question:
    st.session_state.messages.append(
        {
            "role": "user",
            "content": user_question
        }
    )

    with st.chat_message("user"):
        st.markdown(user_question)

    with st.chat_message("assistant"):
        with st.spinner("Réflexion en cours..."):
            result = send_message_to_backend(user_question)
            answer = result.get("answer", "Aucune réponse reçue.")

            st.markdown(answer)

            if result.get("status") == "success":
                with st.expander("Détails techniques"):
                    st.json(
                        {
                            "intent": result.get("intent"),
                            "context_id": result.get("context_id"),
                            "request_id": result.get("request_id"),
                            "response_id": result.get("response_id")
                        }
                    )

    st.session_state.messages.append(
        {
            "role": "assistant",
            "content": answer
        }
    )