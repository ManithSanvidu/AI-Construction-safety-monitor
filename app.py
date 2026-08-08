import os
import sys

# Fix the Python paths so the AI service can find its files
sys.path.append(os.path.join(os.path.dirname(__file__), "ai"))
sys.path.append(os.path.join(os.path.dirname(__file__), "backend", "ai"))

from fastapi import FastAPI
from backend.ai.main import app as fastapi_app
import gradio as gr

# Create a dummy UI so Hugging Face marks the space as "Healthy"
demo = gr.Interface(
    fn=lambda: "AI Microservice is running smoothly!",
    inputs=[],
    outputs="text",
    title="Construction Safety AI"
)

# Merge our AI FastAPI with the Gradio UI
app = gr.mount_gradio_app(fastapi_app, demo, path="/")
